// A wound has one clock, even when several hits land between two frames.
const durations = [0, 3000, 4500, 6000];
const threadWeapons = new Set(['pistol', 'smg', 'shotgun', 'ribbonbow']);
const softWeapons = new Set(['bubbles', 'confetti', 'chime', 'pompom', 'yarn']);

export function woundDuration(severity) {
  return Number.isInteger(severity) && severity >= 1 && severity <= 3 ? durations[severity] : 0;
}

export function hitSeverity(cause, amount, weapon) {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (cause === 'weapon') {
    if (softWeapons.has(weapon)) return 0;
    const threshold = threadWeapons.has(weapon) ? 8 : weapon ? 18 : 15;
    if (amount < threshold) return 0;
    return amount >= 38 ? 3 : amount >= 24 ? 2 : 1;
  }
  if (cause === 'melee' || cause === 'police') return amount >= 15 ? 1 : 0;
  if (cause === 'traffic' || cause === 'crash') {
    return amount >= 42 ? 3 : amount >= 28 ? 2 : amount >= 16 ? 1 : 0;
  }
  return 0;
}

function validWound(wound) {
  return wound && Number.isSafeInteger(wound.severity) && wound.severity >= 1 && wound.severity <= 3 &&
    Number.isFinite(wound.at) && wound.at >= 0 && Number.isFinite(wound.until) &&
    wound.until === wound.at + woundDuration(wound.severity);
}

export function activeBleeding(wound, now) {
  if (!validWound(wound) || !Number.isFinite(now) || wound.at > now + 500 || wound.until <= now) return null;
  return {at: wound.at, until: wound.until, severity: wound.severity};
}

export function bleedingAfterHit(previous, severity, at) {
  if (!Number.isFinite(at) || at < 0) return null;
  const open = activeBleeding(previous, at);
  if (!Number.isInteger(severity) || severity < 1 || severity > 3) return open;
  const level = Math.max(severity, open?.severity || 0);
  return {at, until: at + woundDuration(level), severity: level};
}

export function bleedDamageBetween(wound, from, to) {
  if (!validWound(wound) || !Number.isFinite(from) || !Number.isFinite(to) || to <= from) return 0;
  const ticks = t => Math.max(0, Math.floor((Math.min(t, wound.until) - wound.at) / 1000));
  return Math.max(0, ticks(to) - ticks(from));
}
