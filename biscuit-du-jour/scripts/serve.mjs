import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
const base = resolve('site');
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.json':'application/json' };
const port = Number(process.env.PORT || 4173);
createServer(async (req, res) => {
  try {
    const raw = new URL(req.url ?? '/', 'http://localhost').pathname;
    const path = resolve(join(base, decodeURIComponent(raw === '/' ? '/index.html' : raw).replace(/^\/+/, '')));
    if (path !== base && !path.startsWith(base+sep)) { res.writeHead(403).end('Interdit'); return; }
    const data = await readFile(path);
    res.writeHead(200, { 'content-type':types[extname(path)] || 'application/octet-stream', 'cache-control':'no-store' }).end(data);
  } catch { res.writeHead(404).end('Fichier absent'); }
}).listen(port, '0.0.0.0', () => console.log(`Biscuit du jour : http://localhost:${port}`));
