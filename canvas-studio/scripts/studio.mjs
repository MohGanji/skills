// Canvas Studio launcher.
// Starts the Vite app, opens ONE real browser window the human works in, and serves a
// small control API on :5179 so the local AI can see & drive that exact page:
//   GET  /screenshot     -> PNG of the live canvas (what the human sees)
//   GET  /shapes         -> JSON of the current page's shapes
//   GET  /export         -> clean SVG of the page
//   GET  /fit            -> zoom camera to fit all content
//   POST /eval  (body=JS expression) -> runs it in the page (e.g. window.editor.* calls)
//
// The browser page and the API share ONE Playwright `page`, so a screenshot is exactly
// the human's view and an eval mutates the human's canvas live.

import { spawn } from 'node:child_process';
import http from 'node:http';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP = 'http://localhost:5178';
const CTRL_PORT = 5179;

const waitFor = async (url, ms = 30000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { const r = await fetch(url); if (r.ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`timed out waiting for ${url}`);
};

// 1) Vite dev server
const vite = spawn('npm', ['run', 'dev'], { stdio: 'inherit', cwd: ROOT });
await waitFor(APP);

// 2) the real browser window the human works in
mkdirSync(join(ROOT, '.studio', 'profile'), { recursive: true });
const ctx = await chromium.launchPersistentContext(join(ROOT, '.studio', 'profile'), {
  headless: false,
  viewport: null,
  args: ['--start-maximized'],
});
const page = ctx.pages()[0] || (await ctx.newPage());
await page.goto(APP);
await page.waitForFunction('window.editor && window.studio', null, { timeout: 30000 });

// 3) control API for the AI
const send = (res, code, type, body) => { res.writeHead(code, { 'content-type': type }); res.end(body); };
http.createServer(async (req, res) => {
  try {
    const path = req.url.split('?')[0];
    if (path === '/screenshot') return send(res, 200, 'image/png', await page.screenshot());
    if (path === '/shapes') return send(res, 200, 'application/json', JSON.stringify(await page.evaluate('window.studio.shapes()')));
    if (path === '/export') return send(res, 200, 'image/svg+xml', (await page.evaluate('window.studio.exportSvg()')) || '');
    if (path === '/fit') { await page.evaluate('window.studio.fit()'); return send(res, 200, 'application/json', 'true'); }
    if (path === '/eval' && req.method === 'POST') {
      let body = ''; for await (const c of req) body += c;
      const r = await page.evaluate(body);
      return send(res, 200, 'application/json', JSON.stringify(r ?? null));
    }
    send(res, 404, 'text/plain', 'unknown endpoint');
  } catch (e) { send(res, 500, 'text/plain', String(e && e.message || e)); }
}).listen(CTRL_PORT, () => {
  console.log(`\n  Canvas Studio is live.`);
  console.log(`  • You: work in the browser window that just opened (${APP}).`);
  console.log(`  • AI:  control API on http://localhost:${CTRL_PORT} (screenshot / shapes / eval / export / fit).\n`);
});

const bye = async () => { try { await ctx.close(); } catch {} vite.kill(); process.exit(0); };
ctx.on('close', bye);
process.on('SIGINT', bye);
process.on('SIGTERM', bye);
