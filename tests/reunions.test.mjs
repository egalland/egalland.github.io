import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';

async function loadModule(path) {
  const { outputFiles } = await build({ entryPoints: [path], bundle: true, platform: 'node', format: 'esm', write: false });
  return import('data:text/javascript;base64,' + Buffer.from(outputFiles[0].contents).toString('base64'));
}
const { newWorkspace, encodeWorkspace, decodeWorkspace } = await loadModule('offline/workspace-data.ts');
const { WorkspaceStore } = await loadModule('offline/workspace-store.ts');
const { createLocalApi } = await loadModule('offline/local-api.ts');
const { buildMailDraft } = await loadModule('lib/mail-draft.ts');

test('un nouveau classeur démarre avec des listes vides et un seul marché générique', () => {
  const data = newWorkspace();
  assert.deepEqual(data.markets.map(market => market.name), ['Mon marché']);
  for (const name of ['users', 'points', 'analystPoints', 'plannerTasks', 'jiraTickets', 'jiraImports', 'drafts']) assert.deepEqual(data[name], []);
});

test('créer un point, le modifier puis réouvrir le classeur conserve le texte et la semaine', async () => {
  const store = new WorkspaceStore(newWorkspace());
  const api = createLocalApi(store);
  const data = { meetingDate: '2026-11-19', priority: 'Préparer la réunion', dossiers: [], operations: [], jira: [], themeColor: 'mint' };
  const save = async priority => {
    const response = await api('/api/points', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Market-USERCODE': 'Z0000001' }, body: JSON.stringify({ marketId: 'market-local', data: { ...data, priority } }) });
    assert.equal(response.ok, true);
    return response.json();
  };
  const first = await save('Première version');
  const next = await save('Priorité confirmée');
  assert.equal(first.point.id, next.point.id);
  const dataRestored = await decodeWorkspace(await encodeWorkspace(store.read()));
  assert.equal(dataRestored.points.length, 1);
  assert.equal(dataRestored.points[0].data.priority, 'Priorité confirmée');
  assert.equal(dataRestored.points[0].week, 47);
});

test('le brouillon EML reprend le destinataire, le corps du message et le document HTML joint', () => {
  const eml = buildMailDraft({ to: 'equipe@example.test', cc: '', subject: 'Réunion', html: '<p>Priorités</p>', attachment: { name: 'reunion.html', html: '<h1>Réunion</h1>' } });
  assert.match(eml, /^To: equipe@example\.test\r$/m);
  assert.match(eml, /multipart\/mixed/);
  assert.match(eml, /filename="reunion.html"/);
  assert.ok(eml.includes(Buffer.from('<h1>Réunion</h1>').toString('base64')));
});

test('import d’un tableau Jira synthétique avec deux états', async () => {
  const { parseJiraCsv } = await loadModule('lib/jira-csv.ts');
  const csv = ['Clé de ticket;État;Résumé;Création;Personne assignée;Mise à jour;Date de résolution', 'TEST-1;Ouvert;Préparer;01/11/2026 09:00;Z0000001;02/11/2026 10:00;', 'TEST-2;Résolu;Clore;01/11/2026 09:00;Z0000001;03/11/2026 10:00;03/11/2026 10:00'].join('\n');
  const result = parseJiraCsv(csv);
  assert.equal(result.tickets.length, 2);
  assert.equal(result.closedTicketCount, 1);
  assert.equal(result.openTicketCount, 1);
});
