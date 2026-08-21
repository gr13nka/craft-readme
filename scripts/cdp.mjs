/*
 * Zero-dependency Chrome DevTools Protocol client.
 *
 * Node 22 ships a global WebSocket, so driving a headless Chromium needs no
 * npm package — which is what lets these scripts run inside any repo without
 * touching its dependencies. Every capture script in this skill imports from
 * here; none of them talk to the browser directly.
 */
import { spawn } from 'node:child_process';
import { writeFile, mkdir, rm, access } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [major] = process.versions.node.split('.').map(Number);
if (major < 22) {
  console.error(`craft-readme scripts need Node 22+ (global WebSocket); you have ${process.versions.node}`);
  process.exit(2);
}

const CANDIDATES = [
  process.env.CHROME,
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome',
].filter(Boolean);

export async function findChrome() {
  for (const p of CANDIDATES) {
    try { await access(p); return p; } catch { /* next */ }
  }
  throw new Error('No Chromium-based browser found. Install Chromium, or set CHROME=/path/to/binary.');
}

const freePort = () => new Promise((ok, no) => {
  const s = createServer();
  s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => ok(port)); });
  s.on('error', no);
});

/*
 * Launches headless Chromium on a fresh profile. Fresh every time, on
 * purpose: a page's own localStorage from the previous take changes what it
 * shows on the next one (a candle lit in take one was still burning in take
 * two, and the whole ritual it was meant to record was skipped).
 */
export async function launch({ profile } = {}) {
  const bin = await findChrome();
  const port = await freePort();
  const dir = profile ?? join(tmpdir(), `craft-readme-profile-${port}`);
  await rm(dir, { recursive: true, force: true });

  const child = spawn(bin, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${dir}`,
    '--no-first-run', '--no-default-browser-check',
    '--hide-scrollbars', '--disable-gpu',
    '--force-color-profile=srgb',
    'about:blank',
  ], { stdio: 'ignore' });

  let target = null;
  for (let i = 0; i < 150; i++) {
    await sleep(200);
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      target = list.find(t => t.type === 'page');
      if (target) break;
    } catch { /* not up yet */ }
  }
  if (!target) { child.kill(); throw new Error('Chromium never opened its debugging port'); }

  const cdp = await connect(target.webSocketDebuggerUrl);
  const close = async () => {
    try { cdp.close(); } catch { /* already gone */ }
    child.kill();
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  };
  return { cdp, close };
}

export async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });

  let id = 0;
  const pending = new Map();
  const listeners = [];

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id != null) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      if (!p) return;
      msg.error ? p.no(new Error(msg.error.message)) : p.ok(msg.result);
    } else {
      for (const l of listeners) l(msg);
    }
  };

  const send = (method, params = {}) => new Promise((ok, no) => {
    const n = ++id;
    pending.set(n, { ok, no });
    ws.send(JSON.stringify({ id: n, method, params }));
  });

  /* Standing subscription; returns its own unsubscribe. */
  const on = (method, handler) => {
    const l = (msg) => { if (msg.method === method) handler(msg.params); };
    listeners.push(l);
    return () => listeners.splice(listeners.indexOf(l), 1);
  };

  return { send, on, close: () => ws.close() };
}

/* Throws the page's own error instead of returning undefined — a silent
   undefined here costs far more time than a stack trace. */
export async function evaluate(cdp, expression) {
  const r = await cdp.send('Runtime.evaluate', {
    expression, returnByValue: true, awaitPromise: true,
  });
  if (r.exceptionDetails) {
    throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
  }
  return r.result.value;
}

export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export async function shot(cdp, path, clip) {
  const params = { format: 'png', captureBeyondViewport: false };
  if (clip) params.clip = { x: clip.x, y: clip.y, width: clip.width, height: clip.height, scale: 1 };
  const { data } = await cdp.send('Page.captureScreenshot', params);
  if (path) await writeFile(path, Buffer.from(data, 'base64'));
  return Buffer.from(data, 'base64');
}

export async function setViewport(cdp, { width, height, dsf = 2 }) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: Math.ceil(width), height: Math.ceil(height), deviceScaleFactor: dsf, mobile: false,
  });
}

/* Without this the page paints Chromium's opaque white behind everything, and
   rounded corners come back as white wedges. Re-apply after every viewport
   change; the override does not always survive one. */
export const transparent = (cdp) =>
  cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });

export async function open(cdp, url, { width, height, dsf = 2, transparentBg = true }) {
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Network.enable');
  /* Cache off, or an edited stylesheet or SVG reads as a no-op. */
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await setViewport(cdp, { width, height, dsf });
  if (transparentBg) await transparent(cdp);
  await cdp.send('Page.navigate', { url });
  /* Poll readyState rather than waiting on Page.loadEventFired: under load the
     event can land before a listener is attached, and a missed event is an
     indistinguishable hang. */
  for (let i = 0; i < 300; i++) {
    if (await evaluate(cdp, 'document.readyState === "complete"')) break;
    await sleep(100);
  }
  await evaluate(cdp, 'document.fonts ? document.fonts.ready.then(() => true) : true');
  return cdp;
}

/* Bounding box of the first element matching `selector`, in CSS px. */
export async function box(cdp, selector) {
  return evaluate(cdp, `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: b.x, y: b.y, width: b.width, height: b.height };
  })()`);
}

export { mkdir, rm };
