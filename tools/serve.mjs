import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Explicit assets only; no writes, logs, directory listing or upload endpoint.
const assets = new Map([
  ['/capture/', ['../capture/index.html', 'text/html; charset=utf-8']],
  ['/capture/app.mjs', ['../capture/app.mjs', 'text/javascript; charset=utf-8']],
  ['/capture/session.mjs', ['../capture/session.mjs', 'text/javascript; charset=utf-8']],
  ['/capture/style.css', ['../capture/style.css', 'text/css; charset=utf-8']]
]);
export function createLocalServer() {
  return createServer(async (req, res) => {
    const item = assets.get(req.url);
    if (req.method !== 'GET' || !item) { res.writeHead(404).end(); return; }
    try {
      const bytes = await readFile(new URL(item[0], import.meta.url));
      res.writeHead(200, { 'Content-Type': item[1], 'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
        'Permissions-Policy': 'gamepad=(self), camera=(), microphone=(), geolocation=()',
        'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'none'; img-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
      });
      res.end(bytes);
    } catch { res.writeHead(500).end(); }
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createLocalServer().listen(8787, '127.0.0.1', () => {
    console.log('Local capture: http://127.0.0.1:8787/capture/ (Ctrl+C to stop)');
  });
}
