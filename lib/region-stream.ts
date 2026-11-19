import { REGION_SIZE, SIDE, pointOnFace, type Focus, type Point } from './planet';
import type { PlanetRegion, PlanetTile } from './planet-render';
import { planeKey, regionOrigin, windowKey } from './planet-camera';

export type MachineView = {point: Point; name: string; kind: string; health: number; maxHealth?: number; faction?: string; mine?: boolean};
export type StreamRegion = PlanetRegion & {revision?: number; machines?: MachineView[]};
export type RegionLoader = (focus: Focus, signal: AbortSignal) => Promise<StreamRegion | null>;

type Stored = {region: StreamRegion; time: number};
const CACHE_LIMIT = 36;
const MAX_IN_FLIGHT = 2;
const REQUEST_INTERVAL = 125;
const REFRESH_AFTER = 18_000;

// Windows are read independently of player commands. Moving the camera changes
// the priority list, never the amount of work queued in the background.
export class RegionStream {
  private readonly cached = new Map<string, Stored>();
  private readonly pending = new Map<string, AbortController>();
  private readonly retryAt = new Map<string, number>();
  private scope = '';
  private wanted: Focus[] = [];
  private timer?: ReturnType<typeof setTimeout>;
  private nextStart = 0;

  constructor(private readonly load: RegionLoader, private readonly repaint: () => void) {}

  configure(focus: Focus | null, wanted: Focus[]) {
    const scope = planeKey(focus);
    if (scope !== this.scope) {
      this.reset();
      this.scope = scope;
    }
    this.wanted = wanted;
    this.schedule();
  }

  reset() {
    clearTimeout(this.timer);
    this.timer = undefined;
    for (const controller of this.pending.values()) controller.abort();
    this.pending.clear();
    this.cached.clear();
    this.retryAt.clear();
    this.wanted = [];
    this.scope = '';
    this.nextStart = 0;
  }

  store(region: StreamRegion, time = Date.now()) {
    if (planeKey(region) !== this.scope) return;
    const key = windowKey(region), existing = this.cached.get(key);
    if (existing) {
      if (existing.region === region || (existing.region.revision ?? 0) > (region.revision ?? 0)) return;
      if (existing.region.revision === region.revision && existing.time > time) return;
    }
    this.retryAt.delete(key);
    this.cached.delete(key);
    this.cached.set(key, {region, time});
    while (this.cached.size > CACHE_LIMIT) {
      const first = this.cached.keys().next().value;
      if (first !== undefined) this.cached.delete(first);
    }
    this.repaint();
  }

  refreshTile(place: Focus, revision: number) {
    if (planeKey(place) !== this.scope) return;
    const target = this.wanted.find(w => {
      const originU = regionOrigin(w.u);
      const originV = regionOrigin(w.v);
      return place.u >= originU && place.u < originU+REGION_SIZE && place.v >= originV && place.v < originV+REGION_SIZE;
    });
    if (!target) return;
    const key = windowKey(target), cached = this.cached.get(key);
    if (cached && (cached.region.revision ?? 0) >= revision) return;
    if (cached) cached.time = 0;
    this.retryAt.delete(key);
    this.pending.get(key)?.abort();
    this.pending.delete(key);
    this.wanted = [target, ...this.wanted.filter(w => windowKey(w) !== key)];
    this.schedule();
  }

  private retryLater(key: string) {
    this.retryAt.delete(key);
    this.retryAt.set(key, Date.now() + 4000);
    if (this.retryAt.size > CACHE_LIMIT) {
      const oldest = this.retryAt.keys().next().value;
      if (oldest !== undefined) this.retryAt.delete(oldest);
    }
  }

  private schedule() {
    if (this.timer || !this.wanted.length || this.pending.size >= MAX_IN_FLIGHT) return;
    const now = Date.now();
    const next = this.wanted.find(focus => {
      const key = windowKey(focus), record = this.cached.get(key);
      return !this.pending.has(key) && (!record || now - record.time > REFRESH_AFTER) && (this.retryAt.get(key) ?? 0) <= now;
    });
    if (!next) return;
    this.timer = setTimeout(() => {
      this.timer = undefined;
      // Re-read priorities after the delay in case the player reversed direction.
      const time = Date.now();
      const focus = this.wanted.find(f => {
        const key = windowKey(f), record = this.cached.get(key);
        return !this.pending.has(key) && (!record || time - record.time > REFRESH_AFTER) && (this.retryAt.get(key) ?? 0) <= time;
      });
      if (!focus || this.pending.size >= MAX_IN_FLIGHT) return;
      const key = windowKey(focus), controller = new AbortController();
      this.pending.set(key, controller);
      this.nextStart = time + REQUEST_INTERVAL;
      void this.load(focus, controller.signal).then(region => {
        if (controller.signal.aborted) return;
        if (region) this.store(region, time);
        else this.retryLater(key);
      }).catch(() => {
        if (!controller.signal.aborted) this.retryLater(key);
      }).finally(() => {
        if (this.pending.get(key) === controller) this.pending.delete(key);
        this.schedule();
      });
      this.schedule();
    }, Math.max(0, this.nextStart - now));
  }

  combine(focus: Focus, windows: Focus[], primary: StreamRegion | null): StreamRegion {
    const keys = new Set(windows.map(windowKey));
    const within = (r: StreamRegion) => windows.some(w => Math.abs(w.u - r.u) < REGION_SIZE && Math.abs(w.v - r.v) < REGION_SIZE);
    const plane = planeKey(focus);
    const entries = [...this.cached.entries()]
      .filter(([key, entry]) => planeKey(entry.region) === plane && (keys.has(key) || within(entry.region)))
      .map(([, entry]) => entry);
    if (primary && planeKey(primary) === planeKey(focus) && within(primary)) entries.push({region: primary, time: Infinity});
    entries.sort((a, b) => (a.region.revision ?? 0) - (b.region.revision ?? 0) || a.time - b.time);
    const tiles = new Map<number, PlanetTile>();
    const machines = new Map<string, MachineView>();
    for (const {region} of entries) {
      for (const tile of region.tiles) tiles.set(tile.v * SIDE + tile.u, tile);
      // A moving or destroyed machine must also disappear from a newer window.
      for (const [key, machine] of machines) {
        const at = pointOnFace(region.face, machine.point);
        if (at.u >= region.originU && at.u < region.originU + region.size &&
            at.v >= region.originV && at.v < region.originV + region.size) machines.delete(key);
      }
      for (const machine of region.machines ?? []) {
        const {x, y, z} = machine.point;
        machines.set([machine.kind, machine.name, machine.faction, x, y, z].join(':'), machine);
      }
    }
    return {...focus, depth: focus.depth ?? 0, size: REGION_SIZE, originU: 0, originV: 0, tiles: [...tiles.values()], machines: [...machines.values()]};
  }
}
