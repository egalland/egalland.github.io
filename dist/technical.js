import {esc,fmt,euro} from './assets.js';

export const CIRCUITS_PER_COFFRET=52;

export const NETWORKS={
 electric:{name:'Électricité',origin:'Tableau électrique',color:'#c17716',unit:'Gaine et câble'},
 cold:{name:'Eau froide',origin:'Arrivée d’eau froide',color:'#267197',unit:'Tube eau froide'},
 hot:{name:'Eau chaude',origin:'Distribution eau chaude',color:'#b04436',unit:'Tube eau chaude'},
 drain:{name:'Évacuation',origin:'Collecteur d’évacuation',color:'#715593',unit:'Tube d’évacuation'}
};
export const POINTS={
 socket:{name:'Prise',net:['electric'],circuit:'Prises'},
 light:{name:'Point lumineux',net:['electric'],circuit:'Éclairage'},
 switch:{name:'Interrupteur',net:['electric'],circuit:'Éclairage'},
 cooktop:{name:'Plaque de cuisson',net:['electric'],circuit:'Plaque',dedicated:true},
 oven:{name:'Four',net:['electric'],circuit:'Four',dedicated:true},
 dishwasher:{name:'Lave-vaisselle',net:['electric','cold','drain'],circuit:'Lave-vaisselle',dedicated:true},
 washer:{name:'Lave-linge',net:['electric','cold','drain'],circuit:'Lave-linge',dedicated:true},
 fridge:{name:'Réfrigérateur',net:['electric'],circuit:'Prises'},
 heater:{name:'Chauffe-eau',net:['electric','cold','hot'],circuit:'Chauffe-eau',dedicated:true},
 ventilation:{name:'Ventilation',net:['electric'],circuit:'Ventilation',dedicated:true},
 sink:{name:'Évier / lavabo',net:['cold','hot','drain']},
 shower:{name:'Douche',net:['cold','hot','drain']},
 wc:{name:'WC',net:['cold','drain']},
 tap:{name:'Robinet',net:['cold']},
 drain:{name:'Évacuation seule',net:['drain']},
 pump:{name:'Filtration piscine',net:['electric'],circuit:'Filtration piscine',dedicated:true}
};
export const BUILDING_TYPES={warehouse:'Entrepôt',house:'Maison',apartment:'Appartement',other:'Autre bâtiment'};
const finite=(value,fallback,min,max)=>Math.max(min,Math.min(max,value===''||value==null||!Number.isFinite(+value)?fallback:+value));
const safeName=(value,fallback)=>String(value||fallback).trim().slice(0,65)||fallback;

export function normalizeTechnical(raw,building,levels,levelMap){
 const coordinate=p=>({x:finite(p?.x,0,0,building.w),y:finite(p?.y,0,0,building.l)});
 const level=id=>levelMap.get(String(id))||levels[0].id;
 const origins={};
 for(const [old,networks] of Object.entries(raw?.origins||{})){
  if(!levelMap.has(old))continue;
  origins[level(old)]=Object.fromEntries(Object.keys(NETWORKS).filter(k=>networks?.[k]).map(k=>[k,coordinate(networks[k])]));
 }
 const pointIds=new Set();
 const points=(Array.isArray(raw?.points)?raw.points:[]).slice(0,450).filter(p=>p&&Object.hasOwn(POINTS,p.kind)).map((p,i)=>{
  let id=String(p.id||'pt-'+i).replace(/[^\w-]/g,'').slice(0,100)||'pt-'+i;
  while(pointIds.has(id))id+='-';
  pointIds.add(id);
  const via=Object.fromEntries(Object.keys(NETWORKS).filter(k=>p.via?.[k]).map(k=>[k,coordinate(p.via[k])]));
  return {id,kind:p.kind,name:safeName(p.name,POINTS[p.kind].name),levelId:level(p.levelId),source:typeof p.source==='string'?p.source.slice(0,120):'',...coordinate(p),via,disconnected:POINTS[p.kind].net.filter(key=>Array.isArray(p.disconnected)&&p.disconnected.includes(key)).slice(0,POINTS[p.kind].net.length-1),circuit:String(p.circuit||'').trim().slice(0,50)};
 });
 const prices={};
 for(const key of [...Object.keys(NETWORKS),...Object.keys(POINTS).map(k=>'point-'+k),'board','circuit']){
  prices[key]=finite(raw?.prices?.[key],0,0,1e6);
  prices['labour-'+key]=finite(raw?.prices?.['labour-'+key],0,0,1e6);
 }
 return {points,origins,prices,excluded:(Array.isArray(raw?.excluded)?raw.excluded:[]).filter(x=>typeof x==='string').slice(0,450)};
}

export const hasNetwork=(point,key)=>POINTS[point.kind].net.includes(key)&&!point.disconnected?.includes(key);

export function removeTechnicalPoints(technical,ids,key){
 const targets=new Set(ids);
 technical.points=technical.points.filter(point=>{
  if(!targets.has(point.id))return true;
  if(key&&POINTS[point.kind].net.some(other=>other!==key&&hasNetwork(point,other))){
   point.disconnected=[...new Set([...(point.disconnected||[]),key])];
   delete point.via[key];
   return true;
  }
  if(point.source&&!technical.excluded.includes(point.source))technical.excluded.push(point.source);
  return false;
 });
}

export function nearestWall(rect,x,y){
 return [{side:0,x,y:rect.y},{side:1,x:rect.x+rect.w,y},{side:2,x,y:rect.y+rect.l},{side:3,x:rect.x,y}]
  .sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0];
}

export function suggestPoints(s,levelId){
 const proposed=[];
 const add=(source,kind,x,y,name)=>proposed.push({id:'auto-'+source,source,kind,x,y,name:name||POINTS[kind].name,levelId,circuit:'',via:{}});
 const rooms=s.rooms.filter(r=>r.levelId===levelId);
 for(const room of rooms){
  const x=room.x+room.w/2,y=room.y+room.l/2;
  if(!s.objects.some(o=>o.roomId===room.id&&['spot','pendant'].includes(o.kind)))add(room.id+'-light','light',x,y,'Éclairage · '+room.name);
  add(room.id+'-switch','switch',room.x+Math.min(.25,room.w/2),room.y,'Commande · '+room.name);
  if(!['bath','hall'].includes(room.type)){
   add(room.id+'-socket-a','socket',room.x+room.w*.33,room.y,'Prise · '+room.name);
   add(room.id+'-socket-b','socket',room.x+room.w*.67,room.y+room.l,'Prise · '+room.name);
  }
 }
 const linked={sink:'sink',shower:'shower',wc:'wc',fridge:'fridge',poolFilter:'pump',poolShower:'shower',vent:'ventilation',spot:'light',pendant:'light'};
 for(const o of s.objects){
  const room=s.rooms.find(r=>r.id===o.roomId);
  if((room?.levelId||o.levelId)!==levelId)continue;
  const x=(room?.x||0)+o.x+o.w/2,y=(room?.y||0)+o.y+o.l/2;
  if(linked[o.kind])add(o.id,linked[o.kind],x,y);
  if(o.kind==='kitchen'){
   add(o.id+'-sink','sink',x-o.w*.26,y,'Évier cuisine');
   add(o.id+'-hob','cooktop',x+o.w*.26,y);
   add(o.id+'-oven','oven',x+o.w*.18,y);
   add(o.id+'-dw','dishwasher',x,y);
  }
 }
 const existing=new Set([...s.technical.points.map(p=>p.source),...s.technical.excluded]);
 return proposed.filter(p=>!existing.has(p.source));
}

export function networkOrigin(s,levelId,key){
 const saved=s.technical.origins[levelId]?.[key];
 if(saved)return saved;
 return {x:0,y:Math.min(s.building.l,({electric:0,cold:.55,hot:1.1,drain:1.65})[key])};
}

function perimeterRoute(rect,a,b){
 const p=nearestWall(rect,a.x,a.y),q=nearestWall(rect,b.x,b.y);
 const corners=[{x:rect.x,y:rect.y},{x:rect.x+rect.w,y:rect.y},{x:rect.x+rect.w,y:rect.y+rect.l},{x:rect.x,y:rect.y+rect.l}];
 const route=direction=>{
  const steps=[a,p];let side=p.side;
  for(let i=0;i<4&&side!==q.side;i++){
   steps.push(corners[direction===1?(side+1)%4:side]);
   side=(side+direction+4)%4;
  }
  return [...steps,q,b];
 };
 const clockwise=route(1),counter=route(-1);
 return distance(clockwise)<=distance(counter)?clockwise:counter;
}
const distance=route=>route.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-route[i].x,p.y-route[i].y),0);
const contains=(r,p)=>p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.l;

export function networkRoute(s,point,key){
 const start=networkOrigin(s,point.levelId,key),building={x:0,y:0,w:s.building.w,l:s.building.l};
 const room=s.rooms.find(r=>r.levelId===point.levelId&&contains(r,point));
 const via=point.via?.[key];
 if(via)return perimeterRoute(building,start,via).concat([{x:point.x,y:via.y},point]);
 if(!room)return perimeterRoute(building,start,point);
 const entry=nearestWall(room,Math.max(room.x,Math.min(room.x+room.w,start.x)),Math.max(room.y,Math.min(room.y+room.l,start.y)));
 return perimeterRoute(building,start,entry).concat(perimeterRoute(room,entry,point));
}

export function technicalEstimate(s,levelId){
 const points=s.technical.points.filter(p=>!levelId||p.levelId===levelId), circuits=new Map(), metres={electric:0,cold:0,hot:0,drain:0};
 const inventory={};
 for(const point of points){
  const item=POINTS[point.kind];
  inventory[point.kind]=(inventory[point.kind]||0)+1;
  for(const key of item.net.filter(key=>hasNetwork(point,key)))metres[key]+=distance(networkRoute(s,point,key));
  if(!item.circuit||!hasNetwork(point,'electric'))continue;
  const id=point.circuit?'custom:'+point.circuit:item.dedicated?point.id:point.levelId+':'+item.circuit;
  if(!circuits.has(id))circuits.set(id,{name:point.circuit||item.circuit,points:[],level:point.levelId});
  circuits.get(id).points.push(point);
 }
 const prices=s.technical.prices;
 const boardCount=Math.ceil(circuits.size/CIRCUITS_PER_COFFRET);
 const items=[
  ...Object.entries(metres).filter(([,v])=>v>0).map(([k,quantity])=>({key:k,name:NETWORKS[k].unit,quantity,unit:'m'})),
  ...Object.entries(inventory).map(([k,quantity])=>({key:'point-'+k,name:POINTS[k].name,quantity,unit:'u'})),
  ...(boardCount?[{key:'board',name:'Coffrets indicatifs',quantity:boardCount,unit:'u'},{key:'circuit',name:'Départs à protéger',quantity:circuits.size,unit:'u'}]:[])
 ].map(item=>{
  const price=prices[item.key]||0,labour=prices['labour-'+item.key]||0;
  return {...item,price,labour,total:item.quantity*(price+labour)};
 });
 return {points,circuits:[...circuits.values()],metres,items,budget:items.reduce((sum,item)=>sum+item.total,0)};
}

export function technicalOverlay(s,levelId,key){
 const network=NETWORKS[key],origin=networkOrigin(s,levelId,key);
 const points=s.technical.points.filter(p=>p.levelId===levelId&&hasNetwork(p,key));
 return '<g data-technical-overlay>'+points.map(p=>{
  const route=networkRoute(s,p,key).map(q=>q.x+','+q.y).join(' ');
  return '<polyline points="'+route+'" stroke="'+network.color+'" stroke-width=".065" fill="none" stroke-linejoin="round" opacity=".88" pointer-events="none"/>';
 }).join('')+'<rect x="'+(origin.x-.16)+'" y="'+(origin.y-.16)+'" width=".32" height=".32" rx=".06" fill="'+network.color+'" stroke="white" stroke-width=".04" pointer-events="none"/>'+points.map((p,i)=>'<g data-tech-point="'+esc(p.id)+'"><circle cx="'+p.x+'" cy="'+p.y+'" r=".36" fill="transparent"/><circle cx="'+p.x+'" cy="'+p.y+'" r=".17" fill="'+network.color+'" stroke="white" stroke-width=".045"/><text x="'+p.x+'" y="'+(p.y+.05)+'" text-anchor="middle" font-size=".145" fill="white" font-weight="700" pointer-events="none">'+(i+1)+'</text></g>').join('')+'</g>';
}

function boardMarkup(s,estimate){
 const {circuits,points}=estimate;
 if(!circuits.length)return '<p>Ajoute ou génère des points électriques pour composer ton tableau.</p>';
 const electrical=points.filter(p=>hasNetwork(p,'electric')).length;
 const tiles=circuits.map((c,i)=>'<li class="tech-breaker"><span>'+(i+1)+'</span><strong>'+esc(c.name)+'</strong></li>').join('');
 const rows=circuits.map((c,i)=>{
  const levels=[...new Set(c.points.map(p=>p.levelId))].map(id=>s.levels.find(l=>l.id===id)?.name).filter(Boolean);
  return '<details class="tech-circuit"><summary><strong>'+(i+1)+'. '+esc(c.name)+'</strong><small>'+esc(levels.join(' / '))+' · '+c.points.length+' point'+(c.points.length===1?'':'s')+'</small></summary><div>'+c.points.map(p=>esc(p.name)).join(' · ')+'</div><div class="tech-actions"><button class="btn" data-panel-focus="'+i+'">Voir en 3D</button><button class="btn danger" data-circuit-remove="'+i+'">Retirer ce circuit</button></div></details>';
 }).join('');
 return '<p>Les points sont regroupés par usage et par niveau. Les appareils dédiés ont leur propre départ. Le nom du circuit d’un point permet de modifier la répartition.</p><div class="tech-board"><div><strong>Tableau prévisionnel</strong><small>'+circuits.length+' départs · '+electrical+' points électriques</small></div><button class="btn primary full" data-panel-focus="0">Ouvrir le tableau en 3D</button><ol class="tech-breakers">'+tiles+'</ol></div>'+rows+'<p class="tech-note">Calibres, protections, sections et implantation à valider par un électricien.</p>';
}

export function technicalScreen(s,levelId,key,tab){
 const estimate=technicalEstimate(s), here=technicalEstimate(s,levelId), network=NETWORKS[key], level=s.levels.find(l=>l.id===levelId);
 const visiblePoints=here.points.filter(p=>hasNetwork(p,key));
 const body=tab==='plan'
  ? '<div class="tech-networks">'+Object.entries(NETWORKS).map(([id,n])=>'<button class="btn '+(id===key?'primary':'')+'" data-tech-net="'+id+'">'+n.name+'</button>').join('')+'</div><p>Les tracés suivent les bords du bâtiment et des pièces. Tu peux déplacer les points et imposer un passage.</p><button class="btn full" data-tech-action="view">Voir le tracé sur le plan</button><div class="tech-actions"><button class="btn" data-tech-action="suggest">Proposer les points du niveau</button><button class="btn" data-tech-action="add">Ajouter un point</button><button class="btn" data-tech-action="origin">Placer · '+network.origin+'</button></div><p><strong>'+fmt(here.metres[key])+' m</strong> de trajets estimés · '+esc(level?.name||'')+'</p>'+(visiblePoints.length?'<button class="btn danger" data-tech-action="clear-network">Retirer les points de ce réseau</button>':'<p>Aucun point sur ce réseau à ce niveau.</p>')+(s.technical.origins[levelId]?.[key]?'<button class="btn" data-tech-action="reset-origin">Réinitialiser l’origine</button>':'')+visiblePoints.map((p,i)=>'<div class="tech-row tech-point-row"><button data-tech-edit="'+esc(p.id)+'"><strong>'+ (i+1)+'. '+esc(p.name)+'</strong><small>'+(p.source?'Proposé':'Manuel')+' · Modifier</small></button><button class="btn danger" data-tech-unlink="'+esc(p.id)+'" aria-label="Retirer '+esc(p.name)+' de '+esc(network.name)+'">Retirer</button></div>').join('')
  : tab==='board' ? boardMarkup(s,estimate)
  : '<p>Les métrés additionnent les trajets horizontaux de chaque point. Renseigne les prix de fourniture et de pose par mètre ou par équipement.</p>'+(estimate.items.length?estimate.items.map(i=>'<div class="tech-row"><span><strong>'+esc(i.name)+'</strong> · '+fmt(i.quantity)+' '+i.unit+'</span><div class="tech-unit-costs"><label>Fourniture (€/'+i.unit+')<input type="number" min="0" max="1000000" step=".01" value="'+i.price+'" data-tech-price="'+i.key+'"></label><label>Pose (€/'+i.unit+')<input type="number" min="0" max="1000000" step=".01" value="'+i.labour+'" data-tech-price="labour-'+i.key+'"></label><strong data-tech-total="'+i.key+'">'+euro(i.total)+'</strong></div></div>').join(''):'<p>Ajoute des points pour obtenir les quantités.</p>')+'<p><strong>Total estimé <span id="technical-estimate-total">'+euro(estimate.budget)+'</span></strong></p>';

 return '<div class="tech-tabs">'+[['plan','Réseaux'],['board','Tableau'],['estimate','Métrés & budget']].map(([id,title])=>'<button data-tech-tab="'+id+'" class="btn '+(tab===id?'primary':'')+'">'+title+'</button>').join('')+'</div>'+body;
}
