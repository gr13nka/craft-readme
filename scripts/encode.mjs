/*
 * Frames directory → GIF or APNG.
 *
 *   node encode.mjs frames/ out.gif  [--fps 20]
 *   node encode.mjs frames/ out.apng [--fps 20]
 *
 * GIF path: one global median-cut palette over every frame (255 colours + a
 * transparent slot), Floyd–Steinberg dithering, and transparent frame
 * differencing against an undisposed canvas — most of a frame is identical to
 * the one before and is written as transparent pixels, which is what keeps a
 * 70-frame take under 300 KB. Dithering is deterministic, so identical input
 * frames quantise identically and really do diff to nothing. Alpha-0 pixels
 * from rounded corners are kept out of the palette and written transparent.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePNG, toRGBA } from './png.mjs';
import { medianCut, nearestFinder, quantise, encodeGIF, TRANSPARENT } from './gifenc.mjs';
import { framesToApng } from './apng.mjs';

export async function framesToGif(dir, out, fps = 20) {
  const delay = Math.max(2, Math.round(100 / fps));           // centiseconds
  const files = (await readdir(dir)).filter(f => f.endsWith('.png')).sort();
  if (!files.length) throw new Error(`no PNG frames in ${dir}`);
  const shots = [];
  for (const f of files) shots.push(toRGBA(decodePNG(await readFile(`${dir}/${f}`))));
  const { w, h } = shots[0];

  const hist = new Map();
  for (const s of shots) {
    const px = s.pixels;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 128) continue;                          // corner cut-out, not a colour
      const k = (px[i] << 16) | (px[i + 1] << 8) | px[i + 2];
      hist.set(k, (hist.get(k) ?? 0) + 1);
    }
  }
  const palette = medianCut(hist, TRANSPARENT);
  while (palette.length < 256) palette.push([0, 0, 0]);
  const nearest = nearestFinder(palette.slice(0, TRANSPARENT));

  const canvas = new Uint8Array(w * h).fill(0xff);
  const frames = [];
  for (let n = 0; n < shots.length; n++) {
    const px = shots[n].pixels;
    const q = quantise(px, w, h, 4, palette, nearest);
    for (let i = 0, j = 3; i < q.length; i++, j += 4) if (px[j] < 128) q[i] = TRANSPARENT;

    if (n === 0) { frames.push({ x: 0, y: 0, w, h, indices: q, delay, transparent: true }); canvas.set(q); continue; }

    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (q[y * w + x] === canvas[y * w + x]) continue;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    if (x1 < 0) { frames[frames.length - 1].delay += delay; continue; }   // nothing moved
    const fw = x1 - x0 + 1, fh = y1 - y0 + 1;
    const sub = new Uint8Array(fw * fh);
    for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
      const j = (y + y0) * w + (x + x0);
      sub[y * fw + x] = q[j] === canvas[j] ? TRANSPARENT : q[j];
    }
    frames.push({ x: x0, y: y0, w: fw, h: fh, indices: sub, delay, transparent: true });
    canvas.set(q);
  }
  const gif = encodeGIF({ w, h, palette, frames });
  await writeFile(out, gif);
  return { out, frames: files.length, stored: frames.length, w, h, fps,
           seconds: +(frames.reduce((s, f) => s + f.delay, 0) / 100).toFixed(2), bytes: gif.length };
}

export async function encodeFrames(dir, out, fps = 20) {
  return out.endsWith('.apng') || out.endsWith('.png')
    ? framesToApng(dir, out, fps)
    : framesToGif(dir, out, fps);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const fi = args.indexOf('--fps');
  const fps = fi >= 0 ? Number(args.splice(fi, 2)[1]) : 20;
  const [dir, out] = args;
  if (!dir || !out) { console.error('usage: encode.mjs frames/ out.gif|out.apng [--fps N]'); process.exit(1); }
  console.log(JSON.stringify(await encodeFrames(dir, out, fps)));
}
