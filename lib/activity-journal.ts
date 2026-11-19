import type {Miner,World} from './world';
import {RELEASE_ID} from './release';
import {along} from './frontier-geography';
import {FACTORY_KINDS} from './factory-grid';
import {factoryDiagnostics} from './factory-sim';
import {INDUSTRY_TREE} from './industry';
import {SPECIALTIES} from './cooperation';
export type ActivityEntry={id:string;generation:string;at:number;actor:string;name:string;kind:'human'|'ai';category:'command'|'blocked'|'progress';action:string;summary:string;context:Record<string,unknown>};
export type ActivityPulse={at:number;coins:number;mined:number;delivered:number;produced:number;status:string;since?:number};
export function actorSnapshot(p:Miner,now:number){const c=p.expedition;return {credits:p.coins,iron:p.inventory.ferrite,copper:p.inventory.cuivre,mined:p.mined,delivered:c?.delivered??0,returnedCargo:c?.returnedCargo??0,rigDelivered:c?.rigDelivered??0,deliveredNet:(c?.delivered??0)-(c?.returnedCargo??0),buildings:c?.factory?.pieces.length??0,research:c?.factory?.unlocked.length??0,unlocked:[...(c?.factory?.unlocked??[])],refined:{...(p.economy?.refined??{})},produced:{...(c?.factory?.produced??{})},workers:c?.workers?.length??0,workerOrders:c?.workers?.reduce<Record<string,number>>((a,v)=>{a[v.order]=(a[v.order]??0)+1;return a;},{}),finance:{...(c?.workerFinance??{fees:0,revenue:0})},ai:p.aiMind,discovered:c?.deposits.length??0,towns:c?.towns.length??0,position:c?c.scout.trip?along(c.scout.trip,now):c.scout.point:null};}
export function appendActivity(w:World,p:Miner,category:ActivityEntry['category'],action:string,summary:string,context:Record<string,unknown>,at:number,key?:string){const entries=w.auditPending??=[];if(entries.length>=1500)return;entries.push({id:RELEASE_ID+':'+p.id+':'+(key??crypto.randomUUID())+':'+category,generation:RELEASE_ID,at,actor:p.id,name:p.name,kind:p.ai?'ai':'human',category,action:action.slice(0,100),summary:summary.slice(0,350),context});}
export function actionContext(a:Record<string,unknown>){const result:Record<string,unknown>={};for(const key of ['type','op','unit','kind','skill','good','ore','quantity','city','id','deposit','rig','recipe','ferrite','cuivre'])if(typeof a[key]==='string'||typeof a[key]==='number')result[key]=String(a[key]).slice(0,100);if(Array.isArray(a.ids)){result.units=a.ids.length;result.selection=a.ids.filter(id=>typeof id==='string').slice(0,48).map(id=>String(id).slice(0,100));}if(Array.isArray(a.cells)){result.tiles=a.cells.length;result.cells=a.cells.slice(0,24).map(v=>{const c=v as Record<string,unknown>;return {face:c.face,x:c.x,y:c.y,dir:c.dir};});}if(a.target&&typeof a.target==='object'){const t=a.target as Record<string,unknown>;result.target={kind:t.kind,id:t.id};}if(a.point&&typeof a.point==='object'){const p=a.point as {face?:unknown;u?:unknown;v?:unknown};result.destination={face:String(p.face).slice(0,10),u:Number.isFinite(p.u)?Math.round(p.u as number):null,v:Number.isFinite(p.v)?Math.round(p.v as number):null};}return result;}
export function monitorActivity(w:World,p:Miner,now:number){
 if(now<p.joined)return;
 const camp=p.expedition;
 if(camp){
  const progress=p.journalProgress??={deposits:0,industry:0,talents:0};
  if(camp.deposits.length>progress.deposits){
   const found=camp.deposits.slice(progress.deposits).map(id=>w.frontier?.deposits[id]).filter(d=>!!d);
   if(found.length)appendActivity(w,p,'progress','exploration/filons',found.length+' gisement'+(found.length>1?'s repérés':' repéré'),{gisements:found.map(d=>({id:d.id,minerai:d.ore,position:d.point,gardes:d.guards}))},now);
  }
  const unlocked=camp.factory?.unlocked??[],talents=camp.talents??[];
  for(const id of unlocked.slice(progress.industry))appendActivity(w,p,'progress','recherche/terminee','Recherche achevée · '+(INDUSTRY_TREE.find(n=>n.id===id)?.name??id),{recherche:id},now);
  for(const id of talents.slice(progress.talents))appendActivity(w,p,'progress','specialisation/acquise','Spécialisation acquise · '+(SPECIALTIES.find(n=>n.id===id)?.name??id),{specialisation:id},now);
  progress.deposits=camp.deposits.length;progress.industry=unlocked.length;progress.talents=talents.length;
  for(const contract of w.frontier?.cooperation?.contracts??[]){
   if(contract.last!==now||(contract.provider!==p.id&&contract.client!==p.id))continue;
   if(!['done','failed','cancelled'].includes(contract.status))continue;
   const success=contract.status==='done';
   const service=contract.kind==='haul'?'Fret':'Escorte';
   const result=success?'achevé':contract.status==='failed'?'échoué':'annulé';
   appendActivity(w,p,success?'progress':'blocked','services/resultat',service+' · contrat '+result+' · '+contract.reward+' CR '+(success?'versés':'remboursés'),{contrat:contract.id,client:contract.client,prestataire:contract.provider,quantite:contract.quantity,livre:contract.delivered,protectionSecondes:contract.protected,prime:contract.reward,statut:contract.status},now,'service-'+contract.id+'-'+result);
  }
  const transfers=(camp.workers??[]).flatMap(worker=>(worker.handoffs??[]).filter(h=>h.at===now).map(h=>({ouvrier:worker.id,operation:h.kind==='lift'?'chargement':'déchargement',minerai:h.good,quantite:h.units,position:h.point})));
  if(transfers.length){
   const loaded=transfers.filter(h=>h.operation==='chargement').reduce((n,h)=>n+h.quantite,0);
   const unloaded=transfers.reduce((n,h)=>n+h.quantite,0)-loaded;
   const summary=[loaded&&`${loaded} unités chargées`,unloaded&&`${unloaded} unités déposées`].filter(Boolean).join(' · ');
   appendActivity(w,p,'progress','logistique/manutention',summary,{transferts:transfers},now,'ouvriers-'+now);
  }
 }
 const factory=p.expedition?.factory;
 if(factory){
  const diagnostics=factoryDiagnostics(w,p,now),previous=factory.conditions??[];
  factory.conditions=diagnostics.map(d=>{
   const old=previous.find(c=>c.piece===d.piece&&c.code===d.code&&c.severity===d.severity);
   const state=old??{piece:d.piece,code:d.code,severity:d.severity,since:now,reported:false};
   if(!state.reported&&(d.severity==='info'?['paused','batch-complete'].includes(d.code):now-state.since>=30000)){
    const piece=factory.pieces.find(q=>q.id===d.piece)!;
    appendActivity(w,p,d.severity==='warning'?'blocked':'progress','factory/condition',FACTORY_KINDS[piece.kind].name+' · '+d.title,{machine:{id:piece.id,kind:piece.kind,recipe:piece.recipe},code:d.code,since:state.since,detail:d.detail,advice:d.advice,good:d.good,available:d.available,reserve:d.reserve},now);
    state.reported=true;
   }
   return state;
  });
  for(const old of previous){
   if(!old.reported||factory.conditions.some(c=>c.piece===old.piece&&c.code===old.code&&c.severity===old.severity))continue;
   const piece=factory.pieces.find(q=>q.id===old.piece),next=diagnostics.find(d=>d.piece===old.piece);
   appendActivity(w,p,'progress','factory/condition-end',piece?FACTORY_KINDS[piece.kind].name+' · '+(next?next.title:'Circulation rétablie'):'Installation démontée',{machine:old.piece,code:old.code,since:old.since,durationSeconds:(now-old.since)/1000,next:next?.code??(piece?'ready':'removed')},now);
  }
 }
 if(now<p.joined||now-(p.activityPulse?.at??p.joined)<60000)return;
 const c=p.expedition;if(!c)return;const workers=c.workers??[],active=workers.filter(v=>v.order!=='idle');
 const produced=Object.values(c.factory?.produced??{}).reduce((s,n)=>s+(n??0),0),previous=p.activityPulse??{at:p.joined,coins:800,mined:0,delivered:0,produced:0,status:''};
 const status=p.coins<54&&active.some(v=>!v.trip)?'Crédits insuffisants pour les prochains départs':workers.some(v=>v.phase==='unload')?'Dépôt plein : déchargement en attente':now-p.joined>120000&&!active.length&&workers.every(v=>!v.trip)?'Ouvriers sans affectation':'';
 if(status&&status!==previous.status)appendActivity(w,p,'blocked','simulation',status,{before:previous,after:actorSnapshot(p,now)},now);
 else if(!status&&previous.status)appendActivity(w,p,'progress','reprise','Activité reprise après : '+previous.status,{durationSeconds:Math.max(0,(now-(previous.since??previous.at))/1000),after:actorSnapshot(p,now)},now);
 if(p.mined!==previous.mined||c.delivered!==previous.delivered||produced!==previous.produced)appendActivity(w,p,'progress','bilan-minute',`${Math.max(0,p.mined-previous.mined)} minerais récoltés · ${Math.max(0,c.delivered-previous.delivered)} livrés · ${Math.max(0,produced-previous.produced)} objets fabriqués`,{delta:{credits:p.coins-previous.coins,mined:p.mined-previous.mined,delivered:c.delivered-previous.delivered,produced:produced-previous.produced},after:actorSnapshot(p,now)},now);
 p.activityPulse={at:now,coins:p.coins,mined:p.mined,delivered:c.delivered,produced,status,since:status===previous.status?previous.since??now:now};
}
export type JournalQuery={kind?:string;category?:string;generation?:string;actor?:string;cursor?:string;search?:string};
export async function readActivity(db:D1Database,viewer:Pick<Miner,'id'>,query:JournalQuery){
 const where:string[]=[],args:(string|number)[]=[];
 for(const [column,value,allowed] of [['kind',query.kind,['human','ai']],['category',query.category,['command','blocked','progress']]] as const)if(value&&allowed.some(v=>v===value)){where.push(column+'=?');args.push(value);}
 if(query.generation!=='archive'){where.push('generation=?');args.push(query.generation && query.generation!=='current' ? query.generation : RELEASE_ID);}
 if(query.actor&&query.actor.length<100){where.push('actor=?');args.push(query.actor);}
 if(query.search){where.push('(instr(lower(summary),lower(?))>0 OR instr(lower(name),lower(?))>0 OR instr(lower(action),lower(?))>0)');const term=query.search.slice(0,80);args.push(term,term,term);}
 if(query.cursor){try{const cursor=JSON.parse(query.cursor);if(Number.isFinite(cursor.at)&&typeof cursor.id==='string'&&cursor.id.length<300){where.push('(at<? OR (at=? AND id<?))');args.push(cursor.at,cursor.at,cursor.id);}}catch{/* Ignore malformed cursors. */}}
 const {results}=await db.prepare('SELECT id,generation,at,actor,name,kind,category,action,summary,context FROM game_activity'+(where.length?' WHERE '+where.join(' AND '):'')+' ORDER BY at DESC,id DESC LIMIT 61').bind(...args).all<Omit<ActivityEntry,'context'>&{context:string}>();
 const page=results.slice(0,60).map(row=>{let context:Record<string,unknown>;try{context=JSON.parse(row.context);}catch{context={};}if(row.kind==='human'&&row.actor!==viewer.id)context={private:true};return {...row,context};}),last=page.at(-1);
 return {entries:page,next:results.length>60&&last?JSON.stringify({at:last.at,id:last.id}):null,generation:RELEASE_ID};
}

export async function recentAiActivity(db:D1Database,through:number) {
 const {results} = await db.prepare('SELECT id,generation,at,actor,name,kind,category,action,summary FROM game_activity WHERE generation=? AND kind=? AND at<=? ORDER BY at DESC,id DESC LIMIT 12')
   .bind(RELEASE_ID, 'ai',through).all<Omit<ActivityEntry,'context'>>();
 return results;
}

export async function observerJournal(db:D1Database, input:unknown) {
 const query:JournalQuery={kind:'ai'};
 if(input && typeof input==='object'){
   const fields=input as Record<string,unknown>;
   for(const key of ['category','generation','actor','search','cursor'] as const) {
     if(typeof fields[key]==='string')query[key]=fields[key].slice(0,key==='cursor'?500:100);
   }
 }
 const [page,versions] = await Promise.all([
   readActivity(db,{id:''},query),
   db.prepare("SELECT DISTINCT generation FROM game_activity WHERE kind='ai' ORDER BY generation").all<{generation:string}>(),
 ]);
 return {...page, generations:[RELEASE_ID, ...versions.results.map(row => row.generation).filter(id => id!==RELEASE_ID)]};
}
