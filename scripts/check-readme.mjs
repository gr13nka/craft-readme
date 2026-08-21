/*
 * The done-check for a README. Fails loudly, with the exact line, on the four
 * things that shipped broken this session before someone caught them by eye:
 *
 *   1. a relative link or image whose target does not exist
 *   2. an in-page #anchor with no matching heading (GitHub's own slug rule)
 *   3. a placeholder left in — an empty list item, a bare "…", TODO, or a
 *      ":owner"-style path that only worked in the repo it was copied from
 *   4. an image over its size budget (still 1.5 MB, animation 3 MB)
 *   5. a command in a fenced block that names a repo file which is not there
 *
 *   node check-readme.mjs [README.md] [--docs docs] [--root .]
 *
 * Exit 0 clean, exit 1 with a numbered list. No network.
 */
import { readFile, stat } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/* GitHub's heading-anchor slug: lowercase, drop anything but word/space/hyphen,
   spaces to hyphens. Good enough for the headings a README actually uses. */
const slug = (h) => h.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');

async function exists(p) { try { await stat(p); return true; } catch { return false; } }

async function headingsOf(file) {
  try {
    const set = new Set();
    for (const m of (await readFile(file, 'utf8')).matchAll(/^#{1,6}\s+(.+?)\s*$/gm)) set.add(slug(m[1]));
    return set;
  } catch { return new Set(); }
}

export async function checkReadme(readmePath, { root = '.', docs = 'docs' } = {}) {
  const problems = [];
  const src = await readFile(readmePath, 'utf8');
  const lines = src.split('\n');
  const base = dirname(resolve(readmePath));
  const localHeadings = await headingsOf(readmePath);

  const linkRe = /!?\[[^\]]*\]\(([^)\s]+)\)|<img[^>]+src="([^"]+)"/g;
  for (let m; (m = linkRe.exec(src)); ) {
    const target = m[1] ?? m[2];
    if (/^(https?:|mailto:|#!)/.test(target)) continue;
    const line = src.slice(0, m.index).split('\n').length;
    if (target.startsWith('#')) {
      if (!localHeadings.has(target.slice(1))) problems.push(`L${line}: anchor ${target} matches no heading in this file`);
      continue;
    }
    const [path, frag] = target.split('#');
    const abs = resolve(base, path);
    if (!(await exists(abs))) { problems.push(`L${line}: link target missing: ${target}`); continue; }
    if (frag && (await headingsOf(abs)).size && !(await headingsOf(abs)).has(frag))
      problems.push(`L${line}: anchor #${frag} not found in ${path}`);
  }

  /* Placeholders. The colon case needs lookahead: "2. Publish it:" is only a
     bug when nothing real follows — the same line above a code block is fine. */
  const isItem = (ln) => /^\s*(?:[-*]|\d+\.)\s/.test(ln);
  const nextIdx = (i) => { for (let j = i + 1; j < lines.length; j++) if (lines[j].trim()) return j; return -1; };
  lines.forEach((ln, i) => {
    const n = i + 1;
    if (/^\s*(?:[-*]|\d+\.)\s*$/.test(ln)) { problems.push(`L${n}: empty list item`); return; }
    if (isItem(ln) && /:\**\s*$/.test(ln.trimEnd()) && !ln.includes('](') && !/`/.test(ln)) {
      const j = nextIdx(i);
      const nxt = j < 0 ? '' : lines[j];
      const indented = /^(?:\s{3,}|\t)/.test(nxt);       // a continuation of this item
      const fenced = nxt.trimStart().startsWith('```');   // the promised code block
      /* Bug only if the colon led to nothing, a heading, or a sibling item. */
      if (!indented && !fenced && (nxt === '' || nxt.trimStart().startsWith('#') || isItem(nxt)))
        problems.push(`L${n}: list item ends at a colon with nothing after it: ${ln.trim()}`);
    }
    if (/\bTODO\b|\bFIXME\b|\bTBD\b/.test(ln)) problems.push(`L${n}: TODO/FIXME/TBD marker`);
    if (/(^|\s)…(\s|$)/.test(ln) && !ln.includes('`') && !ln.includes('](')) problems.push(`L${n}: bare "…" placeholder`);
    if (/repos\/:owner|:owner\/[A-Za-z]/.test(ln)) problems.push(`L${n}: ":owner" placeholder — use quoted {owner}/{repo}: ${ln.trim()}`);
    if (/\{\{[^}]+\}\}/.test(ln)) problems.push(`L${n}: unfilled {{placeholder}}`);
  });

  /* Image size budgets. */
  const imgRe = /!?\[[^\]]*\]\(([^)\s]+\.(?:png|jpe?g|gif|webp|apng))\)|src="([^"]+\.(?:png|jpe?g|gif|webp|apng))"/gi;
  for (let m; (m = imgRe.exec(src)); ) {
    const rel = m[1] ?? m[2];
    if (/^https?:/.test(rel)) continue;
    const abs = resolve(base, rel);
    if (!(await exists(abs))) continue;                       // missing already reported above
    const bytes = (await stat(abs)).size;
    const cap = /\.(gif|apng)$/i.test(rel) ? 3_000_000 : 1_500_000;
    if (bytes > cap) problems.push(`${rel}: ${(bytes / 1e6).toFixed(2)}MB over the ${(cap / 1e6)}MB budget`);
  }

  /* Commands in fenced blocks that name a repo-relative file. */
  const fences = src.match(/```[\s\S]*?```/g) ?? [];
  const known = new Set();
  for (const block of fences) {
    for (const tok of block.matchAll(/(?:node|python3?|sh|bash|\.\/)\s+([./\w-]+\.[\w]+)/g)) {
      const f = tok[1];
      if (f.startsWith('/') || known.has(f)) continue;
      known.add(f);
      if (!(await exists(resolve(root, f)))) problems.push(`command references a file not in the repo: ${f}`);
    }
  }

  return problems;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const readme = args.find(a => !a.startsWith('--')) ?? 'README.md';
  const di = args.indexOf('--docs'), ri = args.indexOf('--root');
  const problems = await checkReadme(readme, {
    docs: di >= 0 ? args[di + 1] : 'docs',
    root: ri >= 0 ? args[ri + 1] : dirname(resolve(readme)),
  });
  if (!problems.length) { console.log('check-readme: clean'); process.exit(0); }
  console.error(`check-readme: ${problems.length} problem(s)`);
  problems.forEach((p, i) => console.error(`  ${i + 1}. ${p}`));
  process.exit(1);
}
