import type { ActivityEntry } from './activity-journal';
import { colonizationView } from './colonies';
import { militiaAttack } from './cooperation';
import { ALL_GOODS, GOODS, type Good } from './economy';
import { piecePlace } from './factory-grid';
import { TOWNS, frontierView } from './frontier';
import { along, type Place, type Trip } from './frontier-geography';
import { SIDE } from './planet';
import { testAgents } from './playtester';
import { RELEASE_ID } from './release';
import { attackFactor } from './research';
import { FACTIONS, type Faction, type World } from './world';

export type ObserverEntry = Omit<ActivityEntry, 'context'>;
export type ObserverMobile = {
  id: string;
  kind: 'scout' | 'army' | 'truck' | 'worker';
  point: Place;
  trip: Trip | null;
  hull: number;
  order: string;
  cargo: number;
  cargoGoods: { ferrite: number; cuivre: number };
};
export type SimulationSpeed = 1 | 4 | 12;

const metricDefinitions = {
  wealth: 'Trésorerie + valeur de vente des minerais et produits finis au dépôt principal et dans les comptoirs. Le fret en transit et les bâtiments sont exclus.',
  power: 'Dégâts nominaux par salve des escouades opérationnelles et approvisionnées (améliorations comprises), plus 18 points par tourelle d’une base intacte.',
  territories: 'Une implantation par base opérationnelle et par avant-poste fondé.',
  production: 'Nombre cumulé d’objets fabriqués depuis la fondation.',
  research: 'Total des technologies industrielles, compétences et spécialisations acquises.',
  warScore: 'Contributions cumulées à l’effort de guerre pendant la manche actuelle.',
};

function stockValue(goods: Partial<Record<Good, number>>) {
  return ALL_GOODS.reduce((sum, good) => sum + (goods[good] ?? 0) * GOODS[good].value, 0);
}

function mobile(id: string, kind: ObserverMobile['kind'], unit: {point: Place; trip: Trip | null; hull: number}, order: string, time: number, goods?: {ferrite: number; cuivre: number}): ObserverMobile {
  const cargoGoods = {ferrite: goods?.ferrite ?? 0, cuivre: goods?.cuivre ?? 0};
  return {id, kind, point: unit.trip ? along(unit.trip, time) : unit.point, trip: unit.trip,
    hull: unit.hull, order, cargo: cargoGoods.ferrite + cargoGoods.cuivre, cargoGoods};
}

/** Owner-only projection. No AI policy imports this module or receives its result. */
export function observerView(w: World, wallNow: number, watchAI?: string, latest: ObserverEntry[] = [],
  clock: {speed: SimulationSpeed; target: number} = {speed: 1, target: wallNow}) {
  const frontier = w.frontier!;
  const time = frontier.time;
  const colonies = colonizationView(w);
  const brains = testAgents(w);
  const actors = w.players.filter(p => p.ai && p.expedition);
  const selected = actors.find(p => p.id === watchAI) ?? actors[0];
  const agents = actors.map(p => {
    const c = p.expedition!, f = c.factory;
    const brain = brains.find(b => b.player === p.id);
    const scout = mobile(p.id + '/scout', 'scout', c.scout, c.scout.auto ? 'auto' : c.scout.trip ? 'move' : 'idle', time);
    const army = mobile(p.id + '/army', 'army', c.army, c.army.order, time, c.army.loot);
    const mobiles = [scout, army, ...(c.workers ?? []).map(v => mobile(v.id, 'worker', v, v.order, time, v.cargo)),
      ...c.trucks.map(v => mobile(v.id, 'truck', v, v.phase, time, v.cargo))];
    const wealth = p.coins + stockValue(p.inventory) + stockValue(p.economy?.refined ?? {}) +
      Object.values(c.stores).reduce((sum, goods) => sum + stockValue(goods), 0);
    const fieldPower = c.army.hull > 0 && c.army.ammo > 0 ? p.units * 8 * attackFactor(p) * militiaAttack(p) : 0;
    const power = Math.round(fieldPower + (c.hull > 0 ? c.turrets * 18 : 0));
    const pieces = (f?.pieces ?? []).map(v => ({id:v.id, kind:v.kind, point:piecePlace(v), dir:v.dir, active:v.active && v.hull>0}));
    return {id:p.id, name:p.name, profile:p.aiMind?.profile ?? 'Colonisation', doctrine:brain?.doctrine ?? '', faction:p.faction, guild:c.guild, home:c.home,
      credits:p.coins, wealth, power, workers:c.workers?.length ?? 0, units:p.units, buildings:pieces.length,
      research:(f?.unlocked.length ?? 0) + (c.talents?.length ?? 0) + (p.research?.length ?? 0),
      produced:Object.values(f?.produced ?? {}).reduce((n, v) => n + (v ?? 0), 0),
      mined:p.mined, delivered:c.delivered, territories:(c.hull > 0 ? 1 : 0) + colonies.outposts.filter(post => post.owner === p.id).length,
      intent:p.aiMind?.goal ?? 'Installation du camp', reason:p.aiMind?.reason ?? '', actions:brain?.actions ?? 0,
      errors:brain?.errors ?? 0, blocked:p.activityPulse?.status || (brain?.stalled ? 'Progression suspendue' : ''),
      iron:p.inventory.ferrite, copper:p.inventory.cuivre, scout, army, mobiles, pieces};
  });
  const total = (roster: typeof agents, field: 'wealth'|'power'|'credits'|'territories'|'produced'|'research') =>
    roster.reduce((sum, agent) => sum + agent[field], 0);
  const factions = (Object.keys(FACTIONS) as Faction[]).map(id => {
    const members = agents.filter(a => a.faction === id);
    return {id, name:FACTIONS[id].name, color:FACTIONS[id].color, members:members.length, credits:total(members,'credits'),
      wealth:total(members,'wealth'), power:total(members,'power'), territories:total(members,'territories'),
      production:total(members,'produced'), research:total(members,'research'), warScore:frontier.cooperation?.war.scores[id] ?? 0};
  }).sort((a,b) => b.wealth-a.wealth || a.id.localeCompare(b.id));
  const guilds = colonies.guilds.map(g => {
    const members = agents.filter(a => a.guild === g.id);
    return {id:g.id, name:g.name, leader:g.leader, founder:g.founder, foundedAt:g.foundedAt, members:members.map(a => a.id),
      wealth:total(members,'wealth'), power:total(members,'power'), territories:total(members,'territories')};
  });
  return {generation:RELEASE_ID, now:wallNow, time, speed:clock.speed, simulationBehind:Math.max(0,clock.target-time),
    activity:w.simulationActivity ?? {simulatedMs:0,skippedMs:0,lastSkip:null},
    planetSize:SIDE, agents, factions, guilds, cities:TOWNS, deposits:Object.values(frontier.deposits), rigs:frontier.rigs,
    outposts:colonies.outposts, expeditions:colonies.expeditions, services:frontier.cooperation?.contracts ?? [],
    focus:frontierView(w,selected,time), latest, metricDefinitions};
}

export type ObserverView = ReturnType<typeof observerView>;
export type ObserverAgent = ObserverView['agents'][number];
