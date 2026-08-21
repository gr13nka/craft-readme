/*
 * Transparent rounded corners for a PNG, or for every PNG in a directory.
 *
 * Corners are cut out, not painted: the pixels outside the corner arc get
 * alpha 0, with a one-pixel antialiased edge, so the image sits on whatever
 * the reader's theme puts behind it. The mat that was tried first — a dark
 * card behind the shot — was rejected for exactly that reason.
 *
 *   node round.mjs in.png out.png [--radius 32]
 *   node round.mjs --batch frames/ out/ [--radius 18]
 *
 * --radius is in image pixels. A screenshot taken at deviceScaleFactor 2
 * wants twice the CSS radius (16 CSS px → --radius 32).
 */
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePNG, toRGBA, encodePNG } from './png.mjs';

/* In place on an RGBA buffer. */
export function roundCorners({ w, h, pixels }, radius) {
  const r = Math.min(radius, w / 2, h / 2);
  if (r <= 0) return { w, h, pixels };
  const corners = [[r, r], [w - r, r], [r, h - r], [w - r, h - r]];
  const span = Math.ceil(r) + 1;
  for (const [cx, cy] of corners) {
    const x0 = Math.max(0, Math.floor(cx - span)), x1 = Math.min(w, Math.ceil(cx + span));
    const y0 = Math.max(0, Math.floor(cy - span)), y1 = Math.min(h, Math.ceil(cy + span));
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        /* Only the square outside the arc belongs to this corner. */
        const outsideX = cx === r ? x + 0.5 < cx : x + 0.5 > cx;
        const outsideY = cy === r ? y + 0.5 < cy : y + 0.5 > cy;
        if (!outsideX || !outsideY) continue;
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        const cover = Math.max(0, Math.min(1, r + 0.5 - d));
        if (cover < 1) {
          const i = (y * w + x) * 4 + 3;
          pixels[i] = Math.round(pixels[i] * cover);
        }
      }
    }
  }
  return { w, h, pixels };
}

export async function roundFile(inPath, outPath, radius) {
  const img = roundCorners(toRGBA(decodePNG(await readFile(inPath))), radius);
  await writeFile(outPath, encodePNG(img));
  return img;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const ri = args.indexOf('--radius');
  const radius = ri >= 0 ? Number(args.splice(ri, 2)[1]) : 32;
  if (args[0] === '--batch') {
    const [, inDir, outDir] = args;
    await mkdir(outDir, { recursive: true });
    const files = (await readdir(inDir)).filter(f => f.endsWith('.png')).sort();
    for (const f of files) await roundFile(join(inDir, f), join(outDir, f), radius);
    console.log(JSON.stringify({ rounded: files.length, radius, out: outDir }));
  } else {
    const [inPath, outPath] = args;
    if (!inPath || !outPath) { console.error('usage: round.mjs in.png out.png [--radius N] | --batch in/ out/'); process.exit(1); }
    const { w, h } = await roundFile(inPath, outPath, radius);
    console.log(JSON.stringify({ out: outPath, w, h, radius }));
  }
}
