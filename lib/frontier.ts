import {charterAvailable,orderOutpost,settleOutposts} from './colonies';
import {FLOW_WINDOW,witnessedFlow} from './factory-flow';
import {actorSnapshot,appendActivity,actionContext,monitorActivity} from './activity-journal';
import {RELEASE_ID} from './release';
import { FACE_ORDER, SIDE, homeFocus, marketDistricts, normalizeFocus, type Face, type Focus } from './planet';
import { along, clampPlace, geologyNoise, keyFor, naturalDeposit, range, scoutWaypoint, surface, tripTo, type Place, type Trip } from './frontier-geography';
import { attackFactor, buyResearch, drillExtraBlocks, haulCapacityBonus, haulSpeedFactor, incomingDamageFactor, maneuverFactor } from './research';
import { actEconomy, economyView, settleWorkshops, ensureEconomy, GOODS, type TradeOffer } from './economy';
import {shared,ensureWorkers,stepWorkers,settleCooperation,cooperationView,actCooperation,finishServiceTruck,stepServiceEscorts,isServiceEscort,guardedByService,serviceDefenders,extractionFactor,freightSpeed,freightLoad,militiaAttack,militiaDefense,specialtyLevel,warFactor,workerSpeed,type Worker,type SpecialtyId,type Cooperation} from './cooperation';
import {depotLimit,hasBuilding} from './frontier-capacity';
import {knowsIndustry} from './industry';
import {factoryState, advanceFactory, actFactory, factoryView} from './factory-sim';
import {FACTORY_KINDS, cellPlace, foundation, type Cell, type FactoryState, type FactoryPiece} from './factory-grid';
import type { World, Miner, Inventory, Resource } from './world';

const STEP=5000, IDLE_LIMIT=4*3600000, SENSOR=260, TOWN_SENSOR=300;
const ORES:Resource[]=['ferrite','cuivre'];
export const stock = ():Inventory => ({ferrite:0,cuivre:0,titane:0,prisme:0});
const amount = (s:Inventory) => ORES.reduce((n,r)=>n+s[r],0);
type Mobile = {point:Place;trip:Trip|null;hull:number};
export type Target = {kind:'camp'|'rig'|'factory'|'base'|'army'|'truck';id:string};
export type Company = Mobile & {order:'hold'|'move'|'attack'|'patrol'|'return'|'escort';target:Target|null;rally:Place;ammo:number;loot:Inventory;pvp:boolean};
export type Truck = Mobile & {id:string;phase:'idle'|'manual'|'pickup'|'delivery'|'city'|'return'|'repair';rig:string|null;city:string|null;cargo:Inventory;escort:boolean;role?:'collect'|'trade'|'standby';guns?:boolean;disabledUntil?:number;reserved?:Inventory|null;contract?:string|null};
export type Rig = {id:string;owner:string;deposit:string;point:Place;hull:number;stock:Inventory;active:boolean;carry?:number;grid?:Cell};
export type Deposit = {id:string;point:Place;ore:Resource;total:number;remaining:number;guards:number;maxGuards:number;respawn:number;safe?:boolean};
export type Town = {id:string;name:string;point:Place};
export type Captain = {
  tradeReserve?:{ferrite:number;cuivre:number};workerFinance?:{fees:number;revenue:number};returnedCargo?:number;rigDelivered?:number;workers?:Worker[];startedWorkers?:boolean;mamGranted?:boolean;talents?:SpecialtyId[];talentJob?:{id:SpecialtyId;start:number;ready:number}|null;metals?:2;factory?:FactoryState;home:Place;hull:number;ruinedAt:number;turrets:number;scout:Mobile & {auto:boolean;step:number};
  army:Company;trucks:Truck[];towns:string[];deposits:string[];explored:string[];
  stores:Record<string,Inventory>;autoTrade:{city:string;ore:Resource;quantity:number}|null;
  guild:string|null;friends:string[];requests:string[];delivered:number;note:string[];
};
export type FrontierState = {
  cooperation?:Cooperation;version:1;metals?:2;time:number;deposits:Record<string,Deposit>;rigs:Rig[];
  guilds:{id:string;name:string;leader:string;founder?:string;foundedAt?:number;members:string[];invites:string[];declined?:string[]}[];
  chat:{id:string;author:string;name:string;guild:string|null;text:string;at:number}[];
  markets:Record<string,{offers:TradeOffer[]}>;events:{id:string;text:string;at:number;players:string[]}[];
};
function cities():Town[] {
  const words=['Braise','Mèche','Dérive','Rouille','Cendre','Cordon','Étoffe','Brèche','Écluse','Mistral','Poussière','Caravane','Traverse','Halo','Lisière','Nouage'];
  return marketDistricts.map(({face,column,row,market}, index) => ({
    id:'v/'+face+'/'+column+'/'+row,
    name:words[index % words.length]+' · '+(FACE_ORDER.indexOf(face)+1),
    point:market
  }));
}
export const TOWNS=cities();
const townById = (id:unknown) => TOWNS.find(t=>t.id===id);
function nearestTown(at:Place) {return TOWNS.reduce((a,b)=>range(at,a.point)<range(at,b.point)?a:b);}
function depositAt(face:Face,x:number,y:number):Deposit {
  const site=naturalDeposit(face,x,y);
  return {...site,remaining:site.total,guards:0,maxGuards:site.ore==='cuivre'?160:90,respawn:0};
}
function nearbyNodes(at:Place,radius:number):Deposit[] {
  const result:Deposit[]=[];
  const last=Math.floor((SIDE-1)/384);
  for(let x=Math.max(0,Math.floor((at.u-radius)/384));x<=Math.min(last,Math.floor((at.u+radius)/384));x++){
    for(let y=Math.max(0,Math.floor((at.v-radius)/384));y<=Math.min(last,Math.floor((at.v+radius)/384));y++){
      const n=depositAt(at.face,x,y);
      if(n.point.u<SIDE&&n.point.v<SIDE&&range(at,n.point)<=radius)result.push(n);
    }
  }
  return result;
}
const captain=(p:Miner)=>p.expedition!;
const state=(w:World)=>w.frontier!;
const allied=(a:Miner,b:Miner)=>a.id===b.id||Boolean(captain(a).guild&&captain(a).guild===captain(b).guild);
function calm(w:World,at:Place) {
  return w.players.some(p=>p.expedition&&range(captain(p).home,at)<=500);
}
function peaceful(at:Place) {return TOWNS.some(t=>range(at,t.point)<100);}
function log(w:World,text:string,players:string[],now:number) {
  const s=state(w);
  s.events.unshift({id:crypto.randomUUID(),text,players,at:now});
  s.events=s.events.slice(0,100);
  for(const id of players){
    const actor=w.players.find(p=>p.id===id);
    if(actor)appendActivity(w,actor,'progress','terrain/evenement',text,{participants:players},now);
  }
}
export function ensureFrontier(w:World,now:number) {
  w.frontier??={version:1,time:now,deposits:{},rigs:[],guilds:[],chat:[],markets:{},events:[]};
  if(w.frontier.metals!==2){for(const d of Object.values(w.frontier.deposits)){if(d.ore==='titane')d.ore='ferrite';if(d.ore==='prisme')d.ore='cuivre';}w.frontier.metals=2;}
  shared(w,now);
  for(const p of w.players){
    if(p.expedition){migrateMetals(w,p);factoryState(p,now);ensureWorkers(p,now);continue;}
    const home=surface(homeFocus(w.planet,p.id));
    p.expedition={home,hull:500,ruinedAt:0,turrets:0,
      scout:{point:clampPlace({...home,u:home.u-36,v:home.v+28}),trip:null,hull:90,auto:false,step:0},
      army:{point:clampPlace({...home,u:home.u+55,v:home.v+30}),trip:null,hull:p.units*50,order:'hold',target:null,rally:{...home},ammo:120,loot:stock(),pvp:false},
      trucks:[],
      towns:[nearestTown(home).id],deposits:[],explored:[],stores:{},autoTrade:null,guild:null,friends:[],requests:[],delivered:0,note:[]};
    // Preserve resources already paid for and cargo en route in the voxel edition.
    if(p.logistics){
      for(const site of p.logistics.sites)for(const r of ORES)p.inventory[r]+=site.stock[r];
      for(const truck of p.logistics.convoys)for(const r of ORES)p.inventory[r]+=truck.cargo[r];
      p.logistics.sites=[];p.logistics.convoys=[];
    }
    p.drill.at=null;p.drill.status='ready';p.mining=null;p.target=null;
    migrateMetals(w,p);factoryState(p,now);
    discover(w,p,home,590,now);
    // Every fresh camp needs both basic ores inside its quiet starting area.
    // These finite nodes are ordinary world deposits, not inventory grants.
    for(const ore of ['ferrite','cuivre'] as const)if(!p.expedition.deposits.some(id=>state(w).deposits[id]?.ore===ore&&range(home,state(w).deposits[id].point)<=500)){
      const id='starter/'+p.id+'/'+ore,point=clampPlace({...home,u:home.u+(ore==='cuivre'?190:-190),v:home.v+120});
      state(w).deposits[id]={id,point,ore,total:8000,remaining:8000,guards:0,maxGuards:0,respawn:0,safe:true};p.expedition.deposits.push(id);
    }
    ensureWorkers(p,now);
  }
}
function migrateMetals(w:World,p:Miner){
  const c=captain(p);if(c.metals===2)return;
  const convert=(s:Partial<Record<string,number>>)=>{
    const ti=s.titane??0,pr=s.prisme??0;
    if(ti||pr){s.ferrite=(s.ferrite??0)+ti;s.cuivre=(s.cuivre??0)+pr;p.coins+=ti*14+pr*146;}
    s.titane=0;s.prisme=0;
  };
  convert(p.inventory);convert(c.army.loot);
  for(const t of c.trucks){convert(t.cargo);if(t.reserved)convert(t.reserved);if(t.rig?.startsWith('withdraw/'))t.rig=t.rig.replace('/titane/','/ferrite/').replace('/prisme/','/cuivre/');}
  for(const s of Object.values(c.stores))convert(s);
  for(const r of state(w).rigs.filter(r=>r.owner===p.id))convert(r.stock);
  for(const r of c.factory?.pieces??[]){convert(r.items);convert(r.output);}
  if(c.autoTrade){if(c.autoTrade.ore==='titane')c.autoTrade.ore='ferrite';if(c.autoTrade.ore==='prisme')c.autoTrade.ore='cuivre';}
  for(const market of Object.values(state(w).markets))for(const offer of market.offers){const o=offer as unknown as {give:string;want:string};if(offer.owner===p.id){o.give=o.give==='titane'?'ferrite':o.give==='prisme'?'cuivre':o.give;o.want=o.want==='titane'?'ferrite':o.want==='prisme'?'cuivre':o.want;}}
  const e=ensureEconomy(p);
  if(e.job){const job=e.job;e.refined[job.recipe]+=(job.batches-job.delivered)*(job.recipe==='module'?1:2);e.job=null;}
  if(p.rare){p.inventory.cuivre+=p.rare.amount;p.coins+=p.rare.amount*146;p.rare=null;}
  c.metals=2;
}
function layoutRigs(w:World) {
  for(const r of state(w).rigs){
    if(r.grid)continue;
    const node=state(w).deposits[r.deposit],anchor=foundation(node?.point??r.point,1);
    const taken=state(w).rigs.filter(q=>q.deposit===r.deposit&&q.grid).map(q=>q.grid!.x);
    let x=anchor.x-5;
    while(taken.includes(x))x+=4;
    r.grid={face:anchor.face,x,y:anchor.y+2};r.point=cellPlace(r.grid,3);
  }
}
function discover(w:World,p:Miner,at:Place,radius:number,now:number) {
  const s=state(w),c=captain(p);
  const mark=keyFor(at);
  if(!c.explored.includes(mark)){c.explored.push(mark);if(c.explored.length>2400)c.explored.shift();}
  for(const raw of nearbyNodes(at,radius)){
    if(!s.deposits[raw.id]){
      raw.safe=calm(w,raw.point)||peaceful(raw.point);
      raw.guards=raw.safe?0:raw.ore==='ferrite'&&geologyNoise(raw.point.u,raw.point.v)<.6?0:raw.maxGuards;
      s.deposits[raw.id]=raw;
    }
    if(range(c.home,raw.point)<=500){s.deposits[raw.id].safe=true;s.deposits[raw.id].guards=0;}
    if(!c.deposits.includes(raw.id))c.deposits.push(raw.id);
  }
  for(const town of TOWNS){
    if(range(at,town.point)>TOWN_SENSOR||c.towns.includes(town.id))continue;
    c.towns.push(town.id);log(w,'Ville découverte · '+town.name,[p.id],now);
  }
}
function spend(p:Miner,credits:number,materials:Partial<Inventory>={}) {
  if(p.coins<credits)throw Error('Crédits insuffisants.');
  for(const r of ORES)if(p.inventory[r]<(materials[r]??0))throw Error('Le dépôt manque de '+r+'.');
  p.coins-=credits;
  for(const r of ORES)p.inventory[r]-=materials[r]??0;
}
function depart(unit:Mobile,to:Place,now:number,speed:number) {unit.trip=tripTo(unit.point,to,now,speed);}
function moveUnit(unit:Mobile,now:number) {
  if(!unit.trip)return false;
  unit.point=along(unit.trip,now);
  if(now<unit.trip.due)return false;
  unit.point={...unit.trip.to};unit.trip=null;return true;
}
function take(source:Partial<Inventory>,dest:Inventory,limit:number) {
  let left=Math.max(0,limit);
  for(const r of ['cuivre','ferrite'] as const){
    const n=Math.min(left,source[r]??0);source[r]=(source[r]??0)-n;dest[r]+=n;left-=n;
  }
}
function finishTruck(w:World,p:Miner,t:Truck,now:number) {
  const s=state(w),c=captain(p),capacity=16+haulCapacityBonus(p)+freightLoad(p);
  const arrived=moveUnit(t,now);
  if(t.phase==='manual'){if(!t.trip)t.phase='idle';return;}
  if(t.contract){finishServiceTruck(w,p,t,now,arrived);return;}
  if(t.phase==='repair'){
    if(t.reserved&&t.city){take(t.reserved,c.stores[t.city]??=stock(),amount(t.reserved));t.reserved=null;}
    if(now>=(t.disabledUntil??now)){t.hull=140;t.phase='delivery';depart(t,c.home,now,25);}
    return;
  }
  if(t.trip)return;
  if(t.phase==='pickup'&&arrived){
    const rig=s.rigs.find(r=>r.id===t.rig&&r.owner===p.id);
    if(rig)take(rig.stock,t.cargo,capacity);
    t.phase='delivery';depart(t,c.home,now,45*haulSpeedFactor(p)*freightSpeed(p));return;
  }
  if(t.phase==='delivery'){
    const used=amount(p.inventory),max=Math.max(depotLimit(p),used);
    const before=amount(t.cargo);take(t.cargo,p.inventory,max-used);
    c.delivered+=before-amount(t.cargo);
    if(amount(t.cargo))return;
    t.phase='idle';t.rig=null;
  }
  if(t.phase==='city'&&arrived){
    const town=t.city&&townById(t.city);
    if(t.reserved){take(t.reserved,t.cargo,amount(t.reserved));t.reserved=null;t.phase='delivery';depart(t,c.home,now,45*haulSpeedFactor(p)*freightSpeed(p));return;}
    if(town){const store=c.stores[town.id]??=stock();take(t.cargo,store,amount(t.cargo));log(w,'Cargaison arrivée à '+town.name,[p.id],now);}
    t.phase='return';depart(t,c.home,now,45*haulSpeedFactor(p)*freightSpeed(p));return;
  }
  if(t.phase==='return'&&arrived){t.phase='idle';t.city=null;}
  if(t.phase!=='idle'||c.hull<=0)return;
  const waiting=s.rigs.filter(r=>r.owner===p.id&&amount(r.stock)>0&&!c.trucks.some(other=>other!==t&&other.rig===r.id&&other.phase==='pickup'));
  const rig=(t.role??'collect')==='collect'?waiting.sort((a,b)=>range(t.point,a.point)-range(t.point,b.point))[0]:null;
  if(rig){t.rig=rig.id;t.phase='pickup';depart(t,rig.point,now,45*haulSpeedFactor(p)*freightSpeed(p));return;}
  const order=c.autoTrade;
  if(order&&t.role==='trade'&&p.inventory[order.ore]>=order.quantity){p.inventory[order.ore]-=order.quantity;t.cargo[order.ore]+=order.quantity;t.phase='city';t.city=order.city;depart(t,townById(order.city)!.point,now,45*haulSpeedFactor(p)*freightSpeed(p));}
}
function sensors(p:Miner):Place[] {
  const c=captain(p);
  return [c.home,...(c.scout.hull>0?[c.scout.point]:[]),...(c.army.hull>0?[c.army.point]:[]),...c.trucks.filter(t=>t.hull>0).map(t=>t.point)];
}
export function canSeePoint(p:Miner,point:Place){return sensors(p).some(at=>range(at,point)<=SENSOR);}
type Victim={point:Place;hull:number;owner?:Miner;factory?:FactoryPiece;rig?:Rig;truck?:Truck;deposit?:Deposit;army?:Company;base?:Captain};
function target(w:World,t:Target):Victim|null {
  const s=state(w);
  if(t.kind==='camp'){const n=s.deposits[t.id];return n?{point:n.point,hull:n.guards,deposit:n}:null;}
  if(t.kind==='rig'){const r=s.rigs.find(x=>x.id===t.id),p=r&&w.players.find(x=>x.id===r.owner);return r&&p?{point:r.point,hull:r.hull,owner:p,rig:r}:null;}
  if(t.kind==='factory'){for(const owner of w.players){const piece=owner.expedition?.factory?.pieces.find(p=>p.id===t.id);if(piece)return {point:cellPlace(piece,FACTORY_KINDS[piece.kind].size),hull:piece.hull,owner,factory:piece};}}
  if(t.kind==='truck'){
    for(const p of w.players){const truck=captain(p).trucks.find(x=>x.id===t.id);if(truck)return {point:truck.point,hull:truck.hull,owner:p,truck};}
  }
  const p=w.players.find(x=>x.id===t.id);
  if(!p)return null;
  const c=captain(p);
  if(t.kind==='army')return {point:c.army.point,hull:c.army.hull,owner:p,army:c.army};
  if(t.kind==='base')return {point:c.home,hull:c.hull,owner:p,base:c};
  return null;
}
function hurt(v:Victim,n:number) {
  const next=Math.max(0,v.hull-n);
  if(v.deposit)v.deposit.guards=next;
  if(v.rig)v.rig.hull=next;
  if(v.factory)v.factory.hull=next;
  if(v.truck)v.truck.hull=next;
  if(v.army)v.army.hull=next;
  if(v.base)v.base.hull=next;
}
function nearestCamp(w:World,at:Place,radius:number) {
  return Object.values(state(w).deposits).filter(n=>n.guards>0&&range(at,n.point)<radius)
    .sort((a,b)=>range(at,a.point)-range(at,b.point))[0];
}
function hit(w:World,p:Miner,v:Victim,now:number) {
  const c=captain(p),a=c.army;
  if(!a.ammo||peaceful(a.point)||peaceful(v.point)||v.hull<=0)return;
  if(v.owner&&allied(p,v.owner))return;
  if(v.owner){
    const upkeep=Math.ceil((1+Math.ceil(p.units*p.units*.08))*(specialtyLevel(p,'Milice')>=3?.5:1));
    if(p.coins<upkeep)return;
    p.coins-=upkeep;
  }
  a.ammo--;
  const damage=p.units*8*attackFactor(p)*militiaAttack(p);
  hurt(v,damage);
  p.damage+=damage;
  if(v.army&&v.army.ammo>0){v.army.ammo--;a.hull=Math.max(0,a.hull-v.owner!.units*5*incomingDamageFactor(p)*militiaDefense(p));}
  if(v.truck&&v.owner){
    const defense=captain(v.owner).army;
    for(const guard of serviceDefenders(w,v.owner,v.truck)){const army=captain(guard).army;army.ammo--;const defended=guard.units*8*attackFactor(guard)*militiaAttack(guard)*incomingDamageFactor(p)*militiaDefense(p);a.hull=Math.max(0,a.hull-defended);guard.damage+=defended;}
    if(v.truck.guns)a.hull=Math.max(0,a.hull-14*incomingDamageFactor(p)*militiaDefense(p));
    if(defense.hull>0&&defense.ammo>0&&range(defense.point,v.point)<280){
      defense.ammo--;a.hull=Math.max(0,a.hull-v.owner.units*8*incomingDamageFactor(p)*militiaDefense(p));
    }
  }
  if(v.base&&v.base.turrets){a.hull=Math.max(0,a.hull-v.base.turrets*18*incomingDamageFactor(p)*militiaDefense(p));}
  if(v.owner&&(v.rig||v.factory||v.base)){
    const defense=captain(v.owner).army;
    if(defense.hull>0&&defense.ammo>0&&range(defense.point,v.point)<140){
      defense.ammo--;a.hull=Math.max(0,a.hull-v.owner.units*7*incomingDamageFactor(p)*militiaDefense(p));
    }
  }
  if(v.hull>damage)return;
  if(v.deposit){v.deposit.respawn=now+12*60000;log(w,'Camp neutralisé · '+GOODS[v.deposit.ore].name,[p.id],now);}
  if(v.owner){
    if(v.truck){take(v.truck.cargo,a.loot,24-amount(a.loot));v.truck.trip=null;v.truck.phase='repair';v.truck.disabledUntil=now+90000;}
    if(v.factory){take(v.factory.items,a.loot,24-amount(a.loot));v.factory.active=false;}
    if(v.rig){take(v.rig.stock,a.loot,24-amount(a.loot));v.rig.active=false;}
    if(v.base){const max=Math.min(24-amount(a.loot),Math.floor(amount(v.owner.inventory)*.15));take(v.owner.inventory,a.loot,max);v.base.ruinedAt=now;}
    log(w,p.name+' a vaincu une cible de '+v.owner.name+'.',[p.id,v.owner.id],now);
  }
  if(a.order==='attack'){a.target=null;a.order='hold';a.trip=null;}
}
function armyStep(w:World,p:Miner,now:number) {
  const c=captain(p),a=c.army;
  moveUnit(a,now);
  if(a.hull<=0)return;
  if(a.order==='move'&&!a.trip)a.order='hold';
  if(a.order==='return'&&!a.trip&&range(a.point,c.home)<75)a.order='hold';
  if(range(a.point,c.home)<75&&a.order!=='attack'){
    take(a.loot,p.inventory,Math.max(0,depotLimit(p)-amount(p.inventory)));
    a.ammo=Math.min(120,a.ammo+10);a.hull=Math.min(p.units*50,a.hull+8);
  }
  if(!a.ammo&&a.order==='attack'){a.order='return';a.target=null;depart(a,c.home,now,48);return;}
  if(a.order==='escort'&&a.target){
    const v=target(w,a.target);
    if(!v||!v.owner||(!allied(p,v.owner)&&!(v.truck&&isServiceEscort(w,p,v.owner,v.truck.id)))){a.order='hold';a.target=null;return;}
    const follow=v.truck?.trip?along(v.truck.trip,now):v.point;
    const future=v.truck?.trip?along(v.truck.trip,now+STEP):v.point;
    const catchup=tripTo(a.point,follow,now-STEP,55*maneuverFactor(p));
    a.point=along(catchup,now);
    a.trip=range(a.point,future)>20?tripTo(a.point,future,now,55*maneuverFactor(p)):null;
    const camp=nearestCamp(w,a.point,140);
    if(camp)hit(w,p,{point:camp.point,hull:camp.guards,deposit:camp},now);
  }else if(a.order==='attack'&&a.target){
    const v=target(w,a.target);
    if(!v||v.hull<=0||range(a.point,v.point)>5000||(v.owner&&allied(p,v.owner))||peaceful(v.point)){a.target=null;a.order='hold';a.trip=null;return;}
    const moving=v.truck?.trip??v.army?.trip;
    if(moving)v.point=along(moving,now);
    const aim=moving?along(moving,now+STEP):v.point;
    if(range(a.point,v.point)>(v.truck?240:105)){if(!a.trip||range(a.trip.to,aim)>40)depart(a,aim,now,46*maneuverFactor(p));}
    else {a.trip=null;hit(w,p,v,now);}
  }else if(a.order==='patrol'||a.order==='hold'){
    const camp=nearestCamp(w,a.point,130);
    if(camp)hit(w,p,{point:camp.point,hull:camp.guards,deposit:camp},now);
    else if(a.pvp&&!peaceful(a.point)){
      const hostile=w.players.find(q=>!allied(p,q)&&captain(q).army.hull>0&&range(a.point,captain(q).army.point)<130&&!peaceful(captain(q).army.point));
      if(hostile)hit(w,p,{point:captain(hostile).army.point,hull:captain(hostile).army.hull,army:captain(hostile).army,owner:hostile},now);
      else {
        const truckOwner=w.players.find(q=>!allied(p,q)&&captain(q).trucks.some(t=>t.hull>0&&t.phase!=='idle'&&range(t.point,a.point)<130&&!peaceful(t.point)));
        const truck=truckOwner&&captain(truckOwner).trucks.find(t=>t.hull>0&&t.phase!=='idle'&&range(t.point,a.point)<130&&!peaceful(t.point));
        if(truck&&truckOwner)hit(w,p,{point:truck.point,hull:truck.hull,truck,owner:truckOwner},now);
      }
    }
    if(a.order==='patrol'&&!a.trip){
      if(range(a.point,a.rally)>20)depart(a,a.rally,now,40*maneuverFactor(p));
      else depart(a,clampPlace({...a.rally,u:a.rally.u+100,v:a.rally.v+40}),now,40*maneuverFactor(p));
    }
  }
}
function production(w:World,now:number) {
  const s=state(w);
  for(const rig of s.rigs){
    if(!rig.active||rig.hull<=0||amount(rig.stock)>=96)continue;
    const p=w.players.find(p=>p.id===rig.owner),node=s.deposits[rig.deposit];
    if(!p||now<p.joined||!node||node.guards>0||captain(p).hull<=0||now>p.lastSeen+IDLE_LIMIT)continue;
    const raw=(1+Math.floor(p.power*.5)+drillExtraBlocks(p))*(p.research?.includes('cadence')?1.25:1)*extractionFactor(p)*(knowsIndustry(captain(p).factory!,'forage-3')?1.6:knowsIndustry(captain(p).factory!,'forage-2')?1.3:1)*warFactor(w,p,now)+(rig.carry??0);
    const n=Math.min(node.remaining,96-amount(rig.stock),Math.floor(raw));
    rig.carry=raw-Math.floor(raw);
    rig.stock[node.ore]+=n;node.remaining-=n;p.mined+=n;w.extracted+=n;
  }
  for(const node of Object.values(s.deposits)){
    if(node.safe){node.guards=0;continue;}
    if(node.guards<=0&&node.respawn&&node.respawn<=now&&node.remaining>0){node.guards=node.maxGuards;node.respawn=0;}
    if(node.guards<=0)continue;
    const near=w.players.filter(p=>now<=p.lastSeen+IDLE_LIMIT&&(range(captain(p).army.point,node.point)<160||range(captain(p).scout.point,node.point)<110||captain(p).trucks.some(t=>t.phase!=='idle'&&t.phase!=='repair'&&range(t.point,node.point)<130)));
    const siteRigs=s.rigs.filter(r=>r.deposit===node.id&&r.hull>0);
    if(!near.length&&!siteRigs.length)continue;
    if(calm(w,node.point)||peaceful(node.point)){node.safe=true;node.guards=0;continue;}
    for(const p of near){
      const c=captain(p),a=c.army;
      if(range(node.point,a.point)<150&&a.hull>0)a.hull=Math.max(0,a.hull-9*incomingDamageFactor(p)*militiaDefense(p));
      if(range(node.point,c.scout.point)<100&&c.scout.hull>0){c.scout.hull=Math.max(0,c.scout.hull-8);if(c.scout.hull<=0){c.scout.trip=null;c.scout.auto=false;}}
      for(const t of c.trucks){
        if(t.hull<=0||t.phase==='idle'||t.phase==='repair'||range(t.point,node.point)>130||peaceful(t.point))continue;
        if((a.hull>0&&a.ammo>0&&range(a.point,t.point)<140)||guardedByService(w,p,t))continue;
        t.hull=Math.max(0,t.hull-(t.guns?4:8));
        if(t.guns){node.guards=Math.max(0,node.guards-8);if(!node.guards)node.respawn=now+12*60000;}
        if(t.hull<=0){t.trip=null;t.phase='repair';t.disabledUntil=now+90000;log(w,'Un transporteur a été immobilisé par un camp. Les secours partent récupérer le fret.',[p.id],now);}
      }
    }
    for(const rig of siteRigs){
      const p=w.players.find(p=>p.id===rig.owner)!;
      if(range(captain(p).army.point,node.point)<130&&captain(p).army.hull>0)continue;
      rig.hull=Math.max(0,rig.hull-5);
    }
  }
}
export function advanceFrontier(w:World,now:number,onTick?:(w:World,time:number)=>void,limits?:{maxSteps:number;cpuMs:number}) {
  ensureFrontier(w,now);layoutRigs(w);
  const s=state(w),end=Math.floor(now/STEP)*STEP;
  const previousTick=Math.floor(s.time/STEP)*STEP;
  const start=Math.max(previousTick,end-IDLE_LIMIT);
  const budgetStart=performance.now();let advanced=start,steps=0;
  for(let time=start+STEP;time<=end;time+=STEP){
    if(limits&&steps>0&&(steps>=limits.maxSteps||performance.now()-budgetStart>=limits.cpuMs))break;
    steps++;
    settleCooperation(w,time);
    for(const p of w.players){
      const c=captain(p);
      if(time<p.joined||time>p.lastSeen+IDLE_LIMIT)continue;
      const arrived=moveUnit(c.scout,time);
      if(c.scout.auto&&(!c.scout.trip||arrived)&&c.scout.hull>0){
        const step=c.scout.step++;
        const destination=step===0?(townById(c.towns[0])??nearestTown(c.home)).point:scoutWaypoint(c.home,step);
        depart(c.scout,destination,time,72);
      }
      armyStep(w,p,time);
      for(const t of c.trucks)finishTruck(w,p,t,time);
      stepWorkers(w,p,time);
      if(hasBuilding(p,'repairbay')&&p.inventory.ferrite>20){const damaged=[c.scout,c.army,...c.trucks,...(c.workers??[])].find(u=>u.hull>0&&u.hull<(u===c.army?p.units*50:u===c.scout?90:'phase' in u&&'cargo' in u&&'order' in u?40:140)&&range(u.point,c.home)<120);if(damaged){damaged.hull=Math.min(damaged.hull+5,damaged===c.army?p.units*50:damaged===c.scout?90:'order' in damaged?40:140);p.inventory.ferrite--;}}

      for(const at of sensors(p))discover(w,p,at,SENSOR,time);
    }
    settleOutposts(w,time,(owner,site)=>{
      discover(w,owner,site.point,550,time);
      appendActivity(w,owner,'progress','colony/founded',site.name+' en service.',{point:site.point,deposit:site.depositId,outpost:site.id},time,site.id);
    });
    production(w,time);stepServiceEscorts(w,time);
    for(const p of w.players)advanceFactory(w,p,time,now-FLOW_WINDOW);
    onTick?.(w,time);
    for(const p of w.players)monitorActivity(w,p,time);
    advanced=time;
  }
  const activity=w.simulationActivity??={simulatedMs:0,skippedMs:0,lastSkip:null};
  activity.simulatedMs+=steps*STEP;
  if(start>previousTick){
    activity.skippedMs+=start-previousTick;
    activity.lastSkip={from:previousTick,to:start};
  }
  s.time=Math.max(s.time,Math.min(end,advanced));
  const settledAt=limits?s.time:now;
  settleCooperation(w,settledAt);
  for(const p of w.players){
    if(p.rare&&p.rare.ready<=settledAt){p.inventory.cuivre+=p.rare.amount;p.coins+=p.rare.amount*146;p.rare=null;}
  }
  settleWorkshops(w,settledAt);
}
function orderPlace(value:unknown) {
  if(!value||typeof value!=='object')throw Error('Lieu invalide.');
  const p=value as Partial<Place>;
  if(!FACE_ORDER.includes(p.face as Face)||typeof p.u!=='number'||typeof p.v!=='number'||!Number.isFinite(p.u)||!Number.isFinite(p.v)||p.u<0||p.v<0||p.u>SIDE-1||p.v>SIDE-1)throw Error('Lieu invalide.');
  return clampPlace(p as Place);
}
function friendlyOnly(w:World,p:Miner,id:unknown) {
  const q=w.players.find(q=>q.id===id&&q.id!==p.id);
  if(!q)throw Error('Joueur introuvable.');
  return q;
}
function marketAction(w:World,p:Miner,a:Record<string,unknown>,now:number) {
  const city=townById(a.city),c=captain(p);
  if(!city||!c.towns.includes(city.id))throw Error('Cette ville ne figure pas dans vos découvertes.');
  const s=state(w),market=s.markets[city.id]??={offers:[]};
  if(a.type==='townSell'||a.type==='offerPost'){
    for(const value of [a.good,a.give,a.want])if(value!==undefined&&value!=='credits'&&!ORES.includes(value as Resource))throw Error('Ce comptoir accepte les minerais.');
  }
  const proxies=w.players.map(q=>({id:q.id,name:q.name,coins:q.coins,inventory:captain(q).stores[city.id]??=stock()}));
  const proxy=proxies.find(q=>q.id===p.id)!;
  const previousCoins=proxy.coins;
  const result=actEconomy({players:proxies,offers:market.offers},proxy,a.type==='townSell'?{...a,type:'goodsSell'}:a,now);
  if(!result)throw Error('Ordre de marché inconnu.');
  if(a.type==='townSell')(c.workerFinance??={fees:0,revenue:0}).revenue+=Math.max(0,proxy.coins-previousCoins);
  for(const q of proxies)w.players.find(x=>x.id===q.id)!.coins=q.coins;
  return result.message;
}
function command(w:World,p:Miner,a:Record<string,unknown>,now:number):string {
  const s=state(w),c=captain(p);
  switch(a.type){
    case 'society':return actCooperation(w,p,a.op==='trade'?{...a,tradePoint:townById(a.city)?.point}:a,now);
    case 'factory':return actFactory(w,p,a,now,peaceful);
    case 'rts': {
      if(!Array.isArray(a.ids)||!a.ids.length||a.ids.length>48||a.ids.some(id=>typeof id!=='string'))throw Error('Sélection invalide.');
      if(a.op!=='move'&&a.op!=='hold')throw Error('Ordre de groupe inconnu.');
      const ids=[...new Set(a.ids)] as string[];
      const units=ids.map(id=>id==='scout'?c.scout:id==='army'?c.army:c.workers?.find(v=>v.id===id)??c.trucks.find(t=>t.id===id));
      if(units.some(u=>!u||u.hull<=0))throw Error('Sélectionnez uniquement vos unités opérationnelles.');
      if(units.some(u=>u&&'escort' in u&&(u.contract||!['idle','manual'].includes(u.phase)||amount(u.cargo)>0)))throw Error('Un camion en mission doit terminer sa livraison.');
      const destination=a.op==='move'?orderPlace(a.point):null,columns=Math.ceil(Math.sqrt(ids.length));
      units.forEach((unit,i)=>{
        const u=unit!;if(u.trip)u.point=along(u.trip,now);u.trip=null;
        if(u===c.scout)c.scout.auto=false;
        if(u===c.army){c.army.target=null;c.army.order=destination?'move':'hold';}
        if('target' in u&&'cargo' in u){const worker=u as Worker;worker.trade=undefined;worker.target=null;worker.order=destination?'move':'idle';worker.phase=destination?'moving':'idle';}
        if('escort' in u){u.role='standby';u.phase=destination?'manual':'idle';}
        if(destination){const to=clampPlace({...destination,u:destination.u+(i%columns-(columns-1)/2)*7,v:destination.v+(Math.floor(i/columns)-(Math.ceil(ids.length/columns)-1)/2)*7});depart(u,to,now,'ready' in u?workerSpeed(p):u===c.scout?24:u===c.army?22*maneuverFactor(p):45*haulSpeedFactor(p)*freightSpeed(p));}
      });
      return destination?'Groupe en déplacement, formation conservée.':'Groupe arrêté à sa position actuelle.';
    }
    case 'move':case 'patrol': {
      const to=orderPlace(a.point),scout=a.unit==='scout',unit=scout?c.scout:c.army;
      if(unit.hull<=0)throw Error('Cette unité doit être réparée à la base.');
      if(scout)c.scout.auto=false;
      else {c.army.order=a.type;c.army.target=null;c.army.rally=to;}
      depart(unit,to,now,scout?72:46*maneuverFactor(p));
      return a.type==='patrol'?'Patrouille assignée.':'Déplacement en cours.';
    }
    case 'groupMove':case 'groupHold':{
      if(!Array.isArray(a.units)||!a.units.length||a.units.length>2||a.units.some(u=>u!=='scout'&&u!=='army'))throw Error('Sélection de groupe invalide.');
      for(const unit of new Set(a.units))command(w,p,{type:a.type==='groupHold'?'hold':'move',unit,point:a.point},now);
      return 'Ordre donné au groupe.';
    }
    case 'scout':
      if(c.scout.hull<=0)throw Error('Récupérez votre éclaireur à la base.');
      c.scout.auto=!c.scout.auto;
      if(!c.scout.auto)c.scout.trip=null;
      return c.scout.auto?'Exploration automatique lancée.':'Éclaireur à l’arrêt.';
    case 'rules':
      c.army.pvp=!c.army.pvp;
      return c.army.pvp?'Patrouille autorisée à engager les joueurs hostiles.':'Patrouille limitée aux créatures et à la défense.';
    case 'hold':
      if(a.unit==='scout'){c.scout.trip=null;c.scout.auto=false;}
      else {c.army.trip=null;c.army.target=null;c.army.order='hold';}
      return 'Position tenue.';
    case 'return':
      if(a.unit==='scout'){c.scout.auto=false;depart(c.scout,c.home,now,72);}
      else {c.army.target=null;c.army.order='return';depart(c.army,c.home,now,48);}
      return 'Retour à la base.';
    case 'install':{
      if(!knowsIndustry(c.factory!,'forage'))throw Error('Débloquez le forage mécanique au MAM.');
      const node=typeof a.deposit==='string'?s.deposits[a.deposit]:null;
      if(!node||!c.deposits.includes(node.id))throw Error('Choisissez un gisement découvert.');
      if(node.remaining<=0)throw Error('Ce gisement est épuisé.');
      if(s.rigs.filter(r=>r.owner===p.id).length>=Math.min(8,p.rigs+1))throw Error('Améliorez le parc de foreuses dans Recherche.');
      if(s.rigs.filter(r=>r.deposit===node.id&&r.hull>0).length>=3)throw Error('Trois emplacements occupent ce gisement. Une escouade peut en déloger une installation adverse.');
      if(peaceful(node.point))throw Error('Les villes sont réservées au commerce.');
      spend(p,90,{ferrite:20});
      s.rigs.push({id:crypto.randomUUID(),owner:p.id,deposit:node.id,point:{...node.point},hull:180,stock:stock(),active:true});
      layoutRigs(w);
      return node.guards>0?'Foreuse installée. Neutralisez le camp pour lancer la production.':'Foreuse installée. La collecte automatique prend le relais.';
    }
    case 'rigPause':case 'rigRepair':case 'rigRecall': {
      const rig=s.rigs.find(r=>r.id===a.id&&r.owner===p.id);
      if(!rig)throw Error('Cette foreuse ne vous appartient pas.');
      if(a.type==='rigPause')rig.active=!rig.active;
      if(a.type==='rigRepair'){spend(p,30,{ferrite:10});rig.hull=180;rig.active=true;}
      if(a.type==='rigRecall'){
        if(amount(rig.stock)>0||c.trucks.some(t=>t.rig===rig.id))throw Error('Videz le chantier avant de rappeler cette foreuse.');
        s.rigs=s.rigs.filter(r=>r.id!==rig.id);p.coins+=35;
      }
      return 'Ordre exécuté sur la foreuse.';
    }
    case 'attack': {
      const t=a.target as Target;
      if(!t||!['camp','rig','factory','army','truck','base'].includes(t.kind)||typeof t.id!=='string')throw Error('Cible invalide.');
      const v=target(w,t);
      if(!v||v.hull<=0||!canSeePoint(p,v.point))throw Error('Votre escouade ou éclaireur doit repérer cette cible.');
      if(peaceful(v.point))throw Error('Cette cible est dans une ville neutre.');
      if(v.owner&&allied(p,v.owner))throw Error('Cette cible appartient à un allié.');
      if(c.army.hull<=0)throw Error('Remettez votre escouade en état.');
      if(range(c.army.point,v.point)>4500)throw Error('Approchez une escouade avant d’attaquer ce secteur.');
      spend(p,v.owner?25+Math.ceil(p.units*p.units*.35):0,v.owner?{ferrite:5}:{});
      c.army.order='attack';c.army.target={kind:t.kind,id:t.id};
      depart(c.army,v.point,now,46*maneuverFactor(p));
      return v.owner?'Assaut engagé. Le ravitaillement et les munitions sont consommés.':'Escouade engagée contre le camp.';
    }
    case 'turret':
      if(c.turrets>=6)throw Error('Six tourelles défendent déjà la base.');
      spend(p,90+60*c.turrets,{ferrite:30,cuivre:5});c.turrets++;
      return 'Tourelle de défense construite.';
    case 'repair':
      if(c.hull<=0&&now-c.ruinedAt<60000)throw Error('Le chantier de secours arrive dans une minute.');
      if(c.hull<=0){p.coins=Math.max(0,p.coins-30);p.inventory.ferrite=Math.max(0,p.inventory.ferrite-10);}
      else spend(p,30,{ferrite:10});
      c.hull=500;c.scout.hull=90;c.scout.point={...c.home};c.scout.trip=null;c.scout.auto=false;
      if(c.army.hull<=0||range(c.army.point,c.home)<80){c.army.point={...c.home};c.army.trip=null;c.army.order='hold';c.army.target=null;c.army.hull=p.units*50;c.army.ammo=120;}
      else {c.army.order='return';c.army.target=null;depart(c.army,c.home,now,48);}
      return 'Base et unités remises en état.';
    case 'train':
      if(!hasBuilding(p,'barracks'))throw Error('Construisez une caserne pour recruter des troupes.');
      if(p.units>=24)throw Error('Effectif maximal atteint.');
      spend(p,80+Math.round(p.units*p.units*3),{ferrite:15,cuivre:3});p.units++;c.army.hull+=50;
      return 'Une recrue rejoint l’escouade.';
    case 'escort':{
      const v=target(w,{kind:'truck',id:String(a.id)});
      if(!v?.owner||!allied(p,v.owner)||c.army.hull<=0)throw Error('Choisissez un convoi ami et une escouade opérationnelle.');
      c.army.order='escort';c.army.target={kind:'truck',id:String(a.id)};
      depart(c.army,v.point,now,55*maneuverFactor(p));
      return 'L’escouade escorte ce transporteur.';
    }
    case 'truckArm':{
      const t=c.trucks.find(t=>t.id===a.id);
      if(!t||t.phase!=='idle'||t.guns)throw Error('Un camion libre au dépôt peut recevoir une tourelle.');
      if(a.assemble===true){
        if(!p.economy?.refined.module)throw Error('Fabriquez un moteur électrique dans une assembleuse.');
        p.economy.refined.module--;
      }else spend(p,70,{cuivre:10});
      t.guns=true;return 'Tourelle embarquée installée.';
    }
    case 'truckRole':{
      const t=c.trucks.find(t=>t.id===a.id);
      if(!t||!['collect','trade','standby'].includes(String(a.role)))throw Error('Affectation de transport invalide.');
      t.role=a.role as 'collect'|'trade'|'standby';
      return t.phase==='idle'?'Transporteur réaffecté.':'Le transporteur terminera sa livraison puis prendra cette affectation.';
    }
    case 'truck':
      if(!knowsIndustry(c.factory!,'motorisation'))throw Error('Débloquez la motorisation au MAM.');
      if(!hasBuilding(p,'repairbay'))throw Error('Construisez un atelier de réparation pour assembler les véhicules.');
      if((p.economy?.refined.module??0)<2)throw Error('Fabriquez deux moteurs électriques pour ce véhicule.');
      if(c.trucks.length>=8)throw Error('Flotte complète.');
      spend(p,170+60*c.trucks.length,{ferrite:20});
      p.economy!.refined.module-=2;
      c.trucks.push({id:crypto.randomUUID(),point:clampPlace({...c.home,u:c.home.u+32+c.trucks.length*14,v:c.home.v+28}),trip:null,hull:140,phase:'idle',rig:null,city:null,cargo:stock(),escort:true});
      return 'Transporteur construit.';
    case 'ship':case 'autoTrade': {
      const city=townById(a.city),ore=a.ore as Resource,n=a.quantity;
      if(!city||!c.towns.includes(city.id)||!ORES.includes(ore)||typeof n!=='number'||!Number.isInteger(n)||n<1||n>64)throw Error('Choisissez une ville connue et un lot de 1 à 64 unités.');
      if(n>16+haulCapacityBonus(p)+freightLoad(p))throw Error('La soute accepte '+(16+haulCapacityBonus(p)+freightLoad(p))+' unités. Développez les recherches de fret pour l’agrandir.');
      if(a.type==='autoTrade'){
        c.autoTrade=a.enabled===false?null:{city:city.id,ore,quantity:n};
        if(c.autoTrade&&!c.trucks.some(t=>t.role==='trade')&&c.trucks[0])c.trucks[0].role='trade';
        return c.autoTrade?'Liaison commerciale automatique activée.':'Liaison commerciale suspendue.';
      }
      const t=c.trucks.find(t=>t.phase==='idle');
      if(!t)throw Error('Tous les transporteurs sont en route.');
      if(p.inventory[ore]<n)throw Error('Ce lot doit d’abord être livré au dépôt.');
      p.inventory[ore]-=n;t.cargo[ore]+=n;t.phase='city';t.city=city.id;t.escort=a.escort!==false;t.role='trade';
      depart(t,city.point,now,45*haulSpeedFactor(p)*freightSpeed(p));
      if(t.escort&&c.army.hull>0){c.army.order='escort';c.army.target={kind:'truck',id:t.id};}
      return 'Convoi parti pour '+city.name+'.';
    }
    case 'withdraw': {
      const city=townById(a.city),r=a.ore as Resource,n=a.quantity;
      if(!city||!c.towns.includes(city.id)||!ORES.includes(r)||typeof n!=='number'||!Number.isInteger(n)||n<1||n>64)throw Error('Retrait invalide.');
      if(n>16+haulCapacityBonus(p)+freightLoad(p))throw Error('Cette quantité dépasse la soute du transporteur.');
      const store=c.stores[city.id]??=stock(),t=c.trucks.find(t=>t.phase==='idle');
      if(!t||store[r]<n)throw Error('Il faut un transporteur libre et un lot disponible en ville.');
      store[r]-=n;t.reserved=stock();t.reserved[r]=n;
      // Pickup is represented by a real outward leg, never a remote credit.
      t.city=city.id;t.phase='city';t.rig='withdraw/'+r+'/'+n;t.role='trade';
      depart(t,city.point,now,45*haulSpeedFactor(p)*freightSpeed(p));
      return 'Transporteur envoyé au comptoir.';
    }
    case 'research':return buyResearch(p,a.skill).message;
    case 'workshopStart': {
      throw Error('Placez une machine dans Usine et alimentez sa recette par convoyeur.');
    }
    case 'upgrade':{
      if(a.kind==='rig'){if(p.rigs>=7)throw Error('Parc complet.');spend(p,240+100*p.rigs,{cuivre:15});p.rigs++;}
      else if(a.kind==='depot'){if(p.core>=8)throw Error('Dépôt maximal.');spend(p,190+80*p.core);p.core++;}
      else throw Error('Amélioration inconnue.');
      return 'Amélioration installée.';
    }
    case 'townSell':case 'offerPost':case 'offerTake':case 'offerCancel':return marketAction(w,p,a,now);
    case 'chat': {
      if(typeof a.text!=='string'||!a.text.trim()||a.text.length>300)throw Error('Un message contient de 1 à 300 caractères.');
      const last=s.chat.findLast(m=>m.author===p.id);
      if(last&&now-last.at<1500)throw Error('Attendez un instant avant le prochain message.');
      if(a.guild&&!c.guild)throw Error('Rejoignez une guilde pour ce canal.');
      s.chat.push({id:crypto.randomUUID(),author:p.id,name:p.name,guild:a.guild?c.guild:null,text:a.text.trim(),at:now});
      s.chat=s.chat.slice(-120);return '';
    }
    case 'colony':
      if(a.op!=='found')throw Error('Ordre de colonisation inconnu.');
      return orderOutpost(w,p,a.deposit,now);
    case 'guildCreate': {
      if(c.guild)throw Error('Vous avez déjà une guilde.');
      const name=typeof a.name==='string'?a.name.trim().slice(0,28):'';
      if(name.length<2)throw Error('Donnez un nom à votre guilde.');
      if(s.guilds.some(g=>g.name.toLowerCase()===name.toLowerCase()))throw Error('Ce nom est déjà utilisé.');
      const id=crypto.randomUUID();s.guilds.push({id,name,leader:p.id,founder:p.id,foundedAt:now,members:[p.id],invites:[]});c.guild=id;
      return 'Guilde fondée.';
    }
    case 'guildInvite': {
      const g=s.guilds.find(g=>g.id===c.guild&&g.leader===p.id),q=friendlyOnly(w,p,a.player);
      if(!g)throw Error('Le chef de guilde peut inviter.');
      if(q.expedition?.guild)throw Error('Cette colonie est déjà affiliée.');
      if(!g.invites.includes(q.id))g.invites.push(q.id);return 'Invitation de '+g.name+' envoyée à '+q.name+'.';
    }
    case 'guildAccept': {
      const g=s.guilds.find(g=>g.id===a.id&&g.invites.includes(p.id));
      if(!g||c.guild)throw Error('Invitation indisponible.');
      g.invites=g.invites.filter(id=>id!==p.id);g.members.push(p.id);c.guild=g.id;return 'Vous avez rejoint '+g.name+'.';
    }
    case 'guildDecline': {
      const g=s.guilds.find(g=>g.id===a.id&&g.invites.includes(p.id));
      if(!g)throw Error('Invitation indisponible.');
      g.invites=g.invites.filter(id=>id!==p.id);(g.declined??=[]).push(p.id);
      return 'Invitation de '+g.name+' déclinée.';
    }
    case 'guildLeave': {
      const g=s.guilds.find(g=>g.id===c.guild);c.guild=null;
      if(g){g.members=g.members.filter(id=>id!==p.id);if(g.leader===p.id)g.leader=g.members[0]??'';if(!g.members.length)s.guilds=s.guilds.filter(x=>x.id!==g.id);else if(!(g.declined??=[]).includes(p.id))g.declined.push(p.id);}
      return 'Vous avez quitté la guilde.';
    }
    case 'friendRequest':case 'friendAccept': {
      const q=friendlyOnly(w,p,a.player),other=captain(q);
      if(a.type==='friendRequest'){if(!other.requests.includes(p.id)&&!other.friends.includes(p.id))other.requests.push(p.id);return 'Demande d’ami envoyée.';}
      if(!c.requests.includes(q.id))throw Error('Demande introuvable.');
      c.requests=c.requests.filter(id=>id!==q.id);
      if(!c.friends.includes(q.id))c.friends.push(q.id);
      if(!other.friends.includes(p.id))other.friends.push(p.id);
      return 'Ami ajouté.';
    }
    default:throw Error('Ordre inconnu.');
  }
}
function cElement(p:Miner,id:string){const q=p.expedition?.factory?.pieces.find(v=>v.id===id);return q?{id:q.id,kind:q.kind,active:q.active,recipe:q.recipe,filter:q.filter,batch:q.batch,status:q.hull? q.job?'Fabrication':'En attente':'Endommagée'}:undefined;}
export function actFrontier(w:World,p:Miner,a:Record<string,unknown>,now:number) {
  if(typeof a.requestId!=='string'||!a.requestId||a.requestId.length>100){appendActivity(w,p,'blocked','validation','Identifiant d’ordre manquant.',{order:actionContext(a)},now);throw Error('Identifiant d’ordre manquant.');}
  if(p.lastActionIds.includes(a.requestId))return 'Ordre déjà exécuté.';
  const before=actorSnapshot(p,now),context=actionContext(a);
  if(a.type==='colony'||(typeof a.type==='string'&&a.type.startsWith('guild'))){
    context.previousGuild=p.expedition?.guild??null;
    for(const key of ['reason','player','name'] as const)if(typeof a[key]==='string')context[key]=a[key].slice(0,180);
  }
  try{const message=command(w,p,a,now);p.lastActionIds.push(a.requestId);p.lastActionIds=p.lastActionIds.slice(-100);appendActivity(w,p,'command',String(a.type??'action')+'/'+String(a.op??''),message,{order:context,element:typeof a.id==='string'?cElement(p,a.id):undefined,before,after:actorSnapshot(p,now)},now,a.requestId);return message;}
  catch(error){appendActivity(w,p,'blocked',String(a.type??'action')+'/'+String(a.op??''),(error as Error).message,{order:context,before,after:before},now,a.requestId);throw error;}
}
function visibleIndustry(w:World,viewer:Miner|undefined,now:number){
  const factories:({id:string;owner:string;flowReset?:number;kind:FactoryPiece['kind'];face:Face;x:number;y:number;dir:FactoryPiece['dir'];hull:number;active:boolean;busy:boolean;placed:number;visibleGoods?:Partial<FactoryPiece['items']>})[]=[];
  const foreignFlow:{owner:string;clock:number;flow:ReturnType<typeof witnessedFlow>}[]=[];
  const carriers:{id:string;owner:string;name:string;point:Place;trip:Trip|null;hull:number;cargo:{ferrite:number;cuivre:number};handoffs?:Worker['handoffs']}[]=[];
  if(!viewer)return {factories,foreignFlow,carriers};
  const seen=(point:Place)=>canSeePoint(viewer,point);
  for(const q of w.players){
    if(q.id===viewer.id||!q.expedition)continue;
    const f=q.expedition.factory;
    const visible=f?.pieces.filter(piece=>seen(cellPlace(piece,FACTORY_KINDS[piece.kind].size)))??[];
    for(const piece of visible){
      const onBelt=['belt','loader','unloader','splitter'].includes(piece.kind);
      const visibleGoods=onBelt?Object.fromEntries(Object.entries(piece.items).filter(([,n])=>n>0)):undefined;
      factories.push({id:piece.id,owner:q.id,flowReset:piece.flowReset,kind:piece.kind,face:piece.face,x:piece.x,y:piece.y,dir:piece.dir,hull:piece.hull,placed:piece.placed,active:piece.active,busy:piece.active&&piece.hull>0&&!!piece.job,visibleGoods});
    }
    if(f&&visible.length)foreignFlow.push({owner:q.id,clock:f.clock,flow:witnessedFlow(f,seen)});
    for(const worker of q.expedition.workers??[]){
      const location=worker.trip?along(worker.trip,now):worker.point;
      if(!worker.hull||!seen(location))continue;
      // Render just the locally visible next few metres, never a foreign route or target.
      const due=worker.trip?Math.min(worker.trip.due,now+2500):now;
      const end=worker.trip&&due>now?along(worker.trip,due):null;
      const trip=end&&seen(end)?{from:location,to:end,start:now,due}:null;
      carriers.push({id:worker.id,owner:q.id,name:q.name,point:location,trip,hull:worker.hull,cargo:{ferrite:worker.cargo.ferrite,cuivre:worker.cargo.cuivre},handoffs:worker.handoffs?.filter(h=>now-h.at<=8000&&seen(h.point))});
    }
  }
  return {factories,foreignFlow,carriers};
}
export function frontierView(w:World,p:Miner|undefined,now:number) {
  const s=state(w),c=p?captain(p):null;
  const ownRig=p?s.rigs.filter(r=>r.owner===p.id):[];
  const neighbors=p?w.players.filter(q=>q.id!==p.id&&canSeePoint(p,captain(q).home)).map(q=>({id:q.id,name:q.name,guild:captain(q).guild,point:captain(q).home,hull:captain(q).hull,turrets:captain(q).turrets})): [];
  const rivals=p?w.players.filter(q=>q.id!==p.id).flatMap(q=>{
    const a=captain(q).army,result:{id:string;owner:string;name:string;kind:'army'|'truck';point:Place;hull:number;trip:Trip|null;allied:boolean}[]=[];
    if(a.hull>0&&canSeePoint(p,a.point))result.push({id:q.id,owner:q.id,name:q.name,kind:'army',point:a.point,hull:a.hull,trip:a.trip,allied:allied(p,q)});
    for(const t of captain(q).trucks)if(t.phase!=='idle'&&t.hull>0&&canSeePoint(p,t.point))result.push({id:t.id,owner:q.id,name:q.name,kind:'truck',point:t.point,hull:t.hull,trip:t.trip,allied:allied(p,q)});
    return result;
  }):[];
  const towns=c?TOWNS.filter(t=>c.towns.includes(t.id)).sort((a,b)=>range(c.home,a.point)-range(c.home,b.point)):[];
  const markets=towns.map(t=>{
    const m=s.markets[t.id]??{offers:[]};
    return {city:t.id,stock:c!.stores[t.id]??stock(),offers:m.offers.filter(o=>!o.recipient||o.owner===p?.id||o.recipient===p?.id)};
  });
  return {now,time:s.time,edition:'frontier' as const,generation:RELEASE_ID,simulationBehind:Math.max(0,now-s.time),planetSize:SIDE,calmRadius:500,
    me:p&&c?{id:p.id,name:p.name,faction:p.faction,coins:p.coins,inventory:p.inventory,units:p.units,research:p.research??[],
      society:cooperationView(w,p,now),factory:factoryView(p,now,w),core:p.core,rigs:p.rigs,power:p.power,home:c.home,hull:c.hull,turrets:c.turrets,ruinedAt:c.ruinedAt,scout:c.scout,army:c.army,trucks:c.trucks,
      delivered:c.delivered,drillRate:(1+Math.floor(p.power*.5)+drillExtraBlocks(p))*(p.research?.includes('cadence')?1.25:1)*12,
      payload:16+haulCapacityBonus(p)+freightLoad(p),depotCapacity:Math.max(depotLimit(p),amount(p.inventory)),autoTrade:c.autoTrade,
      explored:c.explored,guild:c.guild,friends:c.friends,requests:c.requests,economy:economyView(w,p).personal}:null,
    ...visibleIndustry(w,p,now),
    cities:towns,markets,rigs:s.rigs.filter(r=>r.owner===p?.id||(p&&canSeePoint(p,r.point))).map(r=>({...r,stock:r.owner===p?.id?r.stock:undefined})),
    deposits:c&&p?c.deposits.map(id=>s.deposits[id]).filter(Boolean).map(d=>({...d,charterAvailable:charterAvailable(w,p,d,now)})):[],neighbors,rivals,
    players:w.players.map(q=>({id:q.id,name:q.name,ai:!!q.ai,faction:q.faction,online:now-q.lastSeen<45000,guild:captain(q).guild,contactMarket:captain(q).towns[0]})),
    guilds:s.guilds.map(g=>({id:g.id,name:g.name,leader:g.leader,members:g.members,invited:!!p&&g.invites.includes(p.id)})),
    chat:s.chat.filter(m=>!m.guild||m.guild===c?.guild).slice(-60),
    events:p?s.events.filter(e=>e.players.includes(p.id)).slice(0,20):[]};
}
export type FrontierView=ReturnType<typeof frontierView>;
