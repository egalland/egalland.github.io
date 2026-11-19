import {classes, floorAt, tile} from './engine.mjs';

function tileTrace(x, y, endX, endY) {
  const dx = endX - x, dy = endY - y;
  let i = Math.floor(x / tile), j = Math.floor(y / tile);
  const ei = Math.floor(endX / tile), ej = Math.floor(endY / tile);
  const sx = Math.sign(dx), sy = Math.sign(dy);
  const stepX = dx ? tile / Math.abs(dx) : Infinity;
  const stepY = dy ? tile / Math.abs(dy) : Infinity;
  let tx = dx ? (((sx > 0 ? i + 1 : i) * tile) - x) / dx : Infinity;
  let ty = dy ? (((sy > 0 ? j + 1 : j) * tile) - y) / dy : Infinity;
  if (!floorAt(i, j)) return false;
  while (i !== ei || j !== ej) {
    if (i !== ei && j !== ej && Math.abs(tx - ty) < 1e-9) {
      if (!floorAt(i + sx, j) || !floorAt(i, j + sy)) return false;
      i += sx; j += sy; tx += stepX; ty += stepY;
    } else if (j === ej || (i !== ei && tx < ty)) {
      i += sx; tx += stepX;
    } else {
      j += sy; ty += stepY;
    }
    if (!floorAt(i, j)) return false;
  }
  return true;
}
export function clearPath(from, to) {
  // All four corners must fit, just as they must for a projectile in advance().
  for (const x of [-1, 1]) for (const y of [-1, 1]) {
    if (!tileTrace(from.x + x, from.y + y, to.x + x, to.y + y)) return false;
  }
  return true;
}

function intercept(from, guard, velocity, weapon, motion) {
  if (!velocity) return guard;
  const {projectileSpeed: speed, windup, projectileLife} = weapon;
  const {vx, vy} = velocity;
  const advanced = {x: guard.x + windup * vx, y: guard.y + windup * vy};
  const futureOrigin = {x:from.x + motion.x * windup, y:from.y + motion.y * windup};
  const origin = clearPath(from, futureOrigin) ? futureOrigin : from;
  const x = advanced.x - origin.x, y = advanced.y - origin.y;
  if (!speed) return clearPath(guard, advanced) && clearPath(origin, advanced)
    ? {x:from.x+x,y:from.y+y} : guard;
  const a = vx * vx + vy * vy - speed * speed, b = 2 * (x * vx + y * vy);
  const disc = b * b - 4 * a * (x * x + y * y);
  if (a >= 0 || disc < 0) return guard;
  const ticks = (-b - Math.sqrt(disc)) / (2 * a);
  if (ticks <= 0 || ticks > projectileLife) return guard;
  const lead = {x: advanced.x + vx * ticks, y: advanced.y + vy * ticks};
  // The angle is locked now, but the projectile originates at release.
  return clearPath(guard, lead) && clearPath(origin, lead)
    ? {x:from.x + lead.x - origin.x, y:from.y + lead.y - origin.y} : guard;
}

export function makeTargeting() {
  const history = new WeakMap();
  let locked = null;
  return function acquire(state, visible = () => true, motion = {x:0, y:0}) {
    const weapon = classes[state.hero];
    const options = [];
    for (const guard of state.guards) {
      const prev = history.get(guard);
      let velocity = prev?.velocity;
      if (!prev || prev.tick !== state.tick) {
        velocity = prev && prev.tick + 1 === state.tick
          ? {vx: guard.x - prev.x, vy: guard.y - prev.y} : null;
        history.set(guard, {x: guard.x, y: guard.y, tick: state.tick, velocity});
      }
      const dist = Math.hypot(guard.x - state.x, guard.y - state.y);
      const outOfRange = weapon.projectileSpeed ? dist > weapon.range : dist >= weapon.range;
      if (guard.hp <= 0 || outOfRange || !visible(guard) || !clearPath(state, guard)) continue;
      options.push({guard, dist, point: intercept(state, guard, velocity, weapon, motion)});
    }
    let winner = null;
    for (const option of options) {
      if (!winner || option.dist < winner.dist) winner = option;
    }
    const previous = options.find(option => option.guard === locked);
    // Keep the lock across nearly tied distances, especially crossing melee enemies.
    if (winner && previous && previous.dist <= winner.dist * 1.18 + 8) winner = previous;
    locked = winner?.guard ?? null;
    return winner;
  };
}
