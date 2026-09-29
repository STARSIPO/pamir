// Full-page screenshots via headless Edge + raw CDP (Node's built-in WebSocket).
// Usage: node shoot.mjs <url> <width> <height> <outPrefix> [--mobile] [--theme=dark]
// Writes <outPrefix>-1.png, -2.png … (chunks of ~2 viewports) and prints paths.
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, w, h, outPrefix, ...flags] = process.argv.slice(2);
const width = +w, height = +h;
const mobile = flags.includes('--mobile');
const theme = (flags.find((f) => f.startsWith('--theme=')) || '').split('=')[1];
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port = 9300 + Math.floor(Math.random() * 600);
const profile = mkdtempSync(join(tmpdir(), 'edge-shot-'));
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', '--disable-sync', '--disable-extensions', `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let wsUrl;
for (let i = 0; i < 50 && !wsUrl; i++) {
  await sleep(200);
  try {
    const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    wsUrl = list.find((t) => t.type === 'page')?.webSocketDebuggerUrl;
  } catch {}
}
if (!wsUrl) { console.error('no CDP'); edge.kill(); process.exit(1); }
const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJs = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
if (mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
const target = theme ? url + (url.includes('?') ? '&' : '?') + 'theme=' + theme : url;
await send('Page.navigate', { url: target });
await sleep(2500);
// Walk the page so scroll reveals fire, then return to the top.
const total = await evalJs('document.documentElement.scrollHeight');
for (let y = 0; y < total; y += Math.round(height * 0.6)) { await evalJs(`window.scrollTo(0, ${y})`); await sleep(160); }
await evalJs('window.scrollTo(0, document.documentElement.scrollHeight)'); await sleep(900);
await evalJs('window.scrollTo(0, 0)'); await sleep(1600);
const full = await evalJs('document.documentElement.scrollHeight');
const overflowX = await evalJs('document.documentElement.scrollWidth > window.innerWidth + 1 ? document.documentElement.scrollWidth : 0');
const chunk = height * 2;
const out = [];
for (let y = 0, n = 1; y < full; y += chunk, n++) {
  const hh = Math.min(chunk, full - y);
  const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y, width, height: hh, scale: 1 } });
  const p = `${outPrefix}-${n}.png`; writeFileSync(p, Buffer.from(r.result.data, 'base64')); out.push(p);
}
console.log(JSON.stringify({ pageHeight: full, horizontalOverflow: overflowX, files: out }));
ws.close(); edge.kill(); await sleep(300);
try { rmSync(profile, { recursive: true, force: true }); } catch {}
