/*
 * Minimal PNG codec: decode 8-bit non-interlaced RGB/RGBA (which is all
 * Page.captureScreenshot ever produces), encode RGBA. Nothing else.
 */
import { inflateSync, deflateSync, crc32 } from 'node:zlib';

export function decodePNG(buf) {
  let p = 8, ihdr = null;
  const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString('ascii', p + 4, p + 8);
    const data = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') ihdr = data;
    else if (type === 'IDAT') idat.push(data);
    p += 12 + len;
  }
  const w = ihdr.readUInt32BE(0), h = ihdr.readUInt32BE(4);
  const depth = ihdr[8], color = ihdr[9], interlace = ihdr[12];
  if (depth !== 8 || interlace !== 0 || (color !== 2 && color !== 6)) {
    throw new Error(`unsupported PNG: depth=${depth} color=${color} interlace=${interlace}`);
  }
  const bpp = color === 6 ? 4 : 3;
  const stride = w * bpp;
  const raw = inflateSync(Buffer.concat(idat));
  const out = Buffer.alloc(h * stride);

  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)];
    const src = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const row = out.subarray(y * stride, (y + 1) * stride);
    const prior = y ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? row[i - bpp] : 0;
      const b = prior ? prior[i] : 0;
      const c = prior && i >= bpp ? prior[i - bpp] : 0;
      let v = src[i];
      switch (filter) {
        case 1: v += a; break;
        case 2: v += b; break;
        case 3: v += (a + b) >> 1; break;
        case 4: {
          const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c);
          v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
          break;
        }
      }
      row[i] = v & 0xff;
    }
  }
  return { w, h, bpp, pixels: out };
}

/* Any decoded image as RGBA, so callers never branch on bpp. */
export function toRGBA({ w, h, bpp, pixels }) {
  if (bpp === 4) return { w, h, bpp: 4, pixels };
  const out = Buffer.alloc(w * h * 4);
  for (let i = 0, j = 0; i < pixels.length; i += 3, j += 4) {
    out[j] = pixels[i]; out[j + 1] = pixels[i + 1]; out[j + 2] = pixels[i + 2]; out[j + 3] = 255;
  }
  return { w, h, bpp: 4, pixels: out };
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}

/* RGBA → PNG. Filter 0 on every row; zlib does the rest. */
export function encodePNG({ w, h, pixels }) {
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
