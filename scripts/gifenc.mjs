/*
 * GIF89a encoder: median-cut global palette, Floyd–Steinberg dithering, and
 * transparent frame differencing.
 *
 * The differencing is what keeps the file small — this scene is a still dark
 * yard with one small thing moving in it, so most of every frame is identical
 * to the one before and is written as transparent pixels over an undisposed
 * canvas. Dithering is deterministic, so identical input frames quantise to
 * identical output and really do diff to nothing.
 */

const TRANSPARENT = 255;   // last slot reserved; the palette holds 255 colours

export function medianCut(histogram, want) {
  const colours = [...histogram].map(([k, n]) => ({
    r: (k >> 16) & 0xff, g: (k >> 8) & 0xff, b: k & 0xff, n,
  }));
  let boxes = [colours];
  while (boxes.length < want) {
    /* Split the box spanning the most colour volume, weighted by how many
       pixels sit in it — a wide box nobody looks at is not worth a slot. */
    let pick = -1, best = -1;
    boxes.forEach((box, i) => {
      if (box.length < 2) return;
      const [lo, hi] = extent(box);
      const vol = Math.max(hi.r - lo.r, hi.g - lo.g, hi.b - lo.b);
      const weight = vol * Math.cbrt(box.reduce((s, c) => s + c.n, 0));
      if (weight > best) { best = weight; pick = i; }
    });
    if (pick < 0) break;
    const box = boxes[pick];
    const [lo, hi] = extent(box);
    const axis = (hi.r - lo.r >= hi.g - lo.g && hi.r - lo.r >= hi.b - lo.b) ? 'r'
               : (hi.g - lo.g >= hi.b - lo.b) ? 'g' : 'b';
    box.sort((a, b) => a[axis] - b[axis]);
    const half = box.reduce((s, c) => s + c.n, 0) / 2;
    let acc = 0, cut = 1;
    for (let i = 0; i < box.length - 1; i++) {
      acc += box[i].n;
      if (acc >= half) { cut = i + 1; break; }
    }
    boxes.splice(pick, 1, box.slice(0, cut), box.slice(cut));
  }
  return boxes.map((box) => {
    let n = 0, r = 0, g = 0, b = 0;
    for (const c of box) { n += c.n; r += c.r * c.n; g += c.g * c.n; b += c.b * c.n; }
    return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
  });
}

function extent(box) {
  const lo = { r: 255, g: 255, b: 255 }, hi = { r: 0, g: 0, b: 0 };
  for (const c of box) {
    for (const k of 'rgb') {
      if (c[k] < lo[k]) lo[k] = c[k];
      if (c[k] > hi[k]) hi[k] = c[k];
    }
  }
  return [lo, hi];
}

export function nearestFinder(palette) {
  const cache = new Map();
  return (r, g, b) => {
    const key = (r << 16) | (g << 8) | b;
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
    let best = 0, bestD = Infinity;
    for (let i = 0; i < palette.length; i++) {
      const dr = r - palette[i][0], dg = g - palette[i][1], db = b - palette[i][2];
      const d = dr * dr * 3 + dg * dg * 6 + db * db;   // eye-weighted
      if (d < bestD) { bestD = d; best = i; }
    }
    cache.set(key, best);
    return best;
  };
}

/* Floyd–Steinberg over a float copy of the frame. */
export function quantise(pixels, w, h, bpp, palette, nearest) {
  const err = new Float32Array(w * h * 3);
  for (let i = 0, p = 0; i < w * h; i++, p += bpp) {
    err[i * 3] = pixels[p]; err[i * 3 + 1] = pixels[p + 1]; err[i * 3 + 2] = pixels[p + 2];
  }
  const out = new Uint8Array(w * h);
  const clamp = (v) => v < 0 ? 0 : v > 255 ? 255 : v;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x, e = i * 3;
      const r = clamp(Math.round(err[e])), g = clamp(Math.round(err[e + 1])), b = clamp(Math.round(err[e + 2]));
      const idx = nearest(r, g, b);
      out[i] = idx;
      const dr = r - palette[idx][0], dg = g - palette[idx][1], db = b - palette[idx][2];
      const spill = (nx, ny, f) => {
        if (nx < 0 || nx >= w || ny >= h) return;
        const j = (ny * w + nx) * 3;
        err[j] += dr * f; err[j + 1] += dg * f; err[j + 2] += db * f;
      };
      spill(x + 1, y, 7 / 16); spill(x - 1, y + 1, 3 / 16);
      spill(x, y + 1, 5 / 16); spill(x + 1, y + 1, 1 / 16);
    }
  }
  return out;
}

function lzw(indices, minCodeSize) {
  const out = [];
  let cur = 0, bits = 0;
  const put = (code, len) => {
    cur |= code << bits; bits += len;
    while (bits >= 8) { out.push(cur & 0xff); cur >>= 8; bits -= 8; }
  };
  const CLEAR = 1 << minCodeSize, EOI = CLEAR + 1;
  let size = minCodeSize + 1, next = EOI + 1;
  let dict = new Map();
  put(CLEAR, size);
  let prefix = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const k = prefix * 4096 + indices[i];
    const found = dict.get(k);
    if (found !== undefined) { prefix = found; continue; }
    put(prefix, size);
    dict.set(k, next++);
    if (next > (1 << size)) {
      if (size < 12) size++;
      else { put(CLEAR, size); dict = new Map(); size = minCodeSize + 1; next = EOI + 1; }
    }
    prefix = indices[i];
  }
  put(prefix, size);
  put(EOI, size);
  if (bits > 0) out.push(cur & 0xff);

  const blocks = [];
  for (let i = 0; i < out.length; i += 255) {
    const chunk = out.slice(i, i + 255);
    blocks.push(chunk.length, ...chunk);
  }
  blocks.push(0);
  return Buffer.from(blocks);
}

export function encodeGIF({ w, h, palette, frames }) {
  const parts = [Buffer.from('GIF89a', 'ascii')];
  const lsd = Buffer.alloc(7);
  lsd.writeUInt16LE(w, 0); lsd.writeUInt16LE(h, 2);
  lsd[4] = 0xf7;              // global table, 8 bits/pixel, 256 entries
  lsd[5] = 0; lsd[6] = 0;
  parts.push(lsd);

  const table = Buffer.alloc(768);
  palette.forEach((c, i) => { table[i * 3] = c[0]; table[i * 3 + 1] = c[1]; table[i * 3 + 2] = c[2]; });
  parts.push(table);

  parts.push(Buffer.concat([
    Buffer.from([0x21, 0xff, 11]), Buffer.from('NETSCAPE2.0', 'ascii'),
    Buffer.from([3, 1, 0, 0, 0]),
  ]));

  for (const f of frames) {
    const gce = Buffer.alloc(8);
    gce[0] = 0x21; gce[1] = 0xf9; gce[2] = 4;
    gce[3] = (1 << 2) | (f.transparent ? 1 : 0);   // disposal 1 = leave in place
    gce.writeUInt16LE(f.delay, 4);
    gce[6] = TRANSPARENT; gce[7] = 0;
    parts.push(gce);

    const desc = Buffer.alloc(10);
    desc[0] = 0x2c;
    desc.writeUInt16LE(f.x, 1); desc.writeUInt16LE(f.y, 3);
    desc.writeUInt16LE(f.w, 5); desc.writeUInt16LE(f.h, 7);
    desc[9] = 0;
    parts.push(desc);

    parts.push(Buffer.from([8]), lzw(f.indices, 8));
  }
  parts.push(Buffer.from([0x3b]));
  return Buffer.concat(parts);
}

export { TRANSPARENT };
