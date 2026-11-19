import {along,range,tripTo,type Place,type Trip} from './frontier-geography';
import {ensureEconomy,ALL_GOODS,GOODS,type Good,type RawGood} from './economy';
import {haulSpeedFactor} from './research';
import {depotLimit,hasBuilding} from './frontier-capacity';
import type {World,Miner,Inventory,Faction} from './world';
import type {Truck} from './frontier';

const WEEK=7*86400000;
const rawCount=(s:Inventory)=>s.ferrite+s.cuivre;
const empty=():Inventory=>({ferrite:0,cuivre:0,titane:0,prisme:0});
export type WorkerHandoff={at:number;kind:'lift'|'drop';good:RawGood;units:number;point:Place};
export type Worker={handoffs?:WorkerHandoff[];cargoSource?:'mine'|'rig'|'trade';id:string;point:Place;trip:Trip|null;hull:number;cargo:Inventory;order:'mine'|'haul'|'idle'|'move'|'trade';target:string|null;trade?:{city:string;point:Place;ore:RawGood};phase:'idle'|'moving'|'outbound'|'working'|'return'|'unload';ready:number};
export type SpecialtyId='extract-1'|'extract-2'|'extract-3'|'freight-1'|'freight-2'|'freight-3'|'militia-1'|'militia-2'|'militia-3';
export type Specialty={id:SpecialtyId;branch:'Extraction'|'Transport'|'Milice';tier:number;name:string;effect:string;cost:Partial<Record<Good,number>>;seconds:number};
export const SPECIALTIES:Specialty[]=[
  {id:'extract-1',branch:'Extraction',tier:1,name:'Prospection',effect:'Récolte des collecteurs 25 % plus rapide, foreuses +20 %.',cost:{ferrite:30,cuivre:10},seconds:45},
  {id:'extract-2',branch:'Extraction',tier:2,name:'Forage intensif',effect:'Foreuses +45 % au total, temps de collecte réduit de 40 %.',cost:{engrenage:12,cable:15},seconds:90},
  {id:'extract-3',branch:'Extraction',tier:3,name:'Maître extracteur',effect:'Foreuses +75 %, collecteurs deux fois plus rapides.',cost:{science:15,module:4},seconds:180},
  {id:'freight-1',branch:'Transport',tier:1,name:'Portage',effect:'Collecteurs +30 % de vitesse et +2 de charge.',cost:{ferrite:20,cuivre:15},seconds:45},
  {id:'freight-2',branch:'Transport',tier:2,name:'Caravanier',effect:'Camions +30 % de vitesse et +8 de charge ; ouvriers : 7 minerais par trajet.',cost:{engrenage:8,cable:20},seconds:90},
  {id:'freight-3',branch:'Transport',tier:3,name:'Logisticien',effect:'Camions +60 % de vitesse et +12 de charge ; ouvriers : 9 minerais par trajet.',cost:{science:15,module:4},seconds:180},
  {id:'militia-1',branch:'Milice',tier:1,name:'Sentinelle',effect:'L’escouade inflige 15 % de dégâts supplémentaires.',cost:{acier:15,cuivre:10},seconds:45},
  {id:'militia-2',branch:'Milice',tier:2,name:'Garde du convoi',effect:'L’escouade subit 25 % de dégâts en moins.',cost:{circuit:8,engrenage:10},seconds:90},
  {id:'militia-3',branch:'Milice',tier:3,name:'Compagnie de sécurité',effect:'Les crédits de ravitaillement des assauts coûtent deux fois moins.',cost:{science:15,module:4},seconds:180},
];
export type ServiceContract={id:string;kind:'haul'|'escort';client:string;provider:string|null;rig:string|null;truck:string|null;vehicle:string|null;ore:RawGood;quantity:number;delivered:number;reward:number;status:'open'|'active'|'done'|'cancelled'|'failed';created:number;accepted:number;started:number;protected:number;cargo:Inventory;from:Place;to:Place;last:number};
export type WarRound={start:number;end:number;scores:Record<Faction,number>;members:Record<string,number>};
export type ServiceOffer={id:string;provider:string;kind:'haul'|'escort';vehicle:string|null;price:number;active:boolean;created:number};
export type Cooperation={offers:ServiceOffer[];contracts:ServiceContract[];war:WarRound;history:{start:number;end:number;scores:Record<Faction,number>;winners:Faction[]}[];bonus:{winners:Faction[];since:number;until:number}|null};
const factions:Faction[]=['aurore','forge','veille'];
export function shared(w:World,now:number):Cooperation{
  const s=w.frontier!.cooperation??={offers:[],contracts:[],war:{start:now,end:now+WEEK,scores:{aurore:0,forge:0,veille:0},members:{}},history:[],bonus:null};s.offers??=[];return s;
}

export const specialtyLevel=(p:Miner,branch:Specialty['branch'])=>Math.max(0,...SPECIALTIES.filter(n=>n.branch===branch&&p.expedition?.talents?.includes(n.id)).map(n=>n.tier));
export const extractionFactor=(p:Miner)=>[1,1.2,1.45,1.75][specialtyLevel(p,'Extraction')];
export const freightSpeed=(p:Miner)=>[1,1,1.3,1.6][specialtyLevel(p,'Transport')];
export const freightLoad=(p:Miner)=>[0,0,8,12][specialtyLevel(p,'Transport')];
export const militiaAttack=(p:Miner)=>specialtyLevel(p,'Milice')>=1?1.15:1;
export const militiaDefense=(p:Miner)=>specialtyLevel(p,'Milice')>=2?.75:1;
export const warFactor=(w:World,p:Miner,now:number)=>shared(w,now).bonus?.until!>now&&shared(w,now).bonus?.since!<=now&&shared(w,now).bonus?.winners.includes(p.faction)?1.1:1;
export function settleCooperation(w:World,now:number){
  const s=shared(w,now),round=s.war;
  if(now>=round.end){
    const best=Math.max(...factions.map(f=>round.scores[f]));
    const winners=best>0?factions.filter(f=>round.scores[f]===best):[];
    s.history.unshift({start:round.start,end:round.end,scores:{...round.scores},winners});s.history=s.history.slice(0,12);
    s.bonus=winners.length?{winners,since:round.end,until:round.end+WEEK}:null;
    const start=round.end+Math.floor((now-round.end)/WEEK)*WEEK;
    s.war={start,end:start+WEEK,scores:{aurore:0,forge:0,veille:0},members:{}};
  }
  for(const p of w.players){const c=p.expedition;if(c?.talentJob&&c.talentJob.ready<=now){(c.talents??=[]).push(c.talentJob.id);c.talentJob=null;}}
  for(const contract of s.contracts)if(contract.status==='open'&&now-contract.created>86400000){const client=w.players.find(p=>p.id===contract.client);if(client)client.coins+=contract.reward;contract.status='cancelled';contract.last=now;}
  s.offers=s.offers.filter(o=>now-o.created<86400000).slice(0,400);
  s.contracts=s.contracts.filter(c=>c.status==='open'||c.status==='active'||now-c.last<7*86400000).slice(0,120);
}
function score(w:World,p:Miner,points:number,now:number){const r=shared(w,now).war,n=Math.max(0,Math.min(points,1000-(r.members[p.id]??0)));r.members[p.id]=(r.members[p.id]??0)+n;r.scores[p.faction]+=n;}
const balance=(p:Miner,g:Good)=>g==='ferrite'||g==='cuivre'?p.inventory[g]:ensureEconomy(p).refined[g];
function spendGoods(p:Miner,cost:Partial<Record<Good,number>>){
  if(Object.entries(cost).some(([g,n])=>balance(p,g as Good)<n))throw Error('Le dépôt manque de ressources pour cette opération.');
  for(const [g,n] of Object.entries(cost)){if(g==='ferrite'||g==='cuivre')p.inventory[g]-=n;else ensureEconomy(p).refined[g as Exclude<Good,RawGood>]-=n;}
}
export function specialtyCost(p:Miner,n:Specialty){
  const other=SPECIALTIES.some(k=>k.branch!==n.branch&&p.expedition?.talents?.includes(k.id));
  return Object.fromEntries(Object.entries(n.cost).map(([g,q])=>[g,Math.ceil(q*(other?1.5:1))])) as Partial<Record<Good,number>>;
}
export function ensureWorkers(p:Miner,now:number){
  const c=p.expedition!;c.talents??=[];c.talentJob??=null;
  c.workers??=Array.from({length:6},(_,i)=>({id:crypto.randomUUID(),point:{...c.home,u:c.home.u+28+i%3*10,v:c.home.v-36+Math.floor(i/3)*12},trip:null,hull:40,cargo:empty(),order:'idle',target:null,phase:'idle',ready:now}));
  return c.workers;
}
export function assignStartingWorkers(w:World,p:Miner,now:number){
  const c=p.expedition!,workers=ensureWorkers(p,now);if(c.startedWorkers)return;c.startedWorkers=true;
  for(const [i,worker] of workers.entries()){
    const ore=i<3?'ferrite':'cuivre',node=c.deposits.map(id=>w.frontier!.deposits[id]).filter(n=>n?.ore===ore&&!n.guards&&n.remaining>0).sort((a,b)=>range(a.point,c.home)-range(b.point,c.home))[0];
    if(node){worker.order='mine';worker.target=node.id;}
  }
}
export const workerLoad=(p:Miner)=>[3,5,7,9][specialtyLevel(p,'Transport')];
export const workerSpeed=(p:Miner)=>[8,10.4,12.8,15.2][specialtyLevel(p,'Transport')];
function departWorker(p:Miner,v:Worker,to:Place,now:number){v.trip=tripTo(v.point,to,now,workerSpeed(p));}
function handoff(v:Worker,kind:WorkerHandoff['kind'],good:RawGood,units:number,at:number){
  if(units<=0)return;
  v.handoffs=(v.handoffs??[]).filter(h=>h.at>=at-8000).slice(-5);
  v.handoffs.push({at,kind,good,units,point:{...v.point}});
}
export function stepWorkers(w:World,p:Miner,now:number){
  if(now<p.joined)return;
  const c=p.expedition!,workers=ensureWorkers(p,now),state=w.frontier!;
  for(const v of workers){
    if(v.hull<=0)continue;
    if(v.trip){v.point=along(v.trip,now);if(now<v.trip.due)continue;v.point={...v.trip.to};v.trip=null;}
    if(v.phase==='moving'){v.phase='idle';v.order='idle';continue;}
    const target=v.order==='mine'?state.deposits[v.target??'']:state.rigs.find(r=>r.id===v.target&&r.owner===p.id);
    if(v.phase==='return'||v.phase==='unload'){
      let room=Math.max(0,depotLimit(p)-rawCount(p.inventory));for(const g of ['ferrite','cuivre'] as const){const n=Math.min(room,v.cargo[g]);p.inventory[g]+=n;v.cargo[g]-=n;handoff(v,'drop',g,n,now);c.delivered+=n;if(v.cargoSource==='trade')c.returnedCargo=(c.returnedCargo??0)+n;if(v.cargoSource==='rig')c.rigDelivered=(c.rigDelivered??0)+n;room-=n;}
      if(rawCount(v.cargo)){v.phase='unload';continue;}v.cargoSource=undefined;v.phase='idle';
    }
    if(v.phase==='outbound'){
      if(v.order==='trade'&&v.trade){const store=c.stores[v.trade.city]??=empty();for(const g of ['ferrite','cuivre'] as const){store[g]+=v.cargo[g];handoff(v,'drop',g,v.cargo[g],now);v.cargo[g]=0;}v.phase='return';departWorker(p,v,c.home,now);continue;}
      if(!target){v.phase='return';departWorker(p,v,c.home,now);continue;}
      v.phase='working';v.ready=now+Math.ceil(60000/[1,1.25,1.66,2][specialtyLevel(p,'Extraction')]);continue;
    }
    if(v.phase==='working'&&now>=v.ready){
      const cap=workerLoad(p);
      if(target&&'remaining' in target&&target.guards<=0){const n=Math.min(cap,target.remaining);target.remaining-=n;v.cargo[target.ore]+=n;if(target.ore==='ferrite'||target.ore==='cuivre')handoff(v,'lift',target.ore,n,now);v.cargoSource='mine';p.mined+=n;w.extracted+=n;}
      else if(target&&'stock' in target){v.cargoSource='rig';let room=cap;for(const g of ['cuivre','ferrite'] as const){const n=Math.min(room,target.stock[g]);target.stock[g]-=n;v.cargo[g]+=n;handoff(v,'lift',g,n,now);room-=n;}}
      else if(target&&'guards' in target&&target.guards>0){v.hull=Math.max(0,v.hull-20);}
      v.phase='return';departWorker(p,v,c.home,now);continue;
    }
    if(v.phase==='idle'&&v.order==='trade'&&v.trade){
      if(p.coins<54)continue;const ore=v.trade.ore,available=Math.max(0,p.inventory[ore]-(c.tradeReserve?.[ore]??(ore==='ferrite'?20:5))),n=Math.min(workerLoad(p),available);if(!n)continue;
      p.inventory[ore]-=n;v.cargo[ore]+=n;handoff(v,'lift',ore,n,now);v.cargoSource='trade';p.coins-=4;(c.workerFinance??={fees:0,revenue:0}).fees+=4;v.phase='outbound';departWorker(p,v,v.trade.point,now);continue;
    }
    if(v.phase!=='idle'||v.order==='idle'||!target||p.coins<54||rawCount(p.inventory)>=depotLimit(p))continue;
    if('remaining' in target&&target.remaining<=0)continue;
    p.coins-=4;(c.workerFinance??={fees:0,revenue:0}).fees+=4;v.phase='outbound';departWorker(p,v,target.point,now);
  }
}
export function isServiceEscort(w:World,provider:Miner,client:Miner,truckId:string){return shared(w,Date.now()).contracts.some(c=>c.kind==='escort'&&c.status==='active'&&c.provider===provider.id&&c.client===client.id&&c.truck===truckId);}
export function guardedByService(w:World,client:Miner,t:Truck){return shared(w,Date.now()).contracts.some(c=>c.kind==='escort'&&c.status==='active'&&c.client===client.id&&c.truck===t.id&&w.players.some(p=>p.id===c.provider&&p.expedition!.army.hull>0&&p.expedition!.army.ammo>0&&range(p.expedition!.army.point,t.point)<140));}
export function serviceDefenders(w:World,client:Miner,t:Truck){return w.players.filter(p=>isServiceEscort(w,p,client,t.id)&&p.expedition!.army.order==='escort'&&p.expedition!.army.hull>0&&p.expedition!.army.ammo>0&&range(p.expedition!.army.point,t.point)<280);}
export function finishServiceTruck(w:World,p:Miner,t:Truck,now:number,arrived:boolean){
  const contract=shared(w,now).contracts.find(c=>c.id===t.contract&&c.provider===p.id&&c.status==='active'),client=contract&&w.players.find(q=>q.id===contract.client);
  if(!contract||!client){t.contract=null;t.phase='return';t.trip=tripTo(t.point,p.expedition!.home,now,45);return;}
  if(t.phase==='repair'){if(now<(t.disabledUntil??now))return;t.hull=140;t.phase=rawCount(t.cargo)?'delivery':'pickup';t.trip=tripTo(t.point,t.phase==='pickup'?contract.from:contract.to,now,30);return;}
  if(t.trip)return;
  if(t.phase==='pickup'&&arrived){t.cargo=contract.cargo;contract.cargo=empty();t.phase='delivery';t.trip=tripTo(t.point,contract.to,now,45*freightSpeed(p)*haulSpeedFactor(p));return;}
  if(t.phase==='delivery'){
    let room=Math.max(0,depotLimit(client)-rawCount(client.inventory));for(const g of ['ferrite','cuivre'] as const){const n=Math.min(room,t.cargo[g]);client.inventory[g]+=n;t.cargo[g]-=n;client.expedition!.delivered+=n;contract.delivered+=n;room-=n;}
    if(rawCount(t.cargo))return;
    contract.status=contract.delivered>=contract.quantity?'done':'failed';contract.last=now;if(contract.status==='done'){p.coins+=contract.reward;score(w,p,30,now);}else client.coins+=contract.reward;t.contract=null;t.phase='return';t.trip=tripTo(t.point,p.expedition!.home,now,45*freightSpeed(p)*haulSpeedFactor(p));
  }
}
export function stepServiceEscorts(w:World,now:number){
  for(const c of shared(w,now).contracts){
    if(c.kind!=='escort'||c.status!=='active')continue;
    const provider=w.players.find(p=>p.id===c.provider),client=w.players.find(p=>p.id===c.client),truck=client?.expedition!.trucks.find(t=>t.id===c.truck),army=provider?.expedition!.army;
    if(!provider||!client||!truck||!army)continue;
    if(now>provider.lastSeen+4*3600000)continue;
    const delta=Math.max(0,Math.min(5,(now-c.last)/1000));c.last=now;
    if(army.hull>0&&army.ammo>0&&army.order==='escort'&&army.target?.id===truck.id&&range(army.point,truck.point)<140){c.started??=0;if(!c.started)c.started=now;c.protected+=delta;}
    if(!c.started&&now<c.accepted+3600000)continue;
    if(c.started&&now<c.started+300000)continue;
    c.status=c.protected>=240&&army.hull>0?'done':'failed';
    if(c.status==='done'){provider.coins+=c.reward;score(w,provider,20,now);}else client.coins+=c.reward;
    if(army.order==='escort'&&army.target?.id===truck.id){army.order='return';army.target=null;army.trip=tripTo(army.point,provider.expedition!.home,now,46);}
  }
}
const POINTS:Record<Good,number>={ferrite:1,cuivre:1,acier:3,lingot:3,engrenage:8,cable:2,circuit:12,module:30,science:20};
export function actCooperation(w:World,p:Miner,a:Record<string,unknown>,now:number){
  const c=p.expedition!,s=shared(w,now);settleCooperation(w,now);const workers=ensureWorkers(p,now);
  if(a.op==='tradeReserve'){const ferrite=a.ferrite,cuivre=a.cuivre;if(!Number.isSafeInteger(ferrite)||!Number.isSafeInteger(cuivre)||Number(ferrite)<0||Number(cuivre)<0||Number(ferrite)>1000000||Number(cuivre)>1000000)throw Error('Réserve commerciale invalide.');c.tradeReserve={ferrite:Number(ferrite),cuivre:Number(cuivre)};return 'Réserve protégée avant les départs commerciaux.';}
  if(a.op==='assign'||a.op==='recall'){
    if(!Array.isArray(a.ids)||!a.ids.length||a.ids.length>36)throw Error('Choisissez les collecteurs.');
    const selected=workers.filter(v=>a.ids instanceof Array&&a.ids.includes(v.id));if(selected.length!==new Set(a.ids).size)throw Error('Collecteurs inconnus.');
    const node=typeof a.deposit==='string'&&c.deposits.includes(a.deposit)?w.frontier!.deposits[a.deposit]:null;
    const rig=typeof a.rig==='string'?w.frontier!.rigs.find(r=>r.id===a.rig&&r.owner===p.id):null;
    if(a.op==='assign'&&!node&&!rig)throw Error('Choisissez un gisement connu ou votre foreuse.');
    const cost=a.op==='assign'?selected.filter(v=>!rawCount(v.cargo)).length*4:0;if(cost&&p.coins<50+cost)throw Error('Gardez 50 CR de réserve et 4 CR par départ.');p.coins-=cost;(c.workerFinance??={fees:0,revenue:0}).fees+=cost;
    for(const v of selected){if(v.trip)v.point=along(v.trip,now);v.trade=undefined;v.order=a.op==='recall'?'idle':node?'mine':'haul';v.target=a.op==='recall'?null:node?.id??rig!.id;if(a.op==='assign'&&!rawCount(v.cargo)){v.phase='outbound';departWorker(p,v,(node??rig)!.point,now);}else{v.phase='return';departWorker(p,v,c.home,now);}}
    return a.op==='recall'?'Collecteurs rappelés. Leur chargement revient au dépôt.':'Collecteurs affectés. Les allers-retours sont automatiques.';
  }
  if(a.op==='trade'){
    if(!Array.isArray(a.ids)||!a.ids.length||a.ids.length>36)throw Error('Choisissez les ouvriers.');
    const selected=workers.filter(v=>a.ids instanceof Array&&a.ids.includes(v.id));if(selected.length!==new Set(a.ids).size)throw Error('Ouvriers inconnus.');
    if(typeof a.city!=='string'||!c.towns.includes(a.city)||(a.ore!=='ferrite'&&a.ore!=='cuivre'))throw Error('Choisissez une ville connue et un minerai.');
    // The point is resolved by Frontier from the known city, never trusted from input.
    const point=a.tradePoint as Place;if(!point)throw Error('Ville introuvable.');
    for(const v of selected){if(v.trip)v.point=along(v.trip,now);v.order='trade';v.target=a.city;v.trade={city:a.city,point,ore:a.ore};v.phase='return';departWorker(p,v,c.home,now);}
    return 'Portage marchand affecté. Les lots arrivent au comptoir après le trajet à pied, puis se vendent dans Troc.';
  }
  if(a.op==='recover'){const v=workers.find(v=>v.id===a.id&&v.hull<=0);if(!v)throw Error('Collecteur immobilisé introuvable.');if(p.coins<20)throw Error('Il faut 20 CR.');spendGoods(p,{ferrite:2});p.coins-=20;v.hull=40;v.point={...c.home};v.trip=null;v.phase='unload';v.order='idle';v.target=null;return 'Collecteur récupéré au camp, chargement conservé.';}
  if(a.op==='recruit'){
    const limit=c.factory?.unlocked.includes('camp-2')?36:24;if(workers.length>=limit)throw Error('Le camp accueille au plus '+limit+' ouvriers.');if(p.coins<120)throw Error('Il faut 120 CR.');spendGoods(p,{ferrite:20,cuivre:5});p.coins-=120;
    workers.push({id:crypto.randomUUID(),point:{...c.home},trip:null,hull:40,cargo:empty(),order:'idle',target:null,phase:'idle',ready:now});return 'Collecteur recruté.';
  }
  if(a.op==='specialize'){
    if(!hasBuilding(p,'mam'))throw Error('Construisez votre centre MAM.');
    const n=SPECIALTIES.find(n=>n.id===a.skill);if(!n)throw Error('Spécialité inconnue.');
    if(c.talents!.includes(n.id))throw Error('Spécialité déjà acquise.');
    if(c.talentJob||c.factory!.research)throw Error('Le MAM termine une recherche.');
    if(specialtyLevel(p,n.branch)!==n.tier-1)throw Error('Débloquez le palier précédent de cette branche.');
    spendGoods(p,specialtyCost(p,n));c.talentJob={id:n.id,start:now,ready:now+n.seconds*1000};return n.name+' · analyse lancée au MAM.';
  }
  if(a.op==='warGive'){
    const good=a.good as Good,n=a.quantity;if(!ALL_GOODS.includes(good)||typeof n!=='number'||!Number.isSafeInteger(n)||n<1||n>100000)throw Error('Contribution invalide.');
    if((s.war.members[p.id]??0)+n*POINTS[good]>1000)throw Error('Chaque commandant peut apporter au plus 1 000 points par manche.');
    spendGoods(p,{[good]:n});score(w,p,n*POINTS[good],now);return 'Contribution livrée à votre faction.';
  }
  if(a.op==='advertise'){
    const kind=a.kind,price=a.price;if((kind!=='haul'&&kind!=='escort')||typeof price!=='number'||!Number.isSafeInteger(price)||price<10||price>100000)throw Error('Offre de service invalide.');
    const t=kind==='haul'?c.trucks.find(t=>t.id===a.vehicle&&t.phase==='idle'&&!t.contract&&t.hull>0):null;
    if(kind==='haul'&&!t||kind==='escort'&&(c.army.hull<=0||c.army.ammo<=0||c.army.order==='escort'))throw Error('L’unité proposée doit être disponible.');
    if(t)t.role='standby';
    s.offers=s.offers.filter(o=>o.provider!==p.id||o.kind!==kind);s.offers.unshift({id:crypto.randomUUID(),provider:p.id,kind,vehicle:t?.id??null,price,active:true,created:now});return 'Votre service est proposé aux autres commandants pour 24 h.';
  }
  if(a.op==='unadvertise'){
    const offer=s.offers.find(o=>o.id===a.id&&o.provider===p.id);if(!offer)throw Error('Offre introuvable.');offer.active=false;return 'Offre de service retirée.';
  }
  if(a.op==='hire'){
    const offer=s.offers.find(o=>o.id===a.id&&o.active),provider=offer&&w.players.find(q=>q.id===offer.provider);
    if(!offer||!provider||provider.id===p.id||now-provider.lastSeen>=4*3600000)throw Error('Ce prestataire n’est plus disponible.');
    const draft=structuredClone(w),clientDraft=draft.players.find(q=>q.id===p.id)!,providerDraft=draft.players.find(q=>q.id===provider.id)!;
    actCooperation(draft,clientDraft,{op:'post',kind:offer.kind,rig:a.rig,truck:a.truck,quantity:a.quantity,reward:offer.price},now);
    const contract=shared(draft,now).contracts[0];actCooperation(draft,providerDraft,{op:'accept',id:contract.id,vehicle:offer.vehicle},now);
    shared(draft,now).offers.find(o=>o.id===offer.id)!.active=false;
    p.coins=clientDraft.coins;provider.expedition=providerDraft.expedition;w.frontier!.cooperation=draft.frontier!.cooperation;w.frontier!.rigs=draft.frontier!.rigs;
    return 'Prestataire engagé. Prime réservée et mission démarrée.';
  }
  if(a.op==='post'){
    if(s.contracts.filter(k=>k.client===p.id&&(k.status==='open'||k.status==='active')).length>=6)throw Error('Vous avez déjà six contrats en cours.');
    const reward=a.reward;if(typeof reward!=='number'||!Number.isSafeInteger(reward)||reward<10||reward>100000||p.coins<reward)throw Error('Prévoyez une prime disponible de 10 à 100 000 CR.');
    const kind=a.kind;if(kind!=='haul'&&kind!=='escort')throw Error('Service inconnu.');
    const rig=kind==='haul'?w.frontier!.rigs.find(r=>r.id===a.rig&&r.owner===p.id):null,truck=kind==='escort'?c.trucks.find(t=>t.id===a.truck):null;
    const quantity=kind==='haul'?a.quantity:0;
    if(kind==='haul'&&(!rig||typeof quantity!=='number'||!Number.isSafeInteger(quantity)||quantity<1||quantity>42))throw Error('Choisissez votre foreuse et un lot de 1 à 42 minerais.');
    if(kind==='escort'&&!truck)throw Error('Choisissez votre convoi à protéger.');
    p.coins-=reward;
    s.contracts.unshift({id:crypto.randomUUID(),kind,client:p.id,provider:null,rig:rig?.id??null,truck:truck?.id??null,vehicle:null,ore:rig?w.frontier!.deposits[rig.deposit].ore as RawGood:'ferrite',quantity:quantity as number,delivered:0,reward,status:'open',created:now,accepted:0,started:0,protected:0,cargo:empty(),from:{...(rig?.point??truck!.point)},to:{...c.home},last:now});
    return 'Contrat publié. La prime reste réservée jusqu’à sa résolution.';
  }
  const contract=s.contracts.find(k=>k.id===a.id);if(!contract)throw Error('Contrat introuvable.');
  if(a.op==='cancel'){
    if(contract.client!==p.id||contract.status!=='open')throw Error('Seul un contrat encore ouvert peut être retiré par son auteur.');
    p.coins+=contract.reward;contract.status='cancelled';contract.last=now;return 'Contrat retiré, prime récupérée.';
  }
  if(a.op==='accept'){
    if(contract.client===p.id||contract.status!=='open')throw Error('Ce contrat ne peut pas être accepté.');
    const client=w.players.find(p=>p.id===contract.client);if(!client)throw Error('Commanditaire indisponible.');
    if(contract.kind==='haul'){
      const t=c.trucks.find(t=>t.id===a.vehicle&&t.phase==='idle'&&t.hull>0&&!t.contract),r=w.frontier!.rigs.find(r=>r.id===contract.rig&&r.owner===client.id);
      if(!t||!r)throw Error('Il faut un transporteur libre et un chantier existant.');
      if(contract.quantity>16+freightLoad(p)+(p.research?.includes('soutes')?6:0)+(p.research?.includes('convois')?8:0))throw Error('La soute est trop petite pour ce contrat.');
      if(r.stock[contract.ore]<contract.quantity)throw Error('Ce lot n’est pas encore disponible au chantier.');
      r.stock[contract.ore]-=contract.quantity;contract.cargo[contract.ore]=contract.quantity;contract.vehicle=t.id;t.contract=contract.id;t.phase='pickup';t.trip=tripTo(t.point,contract.from,now,45*freightSpeed(p)*haulSpeedFactor(p));
    }else{
      const t=client.expedition!.trucks.find(t=>t.id===contract.truck),army=c.army;
      if(!t||t.phase==='idle'||t.hull<=0||army.hull<=0||army.ammo<=0||army.order==='escort')throw Error('Il faut une escouade libre et un convoi du client en route.');
      if(s.contracts.some(k=>k.kind==='escort'&&k.status==='active'&&(k.provider===p.id||k.truck===t.id)))throw Error('Cette escorte est déjà affectée.');
      army.order='escort';army.target={kind:'truck',id:t.id};army.trip=tripTo(army.point,t.point,now,55);
    }
    contract.provider=p.id;contract.status='active';contract.accepted=now;contract.last=now;return 'Contrat accepté. Votre unité rejoint physiquement le client.';
  }
  throw Error('Ordre coopératif inconnu.');
}
export function cooperationView(w:World,p:Miner,now:number){
  const s=shared(w,now),c=p.expedition!;
  return {workerCapacity:workerLoad(p),workerSpeed:workerSpeed(p),tradeReserve:c.tradeReserve??{ferrite:20,cuivre:5},workerFinance:c.workerFinance??{fees:0,revenue:0},returnedCargo:c.returnedCargo??0,workers:ensureWorkers(p,now),talents:c.talents??[],talentJob:c.talentJob??null,specialties:SPECIALTIES.map(n=>({...n,cost:specialtyCost(p,n)})),
    offers:s.offers.filter(o=>o.active||o.provider===p.id).map(o=>{const provider=w.players.find(q=>q.id===o.provider),free=o.kind==='haul'?provider?.expedition!.trucks.some(t=>t.id===o.vehicle&&t.phase==='idle'&&!t.contract&&t.hull>0):!!provider&&provider.expedition!.army.hull>0&&provider.expedition!.army.ammo>0&&provider.expedition!.army.order!=='escort';return {...o,vehicle:o.provider===p.id?o.vehicle:undefined,name:provider?.name??'Camp',available:o.active&&!!provider&&now-provider.lastSeen<4*3600000&&!!free,capacity:provider?16+freightLoad(provider)+(provider.research?.includes('soutes')?6:0)+(provider.research?.includes('convois')?8:0):0,level:provider?specialtyLevel(provider,o.kind==='haul'?'Transport':'Milice'):0};}),
    contracts:s.contracts.map(k=>{const involved=k.client===p.id||k.provider===p.id;return {...k,from:involved?k.from:undefined,to:involved?k.to:undefined,cargo:involved?k.cargo:undefined,clientName:w.players.find(p=>p.id===k.client)?.name??'Camp',providerName:w.players.find(p=>p.id===k.provider)?.name??null,distance:Math.round(range(k.from,k.to))};}),
    war:{...s.war,own:s.war.members[p.id]??0,members:undefined,bonus:s.bonus,history:s.history.slice(0,4)},reset:'2026-11-08'};
}
