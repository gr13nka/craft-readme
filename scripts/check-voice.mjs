/*
 * The voice check. Fails, with the line, on the vocabulary that gives a machine
 * away: marketing adjectives, softeners, LLM connective tissue, boilerplate
 * openers and closers, emoji, exclamation marks. And on the loudest tell of
 * all, an LLM trying to be funny: the parenthetical wink, "spoiler alert",
 * "pro tip", ™. Warns on the structural tells a regex can only suspect: the
 * em-dash aside, the rule-of-three list, "not X, but Y", the participial
 * payoff, same-length sentences, semicolons, a Title Case heading.
 *
 *   node check-voice.mjs [README.md …] [--strict]
 *
 * Prose only. Fenced code, inline code, quoted spans, HTML tags, comments,
 * URLs and badges are ignored (a mention of "seamlessly" is not a use). Exit 1 on any error (any warning too with --strict), else 0.
 * The rules are explained in references/voice.md; this is the part of them a
 * regex can hold. A warning is a judgment call, not a verdict.
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/* ---- the word lists ------------------------------------------------------ */

const MARKETING = [
  'powerful', 'robust(?:ly|ness)?', 'seamless(?:ly)?',
  'blazing(?:ly)?(?:[- ]fast)?', 'lightning[- ]fast', 'lightweight', 'cutting[- ]edge', 'state[- ]of[- ]the[- ]art',
  'next[- ]gen(?:eration)?', 'best[- ]in[- ]class', 'world[- ]class', 'enterprise[- ]grade', 'production[- ]grade',
  'battle[- ]tested', 'game[- ]chang(?:er|ing)', 'revolutioni[sz]e[sd]?', 'supercharged?', 'turbocharged?',
  'unleash(?:es|ed)?', 'empower(?:s|ed|ing)?', 'leverag(?:e|es|ed|ing)', 'utili[sz](?:e|es|ed|ing)',
  'streamlin(?:e|es|ed|ing)', 'delightful', 'magical(?:ly)?', 'elegant(?:ly)?', 'intuitive(?:ly)?',
  'beautiful(?:ly)?', 'sleek', 'comprehensive', 'versatile', 'feature[- ]rich', 'full[- ]featured',
  'all[- ]in[- ]one', 'one[- ]stop', 'plug[- ]and[- ]play', 'easy[- ]to[- ]use', 'user[- ]friendly',
  'developer[- ]friendly', 'first[- ]class', 'batteries[- ]included', 'ready[- ]to[- ]use', 'purpose[- ]built',
  'tailored', 'curated',
];

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
  'ensur(?:es|ing|e)(?: that)?', 'note that', 'basically', 'under the hood', 'no more \\w+', 'this means (?:that )?',
  'which means', 'can be used to', 'provides? a (?:way|simple way|set of)', 'that said,', 'as well as', 'etc\\.?',
  '(?:incredibly|truly|extremely|highly|super|absolutely|totally|genuinely|remarkably|exceptionally|significantly)',
  '(?:potentially|generally|typically|in most cases|somewhat|fairly|relatively|arguably)',
];

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

const HEADING = ['(?:key )?features?$', 'why \\w+\\??$', 'table of contents', 'tl;?dr', '^(?:overview|introduction|about)$'];
const HEADING_SOFT = [
  '^(?:getting started|prerequisites|contributing|acknowledg\\w*|roadmap|changelog|support|contact|authors?|motivation|background|credits)$',
];

const word = (alts) => new RegExp(`(?<![\\w-])(?:${alts.join('|')})(?![\\w-])`, 'giu');

/* [id, level, regex, hint]. The regex runs on cleaned prose, lowercase-insensitive. */
const RULES = [
  ['marketing',   'error', word(MARKETING),      'say what it does, or the number; the adjective is the tell'],
  ['softener',    'error', word(SOFTENER),       'a softener; it says "this is easy" instead of showing the one command'],
  ['softener',    'warn',  word(MARKETING_SOFT), 'a softener; cut it, the command is the same length without it'],
  ['scaffold',    'error', word(SCAFFOLD),        'LLM connective tissue; state the thing and stop'],
  ['scaffold',    'warn',  word(SCAFFOLD_SOFT),   'hedge or filler; cut unless it carries a fact'],
  ['boilerplate', 'error', word(BOILERPLATE),     'README boilerplate; nobody reads it, and it reads generated'],
  ['boilerplate', 'warn',  word(BOILERPLATE_SOFT),'boilerplate shape; does the line say anything true and actionable?'],
  ['wink',        'error', word(WINK),            'the joke is being labelled; drop the label, usually the joke'],
  ['wink',        'warn',  word(WINK_SOFT),       'a wink; the line should stand without it'],
  ['wink',        'error', /\u2122|\(tm\)/gi,       'the ironic ™; the tell of an LLM doing sarcasm'],
  ['em-dash',     'warn',  /\u2014|\s--\s|\s\u2013\s/g, 'a period usually does the job; keep only if you would defend it'],
  ['semicolon',   'warn',  /;(?=\s)/g,            'READMEs rarely need one; two sentences'],
  ['antithesis',  'warn',  /\bnot (?:just |only |merely |simply |about )?[^,.;]{1,50}, (?:it'?s|it is|but|rather|that'?s)\b|\bnot [^,.;]{1,40}, but\b|, not [^,.;]{1,30}\.(?:\s|$)/giu, '"not X, Y" balance; pick a side'],
  ['payoff',      'error', /, (?:making|allowing|enabling|ensuring|empowering) (?:it|you|them|us|the|this|your|a|an|each|every|for)\b/giu, 'the participial tail explains the payoff; the reader got it'],
  ['payoff',      'warn',  /, (?:which|that) (?:makes|means|ensures|allows|lets|keeps|gives|is what)\b|, so (?:that )?you (?:can|don'?t|never|won'?t)\b/giu, 'explaining the payoff; state the thing and stop'],
  ['ellipsis',    'warn',  /(?:\.\.\.|\u2026)\s*$/g, 'trailing off; finish the sentence or cut it'],
];

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

/* ---- the check ----------------------------------------------------------- */

export async function checkVoice(file) {
  const src = await readFile(file, 'utf8');
  const lines = proseLines(src);
  const found = [];
  const add = (n, level, id, text, hint) => found.push({ line: n, level, id, text: snip(text), hint });

  for (const L of lines) {
    const t = L.text;
    for (const [id, level, re, hint] of RULES) {
      re.lastIndex = 0;
      for (let m; (m = re.exec(t)); ) add(L.n, level, id, m[0].trim() || m[0], hint);
    }
    const em = [...t.matchAll(EMOJI)].find((m) => !/[©®™]/.test(m[0]));
    if (em) add(L.n, 'error', 'emoji', em[0], 'no emoji, anywhere, in any register');
    for (const m of t.matchAll(/!(?=[\s"')\]]|$)/g)) add(L.n, 'error', 'exclamation', t.slice(Math.max(0, m.index - 30), m.index + 1), 'no exclamation marks; the fact is enough');

    if (L.kind === 'heading') {
      for (const re of HEADING) if (new RegExp(re, 'iu').test(t)) add(L.n, 'error', 'heading', t, 'a machine-shaped heading; name what the section actually shows');
      for (const re of HEADING_SOFT) if (new RegExp(re, 'iu').test(t)) add(L.n, 'warn', 'heading', t, 'boilerplate section on a landing page; keep only if it says something true and actionable');
      if (/\?\s*$/.test(t) && !/^(?:key )?features/i.test(t)) add(L.n, 'warn', 'heading', t, 'a question heading; the reader did not ask it');
      const ws = t.split(/\s+/);
      const caps = ws.slice(1).filter((w) => /^[A-Z][a-z]{3,}/.test(w)).length;
      const lower = ws.slice(1).filter((w) => /^[a-z]{4,}/.test(w)).length;
      if (ws.length >= 3 && caps >= 2 && lower === 0) add(L.n, 'warn', 'heading', t, 'Title Case heading; sentence case reads human');
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

  return found.sort((a, b) => a.line - b.line || (a.level === b.level ? 0 : a.level === 'error' ? -1 : 1));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const strict = args.includes('--strict');
  const files = args.filter((a) => !a.startsWith('--'));
  if (!files.length) files.push('README.md');
  let errors = 0, warns = 0;
  for (const f of files) {
    const found = await checkVoice(f);
    const e = found.filter((x) => x.level === 'error').length, w = found.length - e;
    errors += e; warns += w;
    if (!found.length) { console.log(`check-voice: ${f} clean`); continue; }
    console.error(`check-voice: ${f}: ${e} error(s), ${w} warning(s)`);
    for (const x of found)
      console.error(`  L${String(x.line).padEnd(4)} ${x.level.padEnd(5)} ${x.id.padEnd(12)} "${x.text}"  \u2192 ${x.hint}`);
  }
  process.exit(errors || (strict && warns) ? 1 : 0);
}
