import {COLONISTS,guildDecision,expansionDecision} from './colonies';
import {currentFlow} from './factory-flow';
import {appendActivity,actorSnapshot} from './activity-journal';
import {join,type World,type Miner} from './world';
import {actFrontier,canSeePoint,ensureFrontier,TOWNS,type Deposit} from './frontier';
import {foundation,starterCircuit,FACTORY_KINDS,goodsCount,type FactoryKind,type FactoryPiece,type BuildMark} from './factory-grid';
import {INDUSTRY_TREE,industryBlocked,canBuild,canRecipe,type IndustryId} from './industry';
import {RECIPES,ensureEconomy,type Good,type RefinedGood} from './economy';
import {SPECIALTIES,specialtyCost,type SpecialtyId} from './cooperation';
import {range} from './frontier-geography';
import {SIDE} from './planet';

export const AI_VERSION=5;
export const AI_COUNT=8;
export const AI_PROFILES=[
 {id:'industry',name:'Industrie',description:'Produire les composants, ouvrir de nouveaux paliers et étendre les circuits.',plan:['mecanique','cablage','electronique','laboratoires','motorisation']},
 {id:'logistics',name:'Logistique',description:'Financer les routes, spécialiser le portage, agrandir le stock et assembler un camion.',plan:['mecanique','cablage','stockage','electronique','motorisation','maintenance','forage']},
 {id:'explorer',name:'Exploration / extraction',description:'Repérer des filons et villes, exploiter un chantier puis ramener réellement sa production.',plan:['forage','mecanique','cablage']},
 {id:'sentinel',name:'Milice',description:'Reconnaître les camps, financer une caserne, combattre et contribuer à la faction.',plan:['mecanique','camp-militaire','cablage']},
] as const;
export type AIProfile=typeof AI_PROFILES[number]['id'];
export type PlaytestState={doctrine?:string;nextCouncil?:number;nextSurvey?:number;slot?:number;player:string;started:number;next:number;actions:number;errors:number;objective:string;checks:{id:string;label:string;at:number}[];events:{at:number;text:string}[];moved:boolean;trading:boolean;sold:number;lastError:string;recovering?:boolean;recoveryCycles?:number;contractPosted?:boolean;production?:{recipe:RefinedGood;produced:number};version?:number;profile?:AIProfile;advanced?:{id:string;label:string;at:number}[];reason?:string;lastDecisionLog?:number;initialDiscoveries?:number;initialTowns?:number;campTarget?:string;raids?:number;lastMilitary?:number;lastGoalProgress?:number;stalls?:number;lastSignature?:string;stalled?:boolean;retryAfter?:number;lastErrorAt?:number;lastSupply?:number;nextExplore?:number};
const check=(s:PlaytestState,id:string,label:string,now:number)=>{if(!s.checks.some(c=>c.id===id))s.checks.push({id,label,at:now});};
export function testAgents(w:World){return [...w.playtest?[w.playtest]:[],...(w.aiTests??[])];}
const profile=(s:PlaytestState)=>AI_PROFILES.find(p=>p.id===s.profile)??AI_PROFILES[0];
export function ensurePlaytester(w:World,now:number,count=AI_COUNT){
 w.aiTests??=[];const desired=Math.max(1,Math.min(24,Math.floor(count)));
 for(let i=testAgents(w).length;i<desired;i++){
  const p=join(w,'[IA] '+(COLONISTS[i]?.name??'Pionnier '+(i+1)),crypto.randomUUID(),(['veille','aurore','forge'] as const)[i%3],now);p.ai=true;
  const state:PlaytestState={slot:i,doctrine:COLONISTS[i%COLONISTS.length].doctrine,player:p.id,started:now,next:now+(i%4)*5000,actions:0,errors:0,objective:'Déplacer les ouvriers',checks:[],events:[],moved:false,trading:false,sold:0,lastError:'',version:AI_VERSION,profile:AI_PROFILES[i%4].id,advanced:[],lastGoalProgress:now};
  if(!w.playtest)w.playtest=state;else w.aiTests.push(state);
  ensureFrontier(w,now);state.initialDiscoveries=p.expedition!.deposits.length;state.initialTowns=p.expedition!.towns.length;
  p.aiMind={profile:profile(state).name,goal:state.objective,reason:'Départ avec les stocks et coûts normaux.',since:now};
  appendActivity(w,p,'command','join','IA '+profile(state).name+' installée aux règles normales.',{after:actorSnapshot(p,now)},now);
 }
 testAgents(w).forEach((s,i)=>{s.slot??=i;s.doctrine??=COLONISTS[i%COLONISTS.length].doctrine;s.profile??=AI_PROFILES[i%4].id;s.advanced??=[];s.version=AI_VERSION;});
}
function goal(w:World,p:Miner,s:PlaytestState,text:string,reason:string,now:number){
 if(s.objective===text&&s.reason===reason)return;
 s.objective=text;s.reason=reason;p.aiMind={profile:profile(s).name,goal:text,reason,since:now};
 if(now-(s.lastDecisionLog??0)>=60000){s.lastDecisionLog=now;appendActivity(w,p,'progress','ia/decision',profile(s).name+' · '+text,{reason,after:actorSnapshot(p,now)},now);}
}
function milestone(w:World,p:Miner,s:PlaytestState,id:string,label:string,now:number){
 if(s.advanced!.some(a=>a.id===id))return;s.advanced!.push({id,label,at:now});appendActivity(w,p,'progress','ia/palier',label,{profile:s.profile,after:actorSnapshot(p,now)},now);
}
function issue(w:World,p:Miner,s:PlaytestState,action:Record<string,unknown>,now:number){
 if(now<(s.retryAfter??0))return false;
 try{const text=actFrontier(w,p,{...action,requestId:crypto.randomUUID()},now);s.actions++;s.lastError='';s.retryAfter=0;s.events.unshift({at:now,text});s.events=s.events.slice(0,16);return true;}
 catch(error){s.errors++;s.lastError=(error as Error).message;s.lastErrorAt=now;s.retryAfter=now+60000;s.events.unshift({at:now,text:'Blocage : '+s.lastError});s.events=s.events.slice(0,16);return false;}
}
function build(w:World,p:Miner,s:PlaytestState,m:BuildMark&{kind:FactoryKind;recipe?:RefinedGood;filter?:Good},now:number){
 const f=p.expedition!.factory!,price=FACTORY_KINDS[m.kind];
 if(!canBuild(f,m.kind)||p.coins<price.credits+100||p.inventory.ferrite<price.ferrite||p.inventory.cuivre<price.cuivre)return false;
 if(!issue(w,p,s,{type:'factory',op:'place',kind:m.kind,cells:[m]},now))return false;
 const piece=f.pieces.find(q=>q.face===m.face&&q.x===m.x&&q.y===m.y)!;
 if(m.recipe&&piece.recipe!==m.recipe)issue(w,p,s,{type:'factory',op:'recipe',id:piece.id,recipe:m.recipe},now);
 if(piece.kind==='loader')issue(w,p,s,{type:'factory',op:'supply',id:piece.id,good:m.filter??'ferrite',quantity:0},now);
 return true;
}
function circuit(p:Miner,kind:FactoryKind,recipe:RefinedGood,turn:number){
 const h=foundation(p.expedition!.home,5),input=Object.keys(RECIPES[recipe].inputs)[0] as Good;
 return starterCircuit(p.expedition!.home,'ferrite').map(e=>{
  const k=e.kind==='furnace'?kind:e.kind,size=FACTORY_KINDS[k].size,x=e.x-h.x,y=e.y-h.y;
  const xy=turn===0?[x,y]:turn===1?[5-y-size,x]:turn===2?[5-x-size,5-y-size]:[y,5-x-size];
  return {...e,kind:k,face:h.face,x:h.x+xy[0],y:h.y+xy[1],dir:((e.dir+turn)%4) as BuildMark['dir'],recipe:e.kind==='furnace'?recipe:undefined,filter:e.kind==='loader'?input:undefined};
 });
}
function ensureCircuit(w:World,p:Miner,s:PlaytestState,kind:FactoryKind,recipe:RefinedGood,turn:number,now:number){
 const f=p.expedition!.factory!,layout=circuit(p,kind,recipe,turn),occupied=layout.map(m=>f.pieces.find(q=>q.face===m.face&&q.x===m.x&&q.y===m.y)).filter(Boolean) as FactoryPiece[];
 const wrong=occupied.find(q=>q.kind==='furnace'||q.kind==='press'||q.kind==='wiremill'||q.kind==='assembler'||q.kind==='lab');
 const oldInput=occupied.find(q=>layout.slice(0,2).some(m=>m.x===q.x&&m.y===q.y)&&Object.entries(q.items).some(([g,n])=>n>0&&!RECIPES[recipe].inputs[g as Good]));
 if(oldInput&&(!wrong||!wrong.job)&&p.inventory.ferrite+p.inventory.cuivre<300)return issue(w,p,s,{type:'factory',op:'drain',id:oldInput.id},now);
 if(wrong&&wrong.kind!==kind){if(wrong.job||p.inventory.ferrite+p.inventory.cuivre>300)return false;return issue(w,p,s,{type:'factory',op:'remove',cells:[wrong]},now);}
 const missing=layout.find(m=>!f.pieces.some(q=>q.face===m.face&&q.x===m.x&&q.y===m.y&&q.kind===m.kind));
 if(missing)return build(w,p,s,missing,now);
 const machine=occupied.find(q=>q.kind===kind)!;
 if(machine.recipe!==recipe&&!machine.job)return issue(w,p,s,{type:'factory',op:'recipe',id:machine.id,recipe},now);
 return false;
}
function quantity(p:Miner,g:Good){return g==='ferrite'||g==='cuivre'?p.inventory[g]:ensureEconomy(p).refined[g];}
function targets(p:Miner,s:PlaytestState){
 const f=p.expedition!.factory!,next=profile(s).plan.find(id=>!f.unlocked.includes(id));
 const node=INDUSTRY_TREE.find(n=>n.id===next),need:Partial<Record<Good,number>>={acier:12,lingot:8};
 for(const [g,n] of Object.entries(node?.cost??{}))need[g as Good]=(need[g as Good]??0)+n;
 if(s.profile==='logistics'){need.engrenage=Math.max(need.engrenage??0,16);if(f.unlocked.includes('cablage'))need.cable=Math.max(need.cable??0,30);if(f.unlocked.includes('motorisation'))need.module=2;}
 if(s.profile==='sentinel'){need.acier=Math.max(need.acier??0,45);need.engrenage=Math.max(need.engrenage??0,12);}
 if(!node&&s.profile==='industry'){need.science=12;need.module=4;need.circuit=10;}
 for(const g of ['science','module','circuit','cable','engrenage','lingot','acier'] as RefinedGood[]){if(!canRecipe(f,g)){delete need[g];continue;}const gap=Math.max(0,(need[g]??0)-quantity(p,g));for(const [input,n] of Object.entries(RECIPES[g].inputs)){if(input!=='ferrite'&&input!=='cuivre')need[input as Good]=(need[input as Good]??0)+Math.ceil(gap/RECIPES[g].output)*n;}}
 return {need,node};
}
function supply(w:World,p:Miner,s:PlaytestState,recipe:RefinedGood,turn:number,now:number,remaining=6){
 const f=p.expedition!.factory!,layout=circuit(p,RECIPES[recipe].machine,recipe,turn),pieces=layout.map(m=>f.pieces.find(q=>q.face===m.face&&q.x===m.x&&q.y===m.y)).filter(Boolean) as FactoryPiece[],loader=pieces.find(q=>q.kind==='loader');
 if(!loader||pieces.length!==layout.length||pieces.find(q=>q.kind===RECIPES[recipe].machine)?.recipe!==recipe)return false;
 if(!loader.active)return issue(w,p,s,{type:'factory',op:'pause',id:loader.id},now);
 if(loader.batch===undefined){if(goodsCount(loader.items))return false;return issue(w,p,s,{type:'factory',op:'supply',id:loader.id,good:loader.filter,quantity:0},now);}
 if(loader.batch>0||goodsCount(loader.items))return false;
 for(const [g,n] of Object.entries(RECIPES[recipe].inputs) as [Good,number][]){
  // Multi-input machines must leave room for the next ingredient on this shared
  // feed. Single-input recipes can safely keep a larger lot in circulation.
  const limit=Object.keys(RECIPES[recipe].inputs).length>1?2:6;
  const batches=Math.min(limit,Math.max(1,Math.ceil(remaining/RECIPES[recipe].output)));
  const inFlight=pieces.reduce((sum,q)=>sum+q.items[g]+(q.job?RECIPES[q.job.recipe].inputs[g]??0:0),0),missing=Math.max(0,n*batches-inFlight);
  const reserve=g==='ferrite'||g==='cuivre'?f.reserve?.[g]??(g==='ferrite'?20:5):0,nTake=Math.min(missing,Math.max(0,quantity(p,g)-reserve));
  if(nTake>0)return issue(w,p,s,{type:'factory',op:'supply',id:loader.id,good:g,quantity:nTake},now);
 }
 return false;
}
function facility(w:World,p:Miner,s:PlaytestState,kind:FactoryKind,now:number){
 const f=p.expedition!.factory!;if(f.pieces.some(q=>q.kind===kind))return false;
 const h=foundation(p.expedition!.home,5);return build(w,p,s,{kind,face:h.face,x:h.x-9,y:h.y+(kind==='warehouse'?7:kind==='barracks'?-9:12),dir:1},now);
}
function specialize(w:World,p:Miner,s:PlaytestState,id:SpecialtyId,now:number){
 const c=p.expedition!;if(c.talents?.includes(id)||c.talentJob||c.factory!.research)return false;
 const n=SPECIALTIES.find(n=>n.id===id)!,previous=id.slice(0,-1)+(n.tier-1);
 if(n.tier>1&&!c.talents?.includes(previous as SpecialtyId))return false;
 if(Object.entries(specialtyCost(p,n)).some(([g,n])=>quantity(p,g as Good)<n))return false;
 return issue(w,p,s,{type:'society',op:'specialize',skill:id},now);
}
export function tickPlaytester(w:World,now:number){for(const s of testAgents(w))runAgent(w,s,now);}
function runAgent(w:World,s:PlaytestState,now:number){
 const p=w.players.find(p=>p.id===s.player);if(!p||now<s.next||now<p.joined)return;
 s.next=now+(s.checks.length>=6?20000:10000);p.lastSeen=now;s.advanced??=[];
 const slot=s.slot??0,colonist=COLONISTS[slot%COLONISTS.length];
 if(now>=(s.nextCouncil??s.started+15000+slot*2000)){
  s.nextCouncil=now+(p.expedition?.guild?35000:45000);
  const vote=guildDecision(w,p,colonist,now);
  if(vote)issue(w,p,s,{...vote.action,reason:vote.reason},now);
 }
 if(now>=(s.nextSurvey??s.started+90000+slot*3000)){
  s.nextSurvey=now+60000;
  const plan=expansionDecision(w,p,colonist,now);
  if(plan)issue(w,p,s,{...plan.action,reason:plan.reason},now);
 }
 const c=p.expedition!,f=c.factory!,workers=c.workers!,city=TOWNS.filter(t=>c.towns.includes(t.id)).sort((a,b)=>range(c.home,a.point)-range(c.home,b.point))[0];
 if(!city)return;
 const signature=[p.mined,s.sold,f.unlocked.length,f.pieces.length,Object.values(f.produced).reduce((a,b)=>a+(b??0),0),c.deposits.length,p.damage].join('/');
 if(signature!==s.lastSignature){s.lastSignature=signature;s.lastGoalProgress=now;if(s.stalled){appendActivity(w,p,'progress','ia/reprise','IA de nouveau en progression.',{after:actorSnapshot(p,now)},now);s.stalled=false;}}
 else if(now-(s.lastGoalProgress??now)>12*60000&&!s.stalled){s.stalls=(s.stalls??0)+1;s.stalled=true;appendActivity(w,p,'blocked','ia/sans-progres','Aucun progrès mesurable depuis douze minutes.',{profile:s.profile,objective:s.objective,after:actorSnapshot(p,now)},now);}
 if(!s.moved){if(issue(w,p,s,{type:'rts',op:'move',ids:workers.map(v=>v.id),point:{...c.home,u:Math.min(SIDE-1,c.home.u+72.45),v:Math.min(SIDE-1,c.home.v+48.72)}},now))s.moved=true;return;}
 if(!s.checks.some(q=>q.id==='move')){if(workers.some(v=>v.trip))return;check(s,'move','Déplacement libre des six ouvriers',now);}
 if(c.delivered>0)check(s,'gather','Récolte et livraison physique au dépôt',now);
 if((f.produced.acier??0)>0&&(f.produced.lingot??0)>0)check(s,'smelt','Deux minerais transformés par circuits',now);
 if(f.unlocked.includes('mecanique'))check(s,'research','Mécanique financée par la production',now);
 if(s.sold>0)check(s,'trade','Livraison et vente réelle en ville',now);
 if(f.pieces.length>=29)check(s,'build','MAM et deux circuits construits',now);
 for(const town of TOWNS.filter(t=>c.towns.includes(t.id))){const ore=(c.stores[town.id]?.cuivre??0)>0?'cuivre':'ferrite',n=c.stores[town.id]?.[ore]??0;if(n>0){if(issue(w,p,s,{type:'townSell',city:town.id,good:ore,quantity:n},now))s.sold+=n;break;}}
 const h=foundation(c.home,5);
 if(!f.pieces.some(q=>q.kind==='mam')){goal(w,p,s,'Construire le MAM','Le centre ouvre les spécialisations utiles au démarrage.',now);build(w,p,s,{kind:'mam',face:h.face,x:h.x-5,y:h.y-5,dir:1},now);return;}
 if(specialize(w,p,s,'freight-1',now))return;
 if(!c.tradeReserve){issue(w,p,s,{type:'society',op:'tradeReserve',ferrite:25,cuivre:s.profile==='logistics'?24:16},now);return;}
 const safe=c.deposits.map(id=>w.frontier!.deposits[id]).filter(n=>n&&n.guards<=0&&n.remaining>0).sort((a,b)=>range(a.point,c.home)-range(b.point,c.home));
 const rig=w.frontier!.rigs.find(r=>r.owner===p.id&&r.active&&r.hull>0);
 const {need,node}=targets(p,s);
 const rawNeed={ferrite:45,cuivre:35};
 for(const recipe of ['acier','lingot'] as const){
  const g=recipe==='acier'?'ferrite':'cuivre';
  rawNeed[g]=Math.min(140,Math.max(rawNeed[g],((need[recipe]??0)-quantity(p,recipe))*2+(f.reserve?.[g]??20)));
 }
 // Free restocking takes precedence over paid construction and trade decisions.
 if(now-(s.lastSupply??0)>=20000){
  for(const [recipe,turn] of [['acier',0],['lingot',1]] as [RefinedGood,number][]){
   const gap=(need[recipe]??0)-quantity(p,recipe);
   if(gap>0&&supply(w,p,s,recipe,turn,now,gap)){s.lastSupply=now;goal(w,p,s,'Alimenter '+RECIPES[recipe].name,'Lot adapté au besoin, réserve de chantier conservée.',now);return;}
  }
 }
 if((!safe.some(n=>n.ore==='ferrite')||!safe.some(n=>n.ore==='cuivre'))&&c.scout.hull>0&&!c.scout.auto){goal(w,p,s,'Rechercher un gisement de remplacement','Un filon connu est épuisé ou devenu hostile.',now);issue(w,p,s,{type:'scout'},now);return;}
 if(p.coins<54&&workers.every(v=>!v.trip)&&workers.every(v=>!v.cargo.cuivre&&!v.cargo.ferrite)){const asset=f.pieces.find(q=>q.kind==='furnace'&&!q.job);if(asset){goal(w,p,s,'Financer les départs par démontage','Récupération normale du coût d’une machine ; aucun crédit créé.',now);issue(w,p,s,{type:'factory',op:'remove',cells:[asset]},now);return;}}
 const traderCount=s.profile==='logistics'?3:2;
 for(const [i,v] of workers.entries()){
  if(v.hull<=0){if(p.coins>=120&&p.inventory.ferrite>=2)issue(w,p,s,{type:'society',op:'recover',id:v.id},now);continue;}
  if(i>=workers.length-traderCount){const saleOre=p.inventory.ferrite>150?'ferrite':'cuivre';if((v.order!=='trade'&&!v.trip||v.trade?.ore!==saleOre)&&!v.cargo.cuivre&&!v.cargo.ferrite){issue(w,p,s,{type:'society',op:'trade',ids:[v.id],city:city.id,ore:saleOre},now);return;}continue;}
  const assigned=(g:'ferrite'|'cuivre')=>workers.filter(q=>q.id!==v.id&&q.order==='mine'&&w.frontier!.deposits[q.target??'']?.ore===g).length;
  const shortage=(g:'ferrite'|'cuivre')=>(rawNeed[g]-p.inventory[g])/(assigned(g)+1);
  const ore=shortage('ferrite')>=shortage('cuivre')?'ferrite':'cuivre',node=safe.find(n=>n.ore===ore),useRig=rig&&s.profile==='explorer'&&i===1;
  const current=v.target&&w.frontier!.deposits[v.target];if((v.order==='mine'&&current&&quantity(p,current.ore as Good)>(current.ore==='ferrite'?rawNeed.ferrite:rawNeed.cuivre)+25||v.order==='haul'&&rig&&quantity(p,w.frontier!.deposits[rig.deposit].ore as Good)>140)&&!v.cargo.ferrite&&!v.cargo.cuivre&&v.phase!=='return'){issue(w,p,s,{type:'society',op:'recall',ids:[v.id]},now);return;}
  if(v.order==='idle'&&quantity(p,useRig?w.frontier!.deposits[rig!.deposit].ore as Good:ore)>=(useRig?90:rawNeed[ore]))continue;
  const old=v.target&&w.frontier!.deposits[v.target],lost=v.order==='mine'&&(!old||old.remaining<=0||old.guards>0);if(lost&&!v.trip&&!v.cargo.cuivre&&!v.cargo.ferrite&&v.phase!=='idle'){issue(w,p,s,{type:'society',op:'recall',ids:[v.id]},now);return;}
  if((v.order==='idle'||lost||useRig&&v.order!=='haul')&&!v.trip&&v.phase==='idle'&&p.coins>=54&&(node||useRig)){
   goal(w,p,s,useRig?'Ramener le minerai du chantier':'Affecter les collecteurs','Gisement sûr le plus proche ; les trajets en cours ne sont pas annulés.',now);
   issue(w,p,s,{type:'society',op:'assign',ids:[v.id],...useRig?{rig:rig.id}:{deposit:node!.id}},now);return;
  }
 }
 if(w.frontier!.cooperation!.contracts.some(k=>k.status==='done'&&k.provider===p.id))milestone(w,p,s,'contract','Prestation livrée et prime gagnée',now);
 if(w.frontier!.cooperation!.contracts.some(k=>k.status==='done'&&k.client===p.id))milestone(w,p,s,'outsourced','Minerai reçu d’un prestataire réel',now);
 if(p.coins<100){goal(w,p,s,'Attendre les recettes en route','Réserve basse : aucune nouvelle dépense de construction.',now);return;}
 const first=[...circuit(p,'furnace','acier',0),...circuit(p,'furnace','lingot',1)];
 const missing=first.find(m=>!f.pieces.some(q=>q.face===m.face&&q.x===m.x&&q.y===m.y&&q.kind===m.kind));
 if(missing){goal(w,p,s,'Construire les premières chaînes','Chaque élément est posé et payé individuellement.',now);build(w,p,s,missing,now);return;}
 if(s.profile==='explorer'&&specialize(w,p,s,'extract-1',now))return;
 if(node&&!f.research&&!c.talentJob&&p.coins>=node.credits+100&&!industryBlocked(p,f,node)){goal(w,p,s,'Rechercher '+node.name,'Prochain palier de la branche '+profile(s).name+'.',now);issue(w,p,s,{type:'factory',op:'research',skill:node.id},now);return;}
 if(s.production&&(f.produced[s.production.recipe]??0)>s.production.produced)s.production=undefined;
 const desired=s.production?.recipe??(['science','module','circuit','cable','engrenage'] as RefinedGood[]).find(g=>canRecipe(f,g)&&quantity(p,g)<(need[g]??0)&&Object.entries(RECIPES[g].inputs).every(([input,n])=>quantity(p,input as Good)>=n));
 if(desired){s.production??={recipe:desired,produced:f.produced[desired]??0};const turn=desired==='engrenage'?2:3;goal(w,p,s,'Fabriquer '+desired,'Production pilotée par les composants du prochain objectif.',now);if(ensureCircuit(w,p,s,RECIPES[desired].machine,desired,turn,now))return;if(supply(w,p,s,desired,turn,now,Math.max(1,(need[desired]??0)-quantity(p,desired))))return;}
 if(f.unlocked.length>=2)milestone(w,p,s,'research-2','Deux recherches terminées',now);
 if((f.produced.engrenage??0)>0)milestone(w,p,s,'gears','Engrenages fabriqués physiquement',now);
 if((f.produced.cable??0)>0)milestone(w,p,s,'wire','Câbles fabriqués physiquement',now);
 if((f.produced.circuit??0)>0)milestone(w,p,s,'circuits','Circuits électroniques fabriqués',now);
 if((f.produced.science??0)>0)milestone(w,p,s,'science','Dossiers de recherche fabriqués',now);
 if((s.profile==='explorer'||s.profile==='sentinel')&&c.scout.hull<=0&&p.coins>=Math.max(300,(node?.credits??0)+200)&&now>=(s.nextExplore??0)&&p.inventory.ferrite>=10){goal(w,p,s,'Récupérer l’éclaireur','La reconnaissance a rencontré un danger ; réparation payée au camp.',now);if(issue(w,p,s,{type:'repair'},now))s.nextExplore=now+20*60000;return;}
 if(s.profile==='explorer'){
  if(!c.scout.auto&&c.scout.hull>0){issue(w,p,s,{type:'scout'},now);return;}
  if(c.deposits.length>(s.initialDiscoveries??0)+4)milestone(w,p,s,'discover','Nouveaux gisements repérés',now);
  if(c.towns.length>(s.initialTowns??1))milestone(w,p,s,'town','Deuxième ville découverte',now);
  if(f.unlocked.includes('forage')&&!rig&&p.coins>=190&&p.inventory.ferrite>=20){const n=safe.find(n=>n.ore==='cuivre')??safe[0];if(n){issue(w,p,s,{type:'install',deposit:n.id},now);return;}}
  if((c.rigDelivered??0)>0)milestone(w,p,s,'rig-delivery','Minerai du chantier réellement livré au dépôt',now);
  if(rig&&(rig.stock.cuivre+rig.stock.ferrite)>=10&&!s.contractPosted&&p.coins>=200){if(issue(w,p,s,{type:'society',op:'post',kind:'haul',rig:rig.id,quantity:10,reward:30},now))s.contractPosted=true;return;}
  if(rig){milestone(w,p,s,'rig','Foreuse installée aux coûts normaux',now);if((rig.stock.cuivre+rig.stock.ferrite)>0)milestone(w,p,s,'rig-output','Chantier en production',now);}
 }
 if(s.profile==='logistics'){
  if(specialize(w,p,s,'freight-2',now))return;
  if(c.talents?.includes('freight-2'))milestone(w,p,s,'freight','Spécialisation de transport au palier deux',now);
  if(f.unlocked.includes('stockage')&&facility(w,p,s,'warehouse',now))return;
  if(f.pieces.some(q=>q.kind==='warehouse'))milestone(w,p,s,'warehouse','Entrepôt financé et construit',now);
  if(f.unlocked.includes('stockage')&&workers.length<8&&p.coins>=350&&p.inventory.ferrite>=40&&p.inventory.cuivre>=20){issue(w,p,s,{type:'society',op:'recruit'},now);return;}
  if(workers.length>=8)milestone(w,p,s,'workforce','Huit ouvriers opérationnels',now);
  if(f.unlocked.includes('maintenance')&&facility(w,p,s,'repairbay',now))return;
  if(f.unlocked.includes('motorisation')&&f.pieces.some(q=>q.kind==='repairbay')&&!c.trucks.length&&ensureEconomy(p).refined.module>=2&&p.coins>=300&&p.inventory.ferrite>=20){issue(w,p,s,{type:'truck'},now);return;}
  if(c.trucks.length){milestone(w,p,s,'truck','Premier camion assemblé',now);const contract=w.frontier!.cooperation!.contracts.find(k=>k.kind==='haul'&&k.status==='open'&&k.client!==p.id&&k.quantity<=16);if(contract&&c.trucks[0].phase==='idle'){issue(w,p,s,{type:'society',op:'accept',id:contract.id,vehicle:c.trucks[0].id},now);return;}}
 }
 if(s.profile==='sentinel'){
  if(specialize(w,p,s,'militia-1',now))return;
  if(f.unlocked.includes('camp-militaire')&&facility(w,p,s,'barracks',now))return;
  if(f.pieces.some(q=>q.kind==='barracks')&&p.units<4&&p.coins>=350&&p.inventory.ferrite>=30&&p.inventory.cuivre>=6){issue(w,p,s,{type:'train'},now);return;}
  if(p.units>=4)milestone(w,p,s,'army','Escouade renforcée grâce à la caserne',now);
  if(!c.scout.auto&&c.scout.hull>0){issue(w,p,s,{type:'scout'},now);return;}
  if(s.campTarget&&w.frontier!.deposits[s.campTarget]?.guards===0){s.raids=(s.raids??0)+1;s.campTarget=undefined;s.lastMilitary=now;milestone(w,p,s,'raid','Camp hostile effectivement neutralisé',now);}
  if(c.army.hull<80||c.army.ammo<20){if(c.army.order!=='return'&&range(c.army.point,c.home)>80){issue(w,p,s,{type:'return',unit:'army'},now);return;}}
  else if(now-(s.lastMilitary??0)>180000&&!c.army.trip&&c.army.order!=='attack'){
   const n=c.deposits.map(id=>w.frontier!.deposits[id]).filter(n=>n?.guards>0&&range(n.point,c.home)<2200).sort((a,b)=>a.guards-b.guards||range(a.point,c.home)-range(b.point,c.home))[0];
   if(n){goal(w,p,s,'Sécuriser un camp reconnu','La milice reste limitée aux monstres ; les joueurs ne sont pas ciblés.',now);if(canSeePoint(p,n.point)){if(issue(w,p,s,{type:'attack',target:{kind:'camp',id:n.id}},now))s.campTarget=n.id;}else issue(w,p,s,{type:'move',unit:'army',point:n.point},now);return;}
  }
  const war=w.frontier!.cooperation!.war;if(!war.members[p.id]&&ensureEconomy(p).refined.acier>=20){if(issue(w,p,s,{type:'society',op:'warGive',good:'acier',quantity:5},now))milestone(w,p,s,'faction','Contribution réelle à l’effort de faction',now);return;}
 }
 goal(w,p,s,node?'Approvisionner '+node.name:'Consolider la spécialisation','Les seuils de production suivent les besoins ; attente des trajets et recettes réels.',now);
}
export function playtestView(w:World,now:number,watch?:string){
 const agents=testAgents(w),s=agents.find(a=>a.player===watch)??w.playtest;if(!s)return null;const p=w.players.find(p=>p.id===s.player);
 return {player:s.player,count:agents.length,agents:agents.map(a=>{const actor=w.players.find(p=>p.id===a.player)!;return {id:a.player,name:actor.name,profile:profile(a).name,home:actor.expedition!.home,checks:a.checks.length,advanced:a.advanced?.length??0,actions:a.actions,errors:a.errors,blocked:actor.activityPulse?.status??a.lastError};}),profile:profile(s).name,description:profile(s).description,version:AI_VERSION,advanced:s.advanced??[],reason:s.reason??'',stalls:s.stalls??0,
 scene:p?{home:p.expedition!.home,flow:currentFlow(p.expedition!.factory!),clock:p.expedition!.factory!.clock,pieces:p.expedition!.factory!.pieces,workers:p.expedition!.workers!.map(v=>({id:v.id,point:v.point,trip:v.trip,hull:v.hull,cargo:v.cargo,handoffs:v.handoffs}))}:null,name:p?.name??'[IA]',started:s.started,updated:Math.min(now,s.next),objective:s.objective,actions:s.actions,errors:s.errors,checks:s.checks,events:s.events,lastError:p?.activityPulse?.status??s.lastError,status:p?.activityPulse?.status?'blocked' as const:s.checks.length>=6?'passed' as const:'running' as const,sold:s.sold,inventory:p?{ferrite:p.inventory.ferrite,cuivre:p.inventory.cuivre,coins:p.coins,plates:(p.economy?.refined.acier??0)+(p.economy?.refined.lingot??0)}:null};
}
