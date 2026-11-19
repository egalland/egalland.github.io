import test from 'node:test';
import assert from 'node:assert/strict';
import {createWanted, wantedRules, wantedThresholds, wantedTuning} from '../public/wanted.js';

test('A lone gunshot stays below a star. Repeating it builds visible progress toward the next threshold', () => {
  const wanted = createWanted();
  assert.equal(wanted.add('peaceful', 1).points, 0);
  const first = wanted.add('gunshot', 2);
  assert.equal(first.level, 0);
  assert.equal(first.nextThreshold, 18);
  assert.equal(first.progress, 5 / 18);
  assert.equal(wanted.add('gunshot', 3).points, 11);
  const third = wanted.add('gunshot', 4);
  assert.equal(third.level, 1);
  assert.equal(third.points, 18);
  assert.equal(third.progress, 0);
  assert.equal(third.nextThreshold, 55);
});

test('Repetition is per infraction, capped at 60%, and expires after six seconds', () => {
  const wanted = createWanted();
  assert.equal(wanted.add('hitPlayer', 0).points, wantedRules.hitPlayer.points);
  for (let i = 0; i < 8; i++) {
    const state = wanted.add('gunshot', i * .1);
    assert.equal(state.lastGain, Math.min(8, 5 + i));
  }
  assert.equal(wanted.add('gunshot', 7).lastGain, 5);
  assert.equal(wanted.add('stealVehicle', 8).lastGain, 24);
  assert.equal(wanted.add('stealService', 8.5).lastGain, 38);
});

test('Cooldown decays only after sustained calm, even across late frames or peaceful input', () => {
  const wanted = createWanted();
  wanted.add('hitOfficer', 2);
  assert.equal(wanted.tick(23).points, 48);
  assert.equal(wanted.add('peaceful', 24).points, 48);
  assert.equal(wanted.tick(26).points, 42.5);
  assert.equal(wanted.tick(25).points, 42.5);
  assert.equal(wanted.add('unknown', 30).points, 31.5);
  assert.equal(wanted.tick(42).level, 0);
  assert.equal(wanted.state().points, 0);
  const other = createWanted();other.add('hitOfficer', 2);
  assert.equal(other.tick(30).points, 31.5);
});

test('All five stars use explicit thresholds, including when cooling and hitting the points cap', () => {
  const wanted = createWanted();
  for (let i = 0; i < wantedThresholds.length; i++) {
    let state = wanted.restore({points: wantedThresholds[i] - .01}, 0);
    assert.equal(state.level, i);
    state = wanted.restore({points: wantedThresholds[i]}, 0);
    assert.equal(state.level, i + 1);
    assert.equal(state.nextThreshold, wantedThresholds[i + 1] ?? null);
    assert.equal(state.progress, i === 4 ? 1 : 0);
  }
  for (let i = 0; i < 30; i++) wanted.add('hitOfficer', 1 + i / 10);
  assert.equal(wanted.state().points, wantedTuning.maxPoints);
  assert.equal(wanted.state().level, 5);
  assert.equal(wanted.state().lastGain, 0);
  assert.equal(wanted.tick(42).level, 4);
});

test('Sector travel transfers the exact points, remaining grace and repeat window to a fresh timeline', () => {
  const first = createWanted();
  first.add('hitCivilian', 101);
  first.add('destroy', 102);
  const wire = JSON.parse(JSON.stringify(first.snapshot(103)));
  const second = createWanted(wire, 0);
  assert.deepEqual(second.state(), first.state());
  assert.equal(second.add('destroy', .5).points, first.add('destroy', 103.5).points);
  assert.equal(second.tick(29).points, first.tick(132).points);
  const afterDecay = second.snapshot(29);
  const third = createWanted(afterDecay, 0);
  assert.equal(third.tick(1).points, second.tick(30).points);
  assert.equal(third.clear().level, 0);
  assert.deepEqual(third.snapshot().ages, {});
});

test('Legacy saves retain their displayed level and malformed or unknown inputs remain bounded', () => {
  const wanted = createWanted();
  assert.equal(wanted.restore({heat: .16, sinceCrime: 12}, 20).level, 1);
  assert.equal(wanted.restore({wanted: 3, heat: 2.2}, 0).points, 110);
  assert.equal(wanted.add('__proto__', 0).points, 110);
  assert.equal(wanted.add('toString', 0).points, 110);
  wanted.restore({points: 20, lastAction: 'gunshot', ages: {gunshot: [6, -2, '1']}}, 0);
  assert.equal(wanted.add('gunshot', 0).lastGain, 5);
  assert.equal(wanted.restore({points: 1e12}, 1).points, 320);
  assert.equal(wanted.restore(null, NaN).level, 0);
});
