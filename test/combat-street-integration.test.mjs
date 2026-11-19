import {broadcastEvents} from './fixtures/fire-events.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../public/game.js';
import { SPAWN, contactAt, monuments, nearbyProps } from '../public/paris-world.js';
import { vehicleSpec } from '../public/vehicle-types.js';
import { createNet } from '../public/net.js';
import { handleApi } from '../worker/game-api.js';
import { localDatabase } from '../scripts/local-db.mjs';

function street(t, count = 1, db = null) {
  const names = ['window', 'document', 'requestAnimationFrame', 'cancelAnimationFrame'];
  const saved = names.map(name => globalThis[name]);
  globalThis.document = new EventTarget();
  globalThis.window = new EventTarget();
  const frames = new Map(), clients = [], waiting = [], roster = new Map(), requests = new Set();
  let frameId = 0, sequence = 0, time = 1782250000000, stamp = performance.now(), frameNumber = 0;
  if (db) t.mock.method(Date, 'now', () => Math.round(time));
  globalThis.requestAnimationFrame = callback => { frames.set(++frameId, callback); return frameId; };
  globalThis.cancelAnimationFrame = id => frames.delete(id);
  t.after(async () => {
    for (const c of clients) { c.net.stop?.(); c.game.destroy(); }
    await Promise.allSettled([...requests]);
    db?.close();
    names.forEach((name, i) => {
      if (saved[i] === undefined) delete globalThis[name];
      else globalThis[name] = saved[i];
    });
  });
  for (let i = 0; i < count; i++) {
    const c = { id: 'street-player-' + i, shots: [], effects: [], aim: 0 };
    c.canvas = Object.assign(new EventTarget(), { focus() {}, setPointerCapture() {} });
    const net = db ? createNet({
      name: c.id, pollMs: 18,
      fetcher(url, init) {
        const request = handleApi(new Request('https://game.test' + url, init), { DB: db });
        requests.add(request);
        request.then(() => requests.delete(request), () => requests.delete(request));
        return request;
      }
    }) : {
      id: c.id, status: count === 1 ? 'offline' : 'online', serverTime: () => time,
      world: () => ({}), peers: () => [...roster.values()].filter(other => other.id !== c.id),
      publish: pose => { c.published = structuredClone(pose); },
      emit(type, data) {
        const event = { type, data: structuredClone(data), at: time, seq: ++sequence, player: c.id };
        if (type === 'fire') c.shots.push(event.data);
        if (count > 1) waiting.push(...broadcastEvents(event, () => ++sequence));
        return count > 1;
      },
      onEvent: callback => { c.receive = callback; }
    };
    c.net = net;
    c.game = createGame({ canvas: c.canvas, net, onState: hud => { c.hud = hud; }, buildView: () => ({
      available: true, mode: 'canvas', aim: () => c.aim, dispose() {},
      render: scene => { c.scene = scene; }, effect: (...args) => c.effects.push(args)
    }) });
    clients.push(c);
  }
  function tick(n = 1) {
    for (let i = 0; i < n; i++) {
      stamp += 1000 / 60; time += 1000 / 60;
      if (frameNumber++ % 7 === 0) for (const c of clients) {
        if (c.published) roster.set(c.id, { ...c.published, id: c.id, joinedAt: 1, updatedAt: time });
      }
      for (const event of waiting.splice(0)) for (const c of clients) if (c.id !== event.player) c.receive(event);
      const batch = [...frames.values()]; frames.clear();
      for (const frame of batch) frame(stamp);
    }
  }
  return { clients, tick };
}

function stand(c, x, y, angle = 0, vehicle = null) {
  const pose = { ...c.game.exportTravelState(), x, y, angle, yaw: angle, vx: 0, vy: 0, vehicle };
  assert.ok(c.game.restoreTravelState(pose));
  return Math.hypot(c.game.getPosition().x - x, c.game.getPosition().y - y) < .04;
}
function clickAt(c, target) {
  const p = c.game.getPosition();
  c.aim = Math.atan2(target.y - p.y, target.x - p.x);
  for (const name of ['pointerdown', 'pointerup']) {
    c.canvas.dispatchEvent(Object.assign(new Event(name), { pointerType: 'mouse', pointerId: 1, button: 0, clientX: 60, clientY: 80 }));
  }
}
function approach(c, type, distance, vehicle = null) {
  const candidates = nearbyProps(SPAWN.x, SPAWN.y, 80).filter(p => p.type === type);
  candidates.sort((a, b) => Math.hypot(a.x - SPAWN.x, a.y - SPAWN.y) - Math.hypot(b.x - SPAWN.x, b.y - SPAWN.y));
  for (const p of candidates) for (let i = 0; i < 16; i++) {
    const angle = i * Math.PI / 8, dx = Math.cos(angle), dy = Math.sin(angle);
    const geometry = vehicle ? { angle, ...vehicleSpec(vehicle.type) } : { radius: .58 };
    let clear = true;
    for (let d = distance; d > 0; d -= .25) {
      const hit = contactAt(p.x - dx * d, p.y - dy * d, geometry);
      if (hit && hit.id !== p.id) { clear = false; break; }
    }
    if (clear && stand(c, p.x - dx * distance, p.y - dy * distance, angle, vehicle)) return p;
  }
  assert.fail('No unoccupied street approach for ' + type);
}
function solid(c, p) { return contactAt(p.x, p.y, { radius: .08, destroyed: c.scene.destroyed })?.id === p.id; }

// Exercise input -> melee contact -> cumulative prop damage -> scene and collision geometry.
test('a punched bin stays solid until enough pistol hits break it, then the player can walk through', t => {
  const { clients: [a], tick } = street(t);
  const bin = approach(a, 'bin', 1.24);
  tick(3);
  assert.ok(solid(a, bin));
  a.game.action('melee'); a.game.action('melee', false); tick(26);
  const first = a.scene.propHealth?.get(bin.id);
  assert.ok(first?.health > 0 && first.health < first.maxHealth, 'one jab must remove some durability');
  assert.ok(solid(a, bin));
  const toward = a.game.getPosition().angle;
  a.game.setMove(0, -1); tick(34); a.game.setMove(0, 0); tick(10);
  assert.ok(Math.hypot(a.scene.p.x - bin.x, a.scene.p.y - bin.y) > bin.r + .22, 'walking is still blocked by the damaged bin');
  let rounds = 0, previous = first.health;
  while (!a.scene.destroyed.has(bin.id) && rounds++ < 12) {
    clickAt(a, bin); tick(20);
    if (!a.scene.destroyed.has(bin.id)) {
      const hp = a.scene.propHealth.get(bin.id)?.health;
      assert.ok(hp > 0 && hp < previous, 'each landed shot removes further durability');
      assert.ok(solid(a, bin)); previous = hp;
    }
  }
  assert.ok(a.scene.destroyed.has(bin.id)); assert.equal(solid(a, bin), false);
  assert.equal(a.effects.filter(([kind]) => kind === 'propBreak').length, 1);
  a.game.setMove(0, -1); tick(48);
  const p = a.game.getPosition();
  assert.ok((p.x - bin.x) * Math.cos(toward) + (p.y - bin.y) * Math.sin(toward) > .2, 'avatar crosses the former collision volume');
});

test('a moving compact car damages a standing street lamp through collision', t => {
  const { clients: [a], tick } = street(t);
  const lamp = approach(a, 'lamp', 4.6, { id: 'qa-compact', type: 'compact', speed: 10 });
  tick(35);
  const damage = a.scene.propHealth?.get(lamp.id);
  assert.ok(damage?.health > 0 && damage.health < damage.maxHealth, 'a moderate collision dents the lamp');
  assert.ok(solid(a, lamp));
  assert.equal(a.effects.filter(([kind]) => kind === 'propBreak').length, 0);
});

test('a sideways shot faces its target, bleeds on the victim and witness, and can be stopped with a dressing', t => {
  const { clients: [a, b], tick } = street(t, 2);
  const arc = monuments.arc;
  assert.ok(stand(a, arc.x, arc.y)); assert.ok(stand(b, arc.x, arc.y + 4)); tick(35);
  const target = b.game.getPosition();
  clickAt(a, target); tick(22);
  const shot = a.shots.at(-1), player = a.scene.entities.find(e => e.self), witness = b.scene.entities.find(e => e.id === a.id);
  assert.ok(shot && Math.abs(shot.angle - Math.PI / 2) < .03);
  assert.ok(Math.abs(player.angle - shot.angle) < .12);
  assert.ok(witness && Math.abs(witness.angle - shot.angle) < .22);
  assert.equal(b.hud.health, 83);
  assert.ok(b.hud.bleeding && b.hud.bleedSeconds > 0);
  assert.ok(a.scene.entities.find(e => e.id === b.id)?.bleeding);
  tick(60); assert.equal(b.hud.health, 82);
  b.game.action('heal'); tick(32);
  assert.equal(b.hud.bleeding, null); assert.equal(b.hud.bleedSeconds, 0);
  assert.ok(!a.scene.entities.find(e => e.id === b.id)?.bleeding);
  const treated = b.hud.health;
  tick(170); assert.equal(b.hud.health, treated);
  clickAt(a, b.game.getPosition()); tick(15);
  assert.ok(b.hud.bleeding);
  const immediate = b.hud.health;
  tick(195);
  assert.equal(b.hud.bleeding, null); assert.equal(b.hud.health, immediate - 3);
  tick(45); assert.equal(b.hud.health, immediate - 3);
});

async function tickUntil(tick, condition, message) {
  const deadline = performance.now() + 4500;
  do {
    tick(3);
    if (condition()) return;
    await new Promise(resolve => setTimeout(resolve, 12));
  } while (performance.now() < deadline);
  assert.fail(message);
}

test('two playable clients see the same partial damage, then the same broken street prop through the world API', async t => {
  const { clients, tick } = street(t, 2, localDatabase());
  const [a, b] = clients;
  const poll = (ready, message) => tickUntil(tick, ready, message);
  const bin = approach(a, 'bin', 1.24);
  tick(4);
  assert.deepEqual(await Promise.all(clients.map(c => c.net.start())), [true, true]);
  await poll(() => clients.every(c => c.net.peers().length === 1), 'both games should have joined the same world');
  a.game.action('melee'); a.game.action('melee', false);
  await poll(() => clients.every(c => c.scene.propHealth.get(bin.id)?.health < 42), 'both clients should receive the first jab');
  const first = b.scene.propHealth.get(bin.id).health;
  assert.ok(first > 0);
  for (const c of clients) {
    assert.equal(c.net.world().propHealth[bin.id]?.health, first);
    assert.ok(solid(c, bin));
  }
  tick(30); clickAt(a, bin);
  await poll(() => clients.every(c => c.net.world().propHealth[bin.id]?.health < first), 'a subsequent pistol round should accumulate');
  const second = b.net.world().propHealth[bin.id].health;
  assert.ok(second > 0);
  tick(22); clickAt(a, bin);
  await poll(() => clients.every(c => c.scene.destroyed.has(bin.id)), 'the authoritative lethal shot should clear both colliders');
  for (const c of clients) {
    assert.equal(c.net.world().propHealth[bin.id].health, 0);
    assert.equal(solid(c, bin), false);
    assert.equal(c.effects.filter(([kind]) => kind === 'propBreak').length, 1);
  }
});


test('the live shooting controls, HTTP netcode and world database agree on a single player hit', async t => {
  const {clients:[a,b],tick}=street(t,2,localDatabase());
  const arc=monuments.arc;
  assert.ok(stand(a,arc.x,arc.y));assert.ok(stand(b,arc.x,arc.y+4));
  tick(3);
  assert.deepEqual(await Promise.all([a.net.start(),b.net.start()]),[true,true]);
  await tickUntil(tick,()=>a.scene.entities.some(e=>e.id===b.net.id)&&b.scene.entities.some(e=>e.id===a.net.id),'both avatars should be present');
  const received=[];
  b.net.onEvent(e=>{if(e.player===a.net.id)received.push(e);});
  clickAt(a,b.game.getPosition());
  assert.equal(a.game.getWeaponAmmo('pistol'),11);
  assert.equal(a.effects.filter(([kind])=>kind==='shot').length,1);
  await tickUntil(tick,()=>b.hud.health===83&&received.some(e=>e.type==='hit'),'the authoritative hit should reach the player');
  const shots=received.filter(e=>e.type==='shot'),hits=received.filter(e=>e.type==='hit');
  assert.equal(shots.length,1);assert.equal(hits.length,1);
  assert.equal(shots[0].data.shotId,hits[0].data.shotId);
  assert.equal(hits[0].data.target,b.net.id);
  assert.ok(b.hud.bleeding);
});
