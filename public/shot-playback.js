// Shots delivered in one poll keep their relative ages. Only some transport delay is
// absorbed, so the newest action stays visible and older burst tracers expire in order.
export function createShotPlayback() {
  const pending = [];
  const latestPlayed = new Map();
  const maxAge = 650;

  function push(event, now) {
    const firedAt = event.data?.firedAt ?? event.at;
    if (!Number.isFinite(firedAt) || firedAt < now - maxAge || firedAt > now + 350) return;
    if (pending.length >= 160) pending.shift();
    pending.push({event, firedAt, receivedAt: now});
  }

  function flush(now, play) {
    if (!pending.length) return;
    const newest = new Map();
    pending.sort((a, b) => a.firedAt - b.firedAt);
    for (const shot of pending) newest.set(shot.event.player, shot);
    for (const {event, firedAt} of pending) {
      const sender = event.player;
      if (now - firedAt > maxAge || firedAt <= (latestPlayed.get(sender) ?? -Infinity)) continue;
      const last = newest.get(sender);
      const allowance = Math.min(220, Math.max(0, last.receivedAt - last.firedAt) * .68);
      const age = Math.max(0, now - firedAt - allowance);
      latestPlayed.set(sender, firedAt);
      play(event, age / 1000);
    }
    pending.length = 0;
    for (const [sender, stamp] of latestPlayed) if (now - stamp > maxAge) latestPlayed.delete(sender);
  }

  return {push, flush};
}
