import { pickRecovery, type Ore } from './planet';

export type SkillId =
  | 'cadence' | 'trepan' | 'longue-percee'
  | 'soutes' | 'turbines' | 'convois'
  | 'blindage' | 'artillerie' | 'doctrine';
export type ResearchBranch = 'Extraction' | 'Logistique' | 'Défense';
export type ResearchNode = {
  id: SkillId;
  branch: ResearchBranch;
  name: string;
  description: string;
  requires: readonly SkillId[];
  credits: number;
  materials: Partial<Record<Ore, number>>;
};

export const RESEARCH_TREE: readonly ResearchNode[] = [
  {id:'cadence', branch:'Extraction', name:'Régulateur de cadence', description:'Les foreuses produisent 25 % de minerai supplémentaire à chaque cycle.', requires:[], credits:140, materials:{ferrite:20}},
  {id:'trepan', branch:'Extraction', name:'Trépan double', description:'La foreuse extrait une unité de minerai supplémentaire par cycle.', requires:['cadence'], credits:380, materials:{cuivre:20}},
  {id:'longue-percee', branch:'Extraction', name:'Forage de précision', description:'La foreuse extrait deux unités de minerai supplémentaires par cycle.', requires:['trepan','soutes'], credits:800, materials:{ferrite:60,cuivre:30}},
  {id:'soutes', branch:'Logistique', name:'Soutes modulaires', description:'Chaque transporteur emporte six unités supplémentaires par trajet.', requires:[], credits:160, materials:{ferrite:25}},
  {id:'turbines', branch:'Logistique', name:'Turbines de fret', description:'Les transporteurs se déplacent 40 % plus vite.', requires:['soutes'], credits:420, materials:{cuivre:25}},
  {id:'convois', branch:'Logistique', name:'Trains de fret', description:'Chaque transporteur emporte huit unités supplémentaires par trajet.', requires:['turbines','blindage'], credits:850, materials:{cuivre:40,ferrite:45}},
  {id:'blindage', branch:'Défense', name:'Blindage composite', description:'L’escouade subit 20 % de dégâts en moins contre la Ruche et les factions rivales.', requires:[], credits:175, materials:{ferrite:25}},
  {id:'artillerie', branch:'Défense', name:'Artillerie mobile', description:'L’escouade inflige 25 % de dégâts supplémentaires.', requires:['blindage'], credits:450, materials:{cuivre:25}},
  {id:'doctrine', branch:'Défense', name:'Avant-garde', description:'Déplacement de l’escouade et capture des relais 35 % plus rapides.', requires:['artillerie','soutes'], credits:900, materials:{ferrite:60,cuivre:30}},
];

type Specialist = { research?: readonly SkillId[] };
type Depot = { research?: SkillId[]; coins:number; inventory:Record<Ore, number> };
const knows = (p:Specialist, id:SkillId) => p.research?.includes(id) ?? false;

export const cooldownFor = (p:Specialist & {pick:number}) => pickRecovery(p.pick,knows(p,'cadence'));
export const pickTimeFactor = (p:Specialist) => knows(p,'cadence') ? .75 : 1;
export const drillExtraBlocks = (p:Specialist) => Number(knows(p,'trepan')) + 2 * Number(knows(p,'longue-percee'));
export const haulCapacityBonus = (p:Specialist) => 6 * Number(knows(p,'soutes')) + 8 * Number(knows(p,'convois'));
export const haulSpeedFactor = (p:Specialist) => knows(p,'turbines') ? 1.4 : 1;
export const incomingDamageFactor = (p:Specialist) => knows(p,'blindage') ? .8 : 1;
export const attackFactor = (p:Specialist) => knows(p,'artillerie') ? 1.25 : 1;
export const maneuverFactor = (p:Specialist) => knows(p,'doctrine') ? 1.35 : 1;

function unavailable(p:Depot, node:ResearchNode) {
  if(knows(p,node.id)) return 'Cette recherche est déjà acquise.';
  if(!node.requires.every(id=>knows(p,id))) return 'Terminez d’abord les recherches préalables.';
  if(p.coins<node.credits) return 'Crédits insuffisants pour cette recherche.';
  if(Object.entries(node.materials).some(([id,n])=>p.inventory[id as Ore]<n)) return 'Le dépôt manque de minerai pour cette recherche.';
  return null;
}

export function researchAvailable(p:Depot, id:SkillId) {
  const node=RESEARCH_TREE.find(n=>n.id===id);
  return Boolean(node && !unavailable(p,node));
}

export function buyResearch(p:Depot, id:unknown) {
  const node=RESEARCH_TREE.find(n=>n.id===id);
  if(!node) throw Error('Recherche inconnue.');
  const blocked=unavailable(p,node);
  if(blocked) throw Error(blocked);
  p.coins-=node.credits;
  for(const [id,n] of Object.entries(node.materials)) p.inventory[id as Ore]-=n;
  (p.research??=[]).push(node.id);
  return {message:node.name+' · recherche acquise.'};
}
