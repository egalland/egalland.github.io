import test from 'node:test';
import assert from 'node:assert/strict';
import {createCrowdMotion, WALKER_RADIUS, PLAYER_RADIUS} from '../public/crowd-motion.js';

const separation = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const pedestrian = (id, x, y, angle = 0, speed = 1.25) => ({id, x, y, angle, speed, moving: speed > 0});
const player = (x, y, id = 'player') => ({id, x, y, r: PLAYER_RADIUS});

test('a pedestrian passes a stationary player on the open side of a wall and returns to the sidewalk', () => {
  // At +0.7 m the wall blocks the side pedestrians normally choose for passing.
  const wall = .70;
  for (const fps of [15, 60]) {
    const sim = createCrowdMotion({blocked: (x, y, r) => y + r > wall,
      move: (x, y, dx, dy, r) => ({x: x + dx, y: Math.min(wall - r, y + dy)})});
    let closest = Infinity, lateral = 0, last;
    const obstacle = player(0, 0);
    for (let frame = 0; frame <= fps * 8; frame++) {
      const actor = pedestrian('walker', -5 + 1.25 * frame / fps, 0);
      sim.step([actor], [obstacle], 1 / fps);
      closest = Math.min(closest, separation(actor, obstacle)); lateral = Math.min(lateral, actor.y);
      assert.ok(actor.y + WALKER_RADIUS <= wall + 1e-8);
      if (last) assert.ok(separation(last, actor) < 2.1 / fps);
      last = actor;
    }
    assert.ok(closest >= PLAYER_RADIUS + WALKER_RADIUS);
    assert.ok(lateral < -.9);
    assert.ok(last.x > 4.9 && Math.abs(last.y) < .1);
  }
});

test('opposing walkers pass on their own right and their poses do not depend on actor list order', () => {
  const simulations = [createCrowdMotion(), createCrowdMotion()];
  let closest = Infinity, a, b;
  for (let frame = 0; frame <= 400; frame++) {
    const t = frame / 40;
    const first = [pedestrian('west', -5 + t, 0, 0, 1), pedestrian('east', 5 - t, 0, Math.PI, 1)];
    const other = first.slice().reverse().map(x => ({...x}));
    simulations[0].step(first, [], 1 / 40); simulations[1].step(other, [], 1 / 40);
    [a, b] = first;
    assert.equal(a.x, other[1].x); assert.equal(b.y, other[0].y);
    closest = Math.min(closest, separation(a, b));
    if (frame === 200) assert.ok(a.y > .2 && b.y < -.2);
  }
  assert.ok(closest >= 2 * WALKER_RADIUS);
  assert.ok(a.x > 4.9 && b.x < -4.9);
});

test('eighteen responders and passersby spawning at the same point remain separated from both players and each other', () => {
  const sim = createCrowdMotion();
  for (let step = 0; step < 210; step++) {
    const t = step / 30;
    const local = {...player(Math.sin(t) * 1.6, 0), vx: Math.cos(t) * 1.6};
    const remote = player(0, -.8, 'peer');
    const actors = Array.from({length: 18}, (_, i) => ({...pedestrian('npc-' + i, 0, 0, 0, 0),
      type: ['pedestrian', 'medic', 'police', 'swat', 'firefighter'][i % 5]}));
    sim.step(actors, [local, remote], 1 / 30);
    assert.equal(actors.length, 18);
    for (let i = 0; i < actors.length; i++) {
      for (const body of [...actors.slice(0, i), local, remote])
        assert.ok(separation(actors[i], body) >= WALKER_RADIUS * 2 - 1e-8);
    }
  }
});

test('walking bodies give the corners of a rotated bus and a downed responder physical space', () => {
  const sim = createCrowdMotion(), angle = Math.PI * .27;
  const bus = {id: 'bus', x: 1, y: 1, angle, halfLength: 4.25, halfWidth: 1.225};
  const a0 = Math.cos(angle), a1 = Math.sin(angle);
  const down = {...pedestrian('medic', -4, -4, 0, 0), stunned: true, ragdoll: {seed: 1}};
  const riders = [down, pedestrian('standing-over-medic', -4, -4, 0, 0)];
  for (let i = 0; i < 5; i++) riders.push(pedestrian('walker-' + i, 1, 1, 0, 0));
  sim.step(riders, [bus], 1 / 30);
  assert.equal(down.x, -4); assert.equal(down.y, -4);
  assert.equal(riders.length, 7);
  for (const rider of riders.slice(1)) {
    const dx = rider.x - bus.x, dy = rider.y - bus.y;
    const forward = Math.abs(dx * a0 + dy * a1), lateral = Math.abs(-dx * a1 + dy * a0);
    assert.ok(Math.hypot(Math.max(0, forward - bus.halfLength), Math.max(0, lateral - bus.halfWidth)) >= WALKER_RADIUS);
    assert.ok(separation(rider, down) >= WALKER_RADIUS * 2);
  }
  const recovered = pedestrian('medic', -2, -4);
  sim.step([recovered], [], 1 / 30);
  assert.ok(recovered.x < -3.8 && recovered.moving);
  sim.reset();
  const teleported = pedestrian('medic', 30, 37, 0, 0);
  sim.step([teleported], [], 1 / 60);
  assert.equal(teleported.x, 30); assert.equal(teleported.y, 37);
});

test('a player sprinting against five walkers next to a wall clears each shoulder before and after both move', () => {
  const wall = 1.13, sprint = 6.4, walk = 1.35;
  for (const fps of [15, 60]) {
    const sim = createCrowdMotion({blocked: (x, y, r) => y + r > wall,
      move: (x, y, dx, dy, r) => ({x: x + dx, y: Math.min(wall - r, y + dy)})});
    let lateral = 0, last;
    for (let frame = 0; frame <= 8 * fps; frame++) {
      const t = frame / fps;
      const runner = {...player(11 - sprint * t, .13), vx: -sprint, vy: 0};
      const next = {...runner, x: runner.x - sprint / fps};
      const group = Array.from({length: 5}, (_, i) => pedestrian('walker-' + i, -5 + i * 1.35 + walk * t, 0, 0, walk));
      sim.step(group, [runner], 1 / fps);
      assert.equal(group.length, 5);
      for (const [i, actor] of group.entries()) {
        assert.ok(actor.y + WALKER_RADIUS <= wall);
        for (const body of [runner, next, ...group.slice(0, i)]) assert.ok(separation(actor, body) >= WALKER_RADIUS * 2);
        lateral = Math.max(lateral, Math.abs(actor.y));
      }
      last = group;
    }
    assert.ok(lateral > .9);
    for (const [i, actor] of last.entries())
      assert.ok(separation(actor, {x: -5 + i * 1.35 + walk * 8, y: 0}) < .12);
  }
});
