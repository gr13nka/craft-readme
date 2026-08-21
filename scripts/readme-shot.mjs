/*
 * Render a README to a clean image — the way GitHub shows it, without the
 * chrome. A skill that makes READMEs has to be able to show one.
 *
 *   readme-shot.mjs README.md --out img.png [--width 900]
 *   readme-shot.mjs --compare before.md after.md --out hero.png
 *   readme-shot.mjs --wipe    before.md after.md --out demo.gif [--fps 20]
 *   readme-shot.mjs --url https://github.com/o/r/blob/main/README.md --out img.png
 *
 * The markdown is rendered to GitHub-styled HTML and screenshotted. The page is
 * written into the README's own repo root and served from there, so repo-
 * relative images (docs/images/…) resolve; shields badges load over the network.
 * Corners are cut to transparency, like every other image this skill makes.
 */
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { resolve, dirname, join, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { launch, open, evaluate, sleep, shot, box, transparent, setViewport } from './cdp.mjs';
import { serve } from './serve.mjs';
import { renderMarkdown } from './markdown.mjs';
import { decodePNG, toRGBA, encodePNG } from './png.mjs';
import { roundCorners } from './round.mjs';
import { framesToGif } from './encode.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const CSS = await readFile(join(HERE, 'github-readme.css'), 'utf8');
const RADIUS = 12 * 2;                                   // css px * dsf

const page = (bodyHTML, width) => `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;background:transparent}
#wrap{width:${width}px;margin:0;border-radius:12px;overflow:hidden}
${CSS}</style>
<div id="wrap"><article class="markdown-body" id="rm">${bodyHTML}</article></div>`;

/* Render one markdown file to a rounded PNG buffer (and its natural size). */
async function renderReadme(cdp, server, repoRoot, mdPath, width) {
  const md = await readFile(mdPath, 'utf8');
  const html = renderMarkdown(md);
  const tmpName = `.craft-readme-preview-${process.pid}-${Math.abs(hash(mdPath))}.html`;
  const tmpFile = join(repoRoot, tmpName);
  await writeFile(tmpFile, page(html, width));
  try {
    await open(cdp, `http://127.0.0.1:${server.port}/${tmpName}`, { width: width + 40, height: 1000, dsf: 2 });
    await sleep(900);                                    // let remote badges settle
    const b = await box(cdp, '#wrap');
    const h = Math.ceil(b.height);
    await setViewport(cdp, { width: width + 40, height: h + 20, dsf: 2 });
    await transparent(cdp);
    await sleep(150);
    const buf = await shot(cdp, null, { x: b.x, y: b.y, width: b.width, height: b.height });
    return { img: roundCorners(toRGBA(decodePNG(buf)), RADIUS), w: Math.round(b.width), h };
  } finally {
    await rm(tmpFile, { force: true });
  }
}

const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; };

async function single(mdPath, out, width) {
  const repoRoot = repoOf(mdPath);
  const server = await serve(repoRoot, 0);
  const { cdp, close } = await launch();
  try {
    const { img } = await renderReadme(cdp, server, repoRoot, mdPath, width);
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, encodePNG(img));
    return { out, w: img.w, h: img.h, bytes: (await readFile(out)).length };
  } finally { await close(); await server.close(); }
}

/* Guess the repo root: walk up to the nearest dir with a .git, else the file's dir. */
import { access } from 'node:fs/promises';
function repoOf(mdPath) { return dirname(resolve(mdPath)); }

/* Compose N rounded README PNGs (as data URIs) into one shot on transparent
   ground. Used for the before/after hero: two cards, labels, an arrow. */
async function compose(cards, out, { gap = 40, labelGap = 44, cropH = 0 } = {}) {
  const server = await serve(HERE, 0);
  const { cdp, close } = await launch();
  try {
    const imgs = cards.map((c) => ({ uri: 'data:image/png;base64,' + encodePNG(c.img).toString('base64'),
      w: c.img.w, h: c.img.h, label: c.label }));
    const scale = 2;                                     // cards are dsf-2 pixels; show at half
    const colW = Math.round(Math.max(...imgs.map((i) => i.w)) / scale);
    const rowH = cropH || Math.round(Math.max(...imgs.map((i) => i.h)) / scale);
    const html = `<!doctype html><meta charset="utf-8"><style>
      html,body{margin:0;background:transparent}
      #row{display:flex;align-items:flex-start;gap:${gap}px;padding:${labelGap + 8}px 8px 8px;width:max-content;
        font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .col{position:relative;width:${colW}px}
      .lab{position:absolute;top:-${labelGap}px;left:2px;font-size:22px;font-weight:700;color:#8b93a7;letter-spacing:.04em}
      .card{width:${colW}px;height:${rowH}px;overflow:hidden;border-radius:14px;
        box-shadow:0 12px 30px rgba(0,0,0,.28);position:relative}
      .card img{width:${colW}px;display:block}
      .fade{position:absolute;left:0;right:0;bottom:0;height:110px;
        background:linear-gradient(rgba(255,255,255,0),#ffffff)}
      .arrow{align-self:center;font-size:44px;color:#8b93a7;margin-top:${labelGap}px}
    </style><div id="row">${imgs.map((im, k) => `${k ? '<div class="arrow">\u2192</div>' : ''}
      <div class="col"><span class="lab">${im.label}</span>
      <div class="card"><img src="${im.uri}">${cropH ? '<div class="fade"></div>' : ''}</div></div>`).join('')}</div>`;
    const tmp = join(HERE, `.compose-${process.pid}.html`);
    await writeFile(tmp, html);
    try {
      await open(cdp, `http://127.0.0.1:${server.port}/${basename(tmp)}`, { width: 200, height: 200, dsf: 2 });
      await sleep(300);
      const b = await box(cdp, '#row');
      await setViewport(cdp, { width: Math.ceil(b.width) + 8, height: Math.ceil(b.height) + 8, dsf: 2 });
      await transparent(cdp);
      await sleep(150);
      const buf = await shot(cdp, null, { x: b.x, y: b.y, width: b.width, height: b.height });
      await mkdir(dirname(out), { recursive: true });
      await writeFile(out, buf);
      return { out, w: Math.round(b.width * 2), h: Math.round(b.height * 2), bytes: buf.length };
    } finally { await rm(tmp, { force: true }); }
  } finally { await close(); await server.close(); }
}

/* Before/after wipe: after over before, a divider sweeping left to right. */
async function wipe(beforeCard, afterCard, out, fps) {
  const server = await serve(HERE, 0);
  const { cdp, close } = await launch();
  try {
    const scale = 2;
    const w = Math.round(Math.max(beforeCard.img.w, afterCard.img.w) / scale);
    const h = Math.round(Math.min(beforeCard.img.h, afterCard.img.h, 720 * scale) / scale);
    const uri = (c) => 'data:image/png;base64,' + encodePNG(c.img).toString('base64');
    const html = `<!doctype html><meta charset="utf-8"><style>
      html,body{margin:0;background:transparent}
      #stage{position:relative;width:${w}px;height:${h}px;border-radius:14px;overflow:hidden;
        box-shadow:0 12px 30px rgba(0,0,0,.28)}
      #stage img{position:absolute;top:0;left:0;width:${w}px;display:block}
      #after{clip-path:inset(0 0 0 0)}
      #div{position:absolute;top:0;bottom:0;width:3px;background:#4b74e8;box-shadow:0 0 10px rgba(75,116,232,.7)}
      .tag{position:absolute;top:12px;font:600 15px -apple-system,sans-serif;color:#fff;
        padding:3px 10px;border-radius:999px;background:rgba(20,22,34,.72)}
      #tb{left:12px}#ta{right:12px}
    </style>
    <div id="stage">
      <img id="before" src="${uri(beforeCard)}">
      <img id="after" src="${uri(afterCard)}">
      <div id="div"></div><span class="tag" id="tb">before</span><span class="tag" id="ta">after</span>
    </div>`;
    const tmp = join(HERE, `.wipe-${process.pid}.html`);
    await writeFile(tmp, html);
    try {
      await open(cdp, `http://127.0.0.1:${server.port}/${basename(tmp)}`, { width: w + 8, height: h + 8, dsf: 2 });
      await sleep(400);
      await transparent(cdp);
      const b = await box(cdp, '#stage');
      const clip = { x: b.x, y: b.y, width: b.width, height: b.height };
      const frameDir = join(tmpdir(), `craft-readme-wipe-${process.pid}`);
      await rm(frameDir, { recursive: true, force: true });
      await mkdir(frameDir, { recursive: true });
      /* timeline: hold before, sweep to after, hold after, sweep back */
      const seq = [];
      const hold = Math.round(fps * 0.9), sweep = Math.round(fps * 1.1);
      for (let k = 0; k < hold; k++) seq.push(0);
      for (let k = 0; k <= sweep; k++) seq.push(k / sweep);
      for (let k = 0; k < hold * 1.4; k++) seq.push(1);
      for (let k = 0; k <= sweep; k++) seq.push(1 - k / sweep);
      let n = 0;
      for (const t of seq) {
        const pct = Math.round((1 - t) * 100);
        await evaluate(cdp, `(() => { const s = ${100 - pct};
          document.getElementById('after').style.clipPath = 'inset(0 ' + (100 - s) + '% 0 0)';
          document.getElementById('div').style.left = s + '%'; return true; })()`);
        await writeFile(join(frameDir, `f${String(++n).padStart(4, '0')}.png`), await shot(cdp, null, clip));
      }
      const res = await framesToGif(frameDir, out, fps);
      await rm(frameDir, { recursive: true, force: true });
      return res;
    } finally { await rm(tmp, { force: true }); }
  } finally { await close(); await server.close(); }
}

/* Render both READMEs once (shared browser), for compare/wipe. */
async function renderPair(beforePath, afterPath, width) {
  const repoRoot = repoOf(afterPath);
  const server = await serve(repoRoot, 0);
  const { cdp, close } = await launch();
  try {
    const before = await renderReadme(cdp, server, repoRoot, beforePath, width);
    const after = await renderReadme(cdp, server, repoRoot, afterPath, width);
    return { before, after };
  } finally { await close(); await server.close(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const val = (f) => { const i = args.indexOf(f); return i < 0 ? undefined : args[i + 1]; };
  const width = Number(val('--width') ?? 900);
  const out = val('--out') ?? 'readme.png';
  const fps = Number(val('--fps') ?? 18);

  if (args[0] === '--compare' || args[0] === '--wipe') {
    const mds = args.filter((a) => /\.md$/.test(a));
    const [beforePath, afterPath] = mds;
    const { before, after } = await renderPair(beforePath, afterPath, width);
    if (args[0] === '--compare')
      console.log(JSON.stringify(await compose(
        [{ img: before.img, label: 'before' }, { img: after.img, label: 'after' }], out, { cropH: 640 })));
    else
      console.log(JSON.stringify(await wipe({ img: before.img }, { img: after.img }, out, fps)));
  } else {
    const md = args.find((a) => !a.startsWith('--') && /\.md$/.test(a));
    console.log(JSON.stringify(await single(md, out, width)));
  }
}

export { renderReadme, repoOf, page, compose, wipe, renderPair };
