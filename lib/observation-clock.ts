export type ObservationSpeed = 1 | 4 | 12;
type Clock = { wall: number; simulated: number; speed: ObservationSpeed };
type ClockWorld = { created: number; frontier?: { time: number }; observationClock?: Clock };

export function isObserverSpeed(value: unknown): value is ObservationSpeed {
  return value === 1 || value === 4 || value === 12;
}

/** All spectators share a persisted wall/simulation anchor. Polling frequency cannot accelerate it. */
export function observerClock(world: ClockWorld, wallNow: number, requested?: ObservationSpeed) {
  const anchor = world.observationClock ??= {
    wall: wallNow,
    simulated: world.frontier?.time ?? world.created,
    speed: 4,
  };
  const wall = Math.max(wallNow, anchor.wall);
  const target = Math.max(world.frontier?.time ?? world.created, anchor.simulated + (wall - anchor.wall) * anchor.speed);
  if (requested !== undefined && isObserverSpeed(requested) && requested !== anchor.speed) {
    world.observationClock = { wall, simulated: target, speed: requested };
  }
  return { target, speed: world.observationClock.speed };
}
