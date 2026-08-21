/*
 * Frames → animated PNG.
 *
 * No pixel data is touched: each frame's compressed IDAT stream is reused
 * verbatim as an fdAT, so the result keeps full colour and full alpha. That is
 * what makes APNG the fallback when a GIF's 256 colours band on a soft scene —
 * at the cost of roughly five times the bytes.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { crc32 } from 'node:zlib';

const SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function chunks(buf) {
  const out = [];
  let p = 8;
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    out.push({ type: buf.toString('ascii', p + 4, p + 8), data: buf.subarray(p + 8, p + 8 + len) });
    p += 12 + len;
  }
  return out;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}

const fcTL = (seq, w, h, num, den) => {
  const d = Buffer.alloc(26);
  d.writeUInt32BE(seq, 0); d.writeUInt32BE(w, 4); d.writeUInt32BE(h, 8);
  d.writeUInt32BE(0, 12); d.writeUInt32BE(0, 16);
  d.writeUInt16BE(num, 20); d.writeUInt16BE(den, 22);
  d[24] = 0; d[25] = 0;                              // dispose NONE, blend SOURCE
  return chunk('fcTL', d);
};

/* `frames` is an array of PNG buffers, already in order. Returns the APNG. */
export function encodeAPNG(frames, fps) {
  /* Consecutive identical frames collapse into one with a longer delay. */
  const shots = [];
  for (const buf of frames) {
    const last = shots[shots.length - 1];
    if (last && last.buf.equals(buf)) { last.ticks++; continue; }
    shots.push({ buf, ticks: 1 });
  }
  const ihdr = chunks(shots[0].buf).find(c => c.type === 'IHDR');
  const w = ihdr.data.readUInt32BE(0), h = ihdr.data.readUInt32BE(4);
  const acTL = Buffer.alloc(8);
  acTL.writeUInt32BE(shots.length, 0); acTL.writeUInt32BE(0, 4);   // loop forever

  const parts = [SIG, chunk('IHDR', ihdr.data), chunk('acTL', acTL)];
  let seq = 0;
  shots.forEach((s, i) => {
    const idat = Buffer.concat(chunks(s.buf).filter(c => c.type === 'IDAT').map(c => c.data));
    parts.push(fcTL(seq++, w, h, s.ticks, fps));
    if (i === 0) parts.push(chunk('IDAT', idat));
    else {
      const n = Buffer.alloc(4); n.writeUInt32BE(seq++);
      parts.push(chunk('fdAT', Buffer.concat([n, idat])));
    }
  });
  parts.push(chunk('IEND', Buffer.alloc(0)));
  return { buffer: Buffer.concat(parts), w, h, stored: shots.length };
}

export async function framesToApng(dir, out, fps = 20) {
  const files = (await readdir(dir)).filter(f => f.endsWith('.png')).sort();
  const frames = [];
  for (const f of files) frames.push(await readFile(`${dir}/${f}`));
  const { buffer, w, h, stored } = encodeAPNG(frames, fps);
  await writeFile(out, buffer);
  return { out, frames: files.length, stored, w, h, fps, bytes: buffer.length };
}
