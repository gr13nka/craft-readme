/*
 * Screenshot or short animation of a web page, driven by a small JSON spec.
 *
 *   node capture.mjs spec.json                 → PNG (or GIF/APNG if spec.record)
 *   node capture.mjs spec.json --probe "a,b"   → print bounding boxes and exit
 *   node capture.mjs spec.json --set scroll=700 --set out=docs/images/hero.png
 *
 * The spec:
 *   { "url": "http://…"  | "serve": "./" [, "path": "/index.html"],
 *     "viewport": { "width": 1400, "height": 900, "dsf": 2 },
 *     "settle": 2000,
 *     "steps": [ {"eval":"…"}, {"click":"sel","wait":1400}, {"hover":[x,y]}, {"wait":500} ],
 *     "clip": {"selector":".panel","pad":16} | {"x":0,"y":0,"width":1400,"height":800},
 *     "radius": 16,
 *     "out": "docs/images/hero.png",
 *     "record": { "trigger":{"click":"sel"}, "lead":500, "duration":3600,
 *                 "fps":20, "slow":3, "format":"gif" } }
 *
 * Always on, never spec options: transparent background, cache disabled, a
 * fresh browser profile, a free port, readyState polling, document.fonts.ready,
 * and a built-in static server when `serve` is set. So one command captures,
 * rounds the corners, encodes, and prints one JSON summary.
 */
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { launch, open, evaluate, sleep, shot, setViewport, transparent, box } from './cdp.mjs';
import { serve } from './serve.mjs';
import { decodePNG, toRGBA, encodePNG } from './png.mjs';
import { roundCorners } from './round.mjs';
import { framesToGif } from './encode.mjs';
import { framesToApng } from './apng.mjs';

const CDP_RADIUS = (r, dsf) => Math.round((r ?? 0) * dsf);

async function runSteps(cdp, steps = []) {
  for (const s of steps) {
    if (s.eval != null) await evaluate(cdp, s.eval);
    if (s.click != null) {
      await evaluate(cdp, `document.querySelector(${JSON.stringify(s.click)})?.click()`);
    }
    if (s.hover != null) {
      const [x, y] = s.hover;
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 });
    }
    if (s.wait != null) await sleep(s.wait);
  }
}

async function resolveClip(cdp, clip) {
  if (!clip) return undefined;
  if (clip.selector) {
    const b = await box(cdp, clip.selector);
    if (!b) throw new Error(`clip selector not found: ${clip.selector}`);
    const pad = clip.pad ?? 0;
    return { x: Math.max(0, b.x - pad), y: Math.max(0, b.y - pad), width: b.width + pad * 2, height: b.height + pad * 2 };
  }
  return { x: clip.x, y: clip.y, width: clip.width, height: clip.height };
}

/* One still. */
async function captureStill(cdp, spec) {
  const clip = await resolveClip(cdp, spec.clip);
  const buf = await shot(cdp, null, clip);
  let img = toRGBA(decodePNG(buf));
  if (spec.radius) img = roundCorners(img, CDP_RADIUS(spec.radius, spec.viewport?.dsf ?? 2));
  await mkdir(dirname(spec.out), { recursive: true });
  await writeFile(spec.out, encodePNG(img));
  return { out: spec.out, w: img.w, h: img.h, bytes: (await readFile(spec.out)).length };
}

/*
 * A short animation. Recorded in slow motion and played back at real speed:
 * clipped screenshots arrive at roughly eight a second, far too coarse for a
 * one- or two-second motion, so both the animation clock and the script clock
 * are stretched by `slow`, then the frames are resampled to the target fps.
 * Both clocks must stretch together or the trigger's own timers fire before
 * the picture they drive has been drawn.
 */
async function captureRecord(cdp, spec) {
  const rec = spec.record;
  const slow = rec.slow ?? 1;
  const fps = rec.fps ?? 20;
  const lead = rec.lead ?? 400;
  const span = lead + rec.duration;
  const clip = await resolveClip(cdp, spec.clip);

  if (slow > 1) {
    await cdp.send('Animation.enable');
    await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 / slow });
    /* Scale the page's own clocks so timeouts, Date.now/performance.now readers
       and rAF-timestamp readers all run at the same stretched rate. */
    await evaluate(cdp, `(() => {
      const S = ${slow};
      const rt = window.setTimeout.bind(window);
      window.setTimeout = (fn, ms, ...a) => rt(fn, (ms || 0) * S, ...a);
      const p0 = performance.now(), rp = performance.now.bind(performance);
      performance.now = () => p0 + (rp() - p0) / S;
      const d0 = Date.now(), rd = Date.now;
      Date.now = () => d0 + (rd() - d0) / S;
      const rr = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (cb) => rr(() => cb(performance.now()));
      return true;
    })()`);
  }

  const raw = [];
  const t0 = Date.now();
  let fired = false;
  while (Date.now() - t0 < span * slow) {
    if (!fired && Date.now() - t0 >= lead * slow) {
      fired = true;
      if (rec.trigger?.click) evaluate(cdp, `document.querySelector(${JSON.stringify(rec.trigger.click)})?.click()`).catch(() => {});
      else if (rec.trigger?.eval) evaluate(cdp, rec.trigger.eval).catch(() => {});
    }
    raw.push({ t: Date.now() - t0, data: await shot(cdp, null, clip) });
  }

  /* Resample the unevenly-timed grabs onto a fixed real-time timeline. */
  const frameDir = join(tmpdir(), `craft-readme-frames-${process.pid}`);
  await rm(frameDir, { recursive: true, force: true });
  await mkdir(frameDir, { recursive: true });
  const total = Math.max(1, Math.round(span / 1000 * fps));
  const pxRadius = CDP_RADIUS(spec.radius, spec.viewport?.dsf ?? 2);
  let cursor = 0, n = 0;
  for (let i = 0; i < total; i++) {
    const want = (i / fps) * 1000 * slow;
    while (cursor + 1 < raw.length && raw[cursor + 1].t <= want) cursor++;
    let img = toRGBA(decodePNG(raw[cursor].data));
    if (pxRadius) img = roundCorners(img, pxRadius);
    await writeFile(join(frameDir, `f${String(++n).padStart(4, '0')}.png`), encodePNG(img));
  }

  await mkdir(dirname(spec.out), { recursive: true });
  const fmt = rec.format ?? 'gif';
  let res;
  if (fmt === 'frames') res = { out: frameDir, frames: n };
  else if (fmt === 'apng') res = await framesToApng(frameDir, spec.out, fps);
  else res = await framesToGif(frameDir, spec.out, fps);
  if (fmt !== 'frames') await rm(frameDir, { recursive: true, force: true });
  return res;
}

function applyOverrides(spec, sets) {
  for (const kv of sets) {
    const [k, ...rest] = kv.split('=');
    const v = rest.join('=');
    const num = Number(v);
    const val = v === 'true' ? true : v === 'false' ? false : (v !== '' && !isNaN(num) ? num : v);
    /* dotted path, e.g. --set viewport.width=1600 or --set record.fps=15 */
    const path = k.split('.');
    let o = spec;
    for (let i = 0; i < path.length - 1; i++) o = (o[path[i]] ??= {});
    o[path[path.length - 1]] = val;
  }
}

export async function capture(spec) {
  let server;
  let url = spec.url;
  if (spec.serve) {
    server = await serve(spec.serve, 0);
    url = `http://127.0.0.1:${server.port}${spec.path ?? '/'}`;
  }
  const { cdp, close } = await launch();
  try {
    const vp = { width: 1400, height: 900, dsf: 2, ...(spec.viewport ?? {}) };
    await open(cdp, url, vp);
    await sleep(spec.settle ?? 1500);
    await runSteps(cdp, spec.steps);
    return spec.record ? await captureRecord(cdp, spec) : await captureStill(cdp, spec);
  } finally {
    await close();
    if (server) await server.close();
  }
}

/* --probe: print the boxes of some selectors so a clip can be chosen without guessing. */
async function probe(spec, selectors) {
  let server, url = spec.url;
  if (spec.serve) { server = await serve(spec.serve, 0); url = `http://127.0.0.1:${server.port}${spec.path ?? '/'}`; }
  const { cdp, close } = await launch();
  try {
    await open(cdp, url, { width: 1400, height: 900, dsf: 2, ...(spec.viewport ?? {}) });
    await sleep(spec.settle ?? 1500);
    await runSteps(cdp, spec.steps);
    const out = {};
    for (const s of selectors) out[s] = await box(cdp, s.trim());
    return out;
  } finally { await close(); if (server) await server.close(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const specPath = args.find(a => !a.startsWith('--'));
  if (!specPath) { console.error('usage: capture.mjs spec.json [--probe "a,b"] [--set k=v]'); process.exit(1); }
  const spec = JSON.parse(await readFile(specPath, 'utf8'));
  /* Ignore "_"-prefixed keys so a spec can carry inline comments. */
  for (const k of Object.keys(spec)) if (k.startsWith('_')) delete spec[k];
  const sets = []; let probeSel = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--set') sets.push(args[++i]);
    else if (args[i] === '--probe') probeSel = args[++i];
  }
  applyOverrides(spec, sets);
  /* A spec path is relative to the spec file's own directory for serve/out. */
  const base = dirname(resolve(specPath));
  if (spec.serve && !spec.serve.startsWith('/')) spec.serve = resolve(base, spec.serve);
  console.log(JSON.stringify(probeSel ? await probe(spec, probeSel.split(',')) : await capture(spec)));
}
