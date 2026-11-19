import type {ActivityEntry,ActivityPulse} from './activity-journal';
import type {PlaytestState} from './playtester';
import type {ColonizationState} from './colonies';
import {
  SIDE, createPlanet, ensureBase, homeFocus, homePoint, regionView, relayFocus, facePoint, pointOnFace,
  keysAround, regionKeys, validPoint, validChunk, canExcavate, extendPrice,
  chunkAt, territoryOwner, isExposed, expandTerritory, manualMine, finishMine, machineMine, nextMachineTarget,
  type PlanetState, type Point, type Face, type Focus,
} from './planet';
import { actEconomy, economyView, settleWorkshops, type PlayerEconomy, type TradeOffer } from './economy';
import {
  buyResearch, cooldownFor, pickTimeFactor, drillExtraBlocks, incomingDamageFactor,
  attackFactor, maneuverFactor, type SkillId,
} from './research';
import { logisticsView, advanceHaul, canStage, stage, haulAction, checkTradeSpace, reservedSpace, convoyPoint, type LogisticsState } from './logistics';
import type { FrontierState, Captain } from './frontier';

export const DIM = SIDE, TOTAL_BLOCKS = DIM ** 3, TICK = 10000, OFFLINE_CAP = 4 * 3600000;
export const FACTIONS = {
  aurore: { name: 'Aurore', color: '#f2c778', home: {x:2,y:2}, motto: 'L’énergie du collectif' },
  forge: { name: 'La Forge', color: '#f1928c', home: {x:21,y:2}, motto: 'La force dans la matière' },
  veille: { name: 'Les Veilleurs', color: '#84d9d2', home: {x:12,y:21}, motto: 'L’équilibre des profondeurs' },
};
export type Faction = keyof typeof FACTIONS;
export const validFaction = (f: unknown): f is Faction => typeof f === 'string' && Object.hasOwn(FACTIONS,f);
export const RESOURCES = {
  ferrite:{name:'Fer',color:'#a1b5c4',value:1}, cuivre:{name:'Cuivre',color:'#e8aa70',value:4},
  titane:{name:'Titane',color:'#a99ee9',value:15}, prisme:{name:'Prisme',color:'#88eadc',value:150},
};
export type Resource = keyof typeof RESOURCES;
export type Inventory = Record<Resource,number>;
export type Drill = { at: Point|null; origin: Point|null; face: Face; health: number; status:'ready'|'deployed'|'damaged'|'exhausted'; next: number; bonusCarry?: number };
export type Miner = {
  ai?:boolean;aiMind?:{profile:string;goal:string;reason:string;since:number};
  activityPulse?:ActivityPulse;
  journalProgress?:{deposits:number;industry:number;talents:number};
  expedition?:Captain;
  id:string;token:string;account?:string;name:string;faction:Faction;coins:number;inventory:Inventory;
  rigs:number;power:number;core:number;pick:number;scanner:number;refinery:boolean;autoSell:boolean;
  mined:number;sold:number;lastMine:number; mining?:{point:Point;ready:number}|null; drill:Drill;
  units:number;hp:number;x:number;y:number;target:string|null;respawn:number;lastSeen:number;joined:number;
  damage:number;relayBlocks:number;lastActionIds:string[];reportedMined:number;reportedCoins:number;reportedDelivered?:number;
  research?:SkillId[];
  economy?:PlayerEconomy;
  logistics?:LogisticsState;
  rare?:{ready:number;amount:number}|null;
};
export type Relay = {
  id:string;name:string;x:number;y:number;owner:Faction|null;capturing:Faction|null;progress:number;
  allianceUntil:number;contributors:string[];produced:number;site:Focus;point:Point;
};
export type Enemy = {id:string;x:number;y:number;target:string;hp:number;maxHp:number;damage:number};
export type World = {
  simulationActivity?:{simulatedMs:number;skippedMs:number;lastSkip:{from:number;to:number}|null};
  colonization?:ColonizationState;
  playtest?:PlaytestState;
  aiTests?:PlaytestState[];
  auditPending?:ActivityEntry[];
  frontier?:FrontierState;
  format:2;seed:number;planet:PlanetState;extracted:number;players:Miner[];relays:Relay[];enemies:Enemy[];
  last:number;created:number;nextWave:number;wave:number;integrity:number;offers?:TradeOffer[];
  log:{text:string;time:number;kind:'world'|'war'|'loot'}[];
};
const relayDefinitions = [
  {name:'Relais Hélios',x:6,y:5},{name:'Le Bastion',x:17,y:5},{name:'Écluse centrale',x:12,y:11},
  {name:'Station Boréale',x:4,y:15},{name:'La Fracture',x:20,y:15},{name:'Le Phare',x:12,y:20},
];
const newDrill = ():Drill => ({at:null,origin:null,face:'top',health:100,status:'ready',next:0});
export function addLog(w:World,text:string,time=w.last,kind:'world'|'war'|'loot'='world'){
  w.log.unshift({text,time,kind});
  w.log=w.log.slice(0,35);
}
export function makeWorld(now=Date.now()):World {
  const seed=1872, last=Math.floor(now/TICK)*TICK;
  return {format:2, seed, planet:createPlanet(seed), extracted:0, players:[], enemies:[], last,
    created:now, nextWave:last+90000, wave:0, integrity:100, offers:[],
    relays:relayDefinitions.map((r,i)=>{
      const site=relayFocus(i);
      return {...r,id:'r'+(i+1),owner:null,capturing:null,progress:0,allianceUntil:0,contributors:[],
        produced:0,site,point:facePoint(site.face,site.u,site.v,site.depth??0)};
    }),
    log:[{text:'Les six faces de la planète sont ouvertes à l’exploration.',time:now,kind:'world'}],
  };
}
export function migrateWorld(input:World):World {
  if(input.format===2) return input;
  // Old layers counted batches, not world coordinates. Keep the production ledger,
  // faction war and accounts while assigning each established miner a physical home.
  const defaults=makeWorld(input.created);
  const w:World = {...defaults,seed:input.seed,planet:createPlanet(input.seed),extracted:input.extracted,
    players:input.players,relays:defaults.relays.map((r,i)=>({...r,...input.relays[i],site:r.site,point:r.point})),
    enemies:input.enemies,last:input.last,nextWave:input.nextWave,wave:input.wave,integrity:input.integrity,log:input.log};
  for(const p of w.players){
    p.drill=newDrill();
    p.mining=null;
    p.core??=0;
    p.lastActionIds??=[];
    ensureBase(w.planet,p.id,crypto.randomUUID());
  }
  addLog(w,'Les anciennes concessions deviennent des bases sur la planète. Les inventaires sont conservés.');
  return w;
}
export function join(w:World,name:string,token:string,faction:Faction,now=Date.now()):Miner {
  const home=FACTIONS[faction].home;
  if(!w.players.length) w.nextWave=now+90000;
  const p:Miner={id:crypto.randomUUID(),token,name:name.trim().slice(0,18)||'Mineur',faction,coins:800,
    inventory:{ferrite:200,cuivre:60,titane:0,prisme:0},rigs:1,power:0,core:0,pick:1,scanner:0,
    refinery:false,autoSell:false,mined:0,sold:0,lastMine:0,mining:null,drill:newDrill(),units:3,hp:90,
    ...home,target:null,respawn:0,lastSeen:now,joined:now,damage:0,relayBlocks:0,lastActionIds:[],
    reportedMined:0,reportedCoins:800};
  ensureBase(w.planet,p.id,crypto.randomUUID());
  w.players.push(p);
  addLog(w,p.name+' rejoint '+FACTIONS[faction].name+'.',now);
  return p;
}
export const maxHp=(p:Pick<Miner,'units'>)=>p.units*30;
export function cost(p:Pick<Miner,'rigs'|'power'|'core'|'pick'|'scanner'|'units'>,kind:string){
  switch(kind){
    case 'rig': return Math.ceil(450*1.48**p.rigs);
    case 'power': return Math.ceil(1100*2.15**p.power);
    case 'pick': return Math.ceil(300*2**p.pick);
    case 'army': return Math.ceil(260*1.22**p.units);
    case 'core': return Math.ceil(1800*2.1**p.core);
    case 'refinery':return 900;
    default: return Infinity;
  }
}
const drillsPerTick=(p:Miner)=>Math.min(12,Math.max(1,Math.floor(p.rigs*(1+p.power*.35)*(1+p.core*.12))))+drillExtraBlocks(p);
function pay(p:Miner,coins:number,items:Partial<Inventory>={}){
  if(!Number.isFinite(coins)||p.coins<coins) throw Error('Crédits insuffisants.');
  for(const [key,n] of Object.entries(items)) if(p.inventory[key as Resource]<n) throw Error('Ressources insuffisantes.');
  p.coins-=coins;
  for(const [key,n] of Object.entries(items)) p.inventory[key as Resource]-=n;
}
export function sell(p:Miner){
  let value=0;
  for(const r of ['ferrite','cuivre','titane'] as Resource[]){value+=p.inventory[r]*RESOURCES[r].value;p.inventory[r]=0;}
  p.coins+=value;p.sold+=value;
  return value;
}
function move(x:number,y:number,tx:number,ty:number,distance:number){
  const length=Math.hypot(tx-x,ty-y);
  return length<=distance?{x:tx,y:ty}:{x:x+(tx-x)*distance/length,y:y+(ty-y)*distance/length};
}
const onRelay=(p:Miner,r:Relay)=>p.hp>0&&p.target===r.id&&Math.hypot(p.x-r.x,p.y-r.y)<.3;
const occupied=(w:World,r:Relay)=>w.enemies.some(e=>e.target===r.id&&Math.hypot(e.x-r.x,e.y-r.y)<.3);
function guardsAt(w:World,r:Relay,now:number){
  return w.players.filter(p=>now-p.lastSeen<=OFFLINE_CAP&&onRelay(p,r));
}
export function beneficiaries(w:World,r:Relay,now=w.last){
  return guardsAt(w,r,now).filter(p=>r.allianceUntil>now?r.contributors.includes(p.id):p.faction===r.owner);
}
export function relayRate(w:World,p:Miner,now=w.last){
  let rate=0;
  for(const r of w.relays){if(occupied(w,r))continue;const group=beneficiaries(w,r,now);
    if(group.some(q=>q.id===p.id))rate+=36/group.length;}
  return rate;
}
function spawnRaid(w:World,now:number){
  w.wave++;
  const targets=w.relays.map(r=>{
    const n=r.owner?w.relays.filter(t=>t.owner===r.owner).length:0;
    return {r,n,weight:1+3*n*n+(r.owner?4:0)+guardsAt(w,r,now).length};
  });
  let choice=(((Math.imul(w.wave+31,2654435761)^w.seed)>>>0)/2**32)*targets.reduce((s,t)=>s+t.weight,0);
  const {r,n}=targets.find(t=>(choice-=t.weight)<=0)??targets[0];
  const active=w.players.filter(p=>now-p.lastSeen<=180000).length;
  const hp=105+Math.min(120,w.wave*4)+n*n*35+Math.max(0,active-2)*18;
  const edge=w.wave%4, x=edge===0?0:edge===1?23:r.x, y=edge===2?0:edge===3?23:r.y;
  const previous=w.enemies.find(e=>e.target===r.id);
  if(previous){previous.hp=Math.min(previous.maxHp*1.5,previous.hp+hp*.4);}
  else {
    r.contributors=[];
    w.enemies.push({id:'vague-'+w.wave,x,y,target:r.id,hp,maxHp:hp,damage:4+Math.min(4,w.wave*.15)+n*n*.7});
  }
  addLog(w,'La Ruche marche vers '+r.name+'.',now,'war');
}
function damage(p:Miner,amount:number,now:number){
  p.hp=Math.max(0,p.hp-amount*incomingDamageFactor(p));
  if(!p.hp)p.respawn=now+90000;
}
function combatStep(w:World,now:number){
  const dt=TICK/1000;
  for(const p of w.players){
    if(p.hp<=0&&p.respawn<=now){p.hp=maxHp(p);p.target=null;Object.assign(p,FACTIONS[p.faction].home);}
    if(p.hp>0&&p.target){const r=w.relays.find(t=>t.id===p.target);if(r) Object.assign(p,move(p.x,p.y,r.x,r.y,dt*.35*maneuverFactor(p)));}
    if(p.hp>0&&!p.target) p.hp=Math.min(maxHp(p),p.hp+dt*1.2);
  }
  if(w.players.length&&now>=w.nextWave){spawnRaid(w,now);w.nextWave=now+75000;}
  for(const e of [...w.enemies]){
    const r=w.relays.find(r=>r.id===e.target);
    if(!r)continue;
    Object.assign(e,move(e.x,e.y,r.x,r.y,dt*.22));
    if(Math.hypot(e.x-r.x,e.y-r.y)>.3)continue;
    const defenders=guardsAt(w,r,now);
    if(defenders.length){
      for(const p of defenders){
        const hit=Math.sqrt(p.units)*3*dt*attackFactor(p);p.damage+=hit;e.hp-=hit;
        if(!r.contributors.includes(p.id))r.contributors.push(p.id);
      }
      if(e.hp<=0){
        w.enemies=w.enemies.filter(enemy=>enemy.id!==e.id);r.allianceUntil=now+180000;
        w.integrity=Math.min(100,w.integrity+3);
        addLog(w,'Victoire commune à '+r.name+'. Prime partagée pendant trois minutes.',now,'war');
      }else for(const p of defenders)damage(p,e.damage*dt/defenders.length,now);
    }else if(r.owner){
      r.owner=null;r.capturing=null;r.progress=0;r.allianceUntil=0;w.integrity=Math.max(20,w.integrity-6);
      addLog(w,'La Ruche s’empare de '+r.name+'.',now,'war');
    }
  }
  for(const r of w.relays){
    if(occupied(w,r))continue;
    let guards=guardsAt(w,r,now);
    if(r.allianceUntil<=now){
      if(new Set(guards.map(p=>p.faction)).size>1){
        for(const p of guards){
          const hostile=guards.filter(q=>q.faction!==p.faction).reduce((s,q)=>s+Math.sqrt(q.units)*1.1*attackFactor(q),0);
          damage(p,hostile*dt/guards.filter(q=>q.faction===p.faction).length,now);
        }
        guards=guardsAt(w,r,now);
      }
      const powers=(Object.keys(FACTIONS) as Faction[]).map(f=>({f,
        strength:guards.filter(p=>p.faction===f).reduce((s,p)=>s+Math.sqrt(p.units),0)/(1+.12*w.relays.filter(t=>t.owner===f).length)
      })).sort((a,b)=>b.strength-a.strength);
      if(powers[0].strength>powers[1].strength*1.1){
        const f=powers[0].f;
        if(r.owner===f){r.progress=0;r.capturing=null;}
        else {
          if(r.capturing!==f){r.progress=0;r.capturing=f;}
          const factionGuards=guards.filter(p=>p.faction===f);
          const factor=factionGuards.reduce((sum,p)=>sum+maneuverFactor(p),0)/factionGuards.length;
          r.progress+=dt/(r.owner?75:45)*100*factor;
          if(r.progress>=100){r.owner=f;r.progress=0;r.capturing=null;addLog(w,FACTIONS[f].name+' capture '+r.name+'.',now,'war');}
        }
      }else if(!powers[0].strength){r.progress=Math.max(0,r.progress-dt);}
    }
    const group=beneficiaries(w,r,now);
    if(group.length){
      const reward=36*dt/60;
      for(const p of group){p.coins+=reward/group.length;p.relayBlocks+=reward/group.length;}
      r.produced+=reward;
    }
  }
}
function distance(a:Point,b:Point){return Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);}
function mineWithDrill(w:World,p:Miner,now:number){
  const d=p.drill;
  if(d.status!=='deployed'||!d.origin||!d.at||now-p.lastSeen>OFFLINE_CAP){d.bonusCarry=0;return;}
  if(now<d.next)return;
  // Six extra blocks/minute per relay divided across its defenders. Only
  // whole extraction attempts can remove blocks; unused capacity never pays out.
  const share=relayRate(w,p,now)/6;
  const accrued=share>0?(d.bonusCarry??0)+share*TICK/60000:0;
  const extra=Math.floor(accrued+1e-9);
  d.bonusCarry=Math.max(0,accrued-extra);
  let at:Point=d.at;
  for(let i=0;i<drillsPerTick(p)+extra&&d.health>0;i++){
    const point:Point|null=canExcavate(w.planet,p.id,at)?at:nextMachineTarget(w.planet,p.id,at,d.face);
    if(!point||distance(point,d.origin)>30){d.status='exhausted';break;}
    if(!canStage(p,point)){d.bonusCarry=0;break;}
    const mined=machineMine(w.planet,p.id,point);
    if(!mined){d.status='exhausted';break;}
    d.at=point;at=point;
    stage(p,point,mined.ore,now);p.mined++;w.extracted++;d.health--;
    if(!d.health)d.status='damaged';
  }
  if(d.status!=='deployed')d.bonusCarry=0;
  d.next=now+TICK;
}
function freightDetour(w:World,p:Miner,site:Point,at:number){
  if(!w.enemies.length)return;
  const home=w.planet.bases[p.id]?.home,chunk=chunkAt(site);
  if(home && chunk.x===home.x && chunk.y===home.y && chunk.z===home.z)return;
  for(const r of w.relays){
    if(distance(site,r.point)>64||!occupied(w,r))continue;
    const covered=guardsAt(w,r,at).some(guard=>guard.faction===p.faction||
      (r.allianceUntil>at && r.contributors.includes(guard.id)));
    if(!covered)return {relay:r.name,delayMs:12_000};
  }
}
function haul(w:World,p:Miner,now:number){
  if(!p.logistics)return;
  if(!p.logistics.sites.length && p.logistics.convoys.every(c=>c.phase==='idle')){
    p.logistics.clock=Math.max(p.logistics.clock,now);
    return;
  }
  advanceHaul(p,homePoint(w.planet,p.id),now,reservedSpace(w.offers,p.id),p.autoSell&&p.refinery?()=>sell(p):undefined,
    (site,at)=>freightDetour(w,p,site,at));
}
function settleManuals(w:World,now:number){
  const pending=w.players.filter(p=>p.mining && p.mining.ready<=Math.min(now,p.lastSeen+OFFLINE_CAP))
    .sort((a,b)=>a.mining!.ready-b.mining!.ready);
  for(const p of pending){
    const until=Math.min(now,p.lastSeen+OFFLINE_CAP);
    const at=Math.max(p.mining!.ready,p.logistics?.clock??0);
    if(at>until)continue;
    const finish=(time:number)=>{
      haul(w,p,time);
      const mined=finishMine(w.planet,p,time,(point,ore)=>stage(p,point,ore,time));
      if(mined?.mined){w.extracted+=mined.mined;haul(w,p,time);}
    };
    finish(at);
    if(p.mining && at<until)finish(until);
  }
}
export function wakeFleet(p:Miner,now:number){
  const expiry=p.lastSeen+OFFLINE_CAP;
  const state=p.logistics;
  if(!state || now<=expiry || state.clock>=now)return;
  const slept=now-Math.max(expiry,state.clock);
  for(const c of state.convoys){
    if(c.phase==='outbound'||c.phase==='returning'){c.started+=slept;c.due+=slept;}
  }
  state.clock=now;
}
export function advance(w:World,now=Date.now()){
  settleWorkshops(w,now);
  const end=Math.floor(now/TICK)*TICK;
  if(!w.players.length){w.last=Math.max(w.last,end);return;}
  const latestActive=Math.max(...w.players.map(p=>p.lastSeen));
  const limit=Math.min(end,w.last+OFFLINE_CAP,latestActive+OFFLINE_CAP);
  for(let tick=w.last+TICK;tick<=limit;tick+=TICK){
    // A departure between battle ticks sees the previous front, even on a long offline catch-up.
    settleManuals(w,tick-1);
    for(const p of w.players)if(tick-1<=p.lastSeen+OFFLINE_CAP)haul(w,p,tick-1);
    combatStep(w,tick);
    settleManuals(w,tick);
    for(const p of w.players){
      if(tick>p.lastSeen+OFFLINE_CAP)continue;
      haul(w,p,tick);
      mineWithDrill(w,p,tick);
      haul(w,p,tick);
    }
  }
  settleManuals(w,now);
  w.last=Math.max(w.last,end);
  for(const p of w.players){
    const through=Math.min(now,p.lastSeen+OFFLINE_CAP);
    haul(w,p,through);
    // Honor a scanner order already paid for before the planet migration.
    if(p.rare&&p.rare.ready<=now){p.inventory.prisme+=p.rare.amount;p.rare=null;}
  }
}
function upgrade(p:Miner,kind:string){
  const limits:Record<string,[number,number]>={rig:[p.rigs,12],power:[p.power,12],pick:[p.pick,10],army:[p.units,30],core:[p.core,10],refinery:[+p.refinery,1]};
  if(!Object.hasOwn(limits,kind))throw Error('Amélioration inconnue.');
  if(limits[kind][0]>=limits[kind][1])throw Error('Niveau maximal atteint.');
  const material=kind==='core'?{prisme:3*(p.core+1)}:kind==='power'?{cuivre:40*(p.power+1)}:kind==='army'?{ferrite:50,cuivre:10}:{};
  pay(p,cost(p,kind),material);
  if(kind==='core')p.core++;
  if(kind==='rig')p.rigs++;
  if(kind==='power')p.power++;
  if(kind==='pick')p.pick++;
  if(kind==='army'){p.units++;if(p.hp>0)p.hp+=30;}
  if(kind==='refinery'){p.refinery=true;p.autoSell=true;}
  return {message:'Amélioration installée.'};
}
function isFace(face:unknown):face is Face{return ['top','bottom','north','south','east','west'].includes(String(face));}
function deploy(w:World,p:Miner,a:Record<string,unknown>,now:number){
  const point=a.block;
  if(a.unit==='drill'){
    if(!validPoint(point)||!isFace(a.face))throw Error('Choisissez une case et une face pour la foreuse.');
    if(p.drill.health<=0)throw Error('Réparez la foreuse avant son déploiement.');
    if(!canExcavate(w.planet,p.id,point))throw Error('Installez la foreuse sur une roche exposée de votre territoire ou en terrain libre.');
    Object.assign(p.drill,{at:point,origin:point,face:a.face,next:now+TICK,status:'deployed',bonusCarry:0});
    return {message:'Foreuse déployée. Première extraction dans dix secondes.'};
  }
  if(a.unit!==undefined&&a.unit!=='squad')throw Error('Unité inconnue.');
  const r=a.relay?w.relays.find(r=>r.id===a.relay):validPoint(point)?w.relays.find(r=>distance(r.point,point)<=32):undefined;
  if(!r)throw Error('Déployez l’escouade sur un relais ou à moins de 32 blocs de celui-ci.');
  if(p.hp<=0)throw Error('Votre escouade est en réparation.');
  p.target=r.id;
  return {message:'Escouade en route vers '+r.name+'.'};
}
export type GameAction = {type:string;requestId?:string;[key:string]:unknown};
function doAction(w:World,p:Miner,a:GameAction,now:number){
  checkTradeSpace(w.players,w.offers,p,a);
  const econ=actEconomy(w,p,a,now);
  if(econ)return econ;
  switch(a.type){
    case 'mine': {
      if(!validPoint(a.block))throw Error('Sélectionnez un bloc de la planète.');
      const result=manualMine(w.planet,p,a.block,now,{cooldownMs:cooldownFor(p),durationFactor:pickTimeFactor(p),
        receive:(point,ore)=>stage(p,point,ore,now)});
      w.extracted+=result.mined;
      return result;
    }
    case 'expand': {
      if(!validChunk(a.parcel))throw Error('Sélectionnez une parcelle voisine.');
      return expandTerritory(w.planet,p,a.parcel);
    }
    case 'logistics': {
      if(a.kind!=='dispatch')return haulAction(p,a.kind);
      if(!validPoint(a.block)||!isExposed(w.planet,a.block))throw Error('Choisissez un point d’enlèvement exposé.');
      const owner=territoryOwner(w.planet,chunkAt(a.block));
      if(owner&&owner!==p.id)throw Error('Cette concession appartient à un autre mineur.');
      return haulAction(p,'dispatch',a.block);
    }
    case 'deploy': return deploy(w,p,a,now);
    case 'repair':
      if(a.unit==='drill'){
        if(p.drill.health>=100)throw Error('Foreuse déjà en parfait état.');
        pay(p,60,{ferrite:40});
        p.drill.health=100;p.drill.at=null;p.drill.origin=null;p.drill.status='ready';p.drill.bonusCarry=0;
        return {message:'Foreuse réparée et ramenée au dépôt.'};
      }
      if(a.unit!=='squad')throw Error('Unité inconnue.');
      if(p.hp>=maxHp(p))throw Error('Escouade déjà opérationnelle.');
      pay(p,80,{ferrite:20});p.hp=maxHp(p);p.respawn=0;p.target=null;Object.assign(p,FACTIONS[p.faction].home);
      return {message:'Escouade réparée au dépôt.'};
    case 'recall':
      if(a.unit==='drill'){
        p.drill.at=null;p.drill.origin=null;p.drill.bonusCarry=0;p.drill.status=p.drill.health>0?'ready':'damaged';
        return {message:'Foreuse rappelée au dépôt.'};
      }
      if(a.unit!==undefined&&a.unit!=='squad')throw Error('Unité inconnue.');
      p.target=null;Object.assign(p,FACTIONS[p.faction].home);return {message:'Escouade rappelée au dépôt.'};
    case 'research':return buyResearch(p,a.skill);
    case 'upgrade':return upgrade(p,String(a.kind));
    case 'sell':return {message:'Vente au comptoir : '+sell(p)+' crédits.'};
    case 'autosell':
      if(!p.refinery)throw Error('Débloquez la raffinerie automatique.');
      p.autoSell=!p.autoSell;return {message:p.autoSell?'Vente automatique activée.':'Vente automatique désactivée.'};
    case 'transfer': {
      const recipient=w.players.find(q=>q.id===a.recipient);
      if(!recipient||recipient.id===p.id)throw Error('Choisissez un autre mineur.');
      const n=a.amount;
      if(typeof n!=='number'||!Number.isSafeInteger(n)||n<1||n>1000000000)throw Error('Montant invalide.');
      pay(p,n);recipient.coins+=n;return {message:'Transfert effectué.'};
    }
    default:throw Error('Action inconnue.');
  }
}
export function act(w:World,p:Miner,a:GameAction,now=Date.now()){
  if(a.requestId!==undefined&&(typeof a.requestId!=='string'||a.requestId.length>100||!a.requestId))throw Error('Identifiant d’action invalide.');
  if(a.requestId&&p.lastActionIds.includes(a.requestId))return {message:'Action déjà traitée.'};
  haul(w,p,now);
  const result=doAction(w,p,a,now);
  haul(w,p,now);
  if(a.requestId){p.lastActionIds.push(a.requestId);p.lastActionIds=p.lastActionIds.slice(-64);}
  return result;
}
// The SQL layer loads only neighborhoods the authorized simulation or requested
// local view can touch. Deployed rigs cannot leave a 30-block operating radius.
export function neededChunks(w:World,focus:Focus|null,action:GameAction|undefined,now:number){
  const keys=new Set<string>(focus?regionKeys(focus):[]);
  const include=(pt:Point,radius:number)=>{for(const key of keysAround(pt,radius))keys.add(key);};
  if(validPoint(action?.block))include(action.block,1);
  const end=Math.floor(now/TICK)*TICK;
  for(const p of w.players){
    if(p.mining&&p.mining.ready<=now)include(p.mining.point,1);
    if(end>w.last&&p.drill.status==='deployed'&&p.drill.origin&&w.last<=p.lastSeen+OFFLINE_CAP){
      // A search may read neighbors bordering the region of operation.
      include(p.drill.origin,2);
    }
  }
  return [...keys];
}
type MarkerKind='drill'|'squad'|'hauler'|'depot'|'crate';
type MachineView={point:Point;name:string;kind:MarkerKind;health:number;maxHealth:number;faction:Faction;mine:boolean};
export function localRegion(w:World,focus:Focus,me?:Miner,revision=0,now=Date.now()){
  const region=regionView(w.planet,focus,me?.id);
  const machines:MachineView[]=[];
  for(const p of w.players){
    function mark(kind:MarkerKind,point:Point|null|undefined,health:number,maxHealth:number,name=p.name){
      if(!point)return;
      const loc=pointOnFace(focus.face,point);
      if(loc.u<region.originU||loc.u>=region.originU+region.size||loc.v<region.originV||loc.v>=region.originV+region.size)return;
      const cell=region.tiles.find(t=>t.u===loc.u&&t.v===loc.v);
      if(!cell||cell.status==='unknown')return;
      // The surface dock spans the shaft mouth even after the owner digs beneath it.
      const dockOverShaft=kind==='depot' && (focus.depth??0)===0 && loc.depth===0;
      if(!dockOverShaft && Math.abs(cell.depth-loc.depth)>1)return;
      machines.push({point,name,kind,health,maxHealth,faction:p.faction,mine:p.id===me?.id});
    }
    const r=w.relays.find(r=>onRelay(p,r));
    const base=homePoint(w.planet,p.id);
    mark('depot',base,100,100);
    mark('drill',p.drill.at,p.drill.health,100);
    mark('squad',r?.point,p.hp,maxHp(p));
    if(!p.logistics)continue;
    for(const c of p.logistics.convoys){
      mark('hauler',convoyPoint(c,base,Math.min(now,p.lastSeen+OFFLINE_CAP)),100,100,p.name+' · T'+c.id);
    }
    if(p.id===me?.id){
      for(const site of p.logistics.sites)mark('crate',site.point,100,100);
    }
  }
  return {...region,machines,revision};
}
export function publicWorld(w:World,me?:Miner,now=Date.now(),focus:Focus|null=null){
  const bonus=me?relayRate(w,me,now):0;
  const harvestBonus=me?.drill.status==='deployed'?bonus/6:0;
  const personal=me?{id:me.id,name:me.name,faction:me.faction,coins:me.coins,inventory:me.inventory,rigs:me.rigs,
    research:me.research??[],pickCooldownMs:cooldownFor(me),
    power:me.power,core:me.core,pick:me.pick,scanner:me.scanner,refinery:me.refinery,autoSell:me.autoSell,mined:me.mined,
    lastMine:me.lastMine,units:me.units,hp:me.hp,x:me.x,y:me.y,target:me.target,respawn:me.respawn,damage:me.damage,
    rate:me.drill.status==='deployed'?drillsPerTick(me)*60/(TICK/1000)+harvestBonus:0,bonus,harvestBonus,relayBlocks:me.relayBlocks,
    logistics:logisticsView(me,w.offers),base:w.planet.bases[me.id],homeFocus:homeFocus(w.planet,me.id),homePoint:homePoint(w.planet,me.id),
    extensionPrice:extendPrice(w.planet.bases[me.id]),drill:me.drill,mining:me.mining??null}:null;
  return {extracted:w.extracted,relays:w.relays,enemies:w.enemies,wave:w.wave,nextWave:w.nextWave,integrity:w.integrity,
    log:w.log,created:w.created,serverTime:now,last:w.last,players:w.players.map(p=>({id:p.id,name:p.name,
      faction:p.faction,mined:p.mined,lastSeen:p.lastSeen,units:p.units,hp:p.hp,x:p.x,y:p.y,target:p.target,damage:p.damage})),
    region:focus?localRegion(w,focus,me,0,now):null,me:personal,economy:economyView(w,me)};
}
export type View=ReturnType<typeof publicWorld>;
