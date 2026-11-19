// Local pursuit uses a monotonic game clock in seconds. Snapshots contain ages,
// so loading the next sector does not depend on the new page's clock origin.
export const wantedThresholds = Object.freeze([18, 55, 110, 185, 280]);

export const wantedTuning = Object.freeze({
  repeatWindow: 6,
  repeatStep: .2,
  maxRepeatBonus: .6,
  calmDelay: 22,
  decayRate: 2.75,
  maxPoints: 320
});

function rule(label, points) {
  return Object.freeze({label, points});
}

export const wantedRules = Object.freeze({
  peaceful: rule('Conduite normale ou action sans infraction', 0),
  gunshot: rule('Coup de feu sans cible touchée', 5),
  destroy: rule('Objet détruit', 10),
  stealVehicle: rule('Vol d’un véhicule en circulation', 24),
  stealService: rule('Vol d’un véhicule de service', 38),
  hitCivilian: rule('Passant ou secouriste touché', 22),
  hitPlayer: rule('Autre joueur touché', 28),
  hitOfficer: rule('Policier ou membre du SWAT touché', 48)
});

const maxRepeats = Math.round(wantedTuning.maxRepeatBonus / wantedTuning.repeatStep);
const isInfraction = action => Object.hasOwn(wantedRules, action) && wantedRules[action].points > 0;
const finite = (value, fallback) => Number.isFinite(value) ? value : fallback;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

function legacyPoints(snapshot) {
  const oldLevel = clamp(Math.ceil(finite(snapshot.wanted, finite(snapshot.heat, 0))), 0, wantedThresholds.length);
  return oldLevel ? wantedThresholds[oldLevel - 1] : 0;
}

export function createWanted(initialSnapshot = null, startTime = 0) {
  let clock = finite(startTime, 0);
  let points = 0;
  let lastCrimeTime = null;
  let lastAction = null;
  let lastGain = 0;
  const repeats = new Map();

  function state() {
    const level = wantedThresholds.reduce((stars, threshold) => stars + Number(points >= threshold), 0);
    const floor = level ? wantedThresholds[level - 1] : 0;
    const nextThreshold = wantedThresholds[level] ?? null;
    return {
      level, points, nextThreshold, lastAction, lastGain,
      progress: nextThreshold === null ? 1 : (points - floor) / (nextThreshold - floor)
    };
  }

  function clear(time = clock) {
    clock = finite(time, clock);
    points = 0;
    lastCrimeTime = null;
    lastAction = null;
    lastGain = 0;
    repeats.clear();
    return state();
  }

  function advance(time) {
    const now = Math.max(clock, finite(time, clock));
    if (points > 0 && lastCrimeTime !== null) {
      const start = Math.max(clock, lastCrimeTime + wantedTuning.calmDelay);
      if (now > start) points = Math.max(0, points - (now - start) * wantedTuning.decayRate);
      if (points === 0) {
        clear(now);
        return;
      }
    }
    clock = now;
  }

  function tick(time) {
    advance(time);
    return state();
  }

  function recent(action) {
    return (repeats.get(action) || []).filter(at => clock - at < wantedTuning.repeatWindow);
  }

  function add(action, time) {
    advance(time);
    if (!isInfraction(action)) return state();
    const previous = recent(action);
    const bonus = Math.min(wantedTuning.maxRepeatBonus, previous.length * wantedTuning.repeatStep);
    const gain = Math.round(wantedRules[action].points * (1 + bonus) * 10) / 10;
    const total = Math.min(wantedTuning.maxPoints, points + gain);
    lastGain = total - points;
    lastAction = action;
    lastCrimeTime = clock;
    points = total;
    previous.push(clock);
    repeats.set(action, previous.slice(-maxRepeats));
    return state();
  }

  function snapshot(time) {
    advance(time);
    const ages = {};
    for (const action of repeats.keys()) {
      const times = recent(action);
      if (times.length) ages[action] = times.map(at => clock - at);
    }
    return {version: 1, points, lastAction, lastGain, sinceCrime: lastCrimeTime === null ? null : clock - lastCrimeTime, ages};
  }

  function restore(value, time = clock) {
    clear(time);
    if (!value || typeof value !== 'object') return state();
    points = clamp(finite(value.points, legacyPoints(value)), 0, wantedTuning.maxPoints);
    if (points === 0) return state();
    // An older travel snapshot has its already-decayed heat and elapsed calm time.
    // Retain its displayed star count. Do not apply its elapsed decay a second time.
    lastCrimeTime = clock - clamp(finite(value.sinceCrime, 0), 0, 86400);
    if (isInfraction(value.lastAction)) {
      lastAction = value.lastAction;
      lastGain = clamp(finite(value.lastGain, 0), 0, wantedRules[lastAction].points * (1 + wantedTuning.maxRepeatBonus));
    }
    for (const action of Object.keys(wantedRules)) {
      const raw = value.ages?.[action];
      if (!isInfraction(action) || !Array.isArray(raw)) continue;
      const times = raw.slice(-maxRepeats)
        .filter(age => Number.isFinite(age) && age >= 0 && age < wantedTuning.repeatWindow)
        .map(age => clock - age)
        .sort((a, b) => a - b);
      if (times.length) repeats.set(action, times);
    }
    return state();
  }

  restore(initialSnapshot, startTime);
  return {add, tick, state, snapshot, restore, clear};
}
