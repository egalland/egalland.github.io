import { RAW_GOODS, type RawGood, type TradeOffer } from './economy';
import { chunkAt, chunkKey, SIDE, type Point, type Ore } from './planet';
import { haulCapacityBonus, haulSpeedFactor } from './research';
import type { Miner, Inventory } from './world';

type Phase = 'idle' | 'outbound' | 'returning' | 'unloading';
type Site = { point: Point; stock: Inventory; opened: number };
type Detour = { relay: string; delayMs: number };
type CheckRoute = (point:Point, at:number) => Detour | undefined;
export type Convoy = { detour?:Detour; id: number; phase: Phase; point: Point | null; cargo: Inventory; started: number; due: number };
export type LogisticsState = { sites: Site[]; convoys: Convoy[]; level: number; delivered: number; priority: Point | null; paused: boolean; clock: number };
const SITE_LIMIT = 16, SITE_CAPACITY = 64, FLEET_LIMIT = 6, DEPOT_LIMIT = 8;
const empty = (): Inventory => ({ ferrite: 0, cuivre: 0, titane: 0, prisme: 0 });
const newConvoy = (id: number): Convoy => ({ id, phase: 'idle', point: null, cargo: empty(), started: 0, due: 0 });
const orePriority = ['prisme', 'titane', 'cuivre', 'ferrite'] as const;
const quantity = (stock: Inventory) => orePriority.reduce((n, ore) => n + stock[ore], 0);
const sector = (point: Point) => chunkKey(chunkAt(point));
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const siteFor = (s: LogisticsState, point: Point) => s.sites.find(site => sector(site.point) === sector(point));
export const logisticsState = (p: Miner) => p.logistics ??= {
  sites: [], convoys: [newConvoy(1)], level: 1, delivered: 0, priority: null, paused: false, clock: 0,
};
const capacity = (p: Miner) => 360 + 160 * (logisticsState(p).level - 1);
const payload = (p: Miner) => 8 + haulCapacityBonus(p);
const fleetCost = (s: LogisticsState) => Math.round(300 * 1.65 ** (s.convoys.length - 1));
const depotCost = (s: LogisticsState) => Math.round(210 * 1.55 ** (s.level - 1));
const raw = (good: string): good is RawGood => RAW_GOODS.includes(good as RawGood);
export const reservedSpace = (offers: TradeOffer[] | undefined, id: string) =>
  (offers ?? []).reduce((n, o) => n + (o.owner === id && raw(o.give) ? o.quantity : 0), 0);
const freeSpace = (p: Miner, reserved: number) => Math.max(0, capacity(p) - quantity(p.inventory) - reserved);

export function canStage(p: Miner, point: Point) {
  const s = logisticsState(p), site = siteFor(s, point);
  return site ? quantity(site.stock) < SITE_CAPACITY : s.sites.length < SITE_LIMIT;
}
export function stage(p: Miner, point: Point, ore: Ore, now: number): boolean {
  if (!canStage(p, point)) return false;
  const s = logisticsState(p);
  let site = siteFor(s, point);
  if (!site) {
    site = {point: {...point}, stock: empty(), opened: now};
    s.sites.push(site);
  }
  site.stock[ore]++;
  return true;
}

function transfer(from: Inventory, to: Inventory, limit: number) {
  let moved = 0;
  // Small or full holds take the most valuable materials first.
  for (const ore of orePriority) {
    const n = Math.min(from[ore], limit - moved);
    from[ore] -= n; to[ore] += n; moved += n;
    if (moved >= limit) break;
  }
  return moved;
}
function duration(p: Miner, base: Point, point: Point) {
  // Long-distance flights use the high-speed cruise motor; a local cycle still takes seconds.
  return Math.round((5000 + 900 * Math.sqrt(distance(base, point))) / haulSpeedFactor(p));
}
function dispatchable(s: LogisticsState, base: Point, payloadSize: number) {
  const priority = s.priority && sector(s.priority);
  const candidates = s.sites.filter(site => {
    const reserved = s.convoys.reduce((total, c) => total + (c.phase === 'outbound' && c.point &&
      sector(c.point) === sector(site.point) ? payloadSize : 0), 0);
    return quantity(site.stock) > reserved;
  });
  candidates.sort((a, b) => Number(sector(b.point) === priority) - Number(sector(a.point) === priority) ||
    a.opened - b.opened || distance(base, a.point) - distance(base, b.point));
  return candidates[0];
}
function processAt(p: Miner, base: Point, at: number, reserved: number, checkRoute?:CheckRoute) {
  const s = logisticsState(p), payloadSize = payload(p);
  let delivered = 0;
  for (const c of s.convoys) {
    if (c.phase === 'returning' && c.due <= at) { c.phase = 'unloading'; c.started = c.due; c.due = 0; }
    if (c.phase === 'unloading') {
      delivered += transfer(c.cargo, p.inventory, freeSpace(p, reserved));
      if (!quantity(c.cargo)) Object.assign(c, newConvoy(c.id));
    }
    if (c.phase === 'outbound' && c.point && c.due <= at) {
      const site = siteFor(s, c.point);
      if (site) transfer(site.stock, c.cargo, payloadSize);
      delete c.detour;
      c.phase = 'returning'; c.started = at; c.due = at + duration(p, base, c.point);
    }
  }
  s.delivered += delivered;
  s.sites = s.sites.filter(site => quantity(site.stock) > 0);
  if (!s.paused && freeSpace(p, reserved) > 0) {
    for (const c of s.convoys) {
      if (c.phase !== 'idle') continue;
      const site = dispatchable(s, base, payloadSize);
      if (!site) break;
      // Assess the route once, before launching. An incursion never stacks delays on a flying convoy.
      const detour = checkRoute?.(site.point, at);
      if (detour) c.detour = detour;
      c.phase = 'outbound'; c.point = {...site.point}; c.started = at;
      c.due = at + duration(p, base, site.point) + (detour?.delayMs ?? 0);
    }
  }
  return delivered;
}

/** Replay arrivals in time order. Stored timestamps are phase boundaries, never repeatable rewards. */
export function advanceHaul(p: Miner, base: Point, at: number, reserved: number, onDelivery?: () => void, checkRoute?:CheckRoute) {
  const s = logisticsState(p);
  if (at < s.clock) return;
  // A full depot must also be able to start automatic liquidation before the next delivery.
  if (onDelivery && !freeSpace(p, reserved)) onDelivery();
  let time = at;
  for (;;) {
    time = at;
    for (const c of s.convoys) {
      if ((c.phase === 'outbound' || c.phase === 'returning') && c.due < time) time = c.due;
    }
    if (processAt(p, base, time, reserved, checkRoute) && onDelivery) onDelivery();
    s.clock = time;
    if (time === at) break;
  }
}

/** Pending raw offers still occupy refundable space. An exchange checks both incoming balances before debiting either side. */
export function checkTradeSpace(players: Miner[], offers: TradeOffer[] | undefined, p: Miner, a: Record<string, unknown>) {
  if (a.type !== 'offerTake' || typeof a.id !== 'string') return;
  const offer = offers?.find(o => o.id === a.id);
  if (!offer || offer.owner === p.id || (offer.recipient && offer.recipient !== p.id)) return;
  const seller = players.find(q => q.id === offer.owner);
  if (!seller) return;
  const lot = raw(offer.give) ? offer.quantity : 0, payment = raw(offer.want) ? offer.price : 0;
  if (lot - payment > freeSpace(p, reservedSpace(offers, p.id))) throw Error('Pas assez de place dans votre dépôt pour recevoir cet échange.');
  if (payment - lot > freeSpace(seller, reservedSpace(offers, seller.id))) throw Error('Le dépôt du vendeur ne peut pas recevoir cet échange.');
}
export function haulAction(p: Miner, kind: unknown, block?: Point) {
  const s = logisticsState(p);
  if (kind === 'pause') {
    s.paused = !s.paused;
    return {message: s.paused ? 'Départs suspendus. Les trajets en cours se terminent.' : 'Collecte automatique reprise.'};
  }
  if (kind === 'dispatch') {
    if (!block) throw Error('Choisissez un point d’enlèvement.');
    s.priority = {...block}; s.paused = false;
    return {message: 'Priorité de collecte donnée à ce secteur.'};
  }
  const buyingFleet = kind === 'fleet';
  if (!buyingFleet && kind !== 'depot') throw Error('Ordre logistique inconnu.');
  if (buyingFleet ? s.convoys.length >= FLEET_LIMIT : s.level >= DEPOT_LIMIT) throw Error('Niveau maximal atteint.');
  const price = buyingFleet ? fleetCost(s) : depotCost(s);
  if (p.coins < price) throw Error('Crédits insuffisants.');
  p.coins -= price;
  if (buyingFleet) s.convoys.push(newConvoy(s.convoys.length + 1)); else s.level++;
  return {message: buyingFleet ? 'Transporteur construit au dépôt.' : 'Dépôt agrandi de 160 unités.'};
}
export function logisticsView(p: Miner, offers?: TradeOffer[]) {
  const s = logisticsState(p);
  return {
    capacity: capacity(p), used: quantity(p.inventory), reserved: reservedSpace(offers, p.id), waiting: s.sites.reduce((n, site) => n + quantity(site.stock), 0),
    inTransit: s.convoys.reduce((n, convoy) => n + quantity(convoy.cargo), 0), delivered: s.delivered,
    fleet: s.convoys.length, fleetCost: fleetCost(s), depotCost: depotCost(s), fleetLimit: FLEET_LIMIT,
    depotLevel: s.level, depotLimit: DEPOT_LIMIT, payload: payload(p), paused: s.paused, priority: s.priority,
    sites: s.sites.map(site => ({point: site.point, stock: site.stock, quantity: quantity(site.stock)})), convoys: s.convoys,
  };
}
export function convoyPoint(c: Convoy, base: Point, now: number, continuous = false): Point | null {
  if (!c.point || c.phase === 'idle') return null;
  if (c.phase === 'unloading') return base;
  const delta = Math.max(0, Math.min(1, (now - c.started) / Math.max(1, c.due - c.started)));
  const t = c.phase === 'returning' ? 1 - delta : delta;
  // Surface flights follow the outside of the cube. Deep mine shafts retain their true depth.
  const center = (SIDE - 1) / 2;
  const axes = ['x','y','z'] as const;
  const start = axes.map(axis => base[axis] - center), end = axes.map(axis => c.point![axis] - center);
  const radius = (v: number[]) => Math.max(...v.map(Math.abs));
  let path = start.map((v, k) => v * (1-t) + end[k] * t);
  if (start.some((v, k) => Math.abs(v) === center && v * end[k] < -center * center * .90)) {
    // Crossing opposite faces uses a stable lateral waypoint instead of cutting through the core.
    const strongest = start.findIndex(v => Math.abs(v) === center);
    const side = (Math.max(0, strongest) + 1) % 3;
    const waypoint = [0,0,0]; waypoint[side] = (start[side] + end[side] < 0 ? -1 : 1) * center;
    path = t <= .5 ? start.map((v, k) => v * (1 - 2*t) + waypoint[k] * 2*t) :
      end.map((v, k) => waypoint[k] * (2 - 2*t) + v * (2*t - 1));
  }
  const shell = radius(start) * (1-t) + radius(end) * t;
  const scale = shell / Math.max(1, radius(path));
  const xyz = path.map(v => {
    const position = Math.max(0, Math.min(SIDE-1, center + v * scale));
    return continuous ? position : Math.round(position);
  });
  return {x:xyz[0], y:xyz[1], z:xyz[2]};
}
