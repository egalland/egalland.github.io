'use strict';

const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID, randomBytes, timingSafeEqual } = require('node:crypto');
const { spawn } = require('node:child_process');

const TABLES = ['jira', 'suivi', 'simulations'];
const FORMAT = 'test-reseau-local/v1';
const MAX_BODY = 16384;

function failure(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function fileError(error) {
  if (error.status) return error;
  const messages = {
    EACCES: 'Accès au dossier refusé. Vérifie tes droits Windows sur le partage.',
    EPERM: 'Écriture ou exécution refusée. Vérifie les droits du dossier.',
    ENOENT: 'Le dossier ou le fichier est introuvable. Vérifie la connexion au réseau.',
    ENOSPC: 'Le disque ou le partage est plein.',
    ENOTDIR: 'Le chemin configuré ne correspond pas à un dossier.',
    EBUSY: 'Un fichier est occupé. Réessaie dans un instant.',
    EIO: 'Erreur de lecture ou d’écriture sur le dossier réseau.'
  };
  return failure(503, messages[error.code] || 'Opération impossible sur le dossier. Détail : ' + error.message);
}

async function loadConfig(baseDir) {
  let config;
  try { config = JSON.parse(await fs.readFile(path.join(baseDir, 'config.json'), 'utf8')); }
  catch (error) { throw new Error('Impossible de lire config.json : ' + error.message); }
  if (!config || typeof config.dossierDonnees !== 'string' || !config.dossierDonnees.trim()) {
    throw new Error('config.json doit contenir un champ dossierDonnees non vide.');
  }
  return { dataDir: path.resolve(baseDir, config.dossierDonnees) };
}

function validateRecord(record, filename, table) {
  if (!record || record.format !== FORMAT || record.table !== table || typeof record.id !== 'string' ||
      !/^[a-f0-9-]{36}$/.test(record.id) || filename !== record.id + '.json' ||
      typeof record.auteur !== 'string' || !record.auteur.trim() || record.auteur.length > 60 ||
      typeof record.message !== 'string' || !record.message.trim() || record.message.length > 2000 ||
      typeof record.poste !== 'string' || typeof record.creeLe !== 'string' || Number.isNaN(Date.parse(record.creeLe))) {
    throw new Error('Format de message invalide.');
  }
  return record;
}

async function readMessages(dataDir) {
  const tables = {}, errors = [];
  for (const table of TABLES) {
    const dir = path.join(dataDir, table);
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const rows = [];
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
      try {
        const filename = path.join(dir, entry.name);
        const stat = await fs.stat(filename);
        if (stat.size > MAX_BODY) throw new Error('Fichier trop volumineux pour ce test.');
        const record = validateRecord(JSON.parse(await fs.readFile(filename, 'utf8')), entry.name, table);
        rows.push(record);
      } catch (error) {
        if (['EACCES', 'EPERM', 'EIO'].includes(error.code)) throw error;
        errors.push(table + '/' + entry.name + ' : ' + error.message + ' Le fichier est conservé.');
      }
    }
    rows.sort((a, b) => b.creeLe.localeCompare(a.creeLe) || b.id.localeCompare(a.id));
    tables[table] = rows;
  }
  return { tables, errors };
}

async function appendMessage(dataDir, input) {
  if (!input || !TABLES.includes(input.table) || typeof input.auteur !== 'string' ||
      typeof input.message !== 'string' || !input.auteur.trim() || !input.message.trim() ||
      input.auteur.length > 60 || input.message.length > 2000) {
    throw failure(400, 'Choisis Jira, suivi ou Simulations, un nom de 1 à 60 caractères et un message de 1 à 2000 caractères.');
  }
  const record = {
    format: FORMAT, id: randomUUID(), table: input.table,
    auteur: input.auteur.trim(), message: input.message.trim(),
    poste: '', creeLe: new Date().toISOString()
  };
  const dir = path.join(dataDir, record.table);
  const temporary = path.join(dir, '.ajout-' + record.id + '.tmp');
  const destination = path.join(dir, record.id + '.json');
  let handle;
  try {
    // Each addition gets a new UUID. Existing records are never overwritten.
    // Readers only see .json files after the write is closed and renamed.
    handle = await fs.open(temporary, 'wx');
    await handle.writeFile(JSON.stringify(record, null, 2) + '\n', 'utf8');
    await handle.sync();
    await handle.close(); handle = null;
    await fs.rename(temporary, destination);
  } catch (error) {
    if (handle) await handle.close().catch(() => {});
    await fs.unlink(temporary).catch(() => {});
    throw error;
  }
  const saved = validateRecord(JSON.parse(await fs.readFile(destination, 'utf8')), record.id + '.json', record.table);
  if (JSON.stringify(saved) !== JSON.stringify(record)) throw failure(503, 'Le message a été écrit mais sa vérification a échoué. Actualise avant de réessayer.');
  return saved;
}

async function probe(dataDir) {
  const filename = path.join(dataDir, '.test-' + randomUUID() + '.tmp');
  const text = JSON.stringify({ id: randomUUID(), date: new Date().toISOString() });
  let created = false;
  try {
    const handle = await fs.open(filename, 'wx'); created = true;
    try { await handle.writeFile(text, 'utf8'); await handle.sync(); }
    finally { await handle.close(); }
    if (await fs.readFile(filename, 'utf8') !== text) throw failure(503, 'Le contenu relu ne correspond pas au contenu écrit.');
    await fs.unlink(filename); created = false;
    return { ok: true, message: 'Lecture / écriture réussies : fichier créé, relu puis supprimé dans le dossier partagé.' };
  } finally {
    if (created) await fs.unlink(filename).catch(() => {});
  }
}

async function readBody(req) {
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) throw failure(415, 'Le format attendu est application/json.');
  let length = 0;
  const chunks = [];
  for await (const chunk of req) {
    length += chunk.length;
    if (length > MAX_BODY) throw failure(413, 'Le message envoyé est trop volumineux.');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch (_) { throw failure(400, 'Le JSON envoyé est invalide.'); }
}

function send(res, status, data, type = 'application/json; charset=utf-8') {
  const body = Buffer.from(type.startsWith('application/json') ? JSON.stringify(data) : data);
  res.writeHead(status, {
    'Content-Type': type, 'Content-Length': body.length,
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
  });
  res.end(body);
}

async function createTestServer(options = {}) {
  const baseDir = options.baseDir || __dirname;
  const config = options.dataDir ? { dataDir: path.resolve(options.dataDir) } : await loadConfig(baseDir);
  const dataDir = config.dataDir;
  for (const table of TABLES) await fs.mkdir(path.join(dataDir, table), { recursive: true });
  const html = await fs.readFile(path.join(baseDir, 'index.html'), 'utf8');
  const token = randomBytes(32).toString('hex');
  let origin;
  const server = http.createServer(async (req, res) => {
    try {
      if (req.headers.host !== new URL(origin).host) throw failure(403, 'Adresse de service non autorisée.');
      if (req.headers.origin && req.headers.origin !== origin) throw failure(403, 'Origine non autorisée.');
      const url = new URL(req.url, origin);
      if ((url.pathname === '/' || url.pathname === '/index.html') && req.method === 'GET') {
        return send(res, 200, html, 'text/html; charset=utf-8');
      }
      if (!url.pathname.startsWith('/api/')) throw failure(404, 'Page introuvable.');
      const supplied = req.headers['x-test-token'];
      if (typeof supplied !== 'string' || !/^[a-f0-9]{64}$/.test(supplied) ||
          !timingSafeEqual(Buffer.from(supplied), Buffer.from(token))) throw failure(403, 'Session absente ou expirée. Relance LANCER.bat et utilise la page qui s’ouvre.');
      if (req.method === 'GET' && url.pathname === '/api/etat') {
        return send(res, 200, { ok: true, dossier: dataDir });
      }
      if (req.method === 'GET' && url.pathname === '/api/messages') return send(res, 200, await readMessages(dataDir));
      if (req.method === 'POST' && url.pathname === '/api/messages') return send(res, 201, { record: await appendMessage(dataDir, await readBody(req)) });
      if (req.method === 'POST' && url.pathname === '/api/test') {
        await readBody(req); return send(res, 200, await probe(dataDir));
      }
      throw failure(404, 'Opération inconnue.');
    } catch (error) {
      const known = fileError(error);
      if (!res.headersSent && !res.destroyed) send(res, known.status || 500, { erreur: known.message });
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.keepAliveTimeout = 1000;
  server.maxConnections = 40;
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    // Loopback only: nobody needs to open an inbound network port on this PC.
    server.listen(0, '127.0.0.1', resolve);
  });
  origin = 'http://127.0.0.1:' + server.address().port;
  const url = origin + '/#' + token;
  const close = () => new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
    server.closeIdleConnections();
  });
  return { server, origin, token, url, dataDir, close };
}

function openBrowser(url) {
  let child;
  if (process.platform === 'win32') child = spawn('cmd.exe', ['/d', '/s', '/c', 'start "" "' + url + '"'], { stdio: 'ignore', windowsHide: true, windowsVerbatimArguments: true });
  else if (process.platform === 'darwin') child = spawn('open', [url], { stdio: 'ignore' });
  else child = spawn('xdg-open', [url], { stdio: 'ignore' });
  child.on('error', () => console.log('Ouverture automatique impossible. Copie le lien affiché dans ton navigateur.'));
  child.unref();
}

if (require.main === module) {
  createTestServer().then(app => {
    console.log('\nTEST RESEAU - Service local demarre\n');
    console.log('Dossier partage : ' + app.dataDir);
    console.log('Ouvre cette adresse si le navigateur ne se lance pas :\n\n' + app.url + '\n');
    console.log('Garde cette fenetre ouverte pendant le test. Ctrl+C pour arreter.');
    console.log('Chaque autre poste lance le meme LANCER.bat depuis le dossier reseau.\n');
    if (process.argv.includes('--ouvrir')) openBrowser(app.url);
    let stopping = false;
    for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
      if (stopping) return;
      stopping = true;
      app.close().then(() => process.exit(0), () => process.exit(1));
    });
  }).catch(error => {
    console.error('\nECHEC DU LANCEMENT : ' + fileError(error).message);
    process.exitCode = 1;
  });
}

module.exports = { createTestServer, readMessages, appendMessage, loadConfig };
