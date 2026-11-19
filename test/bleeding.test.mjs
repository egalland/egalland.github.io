import test from 'node:test';
import assert from 'node:assert/strict';
import {activeBleeding, bleedDamageBetween, bleedingAfterHit, hitSeverity} from '../public/bleeding.js';
import {createVitality, npcHealthAt} from '../public/vitality.js';

const at = 1_900_000_000_000;

test('Sustained bleeding depends on impact type and magnitude', () => {
  assert.equal(hitSeverity('melee', 12), 0);
  assert.equal(hitSeverity('melee', 16), 1);
  assert.equal(hitSeverity('weapon', 10, 'smg'), 1);
  assert.equal(hitSeverity('weapon', 28, 'ribbonbow'), 2);
  assert.equal(hitSeverity('weapon', 48, 'shotgun'), 3);
  assert.equal(hitSeverity('traffic', 46), 3);
  assert.equal(hitSeverity('weapon', 48, 'bubbles'), 0);
  assert.equal(hitSeverity('weapon', 60, 'confetti'), 0);
  assert.equal(hitSeverity('unknown', 100), 0);
});

test('A wound can be refreshed, but cannot stack damage or retain malformed network state', () => {
  const wound = bleedingAfterHit(null, 2, at);
  assert.deepEqual(wound, {at, until: at + 4500, severity: 2});
  assert.deepEqual(bleedingAfterHit(wound, 0, at + 2200), wound);
  assert.deepEqual(bleedingAfterHit(wound, 1, at + 3000), {at: at + 3000, until: at + 7500, severity: 2});
  assert.equal(bleedDamageBetween(wound, at, at + 999), 0);
  assert.equal(bleedDamageBetween(wound, at + 1800, at + 10_000), 3);
  assert.equal(bleedDamageBetween(wound, at + 4500, at + 10_000), 0);
  assert.equal(activeBleeding(wound, at + 4500), null);
  assert.equal(activeBleeding({...wound, until: at + 50_000}, at), null);
  assert.equal(activeBleeding({...wound, severity: 20}, at), null);
  assert.equal(activeBleeding(wound, at - 1000), null);
});

test('Real ticks, suspended frames and district transfers charge exactly the same wound once', () => {
  const first = createVitality(null, at);
  first.hurt(17, {at, cause: 'weapon', weapon: 'pistol'});
  first.tick(at + 1250);
  assert.equal(first.health, 82);
  const saved = structuredClone(first.snapshot());
  const resumed = createVitality(saved, at + 2040);
  assert.equal(resumed.health, 81);
  assert.equal(resumed.state(at + 2040).bleedSeconds, 1);
  resumed.tick(at + 2040);
  assert.equal(resumed.health, 81);
  resumed.tick(at + 7000);
  first.tick(at + 7000);
  const late = createVitality(saved, at + 7000);
  for (const life of [first, resumed, late]) {
    assert.equal(life.health, 80);
    assert.equal(life.bleeding, null);
    assert.equal(life.state(at + 7000).bleedSeconds, 0);
  }
});

test('A first-aid kit and a paramedic both stop blood loss, and a direct knockout clears it', () => {
  for (const medic of [false, true]) {
    const life = createVitality(null, at);
    life.hurt(28, {at, cause: 'weapon', weapon: 'ribbonbow'});
    assert(life.aid(at + 1300, medic));
    assert.equal(life.health, 71 + (medic ? 18 : 25));
    assert.equal(life.bleeding, null);
    life.tick(at + 5000);
    assert.equal(life.health, 71 + (medic ? 18 : 25));
  }
  const life = createVitality({health: 19}, at);
  life.hurt(17, {at, cause: 'weapon', weapon: 'pistol'});
  life.tick(at + 1000);
  assert.equal(life.health, 1);
  life.tick(at + 2200);
  assert.equal(life.health, 1);
  life.hurt(1, {at: at + 2300, cause: 'melee'});
  assert(life.down);
  assert.equal(life.bleeding, null);
  life.tick(at + 10_000);
  assert.equal(life.health, 75);
});

test('A soft impact preserves an open wound across a small network clock correction', () => {
  const life = createVitality(null, at);
  life.hurt(17, {at, cause: 'weapon', weapon: 'pistol'});
  life.tick(at + 1010);
  life.hurt(8, {at: at + 990, cause: 'weapon', weapon: 'bubbles'});
  life.tick(at + 1010);
  assert.equal(life.health, 74);
  assert.equal(life.bleeding.at, at);
  life.tick(at + 3050);
  assert.equal(life.health, 72);
});

test('Repeated NPC snapshots derive identical health from the canonical hit time', () => {
  const bleeding = bleedingAfterHit(null, 3, at);
  const state = {health: 45, healthAt: at, bleeding};
  assert.equal(npcHealthAt(state, at + 1890), 44);
  const observed = structuredClone(state);
  for (let i = 0; i < 6; i++) assert.equal(npcHealthAt(observed, at + 2560), 43);
  const next = {health: 39, healthAt: at + 2560, bleeding};
  assert.equal(npcHealthAt(next, at + 6050), 35);
  assert.equal(npcHealthAt({...state, health: 2}, at + 6050), 1);
  assert.equal(npcHealthAt({...state, health: 0.8}, at + 6050), 0.8);
  assert.equal(npcHealthAt(state, at + 11_000), 43);
});
