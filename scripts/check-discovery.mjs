/*
 * The done-check for whether anyone will find the project. The other two gates ask
 * whether the README is broken (check-readme) and whether it reads human (check-voice);
 * this one asks whether a stranger ever arrives to read it.
 *
 * It exists because the two search surfaces read different things, and the natural
 * assumption is backwards on both counts:
 *
 *   - GitHub's repo search does NOT read the README. Name, description and topics only,
 *     unless the searcher types `in:readme`. So README prose cannot rescue a blank
 *     description, and keyword-stuffing it buys nothing.
 *   - Google DOES read the README, in full, and ignores the topics.
 *
 * The description is the only field that wins both, which is why an empty one is an
 * error here and nothing else is.
 *
 *   node check-discovery.mjs [README.md] [--no-remote] [--root .]
 *
 * Without --no-remote it shells out to `gh` for the repo's own fields; with it, or with
 * no `gh` on PATH, it checks only what is in the file. Exit 0 clean, 1 on any error.
 */
import { readFile, stat } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { checkVoiceText, readMarker } from './check-voice.mjs';

const run = promisify(execFile);

/* GitHub's documented ceilings, and the observed ones that matter more.
   350 is the hard cap the API rejects past; the rest are where a field stops working
   before it stops being accepted. */
const DESC_MAX = 350;          // API limit
const DESC_VISIBLE = 35;       // what survives in a Google title after "GitHub - owner/repo: "
const DESC_CARD = 150;         // where the social card truncates
const DESC_MIN = 25;           // below this it cannot carry a searchable phrase
const TOPICS_MAX = 20;         // API limit
const TOPICS_WANT = 3;         // below this the sidebar says nothing
const OG_BYTES = 1_000_000;    // GitHub's documented limit for a social preview
const OG_W = 1280, OG_H = 640; // its documented best-display size

const SLUG = /^[a-z0-9][a-z0-9-]{0,49}$/;
const EMOJI = /\p{Extended_Pictographic}/u;

const snip = (s, n = 60) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
async function exists(p) { try { await stat(p); return true; } catch { return false; } }

/* PNG dimensions live in the IHDR, at a fixed offset. Cheaper than decoding the image,
   and this is the only thing we need to know about it. */
async function pngSize(abs) {
  try {
    const b = await readFile(abs);
    if (b.length < 24 || b.readUInt32BE(0) !== 0x89504e47) return null;
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  } catch { return null; }
}

/* The file with fenced code and HTML comments removed, so neither a code sample nor the
   voice marker is mistaken for prose or for an <img>. Line numbers are preserved. */
function readable(src) {
  const out = src.split('\n');
  let fenced = false;
  for (let i = 0; i < out.length; i++) {
    if (/^\s*```/.test(out[i])) { fenced = !fenced; out[i] = ''; continue; }
    if (fenced) out[i] = '';
  }
  return out.join('\n').replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
}

/* A prose paragraph is a run of lines that are not a heading, a fence, a bare image, a
   badge row, or raw HTML. This is what Google has to build a snippet out of. */
function paragraphs(text) {
  const out = [];
  let cur = null;
  text.split('\n').forEach((raw, i) => {
    const t = raw.trim();
    const bare = t
      .replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, '')   // linked badge
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')                 // image
      .replace(/<[^>]*>/g, '')                              // html tag
      .trim();
    if (!bare || /^#{1,6}\s/.test(t) || /^[-=]{3,}$/.test(t) || /^\|/.test(t)) { cur = null; return; }
    if (!cur) { cur = { n: i + 1, text: bare }; out.push(cur); }
    else cur.text += ' ' + bare;
  });
  return out;
}

export async function checkDiscovery(readmePath, { root, remote = true } = {}) {
  const found = [];
  const add = (line, level, id, text, hint) => found.push({ line, level, id, text: snip(String(text)), hint });

  const src = await readFile(readmePath, 'utf8');
  const base = dirname(resolve(readmePath));
  root = root ?? base;
  const text = readable(src);
  const lines = text.split('\n');

  /* ---- the file ---------------------------------------------------------- */

  /* The README's first "#" becomes the repo page's only <h1>, and an <h1> is one of the
     sources Google builds a title from. A header made only of a centred logo image
     leaves the page without one. */
  const h1 = lines.findIndex((l) => /^#\s+\S/.test(l));
  const setext = lines.findIndex((l, i) => i > 0 && /^=+\s*$/.test(l) && lines[i - 1].trim());
  const htmlH1 = /<h1[\s>]/i.test(text);
  if (h1 < 0 && setext < 0 && !htmlH1)
    add(1, 'error', 'no-h1', 'no "# Name" heading', 'the first # is the page\'s only <h1> and one of Google\'s title sources; a logo image alone leaves none');

  /* Alt text is the only thing an indexer, a screen reader, or a text-mode reader gets
     from an image here: repo-relative images are rewritten under /raw/, which robots.txt
     blocks, and external ones are proxied through hashed camo URLs. */
  for (const m of text.matchAll(/<img\b[^>]*>/gi)) {
    const line = text.slice(0, m.index).split('\n').length;
    const alt = m[0].match(/\balt\s*=\s*"([^"]*)"/i);
    if (!alt) add(line, 'error', 'alt-missing', m[0], 'no alt=; the image itself is never indexable, so this is the only description of it that survives');
    else if (!alt[1].trim()) add(line, 'warn', 'alt-empty', m[0], 'alt="" marks it decorative; correct for a logo, wrong for a screenshot');
  }
  for (const m of text.matchAll(/!\[([^\]]*)\]\(([^)\s]+)/g)) {
    const line = text.slice(0, m.index).split('\n').length;
    if (!m[1].trim()) add(line, 'warn', 'alt-empty', m[0], 'an empty alt; name what the image shows unless it is decorative');
  }

  /* Google's snippet comes primarily from page content, so the first prose on the page
     is what a searcher reads. Warn, not error: which paragraph names the project is a
     voice decision, and three is enough room for a slogan to land first. */
  const paras = paragraphs(text);
  if (!paras.length) add(1, 'error', 'no-prose', 'no prose paragraph', 'the page has no sentence for Google to use as a snippet');
  else {
    const name = (h1 >= 0 ? lines[h1].replace(/^#\s+/, '') : '').trim();
    if (name) {
      /* Escape first, then loosen the separators — doing it the other way round escapes
         the character class this builds and matches it as literal text. */
      const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(esc.replace(/[-_]/g, '[-_ ]?'), 'i');
      const where = paras.slice(0, 3).findIndex((p) => re.test(p.text));
      if (where < 0)
        add(paras[0].n, 'warn', 'unnamed', paras[0].text, `"${name}" is not named in the first three paragraphs; the snippet will not say what this is`);
    }
    /* A badge row above the first sentence pushes that sentence down the page. */
    const badge = lines.findIndex((l) => /img\.shields\.io|badge\.fury|\[!\[/.test(l));
    if (badge >= 0 && paras[0].n > badge + 1)
      add(badge + 1, 'warn', 'badges-first', 'badge row above the first sentence', 'the descriptive sentence reads better, and snippets better, above the badges');
  }

  /* The social card, if one has been captured. Its budget is tighter than a still's, and
     it is the one image in this skill that must NOT have transparent corners. */
  for (const rel of ['docs/images/og.png', 'docs/images/social.png']) {
    const abs = join(root, rel);
    if (!(await exists(abs))) continue;
    const bytes = (await stat(abs)).size;
    if (bytes > OG_BYTES) add(0, 'error', 'og-size', `${rel} ${(bytes / 1e6).toFixed(2)}MB`, `over GitHub's ${OG_BYTES / 1e6}MB limit for a social preview`);
    const d = await pngSize(abs);
    if (d && (d.w !== OG_W || d.h !== OG_H))
      add(0, 'warn', 'og-dimensions', `${rel} ${d.w}x${d.h}`, `${OG_W}x${OG_H} is the documented best-display size`);
  }

  /* ---- the repo ---------------------------------------------------------- */

  if (!remote) return { findings: sort(found), remote: false };

  let repo;
  try {
    const { stdout } = await run('gh', ['repo', 'view', '--json',
      'name,nameWithOwner,description,repositoryTopics,homepageUrl,usesCustomOpenGraphImage'], { cwd: root });
    repo = JSON.parse(stdout);
  } catch {
    return { findings: sort(found), remote: false, note: 'gh unavailable or not a GitHub remote; file checks only' };
  }

  const desc = (repo.description ?? '').trim();
  if (!desc) {
    add(0, 'error', 'description', '(empty)', 'with none, the page title, the meta description and every share card read "Contribute to owner/repo development by creating an account on GitHub"');
  } else {
    if (desc.length > DESC_MAX) add(0, 'error', 'description-long', `${desc.length} chars`, `over GitHub's ${DESC_MAX}-character limit`);
    else if (desc.length < DESC_MIN) add(0, 'warn', 'description-short', desc, 'too short to carry the phrase someone would search');
    if (desc.length > DESC_CARD) add(0, 'warn', 'description-card', `${desc.length} chars`, `the social card truncates near ${DESC_CARD}`);
    if (EMOJI.test(desc.slice(0, 4))) add(0, 'warn', 'description-emoji', desc.slice(0, 12), `a leading emoji spends the ~${DESC_VISIBLE} characters Google actually shows`);
    /* The description is prose, so it answers to the same registers as the README. */
    const voice = readMarker(src).voice;
    for (const f of checkVoiceText(desc, { voice }).findings)
      add(0, f.level, `description-${f.id}`, f.text, f.hint);
  }

  const topics = (repo.repositoryTopics ?? []).map((t) => t.name ?? t).filter(Boolean);
  if (!topics.length) add(0, 'error', 'topics', '(none)', 'topics are indexed by GitHub search and are the only field a README cannot substitute for');
  else {
    if (topics.length < TOPICS_WANT) add(0, 'warn', 'topics-few', topics.join(', '), `${topics.length} topic(s); five to twelve is the useful range`);
    if (topics.length > TOPICS_MAX) add(0, 'error', 'topics-many', `${topics.length}`, `over GitHub's limit of ${TOPICS_MAX}`);
    for (const t of topics) if (!SLUG.test(t)) add(0, 'error', 'topic-slug', t, 'lowercase letters, digits and hyphens, 50 characters or less');
    /* Topics match as exact atomic slugs — no stemming, no splitting, no prefix. An
       invented or pluralised one never fires for anybody, so it is dead weight. */
    for (const t of topics.filter((x) => SLUG.test(x))) {
      try {
        const { stdout } = await run('gh', ['api', `/search/repositories?q=topic:${encodeURIComponent(t)}&per_page=1`, '--jq', '.total_count'], { cwd: root });
        const n = Number(stdout.trim());
        if (Number.isFinite(n) && n < 5)
          add(0, 'warn', 'topic-unused', `${t} (${n} repos)`, 'almost nobody else uses this slug; topics never stem or split, so an invented one never fires');
      } catch { /* rate limit or offline: the slug format check already ran */ }
    }
  }

  if (!(repo.homepageUrl ?? '').trim()) {
    const live = /\[[^\]]*(?:live|demo|docs?|website|playground)[^\]]*\]\(https?:/i.test(text);
    if (live) add(0, 'warn', 'homepage', '(empty)', 'the README links a live site but the About box does not; it is the first link a visitor looks for');
  }

  if (!repo.usesCustomOpenGraphImage)
    add(0, 'warn', 'social-preview', '(auto-generated)', 'the default card shows an avatar and a fork count; a custom one is the only thing a reader sees before clicking');

  /* Names split on hyphens and nothing else: aho-corasick is findable by "aho" and by
     "corasick"; ripgrep is invisible to a search for "grep". A warning only — renaming
     redirects issues and stars, but the old name can never be reused and Actions
     references to it break. */
  const nm = repo.name ?? '';
  if (!nm.includes('-') && !nm.includes('_') && nm.length >= 8 && /^[a-z]+$/.test(nm))
    add(0, 'warn', 'repo-name', nm, 'a run-together name is not findable by its parts; hyphenating makes each word searchable, but renaming has costs — the owner decides');

  return { findings: sort(found), remote: true, repo };
}

const sort = (f) => f.sort((a, b) => a.line - b.line || (a.level === b.level ? 0 : a.level === 'error' ? -1 : 1));

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const ri = args.indexOf('--root');
  const readme = args.find((a, i) => !a.startsWith('--') && (ri < 0 || i !== ri + 1)) ?? 'README.md';
  const { findings, remote, note } = await checkDiscovery(readme, {
    root: ri >= 0 ? resolve(args[ri + 1]) : undefined,
    remote: !args.includes('--no-remote'),
  });
  const scope = remote ? 'file + repo' : 'file only';
  const e = findings.filter((x) => x.level === 'error').length, w = findings.length - e;
  if (note) console.error(`check-discovery: ${note}`);
  if (!findings.length) { console.log(`check-discovery: ${readme} (${scope}) clean`); process.exit(0); }
  console.error(`check-discovery: ${readme} (${scope}): ${e} error(s), ${w} warning(s)`);
  for (const x of findings) {
    const where = x.line ? `L${String(x.line).padEnd(4)}` : 'repo ';
    console.error(`  ${where} ${x.level.padEnd(5)} ${x.id.padEnd(20)} "${x.text}"  → ${x.hint}`);
  }
  process.exit(e ? 1 : 0);
}
