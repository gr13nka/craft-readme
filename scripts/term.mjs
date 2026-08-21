/*
 * A terminal card from a transcript — the CLI equivalent of a screenshot.
 *
 *   node term.mjs transcript.txt --out docs/images/cli.png [--title bury] [--width 720]
 *   node term.mjs transcript.txt --out docs/images/cli.gif --animate [--fps 15]
 *
 * Transcript lines:
 *   "$ some command"   a command — typed out in the animation, prompt in green
 *   "~ 800"            a pause of 800 ms (animation only; ignored in the still)
 *   anything else      output; a subset of ANSI SGR colour (0,1,2,30-37,90-97)
 *                      is honoured so real CLI output can be pasted in verbatim
 *
 * The animation is time-stepped, not real-time: the full transcript is rendered
 * once to fix the card's height, then each frame paints the content visible at
 * that instant. Deterministic, so no dropped frames and no jitter in the box.
 */
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { launch, open, evaluate, sleep, shot, box, transparent, setViewport } from './cdp.mjs';
import { serve } from './serve.mjs';
import { decodePNG, toRGBA, encodePNG } from './png.mjs';
import { roundCorners } from './round.mjs';
import { framesToGif } from './encode.mjs';

const ANSI = {
  30: '#282c34', 31: '#e06c75', 32: '#98c379', 33: '#e5c07b',
  34: '#61afef', 35: '#c678dd', 36: '#56b6c2', 37: '#abb2bf',
  90: '#5c6370', 91: '#e06c75', 92: '#98c379', 93: '#e5c07b',
  94: '#61afef', 95: '#c678dd', 96: '#56b6c2', 97: '#ffffff',
};
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* One output line with its SGR subset → HTML spans. */
function ansiLine(line) {
  let html = '', color = null, bold = false, dim = false, open = false;
  const flush = () => { if (open) { html += '</span>'; open = false; } };
  const span = () => {
    flush();
    const st = [];
    if (color) st.push(`color:${color}`);
    if (bold) st.push('font-weight:600');
    if (dim) st.push('opacity:.6');
    if (st.length) { html += `<span style="${st.join(';')}">`; open = true; }
  };
  const parts = line.split(/\x1b\[([0-9;]*)m/);
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) { if (parts[i]) html += esc(parts[i]); }
    else {
      for (const n of parts[i].split(';').map(Number)) {
        if (n === 0) { color = null; bold = false; dim = false; }
        else if (n === 1) bold = true;
        else if (n === 2) dim = true;
        else if (ANSI[n]) color = ANSI[n];
      }
      span();
    }
  }
  flush();
  return html;
}

/* Transcript → ordered units and a reveal schedule. */
function parse(text) {
  const units = [];
  for (const raw of text.replace(/\n$/, '').split('\n')) {
    if (/^~\s+\d+$/.test(raw)) units.push({ kind: 'pause', ms: Number(raw.slice(1).trim()) });
    else if (raw.startsWith('$ ')) units.push({ kind: 'cmd', text: raw.slice(2) });
    else units.push({ kind: 'out', text: raw });
  }
  return units;
}

const jitter = (i) => 30 + (((i * 2654435761) >>> 0) % 22);   // deterministic 30–51ms/char

/* Full HTML with everything visible (for the still and for height-locking). */
function renderFull(units) {
  const rows = [];
  for (const u of units) {
    if (u.kind === 'pause') continue;
    if (u.kind === 'cmd') rows.push(`<span class="p">$</span> <span class="c">${esc(u.text)}</span>`);
    else rows.push(ansiLine(u.text));
  }
  rows.push('<span class="p">$</span> <span class="cur">&nbsp;</span>');
  return rows.join('\n');
}

/* HTML visible at time t (ms), with a cursor while a command is typing. */
function renderAt(units, t) {
  const rows = [];
  let clock = 0;
  for (const u of units) {
    if (u.kind === 'pause') { clock += u.ms; continue; }
    if (u.kind === 'cmd') {
      let shown = 0;
      for (let i = 0; i < u.text.length; i++) { clock += jitter(i); if (clock <= t) shown++; else break; }
      if (shown === 0 && clock > t) { /* not started */ }
      const typing = shown < u.text.length;
      const head = `<span class="p">$</span> <span class="c">${esc(u.text.slice(0, shown))}</span>`;
      if (shown > 0 || !typing) rows.push(typing ? head + '<span class="cur">&nbsp;</span>' : head);
      if (typing) return rows.join('\n');            // nothing after an unfinished command
      clock += 250;                                   // Enter beat
    } else {
      if (clock > t) return rows.join('\n');
      rows.push(ansiLine(u.text));
      clock += 34;
    }
  }
  rows.push('<span class="p">$</span> <span class="cur">&nbsp;</span>');
  return rows.join('\n');
}

function totalTime(units) {
  let clock = 0;
  for (const u of units) {
    if (u.kind === 'pause') clock += u.ms;
    else if (u.kind === 'cmd') { for (let i = 0; i < u.text.length; i++) clock += jitter(i); clock += 250; }
    else clock += 34;
  }
  return clock;
}

const HERE = dirname(fileURLToPath(import.meta.url));

export async function term(transcriptPath, opts) {
  const units = parse(await readFile(transcriptPath, 'utf8'));
  const width = opts.width ?? 720;
  const dsf = 2, radius = 12 * dsf;
  const server = await serve(HERE, 0);
  const { cdp, close } = await launch();
  try {
    await open(cdp, `http://127.0.0.1:${server.port}/term.html`, { width: width + 80, height: 1200, dsf });
    await evaluate(cdp, `(() => {
      document.getElementById('term').style.width = ${width - 32} + 'px';
      const bar = document.getElementById('bar');
      ${opts.title ? `document.getElementById('title').textContent = ${JSON.stringify(opts.title)};` : `bar.classList.add('hidden');`}
      return true;
    })()`);

    /* Lock the card height to the full transcript so partial frames don't grow. */
    await evaluate(cdp, `document.getElementById('body').innerHTML = ${JSON.stringify(renderFull(units))}`);
    await sleep(60);
    const full = await box(cdp, '#term');
    const h = Math.ceil(full.height);
    await evaluate(cdp, `document.getElementById('term').style.height = ${h} + 'px'`);
    await setViewport(cdp, { width: width + 80, height: h + 40, dsf });
    await transparent(cdp);

    const grabRounded = async () => {
      const b = await box(cdp, '#term');
      const clip = { x: b.x, y: b.y, width: b.width, height: b.height };
      return encodePNG(roundCorners(toRGBA(decodePNG(await shot(cdp, null, clip))), radius));
    };

    await mkdir(dirname(opts.out), { recursive: true });
    if (!opts.animate) {
      await writeFile(opts.out, await grabRounded());
      const { width: w } = await box(cdp, '#term');
      return { out: opts.out, w: Math.round(w * dsf), h: h * dsf };
    }

    const fps = opts.fps ?? 15, hold = 1500;
    const T = totalTime(units);
    const frameDir = join(tmpdir(), `craft-readme-term-${process.pid}`);
    await rm(frameDir, { recursive: true, force: true });
    await mkdir(frameDir, { recursive: true });
    const frames = Math.ceil((T + hold) / 1000 * fps);
    for (let i = 0; i < frames; i++) {
      const t = (i / fps) * 1000;
      /* HTML is computed here in Node, then set directly — the page does no work. */
      await evaluate(cdp, `document.getElementById('body').innerHTML = ${JSON.stringify(renderAt(units, Math.min(t, T)))}`);
      await writeFile(join(frameDir, `f${String(i + 1).padStart(4, '0')}.png`), await grabRounded());
    }
    const res = await framesToGif(frameDir, opts.out, fps);
    await rm(frameDir, { recursive: true, force: true });
    return res;
  } finally { await close(); await server.close(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const src = args.find(a => !a.startsWith('--'));
  const flag = (name, has) => { const i = args.indexOf(name); return i < 0 ? undefined : (has ? true : args[i + 1]); };
  if (!src) { console.error('usage: term.mjs transcript.txt --out path.png [--animate] [--fps 15] [--width 720] [--title x]'); process.exit(1); }
  const opts = {
    out: flag('--out') ?? 'terminal.png',
    animate: !!flag('--animate', true),
    fps: flag('--fps') ? Number(flag('--fps')) : undefined,
    width: flag('--width') ? Number(flag('--width')) : undefined,
    title: flag('--title'),
  };
  console.log(JSON.stringify(await term(src, opts)));
}
