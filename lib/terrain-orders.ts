import { facePoint } from './planet';
import type { MineProgress, PlanetRelay, PlanetTile } from './planet-render';

export type Placement = 'drill' | 'hauler' | 'squad';
export type TerrainOrder = 'mine' | Placement | 'inspect';
export type Operator = {
  drillReady: boolean;
  squadReady: boolean;
  lastMine: number;
  cooldownMs: number;
  serverTime: number;
};

export const orderNames: Record<TerrainOrder, string> = {
  mine: 'Miner à la pioche', drill: 'Déployer la foreuse', hauler: 'Envoyer un transporteur',
  squad: 'Déployer les sentinelles', inspect: 'Inspecter le bloc',
};

export function nearRelay(tile: PlanetTile, relays: PlanetRelay[]) {
  return relays.find(relay => {
    const {face, u, v, depth = 0} = relay.focus;
    const point = facePoint(face, u, v, depth);
    return Math.hypot(tile.point.x-point.x, tile.point.y-point.y, tile.point.z-point.z) <= 32;
  });
}

export function pickCycle(operator?: Operator | null, job?: MineProgress | null) {
  if (!operator) return null;
  if (job) return {label:'Extraction', start:job.started ?? operator.lastMine, end:job.ready, pending:true};
  if (!operator.lastMine || operator.cooldownMs <= 0) return null;
  return {label:'Recharge', start:operator.lastMine, end:operator.lastMine + operator.cooldownMs, pending:false};
}

export function blockedOrder(
  tool: TerrainOrder, tile: PlanetTile, operator: Operator | null | undefined,
  relay: PlanetRelay | undefined, busy: boolean, pickBusy: boolean,
) {
  if (tool === 'inspect') return '';
  if (!operator) return 'Établis une base pour donner cet ordre.';
  if (busy) return 'Transmission en cours.';
  if (tool === 'squad') {
    if (!operator.squadReady) return 'Escouade en réparation.';
    return relay ? '' : 'Un relais doit se trouver à 32 blocs ou moins.';
  }
  if (tile.territory === 'foreign') return 'Ce terrain appartient à un autre mineur.';
  if (tile.status === 'unknown') return 'Il faut d’abord exposer cette roche.';
  if (tool === 'hauler') return '';
  if (tile.status === 'air') return 'Ce bloc a déjà été extrait.';
  if (tool === 'drill' && !operator.drillReady) return 'Répare la foreuse à la base.';
  if (tool === 'mine' && pickBusy) return 'La pioche est occupée.';
  return '';
}

const minerals: Record<string, string> = {ferrite:'Ferrite', cuivre:'Cuivre', titane:'Titane', prisme:'Prisme'};
export function tileName(tile: PlanetTile) {
  if (tile.status === 'air') return 'Galerie ouverte';
  if (tile.status === 'unknown') return 'Roche enfouie';
  return tile.ore ? minerals[tile.ore] ?? tile.ore : 'Roche exposée';
}
export function tileClaim(tile: PlanetTile) {
  return tile.territory === 'foreign' ? 'Territoire étranger' :
    tile.territory === 'home' ? 'Noyau personnel' :
    tile.territory === 'owned' ? 'Parcelle personnelle' : '';
}
