import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export function normalize(result, now = Date.now()) {
  const byId = result.rateLimitsByLimitId;
  // Never combine different metered buckets or assume primary means five hours.
  const bucket = byId?.codex ?? (result.rateLimits?.limitId === 'codex' ? result.rateLimits : null);
  if (!bucket) throw new Error('Quota Codex absent de la réponse');
  const windows = [bucket.primary, bucket.secondary].filter(Boolean).map(w => {
    if (!Number.isFinite(w.usedPercent) || w.usedPercent < 0 || w.usedPercent > 100 ||
        !Number.isFinite(w.windowDurationMins) || w.windowDurationMins <= 0 ||
        !Number.isFinite(w.resetsAt) || w.resetsAt <= 0) throw new Error('Quota invalide');
    return { remaining: Math.round((100 - w.usedPercent) * 10) / 10,
      minutes: w.windowDurationMins, resetsAt: w.resetsAt };
  });
  if (!windows.length) throw new Error('Aucune fenêtre de quota disponible');
  return { fetchedAt: Math.floor(now / 1000), bucket: 'codex', windows };
}

export async function readQuotas(command = process.env.CODEX_COMMAND || 'codex') {
  const script = process.env.CODEX_SCRIPT;
  const proc = spawn(script ? process.execPath : command, script ? [script, 'app-server'] : ['app-server'], { stdio: ['pipe', 'pipe', 'pipe'], shell: false });
  // Do not log protocol output: it may contain account information.
  proc.stderr.resume();
  const lines = createInterface({ input: proc.stdout });
  const pending = new Map(); let id = 0;
  function rejectAll(error) { for (const p of pending.values()) p.reject(error); pending.clear(); }
  lines.on('line', line => {
    let msg; try { msg = JSON.parse(line); } catch { return; }
    const p = pending.get(msg.id);
    if (!p) {
      if (msg.id !== undefined && msg.method) proc.stdin.write(JSON.stringify({ id: msg.id, error: { code: -32601, message: 'Unsupported' } }) + '\n');
      return;
    }
    pending.delete(msg.id);
    if (msg.error) p.reject(new Error('Codex a refusé la lecture : vérifier version et connexion'));
    else p.resolve(msg.result);
  });
  proc.on('error', () => rejectAll(new Error('Codex introuvable')));
  proc.stdin.on('error', () => rejectAll(new Error('Connexion Codex interrompue')));
  proc.on('exit', () => rejectAll(new Error('Codex arrêté')));
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id; pending.set(requestId, { resolve, reject });
    proc.stdin.write(JSON.stringify({ id: requestId, method, params }) + '\n');
  });
  const timeout = setTimeout(() => { rejectAll(new Error('Lecture expirée')); proc.kill(); }, 20000);
  try {
    await send('initialize', { clientInfo: { name: 'quota_panel', title: 'Quota Panel', version: '0.1.0' } });
    proc.stdin.write(JSON.stringify({ method: 'initialized', params: {} }) + '\n');
    return normalize(await send('account/rateLimits/read'));
  } finally { clearTimeout(timeout); lines.close(); proc.stdin.end(); proc.kill(); }
}

export function authorized(header, token) {
  const a = Buffer.from(header || ''); const b = Buffer.from(`Bearer ${token}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const token = process.env.PANEL_TOKEN;
  if (!token || token.length < 32) throw new Error('Définir PANEL_TOKEN avec au moins 32 caractères aléatoires');
  let cache; let inflight;
  const server = createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (!authorized(req.headers.authorization, token)) { res.writeHead(401); res.end('{"error":"Non autorisé"}'); return; }
    if (req.method !== 'GET' || req.url !== '/quota') { res.writeHead(404); res.end('{}'); return; }
    try {
      if (!cache || Date.now() / 1000 - cache.fetchedAt > 60) {
        inflight ??= readQuotas().finally(() => { inflight = undefined; });
        cache = await inflight;
      }
      res.end(JSON.stringify(cache));
    } catch { res.writeHead(503); res.end('{"error":"Lecture impossible : vérifier Codex et sa connexion sur le relais"}'); }
  });
  server.listen(8765, '127.0.0.1', () => console.log('Relais local : port 8765. Accès téléphone via relais HTTPS privé à configurer.'));
}
