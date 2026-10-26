import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { createLocalServer } from '../tools/serve.mjs';

test('loopback capture serves only static assets, blocks uploads and sends restrictive headers', async () => {
  const server = createLocalServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  try {
    assert.equal(server.address().address, '127.0.0.1');
    const root = `http://127.0.0.1:${server.address().port}`;
    for (const name of ['', 'app.mjs', 'session.mjs', 'style.css']) {
      const response = await fetch(`${root}/capture/${name}`);
      assert.equal(response.status, 200); assert.match(response.headers.get('content-security-policy'), /connect-src 'none'/);
      assert.equal(response.headers.get('cache-control'), 'no-store');
    }
    for (const path of ['/upload', '/', '/docs/verified-mapping.md', '/capture/../package.json', '/capture/?sample=private']) {
      assert.equal((await fetch(root + path)).status, 404);
    }
    assert.equal((await fetch(root + '/capture/', { method: 'POST', body: 'synthetic' })).status, 404);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});

test('capture has no network clients, storage, keyboard logging or external resources', async () => {
  const files = await Promise.all(['app.mjs', 'session.mjs', 'index.html', 'style.css'].map(f =>
    readFile(new URL('../capture/' + f, import.meta.url), 'utf8')));
  const source = files.join('\n');
  assert.doesNotMatch(source, /\b(fetch|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|indexedDB|serviceWorker|cookie|keydown|keyup|keypress)\b/);
  assert.doesNotMatch(source, /(?:src|href)=["']https?:/);
  assert.match(source, /connect-src 'none'/);
});
