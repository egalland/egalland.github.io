import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const start = 2_000_000_000_000;
const firstWindow = 1800;
const longWindow = 8 * 3600;
const seeds = ['strate-capacity/0', 'strate-capacity/1'];
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'strate-observer-capacity-'));
const savedUUID = crypto.randomUUID;
const savedNow = Date.now;
const round = value => Number(value.toFixed(2));
const p95 = samples => round(samples.toSorted((a, b) => a - b)[Math.ceil(samples.length * .95) - 1]);
const bytes = value => Buffer.byteLength(value, 'utf8');

function seedAgents(seed) {
  let sequence = 0;
  crypto.randomUUID = () => {
    const h = createHash('sha256').update(seed + '/' + sequence++).digest('hex');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-4' + h.slice(13, 16) + '-a' + h.slice(17, 20) + '-' + h.slice(20, 32);
  };
}

// Capture the actual serialized bind parameters sent by saveWorld. No DB calls are made.
function captureD1() {
  let stateBytes = 0, journalBatchBytes = 0, journalStatements = 0;
  const db = {
    prepare(sql) {
      return {bind(value) {
        if (sql.startsWith('UPDATE voxel_worlds SET state=')) stateBytes = bytes(value);
        if (sql.includes('INSERT OR IGNORE INTO game_activity')) {
          journalBatchBytes = Math.max(journalBatchBytes, bytes(value));
          journalStatements++;
        }
        return {};
      }};
    },
    batch() { return [{meta: {changes: 1}}]; },
  };
  return {db, sizes: () => ({stateBytes, journalBatchBytes, journalStatements})};
}

try {
  // Only project-owned TS modules, no browser startup, Worker, network, or API credentials.
  const modules = (await fs.readdir('lib')).filter(name => name.endsWith('.ts') && !name.endsWith('.d.ts'));
  await Promise.all(modules.map(async name => {
    const source = await fs.readFile(path.join('lib', name), 'utf8');
    const {outputText} = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022}});
    const js = outputText.replace(/from (['"])(\.\/[^'"]+)\1/g, 'from $1$2.mjs$1');
    await fs.writeFile(path.join(temporary, name.replace(/\.ts$/, '.mjs')), js);
  }));
  const load = name => import(pathToFileURL(path.join(temporary, name + '.mjs')));
  const [core, frontier, bots, observer, store, clocks, cadence] = await Promise.all(['world', 'frontier', 'playtester', 'observatory', 'world-store', 'observation-clock', 'observer-cadence'].map(load));

  async function exercise(ai, seed, hours) {
    seedAgents(seed);
    let now = start;
    Date.now = () => now;
    const world = core.makeWorld(start);
    clocks.observerClock(world, start, 1);
    bots.ensurePlaytester(world, start, ai);
    frontier.ensureFrontier(world, start);
    assert.equal(world.players.length, ai);
    assert(world.players.every(p => p.ai && p.expedition.workers.length === 6 && p.coins === 800));
    const tick = [], viewTime = [], saved = [], response = [];
    const recordedIds = new Set();
    let recent = [], events = 0, journalJsonBytes = 0, maxEventsPerTick = 0, maxJournalBatch = 0;
    let maxState = 0, maxResponse = 0, early;
    const checkpoints = [];
    for (let seconds = 5; seconds <= hours * 3600; seconds += 5) {
      now = start + seconds * 1000;
      const t = performance.now();
      frontier.advanceFrontier(world, now, bots.tickPlaytester);
      if (seconds <= firstWindow) tick.push(performance.now() - t);
      const pending = world.auditPending ?? [];
      events += pending.length;
      maxEventsPerTick = Math.max(maxEventsPerTick, pending.length);
      if (pending.length) {
        journalJsonBytes += bytes(JSON.stringify(pending));
        for (const event of pending) recordedIds.add(event.id);
        const summaries = pending.map(({context, ...summary}) => summary);
        recent = summaries.concat(recent).sort((a, b) => b.at - a.at || (a.id === b.id ? 0 : a.id < b.id ? 1 : -1)).slice(0, 12);
      }
      if (seconds <= firstWindow || seconds % 600 === 0) {
        const db = captureD1(), version = seconds / 5;
        const beforeSave = performance.now();
        await store.saveWorld(db.db, {world, version});
        const saveMs = performance.now() - beforeSave;
        const {stateBytes, journalBatchBytes} = db.sizes();
        assert(stateBytes > 0, 'Serialized world D1 bind not found');
        const focusCamps = seconds <= firstWindow ? [world.players[(version - 1) % ai]] : world.players;
        let responseBytes = 0, view;
        for (const focus of focusCamps) {
          const beforeView = performance.now();
          view = observer.observerView(world, now, focus.id, recent, clocks.observerClock(world, now));
          responseBytes = Math.max(responseBytes, bytes(JSON.stringify({view, version})));
          if (seconds <= firstWindow) viewTime.push(performance.now() - beforeView);
          assert.equal(view.agents.length, ai);
        }
        maxState = Math.max(maxState, stateBytes);
        maxResponse = Math.max(maxResponse, responseBytes);
        maxJournalBatch = Math.max(maxJournalBatch, journalBatchBytes);
        if (seconds <= firstWindow) {
          saved.push(saveMs);
          response.push(responseBytes);
        }
        if (seconds === firstWindow || seconds % 3600 === 0) {
          const agents = bots.testAgents(world);
          const stalled = agents.filter(a => a.checks.length < 6).map(a => ({
            name: world.players.find(p => p.id === a.player).name, profile: a.profile, checks: a.checks.length, goal: a.objective,
          }));
          assert.equal(view.activity.simulatedMs, seconds * 1000);
          assert.equal(view.activity.skippedMs, 0);
          const state = {
            seconds, uniqueEventIds: recordedIds.size, stateBytes, responseBytes, events, journalJsonBytes, maxEventsPerTick, maxSampledJournalBatchBytes: maxJournalBatch,
            routesComplete: agents.length - stalled.length, incompleteRoutes: stalled, errors: agents.reduce((sum, a) => sum + a.errors, 0),
            outposts: view.outposts.length, guilds: view.guilds.length, independent: view.agents.filter(a => !a.guild).length,
            deposits: view.deposits.length,
          };
          if (seconds === firstWindow) {
            early = {
              ai, seed, startingWorkers: ai * 6, ...state,
              tickP95Ms: p95(tick), viewAndSerializeP95Ms: p95(viewTime), serializePersistenceP95Ms: p95(saved),
              responseP95Bytes: p95(response), maxResponseBytes: maxResponse, maxStateBytes: maxState,
            };
            console.log(JSON.stringify(early));
          } else checkpoints.push(state);
        }
      }
      world.auditPending = [];
    }
    return {early, longRun: hours * 3600 > firstWindow
      ? {ai, seed, maxSampledStateBytes: maxState, maxSampledResponseBytes: maxResponse, checkpoints}
      : null};
  }

  // Max-step transaction immediately after founding, ignoring only the runtime CPU stop.
  async function backlogWrite(seed) {
    seedAgents(seed);
    let now = start;
    Date.now = () => now;
    const world = core.makeWorld(start);
    clocks.observerClock(world, start, 1);
    bots.ensurePlaytester(world, start);
    now += 240000;
    frontier.advanceFrontier(world, now, bots.tickPlaytester, {maxSteps:48, cpuMs:Infinity});
    assert.equal(world.frontier.time, now);
    const db = captureD1();
    await store.saveWorld(db.db, {world, version:0});
    return {seed, ai:bots.AI_COUNT, simulatedSeconds:240, events:world.auditPending.length, ...db.sizes()};
  }

  // Fixed wall-clock intervals without transport latency. Catch-up obeys the actual CPU budget.
  function pollingProbe(speed, fixed = false) {
    seedAgents(seeds[0]);
    let wall = start;
    Date.now = () => wall;
    const w = core.makeWorld(start);
    clocks.observerClock(w, start, speed);
    bots.ensurePlaytester(w, start);
    const interval = lag => fixed ? 6000 : cadence.observerPollInterval(speed, lag);
    let requests = 0, maxBehind = 0, behind = 0, next = start + interval(0);
    const until = start + 360000;
    while (wall < until) {
      wall = Math.min(until, next);
      const clock = clocks.observerClock(w, wall);
      frontier.advanceFrontier(w, clock.target, bots.tickPlaytester, {maxSteps:48, cpuMs:20});
      requests++;
      behind = clock.target - w.frontier.time;
      maxBehind = Math.max(maxBehind, behind);
      w.auditPending = [];
      next = wall + interval(behind);
    }
    assert.equal(w.simulationActivity.skippedMs, 0);
    return {speed, policy:fixed ? 'témoin fixe' : 'cadence du client', nominalIntervalMs:interval(0), catchUpMs:interval(5000),
      wallSeconds:360, requests,
      targetSeconds:360 * speed, simulatedSeconds:(w.frontier.time - start) / 1000,
      maxBehindSeconds:maxBehind / 1000, finalBehindSeconds:behind / 1000};
  }

  const results = [], longRuns = [], backlogWrites = [];
  for (const seed of seeds) {
    for (const ai of [1, 4, 8, 12]) {
      const {early, longRun} = await exercise(ai, seed, ai === bots.AI_COUNT ? longWindow / 3600 : firstWindow / 3600);
      results.push(early);
      if (longRun) longRuns.push(longRun);
    }
    backlogWrites.push(await backlogWrite(seed));
  }
  const polling = [pollingProbe(12, true), pollingProbe(4), pollingProbe(12)];
  const report = {
    scope: 'Mesures locales Node, mondes exclusivement IA, économie et coûts ordinaires. Mesure du moteur synchrone et de la sérialisation. SQL, réseau, cache HTTP, requêtes concurrentes et rendu du navigateur exclus.',
    scenario: 'Deux séries reproductibles de positions initiales et décisions. Même terrain procédural. Pas de 5 secondes simulées, caméra centrée à tour de rôle sur chaque IA et 12 derniers événements réels. Toutes les mesures sont en octets UTF-8, avant compression.',
    methodology: 'Les quatre effectifs sont comparés sur les mêmes 30 premières minutes. Le nombre sélectionné est prolongé à huit heures par série. État D1 et réponse observateur mesurés à chaque pas sur 30 minutes puis toutes les 10 minutes pour chaque camp (plus grande réponse retenue). Un test séparé regroupe les 48 premiers pas dans une transaction sans limite CPU pour mesurer ses paramètres. Horloge et identifiants sont locaux et déterministes.',
    storage: 'La taille de l’état correspond au paramètre state du véritable saveWorld, hors taille de la clé de ligne et index. Le maximum du lot de journal porte sur les paramètres JSON échantillonnés. La taille de réponse inclut la carte, les IA, le détail d’un camp et le fil récent. journalJsonBytes cumule les tableaux JSON des événements à chaque pas. Clés, syntaxe et contexte compris, hors index et format interne des lignes SQL.',
    selectedAI: bots.AI_COUNT, strategyVersion: bots.AI_VERSION, nodeVersion: process.version, results, longRuns, backlogWrites, polling,
  };
  await fs.writeFile('docs/ai-capacity.json', JSON.stringify(report, null, 2) + '\n');
  assert.equal(longRuns.length, seeds.length);
  assert(longRuns.every(run => run.maxSampledStateBytes < 2_000_000 - 200), 'Valeur state proche de la limite D1 pour une ligne.');
  assert(backlogWrites.every(run => run.events < 1500), 'Le rattrapage a atteint le plafond de journal par transaction.');
} finally {
  Date.now = savedNow;
  crypto.randomUUID = savedUUID;
  await fs.rm(temporary, {recursive: true, force: true});
}
