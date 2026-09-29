// Viewport screenshots of interactive states via headless Edge + raw CDP.
// Usage: node interact.mjs <url> <width> <height> <outPrefix> [--mobile] [--theme=dark] --steps='<json>'
// steps: array of { "scroll": <y> } | { "eval": "<js expression>" } | { "click": "<css selector>" }
//        | { "key": "Escape" } | { "wait": <ms> } | { "shot": "<name>" } | { "log": "<js expression>" }
// Prints JSON with screenshot paths and log values. Screenshots are viewport-only.
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const [url, w, h, outPrefix] = args;
const flags = args.slice(4);
const width = +w, height = +h;
const mobile = flags.includes('--mobile');
const theme = (flags.find((f) => f.startsWith('--theme=')) || '').split('=')[1];
const steps = JSON.parse((flags.find((f) => f.startsWith('--steps=')) || '--steps=[]').slice(8));
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port = 9900 + Math.floor(Math.random() * 600);
const profile = mkdtempSync(join(tmpdir(), 'edge-int-'));
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--disable-sync', '--disable-extensions', `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let wsUrl;
for (let i = 0; i < 50 && !wsUrl; i++) { await sleep(200); try { wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page')?.webSocketDebuggerUrl; } catch {} }
if (!wsUrl) { console.error('no CDP'); edge.kill(); process.exit(1); }
const ws = new WebSocket(wsUrl); await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map(); const consoleErrors = [];
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') consoleErrors.push(m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text); if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') consoleErrors.push(m.params.args.map((a) => a.value ?? a.description).join(' ')); });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJs = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); return r.result?.exceptionDetails ? 'EXCEPTION: ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text) : r.result?.result?.value; };
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
if (mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await send('Page.navigate', { url: theme ? url + (url.includes('?') ? '&' : '?') + 'theme=' + theme : url });
await sleep(2500);
const out = { shots: [], logs: [] };
for (const s of steps) {
  if (s.scroll !== undefined) { await evalJs(`window.scrollTo(0, ${s.scroll})`); await sleep(700); }
  else if (s.eval) { await evalJs(s.eval); await sleep(300); }
  else if (s.click) { const r = await evalJs(`(() => { const el = document.querySelector(${JSON.stringify(s.click)}); if (!el) return 'NOT FOUND'; el.scrollIntoView({block:'center'}); el.click(); return 'ok'; })()`); out.logs.push({ click: s.click, r }); await sleep(700); }
  else if (s.key) { await send('Input.dispatchKeyEvent', { type: 'keyDown', key: s.key, code: s.key, windowsVirtualKeyCode: s.key === 'Escape' ? 27 : s.key === 'Tab' ? 9 : s.key === 'ArrowRight' ? 39 : s.key === 'ArrowLeft' ? 37 : 0 }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: s.key, code: s.key }); await sleep(500); }
  else if (s.wait) { await sleep(s.wait); }
  else if (s.log) { out.logs.push({ expr: s.log, value: await evalJs(s.log) }); }
  else if (s.shot) { const r = await send('Page.captureScreenshot', { format: 'png' }); const p = `${outPrefix}-${s.shot}.png`; writeFileSync(p, Buffer.from(r.result.data, 'base64')); out.shots.push(p); }
}
out.consoleErrors = consoleErrors;
console.log(JSON.stringify(out));
ws.close(); edge.kill(); await sleep(300); try { rmSync(profile, { recursive: true, force: true }); } catch {}
