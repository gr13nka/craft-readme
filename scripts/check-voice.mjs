/*
 * The voice check. Fails, with the line, on the vocabulary that gives a machine
 * away: marketing adjectives, softeners, LLM connective tissue, boilerplate
 * openers and closers, emoji, exclamation marks. And on the loudest tell of
 * all, an LLM trying to be funny: the parenthetical wink, "spoiler alert",
 * "pro tip", ™. Warns on the structural tells a regex can only suspect: the
 * em-dash aside, the rule-of-three list, "not X, but Y", the participial
 * payoff, same-length sentences, semicolons, a Title Case heading.
 *
 *   node check-voice.mjs [README.md …] [--voice deadpan|plain|quiet] [--strict]
 *
 * Three registers share one core. The register comes from --voice, else the
 * <!-- craft-readme: voice=… --> marker on the README's first line, else
 * plain. The base rules are the full set, which is deadpan's; a register is a
 * set of overrides on them (references/voice.md explains each). plain lets a
 * claim adjective through as a warning when its line carries the number or a
 * link, turns "!" and bold-label bullets into warnings (three "!" is an error
 * again), and stops warning on "Note that", question headings, Contributing
 * and Credits headings and sentence rhythm. quiet stops warning on the
 * consequence clause ("which means", ", so you can") and warns on a jab.
 *
 * Prose only. Fenced code, inline code, quoted spans, HTML tags, comments,
 * URLs and badges are ignored (a mention of "seamlessly" is not a use).
 * Exit 1 on any error (any warning too with --strict), 2 on a bad flag, else
 * 0. A warning is a judgment call, not a verdict.
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/* ---- the word lists ------------------------------------------------------ */

const MARKETING = [
  'seamless(?:ly)?', 'cutting[- ]edge', 'state[- ]of[- ]the[- ]art',
  'next[- ]gen(?:eration)?', 'best[- ]in[- ]class', 'world[- ]class', 'enterprise[- ]grade', 'production[- ]grade',
  'battle[- ]tested', 'game[- ]chang(?:er|ing)', 'revolutioni[sz]e[sd]?', 'supercharged?', 'turbocharged?',
  'unleash(?:es|ed)?', 'empower(?:s|ed|ing)?', 'leverag(?:e|es|ed|ing)', 'utili[sz](?:e|es|ed|ing)',
  'streamlin(?:e|es|ed|ing)', 'delightful', 'magical(?:ly)?', 'elegant(?:ly)?', 'intuitive(?:ly)?',
  'beautiful(?:ly)?', 'sleek', 'versatile', 'feature[- ]rich', 'full[- ]featured',
  'all[- ]in[- ]one', 'one[- ]stop', 'plug[- ]and[- ]play', 'easy[- ]to[- ]use', 'user[- ]friendly',
  'developer[- ]friendly', 'first[- ]class', 'batteries[- ]included', 'ready[- ]to[- ]use', 'purpose[- ]built',
  'tailored', 'curated',
];

/* A claim adjective: true when a number stands next to it (uv: "10-100x faster
   [benchmarks]"), a tell when nothing does. plain lets it through as a warning
   on a line that carries a digit or a link. */
const CLAIM = ['powerful', 'robust(?:ly|ness)?', 'lightweight', 'comprehensive', 'blazing(?:ly)?(?:[- ]fast)?', 'lightning[- ]fast'];

/* "This is easy", said instead of shown. */
const SOFTENER = ['simply', 'easily', 'with ease', 'a breeze', 'painless(?:ly)?', 'effortless(?:ly)?', 'hassle[- ]free', 'frictionless'];

const MARKETING_SOFT = [
  'modern', 'flexible', 'scalable', 'extensible', 'customi[sz]able', 'configurable', 'drop[- ]in',
  'out of the box', 'minimal(?:ist)?', 'straightforward', 'quickly', 'in (?:seconds|minutes|no time)',
  'in (?:just )?a few (?:simple |easy )?(?:steps|lines|clicks|commands)', 'easy to (?:use|set up|install|configure)',
  'quick and easy', 'just (?:run|add|install|call|use|paste|type|drop|pass|point|open|clone|import)',
];

const SCAFFOLD = [
  "whether you(?:'re| are)", '(?:is |are |was |were )?designed (?:to|for|with)', 'aims? to',
  'allow(?:s|ing)? you to', 'enabl(?:es|ing) you to', 'mak(?:es|ing) it (?:easy|simple|possible|effortless|trivial)',
  'so (?:that )?you can focus', 'without the hassle', 'say goodbye', 'look no further', 'at its core',
  'in a nutshell', 'in short,', 'in other words', "it'?s worth noting", 'importantly', 'notably', 'additionally',
  'furthermore', 'moreover', '^overall,', 'ultimately', 'essentially', 'simply put', 'that being said',
  'with that in mind', "let'?s (?:dive|get started|take a look|explore|begin)", 'dive in', 'deep dive',
  "here'?s how", "here'?s the thing", 'the best part', "what'?s more", 'on top of that', 'last but not least',
  'a (?:wide )?(?:range|variety|plethora|host|myriad|number|multitude) of', 'countless', 'numerous',
  'in order to', 'due to the fact', '(?:is|are) able to', 'in terms of', 'when it comes to',
  'not only .{1,60} but also', 'takes? .{1,40} to the next level', 'seamlessly integrat', 'built[- ]in support for',
  'from the ground up', 'with \\w+ in mind', "you'?ll love", 'got you covered', 'rest assured', 'peace of mind',
  'no matter (?:what|where|which|how)',
];

const SCAFFOLD_SOFT = [
  'ensur(?:es|ing|e)(?: that)?', 'basically', 'under the hood', 'no more \\w+',
  'can be used to', 'provides? a (?:way|simple way|set of)', 'that said,', 'as well as', 'etc\\.?',
  '(?:incredibly|truly|extremely|highly|super|absolutely|totally|genuinely|remarkably|exceptionally|significantly)',
  '(?:potentially|generally|typically|in most cases|somewhat|fairly|relatively|arguably)',
];

/* The caveat opener serious READMEs use (bat, tokio, zstd); a hedge elsewhere. */
const CAVEAT = ['note that'];

/* The consequence clause: a feature, then what it guarantees you. The quiet
   register's key move (Joplin: "offline first, which means you always have all
   your data on your phone"); the explained payoff in the others. */
const CONSEQUENCE = /\b(?:which|this|that) means\b|, so (?:that )?you (?:can|don'?t|never|won'?t)\b/giu;

const BOILERPLATE = [
  '^welcome to', '^introducing', '^meet \\w+[,.!]', 'say hello to', 'happy (?:coding|hacking|building|shipping|writing)',
  'feel free to', "don'?t hesitate", 'contributions? (?:are |is )?(?:always |very )?welcome', 'enjoy[.!]?$',
  'made with (?:love|❤|<3|♥)', 'star (?:this|the) repo', 'give (?:it|us) a star', 'if you (?:find|found) this (?:useful|helpful)',
  'stay tuned', 'thanks for (?:reading|checking|stopping|visiting)', 'hope (?:this|you|it) (?:helps|enjoy|find)',
  'reach out', 'get in touch',
];

const BOILERPLATE_SOFT = [
  '(?:pull requests?|prs?) (?:are )?welcome',
  '^this (?:project|repository|repo|tool|library|package|app|cli|skill) (?:is|contains|provides|aims|offers|allows|helps|makes|lets)',
  '^\\s*(?:\\*\\*)?step \\d+', '^\\s*(?:\\*\\*)?(?:note|tip|warning|important|caution)(?:\\*\\*)?:', '^\\s*\\[!(?:note|tip|warning|important|caution)\\]',
  '^\\s*(?:ps|p\\.s\\.)[:.]?\\s',
];

/* An LLM told to be funny. Every one of these is the joke being labelled. */
const WINK = [
  '\\((?:yes,? )?really\\)', '\\(seriously\\)', '\\(i know\\)', "\\(don'?t ask\\)", '\\(long story\\)',
  "you'?re welcome(?! to)", 'i know,? i know', 'spoiler(?: alert)?', 'plot twist', 'fun fact', 'pro[- ]?tip',
  'hot take', 'unpopular opinion', 'wait for it', 'let that sink in', 'narrator:', "chef'?s kiss",
  'because of course', 'of course it (?:does|is|did|will|works)', 'because reasons', 'shocking,? i know', '\\bshocker\\b',
  'dear reader', "it'?s 20\\d\\d", 'it just works', "i'?ll wait", '^look,', 'okay,? but',
  'not gonna lie', '\\bngl\\b', 'tl;?dr', 'yada yada', 'insert \\w+ here', '\\blol\\b', 'no,? really', 'trust me',
  'believe it or not', 'you guessed it', 'surprise,? surprise', 'drumroll', 'mic drop', 'boom\\b',
  '\\*(?:sigh|cough|shrug|ahem|wink|nudge|cries|screams|sobs|laughs)s?\\*', '¯\\\\_\\(ツ\\)_/¯',
  '(?:^|\\s)[:;]-?[)(DPp](?:\\s|$)', '\\s/s(?:\\s|$)', '\\((?:joke|kidding|jk)\\)', 'just kidding', '\\bjk\\b',
  "\\bi'?m (?:not )?(?:kidding|joking)\\b", 'you (?:read|heard) that right',
];
const WINK_SOFT = ['obviously', 'of course,', 'needless to say', 'to be fair', 'in all seriousness', 'jokes aside'];

/* The jab. A quiet README withholds; it does not take a swing at the reader,
   a user, or a competitor. */
const HARSH = ['nobody', 'no one', "you won'?t", "you'?ll never", 'dead', 'dies?', 'kill(?:s|ed|ing)?', 'garbage', 'stupid',
  'dumb', 'damn', 'hell', 'sucks?', 'hate[sd]?', 'useless', 'idiots?', 'pain in the', "don'?t bother", 'wall of text'];

const HEADING = ['(?:key )?features?$', 'table of contents', 'tl;?dr', '^(?:overview|introduction|about)$'];
const HEADING_SOFT = ['^(?:getting started|prerequisites|contributing|roadmap|changelog|support|contact|authors?|motivation|background)$'];
const HEADING_CREDIT = ['^(?:acknowledg\\w*|credits|thanks|sponsors?)$'];

const word = (alts) => new RegExp(`(?<![\\w-])(?:${alts.join('|')})(?![\\w-])`, 'giu');

/* [key, level, regex, hint]. The key is unique and is the id printed; the
   registers override by it. The regex runs on cleaned prose, case-insensitive. */
const RULES = [
  ['marketing',        'error', word(MARKETING),      'say what it does, or the number; the adjective is the tell'],
  ['claim',            'error', word(CLAIM),          'a claim adjective; give the number, or the link to the benchmark'],
  ['softener',         'error', word(SOFTENER),       'a softener; it says "this is easy" instead of showing the one command'],
  ['marketing-soft',   'warn',  word(MARKETING_SOFT), 'a softener; cut it, the command is the same length without it'],
  ['scaffold',         'error', word(SCAFFOLD),        'LLM connective tissue; state the thing and stop'],
  ['scaffold-soft',    'warn',  word(SCAFFOLD_SOFT),   'hedge or filler; cut unless it carries a fact'],
  ['caveat',           'warn',  word(CAVEAT),          'a hedge; cut unless the caveat carries a fact'],
  ['consequence',      'warn',  CONSEQUENCE,           'explaining the payoff; state the thing and stop'],
  ['boilerplate',      'error', word(BOILERPLATE),     'README boilerplate; nobody reads it, and it reads generated'],
  ['boilerplate-soft', 'warn',  word(BOILERPLATE_SOFT),'boilerplate shape; does the line say anything true and actionable?'],
  ['wink',             'error', word(WINK),            'the joke is being labelled; drop the label, usually the joke'],
  ['wink-soft',        'warn',  word(WINK_SOFT),       'a wink; the line should stand without it'],
  ['tm',               'error', /\u2122|\(tm\)/gi,       'the ironic ™; the tell of an LLM doing sarcasm'],
  ['em-dash',          'warn',  /\u2014|\s--\s|\s\u2013\s/g, 'a period usually does the job; keep only if you would defend it'],
  ['semicolon',        'warn',  /;(?=\s)/g,            'READMEs rarely need one; two sentences'],
  ['antithesis',       'warn',  /\bnot (?:just |only |merely |simply |about )?[^,.;]{1,50}, (?:it'?s|it is|but|rather|that'?s)\b|\bnot [^,.;]{1,40}, but\b|, not [^,.;]{1,30}\.(?:\s|$)/giu, '"not X, Y" balance; pick a side'],
  ['payoff',           'error', /, (?:making|allowing|enabling|ensuring|empowering) (?:it|you|them|us|the|this|your|a|an|each|every|for)\b/giu, 'the participial tail explains the payoff; the reader got it'],
  ['payoff-soft',      'warn',  /, (?:which|that) (?:makes|ensures|allows|lets|keeps|gives|is what)\b/giu, 'explaining the payoff; state the thing and stop'],
  ['ellipsis',         'warn',  /(?:\.\.\.|\u2026)\s*$/g, 'trailing off; finish the sentence or cut it'],
];

/* ---- the registers ------------------------------------------------------- */

/* A register is a set of overrides on the base rules, by key. skip: not
   reported. warn: an error becomes a warning. licensed: an error becomes a
   warning when the line carries a number or a link. density: N or more of a
   warning in one file is an error after all. extra: rules only this register
   runs. The base rules are the full set, which is deadpan's; the default when
   nothing says otherwise is plain. */
const PROFILES = {
  deadpan: {},
  plain: {
    skip: ['caveat', 'heading-question', 'heading-soft', 'heading-credit', 'rhythm'],
    warn: ['exclamation', 'bold-bullets', 'heading'],
    licensed: ['claim'],
    density: { exclamation: 3 },
  },
  quiet: {
    skip: ['consequence', 'heading-credit'],
    extra: [['harsh', 'warn', word(HARSH), 'quiet withholds; it does not jab']],
  },
};
const VOICES = Object.keys(PROFILES);
const DEFAULT_VOICE = 'plain';
const LICENSED_HINT = 'the number or link on the line licenses it; keep only if that is the measure of the claim';

/* <!-- craft-readme: voice=quiet --> on the README's first line. Read from the
   raw source, because proseLines strips comments. First match wins. */
const MARKER = /<!--\s*craft-readme:\s*voice\s*=\s*([\w-]+)\s*-->/i;
export function readMarker(src) {
  const m = src.match(MARKER);
  return m ? { voice: m[1].toLowerCase(), line: src.slice(0, m.index).split('\n').length } : {};
}

/* ---- the text ------------------------------------------------------------ */

const strip = (line) => line
  .replace(/`[^`]*`/g, ' ')
  .replace(/"[^"\n]{1,80}"|\u201c[^\u201d\n]{1,80}\u201d/g, ' ')   // a quoted span is a mention, not a use
  .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
  .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/<[^>]*>/g, ' ')
  .replace(/https?:\/\/\S+/g, ' ')
  .replace(/\s+/g, ' ').trim();

const BLOCK_MARK = /^\s*(?:#{1,6}\s+|>\s?|[-*+]\s+|\d+[.)]\s+)/;
const EMOJI = /\p{Extended_Pictographic}/gu;
const BOLD_LEAD = /^\s*[-*+]\s+\*\*[^*]+\*\*\s*[:\u2014\u2013-]/;

/* Turns a file into prose lines with their kind, skipping fences, comments
   and HTML-only lines. Returns [{ n, kind: 'heading'|'item'|'text', raw, text }]. */
function proseLines(src) {
  const out = [];
  let fence = false, comment = false, quoteLeft = 0;   // quoteLeft: chars of a "…" span still open from the line above
  src.split('\n').forEach((raw, i) => {
    const n = i + 1;
    if (/^\s*(?:```|~~~)/.test(raw)) { fence = !fence; quoteLeft = 0; return; }
    if (fence) return;
    if (!raw.trim()) { quoteLeft = 0; return; }
    let line = raw;
    if (comment) { const e = line.indexOf('-->'); if (e < 0) return; line = line.slice(e + 3); comment = false; }
    line = line.replace(/<!--[\s\S]*?-->/g, ' ');
    const s = line.indexOf('<!--'); if (s >= 0) { line = line.slice(0, s); comment = true; }
    const isHeading = /^\s*#{1,6}\s/.test(line);
    const isItem = /^\s*(?:[-*+]|\d+[.)])\s/.test(line);
    if (/^\s*\|[\s:|-]*\|?\s*$/.test(line)) return;          // table divider
    let body = line.replace(BLOCK_MARK, '').replace(/`[^`]*`/g, ' ');
    /* A "…" span wrapped across the line break: finish it here, within its budget. */
    if (quoteLeft) {
      const e = body.indexOf('"');
      body = e >= 0 && e <= quoteLeft ? body.slice(e + 1) : body;
      quoteLeft = 0;
    }
    const q = (body.match(/"/g) ?? []).length;
    if (q % 2) {
      const open = body.lastIndexOf('"'), tail = body.length - open;
      if (tail <= 80) { quoteLeft = 80 - tail; body = body.slice(0, open); }
    }
    const text = strip(body);
    if (!text) return;
    out.push({ n, kind: isHeading ? 'heading' : isItem ? 'item' : 'text', raw, text });
  });
  return out;
}

const sentences = (t) => t.split(/(?<=[.!?])\s+(?=[A-Z"'(\[])/).map((s) => s.trim()).filter(Boolean);
const words = (s) => s.split(/\s+/).filter(Boolean).length;
const snip = (s, n = 60) => (s.length > n ? s.slice(0, n - 1) + '\u2026' : s);
/* A digit in the prose, or a non-image link on the raw line: the evidence that licenses a claim. */
const measured = (L) => /\d/.test(L.text) || /(?<!!)\[[^\]]+\]\([^)]+\)/.test(L.raw);

/* ---- the check ----------------------------------------------------------- */

export async function checkVoice(file, { voice } = {}) {
  const src = await readFile(file, 'utf8');
  const marker = readMarker(src);
  let v = voice ?? marker.voice ?? DEFAULT_VOICE;
  const source = voice ? 'flag' : marker.voice ? 'marker' : 'default';
  const found = [];
  if (!PROFILES[v]) {
    found.push({ line: marker.line ?? 1, level: 'error', id: 'marker', text: `voice=${v}`, hint: `unknown register; one of ${VOICES.join(', ')}` });
    v = DEFAULT_VOICE;
  }
  const P = PROFILES[v], skip = new Set(P.skip), soften = new Set(P.warn), licensed = new Set(P.licensed);
  const rules = [...RULES, ...(P.extra ?? [])];
  const add = (n, level, id, text, hint) => {
    if (skip.has(id)) return;
    found.push({ line: n, level: soften.has(id) ? 'warn' : level, id, text: snip(text), hint });
  };
  const lines = proseLines(src);

  for (const L of lines) {
    const t = L.text;
    for (const [id, level, re, hint] of rules) {
      re.lastIndex = 0;
      for (let m; (m = re.exec(t)); ) {
        const hit = m[0].trim() || m[0];
        if (licensed.has(id) && measured(L)) add(L.n, 'warn', id, hit, LICENSED_HINT);
        else add(L.n, level, id, hit, hint);
      }
    }
    const em = [...t.matchAll(EMOJI)].find((m) => !/[©®™]/.test(m[0]));
    if (em) add(L.n, 'error', 'emoji', em[0], 'no emoji, anywhere, in any register');
    for (const m of t.matchAll(/!(?=[\s"')\]]|$)/g)) add(L.n, 'error', 'exclamation', t.slice(Math.max(0, m.index - 30), m.index + 1), 'no exclamation marks; the fact is enough');

    if (L.kind === 'heading') {
      for (const re of HEADING) if (new RegExp(re, 'iu').test(t)) add(L.n, 'error', 'heading', t, 'a machine-shaped heading; name what the section actually shows');
      for (const re of HEADING_SOFT) if (new RegExp(re, 'iu').test(t)) add(L.n, 'warn', 'heading-soft', t, 'boilerplate section on a landing page; keep only if it says something true and actionable');
      for (const re of HEADING_CREDIT) if (new RegExp(re, 'iu').test(t)) add(L.n, 'warn', 'heading-credit', t, 'a credits section; one line under License usually carries it');
      if (/^why \w+\??$/iu.test(t)) add(L.n, 'warn', 'heading-question', t, '"Why X?" is the machine\'s favourite heading; humans use it too (esbuild). Name what the section shows');
      else if (/\?\s*$/.test(t) && !/^(?:key )?features/i.test(t)) add(L.n, 'warn', 'heading-question', t, 'a question heading; the reader did not ask it');
      const ws = t.split(/\s+/);
      const caps = ws.slice(1).filter((w) => /^[A-Z][a-z]{3,}/.test(w)).length;
      const lower = ws.slice(1).filter((w) => /^[a-z]{4,}/.test(w)).length;
      if (ws.length >= 3 && caps >= 2 && lower === 0) add(L.n, 'warn', 'heading-case', t, 'Title Case heading; sentence case reads human');
    }

    /* Rule of three: "A, B, and C", or "A, B and C" when the items are short. */
    for (const s of sentences(t)) {
      const commas = (s.match(/,/g) ?? []).length;
      const oxford = commas === 2 && /,[^,]*,\s+(?:and|or)\s+[^,]+$/u.test(s);
      const plain = commas === 1 && words(s) <= 18 && /^[^,]{1,40}, [^,]{1,40} (?:and|or) [^,.]{1,40}[.!?]?$/u.test(s);
      if (oxford || plain) add(L.n, 'warn', 'triplet', s, 'rule of three; two, or four, or a fragment');
    }
  }

  /* Bold-lead bullet lists ("- **Fast**: …" ×3) and same-length paragraphs. */
  let run = 0;
  for (const L of lines) {
    if (L.kind === 'item' && BOLD_LEAD.test(L.raw)) { if (++run === 3) add(L.n - 2, 'error', 'bold-bullets', strip(L.raw), 'a features list of bold lead-ins; two flat sentences, or the picture'); }
    else run = 0;
  }
  let para = [], start = 0;
  const flush = () => {
    if (para.length) {
      const ss = sentences(para.join(' '));
      if (ss.length >= 3) {
        const ns = ss.map(words), mean = ns.reduce((a, b) => a + b, 0) / ns.length;
        if (mean >= 8 && ns.every((n) => Math.abs(n - mean) <= mean * 0.25))
          add(start, 'warn', 'rhythm', `${ns.join('/')} words`, 'every sentence the same length reads composed; vary hard');
        const heads = ss.map((x) => (x.match(/^[\w']+/) ?? [''])[0].toLowerCase());
        for (let i = 2; i < heads.length; i++)
          if (heads[i] && heads[i] === heads[i - 1] && heads[i] === heads[i - 2]) { add(start, 'warn', 'anaphora', `${ss[i - 2].slice(0, 20)}… ×3`, 'three sentences opening on the same word; a composed cadence'); break; }
      }
    }
    para = [];
  };
  let prev = 0;
  for (const L of lines) {
    if (L.kind !== 'text' || L.n !== prev + 1) flush();
    if (L.kind === 'text') { if (!para.length) start = L.n; para.push(L.text); }
    prev = L.n;
  }
  flush();

  /* Density: what a register lets through one at a time, it does not let through in bulk. */
  for (const [id, cap] of Object.entries(P.density ?? {})) {
    const hits = found.filter((x) => x.id === id);
    if (hits.length >= cap) found.push({ line: hits[0].line, level: 'error', id: `${id}-density`, text: `${hits.length} in the file`, hint: `${hits.length} ${id} marks reads generated (tokio has one; Logseq 26)` });
  }

  found.sort((a, b) => a.line - b.line || (a.level === b.level ? 0 : a.level === 'error' ? -1 : 1));
  return { voice: v, source, marker: marker.voice, findings: found };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const strict = args.includes('--strict');
  const vi = args.indexOf('--voice');
  const voice = vi >= 0 ? args[vi + 1] : undefined;
  if (vi >= 0 && !PROFILES[voice]) { console.error(`check-voice: --voice takes one of ${VOICES.join(', ')}`); process.exit(2); }
  const files = args.filter((a, i) => !a.startsWith('--') && (vi < 0 || i !== vi + 1));
  if (!files.length) files.push('README.md');
  let errors = 0, warns = 0;
  for (const f of files) {
    const { voice: v, source, marker, findings } = await checkVoice(f, { voice });
    const tag = source === 'default' ? `${v}, no marker` : marker && marker !== v ? `${v}, marker says ${marker}` : v;
    const e = findings.filter((x) => x.level === 'error').length, w = findings.length - e;
    errors += e; warns += w;
    if (!findings.length) { console.log(`check-voice: ${f} (${tag}) clean`); continue; }
    console.error(`check-voice: ${f} (${tag}): ${e} error(s), ${w} warning(s)`);
    for (const x of findings)
      console.error(`  L${String(x.line).padEnd(4)} ${x.level.padEnd(5)} ${x.id.padEnd(16)} "${x.text}"  \u2192 ${x.hint}`);
  }
  process.exit(errors || (strict && warns) ? 1 : 0);
}
