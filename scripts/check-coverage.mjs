/*
 * Proves a README restructure lost nothing. When prose moves from the README
 * into docs/GUIDE.md it must move verbatim, not get paraphrased away — so this
 * takes every substantial line of the OLD README and checks it survives
 * somewhere in the NEW set of files.
 *
 *   node check-coverage.mjs --old old-README.md --new README.md --new docs/GUIDE.md \
 *        [--allow "commented-out image"] [--allow "Walk through it"]
 *
 * A line counts as substantial at >24 chars after whitespace-collapsing.
 * --allow patterns are lines you meant to drop (an old title block, a stale
 * link); without them the check always fails after a genuine cut. Exit 1 lists
 * what vanished; exit 0 means everything is accounted for.
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const norm = (s) => s.replace(/\s+/g, ' ').trim();

export async function checkCoverage({ old, news, allow = [] }) {
  const oldLines = (await readFile(old, 'utf8')).split('\n');
  let haystack = '';
  for (const f of news) haystack += '\n' + norm(await readFile(f, 'utf8'));
  const missing = [];
  for (const raw of oldLines) {
    const n = norm(raw);
    if (n.length <= 24) continue;
    if (allow.some((a) => n.includes(a))) continue;
    if (!haystack.includes(n)) missing.push(raw.trim());
  }
  return missing;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const old = args[args.indexOf('--old') + 1];
  const news = [], allow = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--new') news.push(args[++i]);
    if (args[i] === '--allow') allow.push(args[++i]);
  }
  if (!old || !news.length) { console.error('usage: check-coverage.mjs --old f --new f [--new f] [--allow pat]'); process.exit(1); }
  const missing = await checkCoverage({ old, news, allow });
  if (!missing.length) { console.log('check-coverage: every old line survives'); process.exit(0); }
  console.error(`check-coverage: ${missing.length} old line(s) survive nowhere`);
  missing.forEach((m) => console.error(`  - ${m.slice(0, 100)}`));
  process.exit(1);
}
