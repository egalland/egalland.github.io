import type {FlowHistory} from './factory-flow';
import type {IndustryId} from './industry';
import {SIDE, type Face} from './planet';
import {type Place} from './frontier-geography';
import {ALL_GOODS, RECIPES, type Good, type RefinedGood} from './economy';

export const FACTORY_TILE=8;
export const FACTORY_LIMIT=640;
export type Direction=0|1|2|3;
export type FactoryKind='belt'|'loader'|'unloader'|'chest'|'furnace'|'press'|'wiremill'|'assembler'|'lab'|'splitter'|'mam'|'warehouse'|'barracks'|'repairbay';
export type FactoryTool=FactoryKind|'erase';
export type Cell={face:Face;x:number;y:number};
export type BuildMark=Cell&{dir:Direction};
export type GoodsStock=Record<Good,number>;
export type FactoryCondition={piece:string;code:string;severity?:'info'|'warning';since:number;reported?:boolean};
export type FactoryPiece=BuildMark&{
  batch?:number;id:string;kind:FactoryKind;items:GoodsStock;output:GoodsStock;hull:number;active:boolean;
  recipe:RefinedGood;filter:Good;job:{recipe:RefinedGood;ready:number;started?:number}|null;placed:number;pausedAt?:number;flowReset?:number;cursor?:number;lastTransfer?:number;gift?:boolean;
};
export type FactoryState={version:2;flow?:FlowHistory;conditions?:FactoryCondition[];pieces:FactoryPiece[];clock:number;unlocked:IndustryId[];research:{id:IndustryId;start:number;ready:number}|null;produced:Partial<Record<RefinedGood,number>>;reserve?:{ferrite:number;cuivre:number};notice?:string};
export const FACTORY_KINDS:Record<FactoryKind,{name:string;size:number;credits:number;ferrite:number;cuivre:number;hull:number}> = {
  mam:{name:'Centre MAM',size:3,credits:80,ferrite:15,cuivre:8,hull:300},
  warehouse:{name:'Entrepôt',size:3,credits:100,ferrite:20,cuivre:5,hull:280},
  barracks:{name:'Caserne',size:3,credits:130,ferrite:15,cuivre:10,hull:300},
  repairbay:{name:'Atelier de réparation',size:3,credits:110,ferrite:20,cuivre:8,hull:260},
  belt:{name:'Convoyeur',size:1,credits:1,ferrite:1,cuivre:0,hull:40},
  loader:{name:'Chargeur',size:1,credits:15,ferrite:2,cuivre:1,hull:100},
  unloader:{name:'Retour au dépôt',size:1,credits:15,ferrite:2,cuivre:1,hull:100},
  chest:{name:'Coffre',size:1,credits:20,ferrite:5,cuivre:0,hull:140},
  furnace:{name:'Fonderie',size:3,credits:65,ferrite:12,cuivre:2,hull:220},
  press:{name:'Presse',size:3,credits:80,ferrite:15,cuivre:3,hull:240},
  wiremill:{name:'Tréfileuse',size:3,credits:85,ferrite:12,cuivre:6,hull:220},
  lab:{name:'Laboratoire',size:3,credits:130,ferrite:20,cuivre:10,hull:240},
  splitter:{name:'Répartiteur',size:1,credits:12,ferrite:3,cuivre:2,hull:100},
  assembler:{name:'Assembleuse',size:3,credits:100,ferrite:15,cuivre:5,hull:240},
};
export const DIRECTIONS=[{x:0,y:-1,name:'Nord'},{x:1,y:0,name:'Est'},{x:0,y:1,name:'Sud'},{x:-1,y:0,name:'Ouest'}] as const;
export const emptyGoods=():GoodsStock=>Object.fromEntries(ALL_GOODS.map(g=>[g,0])) as GoodsStock;
export const goodsCount=(s:GoodsStock)=>ALL_GOODS.reduce((n,g)=>n+s[g],0);
export const cellKey=(c:Cell)=>c.face+'/'+c.x+'/'+c.y;
export const cellAt=(p:Place):Cell=>({face:p.face,x:Math.floor(p.u/FACTORY_TILE),y:Math.floor(p.v/FACTORY_TILE)});
export const cellPlace=(c:Cell,size=1):Place=>({face:c.face,u:(c.x+size/2)*FACTORY_TILE,v:(c.y+size/2)*FACTORY_TILE,depth:0});
export const piecePlace=(p:Pick<FactoryPiece,'kind'|'face'|'x'|'y'>)=>cellPlace(p,FACTORY_KINDS[p.kind].size);
export const machine=(p:Pick<FactoryPiece,'kind'>)=>['furnace','press','wiremill','assembler','lab'].includes(p.kind);
export function footprint(c:Cell,size:number):Cell[] {
  return Array.from({length:size*size},(_,n)=>({...c,x:c.x+n%size,y:c.y+Math.floor(n/size)}));
}
export function contains(c:Cell,anchor:Cell,size:number) {
  return c.face===anchor.face&&c.x>=anchor.x&&c.x<anchor.x+size&&c.y>=anchor.y&&c.y<anchor.y+size;
}
export function foundation(point:Place,size:number):Cell {
  const c=cellAt(point),half=Math.floor(size/2);
  return {...c,x:c.x-half,y:c.y-half};
}
export function port(p:Pick<FactoryPiece,'kind'|'face'|'x'|'y'|'dir'>,outside=true,rear=false):Cell {
  const size=FACTORY_KINDS[p.kind].size,half=Math.floor(size/2),d=DIRECTIONS[p.dir],length=half+(outside?1:0),sign=rear?-1:1;
  return {face:p.face,x:p.x+half+d.x*length*sign,y:p.y+half+d.y*length*sign};
}
export const defaultRecipe=(kind:FactoryKind):RefinedGood=>kind==='press'?'engrenage':kind==='wiremill'?'cable':kind==='lab'?'science':kind==='assembler'?'circuit':'acier';
export function inputPorts(p:Pick<FactoryPiece,'kind'|'face'|'x'|'y'|'dir'>){
  if(!machine(p))return [port(p,false,true)];
  return [port(p,false,true),port({...p,dir:((p.dir+1)%4) as Direction},false),port({...p,dir:((p.dir+3)%4) as Direction},false)];
}
export const validCell=(c:Cell)=>Number.isInteger(c.x)&&Number.isInteger(c.y)&&c.x>=0&&c.y>=0&&c.x<SIDE/FACTORY_TILE&&c.y<SIDE/FACTORY_TILE;
export function factoryStatus(p:FactoryPiece):string {
  if(!p.hull)return 'Endommagée';
  if(!p.active)return 'En pause';
  if(p.kind==='mam')return 'Analyses et spécialisations';
  if(p.kind==='warehouse')return 'Stock local '+goodsCount(p.items)+'/512 · dépôt +300';
  if(p.kind==='barracks')return 'Recrutement et milice';
  if(p.kind==='repairbay')return 'Répare les unités proches';
  if(p.job)return 'Fabrication';
  if(p.kind==='belt')return goodsCount(p.items)?'En circulation':'Vide';
  if(p.kind==='chest')return goodsCount(p.items)>=128?'Coffre plein':'Stock tampon';
  if(p.kind==='splitter')return goodsCount(p.items)?'Répartition':'En attente de matière';
  if(p.kind==='loader')return p.batch===0?(goodsCount(p.items)?'Fin du lot en transit':'Lot terminé'):goodsCount(p.items)?'Sortie en attente':'En attente de matière';
  if(p.kind==='unloader')return goodsCount(p.items)?'Déchargement':'En attente de matière';
  const recipe=RECIPES[p.recipe];
  if(goodsCount(p.output)+recipe.output>16)return 'Sortie pleine';
  return Object.entries(recipe.inputs).every(([g,n])=>p.items[g as Good]>=n)?'Prête':'Entrée à alimenter';
}

export function starterCircuit(home:Place,ore:'ferrite'|'cuivre'){
  const h=foundation(home,5),entries:{kind:FactoryKind;x:number;y:number;dir:Direction;recipe?:RefinedGood;filter?:Good}[]=[
    {kind:'loader',x:5,y:1,dir:1,filter:ore},{kind:'belt',x:6,y:1,dir:1},
    {kind:'furnace',x:7,y:0,dir:1,recipe:ore==='ferrite'?'acier':'lingot'},
    {kind:'belt',x:10,y:1,dir:0},{kind:'belt',x:10,y:0,dir:0},{kind:'belt',x:10,y:-1,dir:3},
    ...Array.from({length:7},(_,i)=>({kind:'belt' as const,x:9-i,y:-1,dir:3 as Direction})),
    {kind:'unloader',x:2,y:-1,dir:2},
  ];
  return entries.map(e=>{
    if(ore==='ferrite')return {...e,face:h.face,x:h.x+e.x,y:h.y+e.y};
    const size=FACTORY_KINDS[e.kind].size;
    return {...e,face:h.face,x:h.x+5-e.y-size,y:h.y+e.x,dir:((e.dir+1)%4) as Direction};
  });
}
export function circuitPrice(home:Place,ore:'ferrite'|'cuivre'){
  return starterCircuit(home,ore).reduce((p,e)=>{const d=FACTORY_KINDS[e.kind];return {credits:p.credits+d.credits,ferrite:p.ferrite+d.ferrite,cuivre:p.cuivre+d.cuivre};},{credits:0,ferrite:0,cuivre:0});
}
