/*
 * Renders the repo's own markdown into a static site for GitHub Pages, using the
 * markdown renderer and GitHub stylesheet this skill already ships. No Jekyll, no
 * front matter in the source files, no build tooling — the same zero-dependency rule
 * as everything else here.
 *
 * It exists for one reason: a docs page tends to outrank the repo page it documents,
 * and a Pages site is the only surface where we control <title>, the meta description
 * and the og: tags directly. Jekyll's default theme does not give us those.
 *
 *   node site.mjs README.md:index.html docs/GUIDE.md:docs/guide.html \
 *     --base https://owner.github.io/repo [--root .]
 *   node site.mjs <same args> --check      → exit 1 if the committed HTML is stale
 *
 * Pages are written where their relative paths already resolve, so images and anchors
 * keep working without rewriting: index.html at the repo root sees docs/images/*, and
 * docs/guide.html sees ../. Markdown links are rewritten to their generated .html.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMarkdown } from './markdown.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* The opening prose, for <meta name="description">. Accumulates paragraphs rather than
   taking the first, because a slogan is usually the first thing on the page and a slogan
   alone never says what the project is. Derived rather than duplicated by hand. */
function describe(md) {
  const parts = [];
  for (const block of md.split(/\n\s*\n/)) {
    const t = block
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/^\s*<[^>]+>\s*$/gm, '')
      .replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, '')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/<[^>]+>/g, '')
      .replace(/[*_`#>]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (t.length < 25) continue;
    parts.push(t);
    const joined = parts.join(' ');
    if (joined.length >= 120) return joined.length > 300 ? joined.slice(0, 297) + '…' : joined;
  }
  const joined = parts.join(' ');
  return joined.length > 300 ? joined.slice(0, 297) + '…' : joined;
}

const title = (md, fallback) => (md.match(/^#\s+(.+)$/m)?.[1] ?? fallback).trim();

const page = ({ body, css, pageTitle, description, canonical, image }) => `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(pageTitle)}</title>
${description ? `<meta name="description" content="${esc(description)}">` : ''}
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(pageTitle)}">
${description ? `<meta property="og:description" content="${esc(description)}">` : ''}
${canonical ? `<meta property="og:url" content="${esc(canonical)}">` : ''}
${image ? `<meta property="og:image" content="${esc(image)}">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:image" content="${esc(image)}">` : ''}
<style>
  html { background: #fff; color-scheme: light; }
  body { margin: 0; padding: 32px 20px 96px; }
  .markdown-body { max-width: 860px; margin: 0 auto; }
  .markdown-body img { max-width: 100%; height: auto; }
  @media (max-width: 600px) { body { padding: 20px 14px 64px; } }
${css}
</style>
<article class="markdown-body">${body}</article>
`;

export async function buildSite(pairs, { root = '.', base = '', check = false } = {}) {
  const css = await readFile(join(HERE, 'github-readme.css'), 'utf8');
  const map = new Map(pairs.map(([src, out]) => [resolve(root, src), resolve(root, out)]));
  const written = [], stale = [];

  for (const [srcAbs, outAbs] of map) {
    const md = await readFile(srcAbs, 'utf8');
    /* Rewrite links to the markdown files we are also generating; anything else is
       left alone, so external links and repo-relative assets keep working. */
    let rewritten = md;
    for (const [otherSrc, otherOut] of map) {
      const from = relative(dirname(srcAbs), otherSrc).split('\\').join('/');
      const to = relative(dirname(outAbs), otherOut).split('\\').join('/');
      if (from === to) continue;
      rewritten = rewritten.split(`](${from}`).join(`](${to}`);
    }
    const canonical = base ? new URL(relative(resolve(root), outAbs).split('\\').join('/'), base + '/').href : '';
    const image = base ? new URL('docs/images/og.png', base + '/').href : '';
    const html = page({
      body: renderMarkdown(rewritten),
      css,
      pageTitle: title(md, 'documentation'),
      description: describe(md),
      canonical: canonical.replace(/\/index\.html$/, '/'),
      image,
    });
    const rel = relative(resolve(root), outAbs);
    if (check) {
      /* The committed HTML is an artifact of the markdown, so it goes stale the moment
         someone edits a source file and forgets to regenerate. Comparing the rebuild
         against what is on disk is the only thing that catches that. */
      let current = null;
      try { current = await readFile(outAbs, 'utf8'); } catch { /* missing counts as stale */ }
      if (current !== html) stale.push({ out: rel, why: current === null ? 'not generated yet' : 'out of date with its markdown' });
    } else {
      await writeFile(outAbs, html);
      written.push({ out: rel, bytes: Buffer.byteLength(html) });
    }
  }
  if (check) return { stale };
  /* No Jekyll: the HTML is final, and this stops GitHub rebuilding it. */
  await writeFile(join(resolve(root), '.nojekyll'), '');
  return written;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const bi = args.indexOf('--base'), ri = args.indexOf('--root');
  const pairs = args
    /* Guard the -1 case: a missing flag makes idx + 1 === 0 and would drop argv[0]. */
    .filter((a, i) => !a.startsWith('--') && (bi < 0 || i !== bi + 1) && (ri < 0 || i !== ri + 1))
    .map((a) => { const [s, o] = a.split(':'); return [s, o ?? s.replace(/\.md$/i, '.html')]; });
  if (!pairs.length) { console.error('usage: site.mjs README.md:index.html [docs/GUIDE.md:docs/guide.html] --base https://owner.github.io/repo'); process.exit(1); }
  const check = args.includes('--check');
  const res = await buildSite(pairs, {
    root: ri >= 0 ? args[ri + 1] : '.',
    base: bi >= 0 ? args[bi + 1].replace(/\/$/, '') : '',
    check,
  });
  if (!check) { console.log(JSON.stringify({ written: res })); process.exit(0); }
  if (!res.stale.length) { console.log('site: in sync with the markdown'); process.exit(0); }
  console.error(`site: ${res.stale.length} page(s) stale — regenerate and commit`);
  for (const s of res.stale) console.error(`  ${s.out}: ${s.why}`);
  process.exit(1);
}
