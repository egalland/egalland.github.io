// All times are milliseconds on the shared server clock. The short render delay
// absorbs delivery jitter; prediction is limited when the next pose is missing.
const VIEW_DELAY = 65;
const MAX_FORECAST = 180;
const CORRECTION_TIME = 90;

export const peerViewTime = now => Math.round(now - VIEW_DELAY);

function positionAt(samples, at) {
  const last = samples.at(-1);
  for (let i = samples.length - 1; i > 0; i--) {
    const a = samples[i - 1], b = samples[i];
    if (at >= b.at) break;
    if (at >= a.at) {
      const t = (at - a.at) / (b.at - a.at);
      return {x:a.x + (b.x - a.x) * t, y:a.y + (b.y - a.y) * t, at};
    }
  }
  if (at < samples[0].at) {
    const first = samples[0];
    return {x:first.x, y:first.y, at:first.at};
  }
  const ahead = Math.min(MAX_FORECAST, at - last.at);
  return {x:last.x + last.vx * ahead / 1000, y:last.y + last.vy * ahead / 1000, at:last.at + ahead};
}

export function readPeerMotion(track, at) {
  const pose = positionAt(track.samples, at), correction = track.correction;
  if (correction) {
    const t = Math.min(1, Math.max(0, (at - correction.at) / CORRECTION_TIME));
    const remaining = (1 - t) ** 2 * (1 + 2 * t);
    pose.x += correction.dx * remaining;
    pose.y += correction.dy * remaining;
  }
  return pose;
}

// The track belongs to the rendered peer. Capture values because a local
// transport may reuse its snapshot object. Duplicate presence never restarts a forecast.
export function recordPeerMotion(track, data, now) {
  const samples = track.samples ??= [];
  const previous = samples.at(-1);
  const at = Number.isFinite(data.updatedAt) ? data.updatedAt : now;
  const vehicle = data.vehicle?.id || '';
  const stopped = data.moving === false || data.health === 0 || data.downUntil > at || data.ragdoll?.until > at;
  const speed = vehicle && !stopped ? data.vehicle.speed || data.speed || 0 : 0;
  const angle = data.angle || 0;
  const vx = stopped ? 0 : Number.isFinite(data.vx) ? data.vx : speed * Math.cos(angle);
  const vy = stopped ? 0 : Number.isFinite(data.vy) ? data.vy : speed * Math.sin(angle);
  const maxSpeed = vehicle ? 42 : 8;
  const scale = maxSpeed / Math.max(maxSpeed, Math.hypot(vx, vy));
  const sample = {at, x:data.x, y:data.y, vx:vx * scale, vy:vy * scale, vehicle, joined:data.joinedAt};
  if (previous) {
    if (Number.isFinite(previous.joined) && Number.isFinite(sample.joined) && sample.joined < previous.joined) return false;
    if (sample.at < previous.at && previous.joined === sample.joined) return false;
    const samePose = previous.x === sample.x && previous.y === sample.y && previous.vx === sample.vx && previous.vy === sample.vy;
    if (previous.joined === sample.joined && previous.vehicle === vehicle && samePose &&
        (sample.at === previous.at || (!Number.isFinite(data.updatedAt) && track.data === data))) {
      track.data = data;
      return false;
    }
  }
  const gap = previous ? sample.at - previous.at : 0;
  const jumped = !previous || sample.joined !== previous.joined || vehicle !== previous.vehicle ||
    gap > 1400 || Math.hypot(sample.x - previous.x, sample.y - previous.y) > 3 + maxSpeed * Math.min(.65, gap / 1000);
  const viewAt = peerViewTime(now);
  const oldPose = jumped ? null : readPeerMotion(track, viewAt);
  track.data = data;
  if (jumped) {
    samples.length = 0;
    track.snapPose = true;
  } else if (gap === 0) samples.pop();
  samples.push(sample);
  if (samples.length > 8) samples.shift();
  track.correction = null;
  if (oldPose) {
    const current = positionAt(samples, viewAt);
    const dx = oldPose.x - current.x, dy = oldPose.y - current.y;
    if (Math.abs(dx) + Math.abs(dy) > .005) track.correction = {at:viewAt, dx, dy};
  }
  return true;
}
