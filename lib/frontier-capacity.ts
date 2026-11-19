import type {Miner} from './world';
export const hasBuilding=(p:Miner,kind:string)=>p.expedition?.factory?.pieces.some(c=>c.kind===kind&&c.active&&c.hull>0)??false;
export const depotLimit=(p:Miner)=>420+p.core*180+Math.min(4,p.expedition?.factory?.pieces.filter(c=>c.kind==='warehouse'&&c.active&&c.hull>0).length??0)*(p.expedition?.factory?.unlocked.includes('stockage-2')?600:300);
