/*
 * Zero-dependency static file server.
 *
 * Every capture needs a page served over http — file:// breaks ES modules
 * silently — and the skill cannot assume python3 or any npm server exists in
 * the repo it is working in. Used internally by capture.mjs, round.mjs and
 * term.mjs; also runs standalone: `node serve.mjs <dir> [--port N]`.
 */
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.wasm': 'application/wasm', '.map': 'application/json',
};

/* Starts serving `dir`; resolves to { port, close }. port 0 picks a free one. */
export function serve(dir, port = 0) {
  const root = resolve(dir);
  const server = createServer(async (req, res) => {
    try {
      let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (path.endsWith('/')) path += 'index.html';
      const file = join(root, normalize(path));
      if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
      const s = await stat(file);
      if (s.isDirectory()) { res.writeHead(302, { Location: path + '/' }); return res.end(); }
      res.writeHead(200, {
        'Content-Type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
        'Content-Length': s.size,
        'Cache-Control': 'no-store',
      });
      createReadStream(file).pipe(res);
    } catch {
      res.writeHead(404); res.end();
    }
  });
  return new Promise((ok, no) => {
    server.on('error', no);
    server.listen(port, '127.0.0.1', () => {
      ok({ port: server.address().port, close: () => new Promise(r => server.close(r)) });
    });
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const dir = args.find(a => !a.startsWith('--')) ?? '.';
  const pi = args.indexOf('--port');
  const { port } = await serve(dir, pi >= 0 ? Number(args[pi + 1]) : 0);
  console.log(`http://127.0.0.1:${port}/`);
}
