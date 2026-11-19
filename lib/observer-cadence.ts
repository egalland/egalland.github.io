import type {SimulationSpeed} from './observatory';

/** At high speed, keep batches small. During catch-up, yield between pulses. */
export function observerPollInterval(speed:SimulationSpeed, behindMs:number) {
  if (behindMs >= 5000) return 1000;
  return speed === 12 ? 2000 : speed === 4 ? 4000 : 6000;
}
