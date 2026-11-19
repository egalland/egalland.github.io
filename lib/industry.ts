import {ensureEconomy,type Good,type RefinedGood} from './economy';
import type {FactoryKind,FactoryState} from './factory-grid';
import {hasBuilding} from './frontier-capacity';
import type {Miner} from './world';

export type IndustryId='mecanique'|'cablage'|'electronique'|'laboratoires'|'motorisation'|'cadence-usine'|'logistique-usine'|'forage'|'stockage'|'camp-militaire'|'maintenance'|'fonderie-2'|'presse-2'|'electronique-2'|'convoyeurs-3'|'stockage-2'|'forage-2'|'forage-3'|'camp-2'|'industrie-3'|'industrie-4'|'industrie-5';
export type IndustryNode={id:IndustryId;name:string;description:string;requires:IndustryId[];cost:Partial<Record<Good,number>>;seconds:number;credits:number;unlocks:string[];tier:number};
export const INDUSTRY_TREE:IndustryNode[]=[
  {id:'mecanique',tier:0,name:'Mécanique',description:'Usinez les plaques de fer pour fabriquer vos premières pièces.',requires:[],cost:{acier:8,lingot:4},seconds:30,credits:60,unlocks:['Presse','Engrenages']},
  {id:'cablage',tier:1,name:'Tréfilage',description:'Transformez le cuivre raffiné en câbles.',requires:['mecanique'],cost:{engrenage:4,lingot:6},seconds:45,credits:90,unlocks:['Tréfileuse','Câbles de cuivre']},
  {id:'electronique',tier:2,name:'Électronique',description:'Croisez les chaînes du fer et du cuivre dans une assembleuse.',requires:['cablage'],cost:{engrenage:6,cable:12},seconds:60,credits:120,unlocks:['Assembleuse','Circuits électroniques']},
  {id:'laboratoires',tier:3,name:'Recherche appliquée',description:'Alimentez des laboratoires en engrenages et en circuits pour produire des dossiers.',requires:['electronique'],cost:{circuit:5,acier:8},seconds:90,credits:160,unlocks:['Laboratoire','Dossiers de recherche']},
  {id:'motorisation',tier:3,name:'Motorisation',description:'Fabriquez les moteurs utilisés par vos véhicules et ateliers.',requires:['electronique'],cost:{circuit:6,engrenage:8,cable:12},seconds:90,credits:180,unlocks:['Moteurs électriques']},
  {id:'cadence-usine',tier:4,name:'Automatisation avancée',description:'Les nouvelles fabrications de toutes vos machines sont 35 % plus rapides.',requires:['laboratoires','motorisation'],cost:{science:10,module:3},seconds:120,credits:240,unlocks:['Vitesse des machines +35 %']},
  {id:'logistique-usine',tier:4,name:'Logistique industrielle',description:'Double la capacité des convoyeurs et permet les répartiteurs.',requires:['laboratoires'],cost:{science:8,engrenage:12},seconds:120,credits:200,unlocks:['Convoyeurs à deux places','Répartiteur']},
  {"id": "forage", "tier": 0, "name": "Forage mécanique", "description": "Automatisez l’extraction sur les gisements découverts.", "requires": [], "cost": {"ferrite": 35, "cuivre": 10}, "seconds": 120, "credits": 100, "unlocks": ["Foreuses sur gisement"]},
  {"id": "stockage", "tier": 1, "name": "Logistique de stockage", "description": "Construisez des entrepôts reliés à vos circuits.", "requires": ["mecanique"], "cost": {"acier": 25, "engrenage": 10}, "seconds": 300, "credits": 200, "unlocks": ["Entrepôt"]},
  {"id": "camp-militaire", "tier": 1, "name": "Organisation de la milice", "description": "Construisez des casernes pour développer vos effectifs.", "requires": ["mecanique"], "cost": {"acier": 30, "engrenage": 8}, "seconds": 300, "credits": 200, "unlocks": ["Caserne"]},
  {"id": "maintenance", "tier": 2, "name": "Ateliers de maintenance", "description": "Réparez vos unités et assemblez vos futurs véhicules.", "requires": ["cablage"], "cost": {"acier": 30, "cable": 25, "engrenage": 15}, "seconds": 600, "credits": 300, "unlocks": ["Atelier de réparation"]},
  {"id": "fonderie-2", "tier": 2, "name": "Métallurgie contrôlée", "description": "Les fonderies produisent 25 % plus vite.", "requires": ["cablage"], "cost": {"acier": 80, "lingot": 50, "engrenage": 20}, "seconds": 900, "credits": 400, "unlocks": ["Fonderies ×1,25"]},
  {"id": "presse-2", "tier": 3, "name": "Usinage de précision", "description": "Les presses produisent 30 % plus vite.", "requires": ["electronique"], "cost": {"engrenage": 60, "circuit": 20}, "seconds": 1200, "credits": 600, "unlocks": ["Presses ×1,30"]},
  {"id": "electronique-2", "tier": 4, "name": "Assemblage synchronisé", "description": "Les assembleuses produisent 30 % plus vite.", "requires": ["laboratoires"], "cost": {"science": 40, "circuit": 60, "module": 10}, "seconds": 1800, "credits": 900, "unlocks": ["Assembleuses ×1,30"]},
  {"id": "convoyeurs-3", "tier": 5, "name": "Fret à haute densité", "description": "Les tapis portent quatre objets par case.", "requires": ["logistique-usine"], "cost": {"science": 80, "engrenage": 150, "module": 25}, "seconds": 3600, "credits": 1500, "unlocks": ["Convoyeurs à quatre places"]},
  {"id": "stockage-2", "tier": 5, "name": "Plateformes de stockage", "description": "La capacité de chaque entrepôt passe de 300 à 600 au dépôt.", "requires": ["stockage", "logistique-usine"], "cost": {"science": 100, "acier": 300, "circuit": 80}, "seconds": 5400, "credits": 2000, "unlocks": ["Entrepôts +600 au dépôt"]},
  {"id": "forage-2", "tier": 4, "name": "Extraction profonde", "description": "Toutes les foreuses produisent 30 % de minerai en plus.", "requires": ["forage", "laboratoires"], "cost": {"science": 60, "module": 20, "engrenage": 100}, "seconds": 3600, "credits": 1200, "unlocks": ["Foreuses ×1,30"]},
  {"id": "forage-3", "tier": 6, "name": "Réseaux extractifs", "description": "Toutes les foreuses produisent 60 % de minerai en plus au total.", "requires": ["forage-2", "convoyeurs-3"], "cost": {"science": 300, "module": 100, "circuit": 400}, "seconds": 14400, "credits": 5000, "unlocks": ["Foreuses ×1,60"]},
  {"id": "camp-2", "tier": 5, "name": "Recrutement régional", "description": "Le camp peut accueillir 36 ouvriers au lieu de 24.", "requires": ["camp-militaire", "laboratoires"], "cost": {"science": 80, "acier": 200, "circuit": 60}, "seconds": 7200, "credits": 2500, "unlocks": ["36 ouvriers maximum"]},
  {"id": "industrie-3", "tier": 6, "name": "Industrie intégrée", "description": "La vitesse globale des machines passe à ×1,65.", "requires": ["cadence-usine", "electronique-2"], "cost": {"science": 300, "module": 80, "circuit": 300}, "seconds": 14400, "credits": 5000, "unlocks": ["Machines ×1,65"]},
  {"id": "industrie-4", "tier": 7, "name": "Complexe industriel", "description": "La vitesse globale des machines passe à ×2.", "requires": ["industrie-3", "stockage-2"], "cost": {"science": 1000, "module": 250, "acier": 2000, "cable": 2000}, "seconds": 43200, "credits": 12000, "unlocks": ["Machines ×2"]},
  {"id": "industrie-5", "tier": 8, "name": "Maîtrise industrielle", "description": "La vitesse globale des machines passe à ×2,5. Un objectif de longue durée pour votre réseau.", "requires": ["industrie-4", "forage-3"], "cost": {"science": 5000, "module": 1000, "circuit": 3000, "engrenage": 3000}, "seconds": 86400, "credits": 30000, "unlocks": ["Machines ×2,5"]},
];
export const INDUSTRY_GATES:Partial<Record<FactoryKind,IndustryId>>={warehouse:'stockage',barracks:'camp-militaire',repairbay:'maintenance',press:'mecanique',wiremill:'cablage',assembler:'electronique',lab:'laboratoires',splitter:'logistique-usine'};
export const RECIPE_GATES:Partial<Record<RefinedGood,IndustryId>>={engrenage:'mecanique',cable:'cablage',circuit:'electronique',science:'laboratoires',module:'motorisation'};
export const knowsIndustry=(f:FactoryState,id:IndustryId)=>f.unlocked?.includes(id)??false;
export const canBuild=(f:FactoryState,kind:FactoryKind)=>!INDUSTRY_GATES[kind]||knowsIndustry(f,INDUSTRY_GATES[kind]!);
export const canRecipe=(f:FactoryState,recipe:RefinedGood)=>!RECIPE_GATES[recipe]||knowsIndustry(f,RECIPE_GATES[recipe]!);
export const industrySpeed=(f:FactoryState)=>knowsIndustry(f,'industrie-5')?2.5:knowsIndustry(f,'industrie-4')?2:knowsIndustry(f,'industrie-3')?1.65:knowsIndustry(f,'cadence-usine')?1.35:1;
export const beltCapacity=(f:FactoryState)=>knowsIndustry(f,'convoyeurs-3')?4:knowsIndustry(f,'logistique-usine')?2:1;
export const recipeSeconds=(f:FactoryState,seconds:number,kind?:FactoryKind)=>Math.max(1,Math.ceil(seconds/(industrySpeed(f)*(kind==='furnace'&&knowsIndustry(f,'fonderie-2')?1.25:kind==='press'&&knowsIndustry(f,'presse-2')?1.3:kind==='assembler'&&knowsIndustry(f,'electronique-2')?1.3:1))));
export function settleIndustry(f:FactoryState,now:number){
  if(f.research&&f.research.ready<=now){
    if(!f.unlocked.includes(f.research.id))f.unlocked.push(f.research.id);
    f.research=null;
  }
}
export function industryBlocked(p:{coins:number;inventory:Partial<Record<Good,number>>;economy?:{stock?:Partial<Record<Good,number>>;refined?:Partial<Record<RefinedGood,number>>}|null},f:FactoryState,node:IndustryNode){
  if(knowsIndustry(f,node.id))return 'Déjà débloqué';
  if(f.research)return 'Une recherche est en cours';
  if(p && 'expedition' in p && !hasBuilding(p as Miner,'mam'))return 'Construisez et activez votre centre MAM';
  if(!node.requires.every(id=>knowsIndustry(f,id)))return 'Prérequis à débloquer';
  if(p.coins<node.credits)return 'Crédits insuffisants';
  if(Object.entries(node.cost).some(([g,n])=>(p.economy?.stock?.[g as Good]??p.economy?.refined?.[g as RefinedGood]??p.inventory[g as Good]??0)<n))return 'Produisez et ramenez les composants au dépôt';
  return null;
}
export function startIndustry(p:Miner,f:FactoryState,id:unknown,now:number){
  settleIndustry(f,now);
  if(!hasBuilding(p,'mam'))throw Error('Construisez votre centre MAM pour lancer une analyse.');
  if(p.expedition?.talentJob)throw Error('Le MAM termine une spécialisation.');
  const node=INDUSTRY_TREE.find(n=>n.id===id);if(!node)throw Error('Technologie inconnue.');
  const blocked=industryBlocked(p,f,node);if(blocked)throw Error(blocked+'.');
  const e=ensureEconomy(p);
  for(const [g,n] of Object.entries(node.cost)){
    if(g==='ferrite'||g==='cuivre')p.inventory[g]-=n;
    else e.refined[g as RefinedGood]-=n;
  }
  p.coins-=node.credits;f.research={id:node.id,start:now,ready:now+node.seconds*1000};
  return node.name+' · recherche lancée.';
}

export const researchTime=(seconds:number)=>seconds>=86400?(seconds/86400).toLocaleString('fr-FR')+' j':seconds>=3600?(seconds/3600).toLocaleString('fr-FR',{maximumFractionDigits:1})+' h':seconds>=60?Math.ceil(seconds/60)+' min':Math.ceil(seconds)+' s';
