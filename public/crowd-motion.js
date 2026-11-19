// World-space footprints, in metres. Both the walking controller and the crowd use these.
export const WALKER_RADIUS = .55;
export const PLAYER_RADIUS = .59;
// Arms and knitted tails extend beyond the load-bearing shoulders. Reserve space between
// characters for their silhouette without widening the wall collision on a narrow pavement.
const walkerSpace = .74, playerSpace = .92;
const skin = .025;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));
const offsets = [0, .36, -.36, .71, -.71, 1.1, -1.1, 1.56, -1.56];
const tau = Math.PI * 2;

function seedAngle(id) {
  let hash = 2166136261;
  for (const ch of String(id)) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619);
  return (hash >>> 0) / 4294967296 * tau;
}

// Signed distance to the actual vehicle corners or the other walker's shoulders.
function distanceTo(body, x, y) {
  let dx = x - body.x, dy = y - body.y;
  if (!body.halfLength) return Math.hypot(dx, dy) - body.r;
  const a = Math.abs(dx * body.c + dy * body.s) - body.halfLength;
  const b = Math.abs(-dx * body.s + dy * body.c) - body.halfWidth;
  return Math.hypot(Math.max(0, a), Math.max(0, b)) + Math.min(0, Math.max(a, b));
}

// Ragdoll joints use the same local forward/up/right axes as both renderers. The body can
// land well ahead of its network anchor: use its projected outline, including the head.
export function pedestrianBody(entity) {
  const {id, x, y} = entity, angle = entity.angle || 0;
  const player = !!(entity.peer || entity.self || entity.player);
  const r = player ? PLAYER_RADIUS : WALKER_RADIUS;
  const speed = entity.speed || 0;
  const base = {id, x, y, angle, r, person: true, player, social: player ? playerSpace : walkerSpace,
    vx: entity.vx ?? speed * Math.cos(angle), vy: entity.vy ?? speed * Math.sin(angle), speed};
  const pose = entity.ragdoll, blend = clamp(pose?.blend ?? 1, 0, 1);
  if (!pose?.head || !pose?.hips) {
    // A legacy down event has no joint samples; both renderers use a leaning fall pose.
    return entity.stunned || entity.down ? {...base, r: .90, fallen: true, vx: 0, vy: 0, speed: 0} : base;
  }
  if (blend < .06) return base;
  const facing = Math.atan2(pose.head[2] - pose.hips[2], pose.head[0] - pose.hips[0]);
  const c = Math.cos(facing), s = Math.sin(facing);
  let minF = -r * (1-blend), maxF = -minF, minS = minF, maxS = maxF;
  for (const [joint, point] of Object.entries(pose)) {
    if (!Array.isArray(point) || point.length !== 3) continue;
    const pad = joint === 'head' ? .34 : joint === 'chest' || joint === 'hips' ? .25 : .14;
    const forward = (point[0]*c + point[2]*s)*blend, side = (-point[0]*s + point[2]*c)*blend;
    minF = Math.min(minF, forward-pad); maxF = Math.max(maxF, forward+pad);
    minS = Math.min(minS, side-pad); maxS = Math.max(maxS, side+pad);
  }
  const heading = angle + facing, forward = (minF+maxF)/2, side = (minS+maxS)/2;
  return {...base, x: x+forward*Math.cos(heading)-side*Math.sin(heading),
    y: y+forward*Math.sin(heading)+side*Math.cos(heading), angle: heading,
    halfLength: (maxF-minF)/2, halfWidth: (maxS-minS)/2, fallen: true, vx: 0, vy: 0, speed: 0};
}

// Clearance from the other body's surface. An officer actually making contact can enter
// the normal personal space, while passing uniformed pedestrians follow the ordinary rule.
function margin(state, body) {
  if (body.fallen) return WALKER_RADIUS + .11;
  if (body.halfLength) return WALKER_RADIUS + skin;
  if (state.closeContact && body.player) return 1.47 - body.r;
  return walkerSpace + skin + body.social - body.r;
}

function asBody(body) {
  const box = body.halfLength > 0 && body.halfWidth > 0;
  const r = body.r || WALKER_RADIUS, player = body.player ?? (!box && !body.person);
  return {...body, r, player, vx: body.vx || 0, vy: body.vy || 0,
    social: body.social ?? (player ? playerSpace : walkerSpace), c: box ? Math.cos(body.angle || 0) : 1,
    s: box ? Math.sin(body.angle || 0) : 0, reach: box ? Math.hypot(body.halfWidth, body.halfLength) : body.r || WALKER_RADIUS};
}

const emptyWorld = (x, y, dx, dy) => ({x: x + dx, y: y + dy});

// The time-sampled sidewalk/dispatch pose is the goal. The actual occupied pose survives
// goal refreshes, so a pedestrian never gets placed back on top of a player every 90 ms.
export function createCrowdMotion({blocked = () => false, move = emptyWorld} = {}) {
  const states = new Map();

  function clear(state, x, y, neighbors) {
    return neighbors.every(body => distanceTo(body, x, y) >= margin(state, body));
  }

  function place(state, neighbors) {
    const insideWall = blocked(state.x, state.y, WALKER_RADIUS);
    if (!insideWall && clear(state, state.x, state.y, neighbors)) return true;
    const free = (x, y) => {
      if (!clear(state, x, y, neighbors) || blocked(x, y, WALKER_RADIUS)) return false;
      if (insideWall) return true;
      const reached = move(state.x, state.y, x - state.x, y - state.y, WALKER_RADIUS);
      return Math.hypot(x - reached.x, y - reached.y) < .012;
    };
    // Estimate the outward normal, including the nearest side of a rotated van or bus.
    // Exact co-locations use an ID-stable direction instead of a zero normal.
    let x = state.x, y = state.y;
    for (let pass = 0; pass < 4; pass++) {
      for (const body of neighbors) {
        const gap = distanceTo(body, x, y);
        const limit = margin(state, body);
        if (gap >= limit) continue;
        const nx = distanceTo(body, x + .006, y) - distanceTo(body, x - .006, y);
        const ny = distanceTo(body, x, y + .006) - distanceTo(body, x, y - .006);
        const length = Math.hypot(nx, ny), nudge = limit + .004 - gap;
        x += (length > .0001 ? nx / length : Math.cos(state.seed)) * nudge;
        y += (length > .0001 ? ny / length : Math.sin(state.seed)) * nudge;
      }
      if (free(x, y)) { state.x = x; state.y = y; return true; }
    }
    // This also covers a route starting inside street furniture, or a pinned pair by a wall.
    for (let ring = 1; ring <= 17; ring++) {
      const count = Math.min(36, 6 + ring * 3), radius = ring * .42;
      for (let i = 0; i < count; i++) {
        const angle = state.seed + tau * i / count;
        x = state.x + radius * Math.cos(angle); y = state.y + radius * Math.sin(angle);
        if (free(x, y)) { state.x = x; state.y = y; return true; }
      }
    }
    return false;
  }

  function risk(body, state, vx, vy) {
    // Subtract the obstacle's velocity, then measure clearance at closest approach.
    const dx = state.x - body.x, dy = state.y - body.y;
    const rx = vx - (body.vx || 0), ry = vy - (body.vy || 0);
    if (body.halfLength) {
      let smallest = Infinity;
      for (const t of [.23, .55, .9]) smallest = Math.min(smallest, distanceTo(body, state.x + rx * t, state.y + ry * t));
      return Math.max(0, WALKER_RADIUS + .43 - smallest);
    }
    const approaching = -(dx * rx + dy * ry);
    if (approaching <= 0) return 0;
    if (state.nominal && body.nominal && state.forwardX*body.forwardX + state.forwardY*body.forwardY > .82) {
      const along = dx*state.forwardX + dy*state.forwardY, ahead = along < 0;
      if (!ahead || Math.abs(dx*state.forwardY - dy*state.forwardX) < .85)
        return Math.max(0, margin(state, body) - (Math.hypot(dx + rx*.25, dy + ry*.25) - body.r));
    }
    const t = Math.min(body.player ? 1.25 : 1.12, approaching / (rx * rx + ry * ry));
    const clearance = Math.hypot(dx + rx * t, dy + ry * t) - body.r;
    return Math.max(0, margin(state, body) + .20 - clearance);
  }

  function advance(state, goal, neighbors, dt) {
    const nominal = goal.moving === false ? 0 : Math.max(0, goal.speed || 0), angle = goal.angle || 0;
    let dx = goal.x - state.x, dy = goal.y - state.y;
    // A person waiting outside a doorway also steps aside when a runner is approaching.
    // The clocked goal remains unchanged so they return once the passing line is clear.
    let yielding = false;
    if (!nominal) for (const other of neighbors) {
      if (!other.player || other.fallen || other.halfLength) continue;
      const v = Math.hypot(other.vx || 0, other.vy || 0);
      if (v < .9) continue;
      const ux = other.vx/v, uy = other.vy/v, ox = state.x - other.x, oy = state.y - other.y;
      const along = ox*ux + oy*uy, across = -ox*uy + oy*ux;
      const pass = margin(state, other) + other.r + .13;
      if (along < -.15 || along > 1.25*v || Math.abs(across) >= pass) continue;
      let side = across < -.04 ? -1 : 1;
      if (blocked(state.x-uy*side*(pass-Math.abs(across)), state.y+ux*side*(pass-Math.abs(across)), WALKER_RADIUS)) side *= -1;
      const shift = side*pass-across;
      dx = -uy * shift; dy = ux * shift; yielding = true; break;
    }
    const distance = Math.hypot(dx, dy);
    if (!nominal && !yielding) {
      if (distance < .035) return;
      const occupiedGoal = distance < 7 && neighbors.some(body => distanceTo(body, goal.x, goal.y) < margin(state, body));
      const standingInLine = occupiedGoal && neighbors.some(body => distanceTo(body, state.x, state.y) < margin(state, body) + .35);
      if (standingInLine) return;
    }
    const c = Math.cos(angle), s = Math.sin(angle);
    const lead = nominal * .7, gx = dx + c * lead, gy = dy + s * lead;
    const magnitude = Math.hypot(gx, gy);
    if (magnitude < .005) return;
    let speed = nominal ? clamp(magnitude / .7, 0, nominal + .75) : Math.min(yielding ? 2.15 : 1.65, distance / dt);
    let singleFile = false, retreat = false;
    if (nominal) for (const other of neighbors) {
      if ((!other.person && !other.player) || other.halfLength) continue;
      const rx = other.x - state.x, ry = other.y - state.y;
      const lead = rx*c + ry*s, lateral = Math.abs(rx*s - ry*c);
      if (lead < .10 || lead > 4 || lateral > 1.1) continue;
      const alignment = c*(other.forwardX || 0) + s*(other.forwardY || 0);
      const spacing = margin(state, other) + other.r + .12;
      const follower = other.nominal && alignment > .82 && lateral < .82;
      const aheadSpeed = Math.max(0, (other.vx || 0)*c + (other.vy || 0)*s);
      if (follower) speed = Math.min(speed, Math.max(0, aheadSpeed + (lead - spacing)*1.65));
      // With both passing sides walled off, queue instead of weaving into the shoulders
      // of the person in front. Oncoming walkers agree by ID which one backs out.
      if (lead > spacing + 1.35 || !blocked(other.x-s*spacing,other.y+c*spacing,WALKER_RADIUS) ||
          !blocked(other.x+s*spacing,other.y-c*spacing,WALKER_RADIUS)) continue;
      singleFile = true;
      if (other.nominal && alignment < -.65 && state.id > other.id) {
        retreat = true; continue;
      }
      speed = Math.min(speed, Math.max(0, aheadSpeed + (lead-spacing)*1.50));
    }
    if (retreat) speed = Math.min(nominal, 1.35);
    if (speed < .035) return;
    const desired = retreat ? angle + Math.PI : Math.atan2(gy, gx);
    // Most sidewalk space is empty. Only score alternatives once a collision is predicted.
    const fx = Math.cos(desired) * speed, fy = Math.sin(desired) * speed;
    const demand = neighbors.some(body => risk(body, state, fx, fy) > .015);
    function tryVelocity(offset, vx, vy) {
      const px = state.x + vx * dt, py = state.y + vy * dt;
      if (!clear(state, px, py, neighbors)) return false;
      const next = move(state.x, state.y, px - state.x, py - state.y, WALKER_RADIUS);
      if (!clear(state, next.x, next.y, neighbors) || Math.hypot(next.x - state.x, next.y - state.y) <= speed * dt * .12) return false;
      state.x = next.x; state.y = next.y;
      state.side = demand && Math.abs(offset) > .35 ? Math.sign(offset) : 0;
      return true;
    }
    if (singleFile) { tryVelocity(0, fx, fy); return; }
    if (!demand && tryVelocity(0, fx, fy)) return;
    const choices = [];
    for (const scale of [1, .5]) for (const offset of offsets) {
      if (!demand && !offset && scale === 1) continue;
      const vx = Math.cos(desired + offset) * speed * scale, vy = Math.sin(desired + offset) * speed * scale;
      let cost = Math.abs(offset) * .24 + (offset < 0 ? .035 : 0) + (1-scale)*.80;
      if (state.side && offset * state.side < 0) cost += .20;
      for (const body of neighbors) {
        const gap = risk(body, state, vx, vy);
        cost += gap * 7 + gap * gap * 3;
      }
      // Look beyond this step: a kerbside wall may block the usual passing side.
      if (blocked(state.x + vx * .7, state.y + vy * .7, WALKER_RADIUS)) cost += 9;
      choices.push({offset, vx, vy, cost});
    }
    choices.sort((a, b) => a.cost - b.cost);
    for (const choice of choices) if (tryVelocity(choice.offset, choice.vx, choice.vy)) return;
  }

  function step(actors, bodies, elapsed) {
    if (!Number.isFinite(elapsed) || elapsed <= 0) return actors;
    const dt = clamp(elapsed, .001, .1), solid = bodies.map(asBody);
    const active = new Set(actors.map(actor => actor.id));
    for (const id of states.keys()) if (!active.has(id)) states.delete(id);
    const entries = actors.map(goal => {
      let state = states.get(goal.id);
      if (!state || Math.hypot(goal.x - state.goalX, goal.y - state.goalY) > 18) {
        state = {id: goal.id, x: goal.x, y: goal.y, r: WALKER_RADIUS, reach: WALKER_RADIUS, social: walkerSpace, person: true,
          angle: goal.angle || 0, walk: goal.walk || 0, vx: 0, vy: 0, side: 0, seed: seedAngle(goal.id), fresh: true};
        states.set(goal.id, state);
      }
      state.goalX = goal.x; state.goalY = goal.y;
      state.closeContact = !!goal.closeContact;
      state.nominal = goal.moving === false ? 0 : (goal.speed || 0);
      state.forwardX = Math.cos(goal.angle || 0); state.forwardY = Math.sin(goal.angle || 0);
      if (goal.stunned || goal.down) {
        Object.assign(state, {x: goal.x, y: goal.y, angle: goal.angle || 0, vx: 0, vy: 0, fresh: false});
        solid.push(asBody(pedestrianBody(goal)));
      }
      return {state, goal};
    }).filter(e => !e.goal.stunned && !e.goal.down);
    // Established walkers claim their occupied positions before newcomers are materialized.
    const byId = (a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    solid.sort(byId);
    entries.sort((a, b) => Number(a.state.fresh) - Number(b.state.fresh) ||
      byId(a.goal, b.goal));
    const walkers = entries.map(e => e.state);
    const hidden = new Set();
    for (const {state, goal} of entries) {
      const nearby = body => body !== state && Math.abs(body.x - state.x) < body.reach + 6 &&
        Math.abs(body.y - state.y) < body.reach + 6;
      const neighbors = [...solid.filter(nearby), ...walkers.filter(other => !other.fresh && nearby(other))];
      if ((state.fresh || !clear(state, state.x, state.y, neighbors)) && !place(state, neighbors)) {
        state.fresh = true; hidden.add(state.id); continue;
      }
      state.fresh = false;
      const ox = state.x, oy = state.y;
      advance(state, goal, neighbors, dt);
      const vx = (state.x - ox) / dt, vy = (state.y - oy) / dt, speed = Math.hypot(vx, vy);
      const factor = 1 - Math.exp(-dt * 12);
      state.vx += (vx - state.vx) * factor; state.vy += (vy - state.vy) * factor;
      if (speed > .12 || goal.moving === false) {
        const facing = speed > .12 ? Math.atan2(vy, vx) : (goal.angle ?? state.angle);
        const delta = facing - state.angle;
        state.angle += Math.atan2(Math.sin(delta), Math.cos(delta)) * factor;
      }
      state.walk += speed * dt * 4.6;
      Object.assign(goal, {x: state.x, y: state.y, angle: state.angle, speed, vx: state.vx, vy: state.vy,
        moving: speed > .12, move: speed > .12, walk: state.walk});
    }
    // When all surrounding space is occupied, retry next frame instead of spawning inside a body.
    if (hidden.size) for (let i = actors.length - 1; i >= 0; i--) if (hidden.has(actors[i].id)) actors.splice(i, 1);
    return actors;
  }
  return {step, reset: () => states.clear()};
}
