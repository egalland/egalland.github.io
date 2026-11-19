import {SEED} from './seed.js';
import {surfaceLimits} from './surfaces.js';
import {ROOM_TYPES,OBJECTS} from './catalog.js';
import {clamp,segmentOnRect} from './geometry.js';
export const uid=()=>Math.random().toString(36).slice(2,10);
const n=(v,f,a,b)=>Math.round(clamp(Number.isFinite(Number(v))?Number(v):f,a,b)*1e6)/1e6;
export const defaults=()=>structuredClone(SEED);
export const levelOf=(s,id)=>s.levels.find(l=>l.id===id)||s.levels[0];
export const objectLevel=(s,o)=>s.rooms.find(r=>r.id===o.roomId)?.levelId||o.levelId;
export const openingLevel=(s,o)=>s.rooms.find(r=>r.id===o.roomId)?.levelId||o.levelId;
export function objectRect(s,o){const r=s.rooms.find(r=>r.id===o.roomId);return{...o,x:o.x+(r?.x||0),y:o.y+(r?.y||0)};}
export function openingParent(s,o){if(o.host==='room')return s.rooms.find(r=>r.id===o.roomId)||{x:0,y:0,...s.building};if(o.host==='free')return{x:o.anchorX||0,y:o.anchorY||0,w:0,l:0,h:s.building.h};return{x:0,y:0,...s.building};}
export function openingSegment(s,o){const p=openingParent(s,o),horizontal=['north','south'].includes(o.wall);return horizontal?{x1:p.x+o.offset,y1:p.y+(o.wall==='south'?p.l:0),x2:p.x+o.offset+o.w,y2:p.y+(o.wall==='south'?p.l:0)}:{x1:p.x+(o.wall==='east'?p.w:0),y1:p.y+o.offset,x2:p.x+(o.wall==='east'?p.w:0),y2:p.y+o.offset+o.w};}
function migrate(raw){
 const v=structuredClone(raw);if(Array.isArray(v.levels)&&v.levels.length)return v;
 const z=v.zone||{x:0,y:0,h:2.6,w:v.building.w,l:v.building.l};
 v.levels=[{id:'ground',name:'Rez-de-chaussée',kind:'ground',elevation:0,thickness:0,height:z.h||2.6,platform:null}];
 for(const r of v.rooms){r.x=Number(r.x||0)+Number(z.x||0);r.y=Number(r.y||0)+Number(z.y||0);r.levelId='ground';r.h=r.h||z.h||2.6;}
 for(const o of v.objects||[])o.levelId='ground';
 if(!Array.isArray(v.openings)){v.openings=[];const count=Math.min(30,Math.max(0,Number(v.light?.windows)||0));for(let i=0;i<count;i++)v.openings.push({id:'legacy'+i,kind:'window',host:'zone',wall:i%2?'west':'north',offset:Math.max(0,(i+1)/(count+1)*(i%2?z.l:z.w)-.6),w:v.light.winw||1.2,h:v.light.winh||1.2});}
 for(const o of v.openings){
  o.levelId='ground';o.sill=o.kind==='window'?.9:0;if(o.host!=='zone')continue;
  const horiz=['north','south'].includes(o.wall),x=z.x+(horiz?o.offset:o.wall==='east'?z.w:0),y=z.y+(horiz?o.wall==='south'?z.l:0:o.offset);
  const seg={x1:x,y1:y,x2:x+(horiz?o.w:0),y2:y+(horiz?0:o.w)},r=v.rooms.find(r=>segmentOnRect(seg,r)>o.w-.01);
  if(r){o.host='room';o.roomId=r.id;o.offset=horiz?x-r.x:y-r.y;}
  else if(segmentOnRect(seg,{x:0,y:0,...v.building})>o.w-.01){o.host='building';o.offset=horiz?x:y;}
  else{o.host='free';o.anchorX=x;o.anchorY=y;o.wall=horiz?'north':'west';o.offset=0;}
 }delete v.zone;v.version=4;return v;
}
export function normalize(input){
 if(!input||!input.building||!Array.isArray(input.rooms))throw Error('Ce fichier ne contient pas de projet Atelier Habitat.');
 const raw=migrate(input),s=defaults(),D=defaults();s.name=String(raw.name||D.name).slice(0,70);
 for(const k of ['building','thermal','light','budget'])if(raw[k]&&typeof raw[k]==='object')for(const key of Object.keys(s[k]))if(Object.hasOwn(raw[k],key))s[k][key]=raw[k][key];
 for(const [k,a,b] of [['w',5,100],['l',5,100],['h',2.4,30],['price',0,1e8]])s.building[k]=n(s.building[k],D.building[k],a,b);
 const used=new Set(),safeId=id=>{let key=String(id||uid()).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,35)||uid();while(used.has(key))key=uid();used.add(key);return key;};const levelsMap=new Map(),roomsMap=new Map();
 s.levels=raw.levels.slice(0,8).filter(l=>l&&typeof l==='object').map((l,i)=>{
  const id=safeId(i===0?'ground':l.id);levelsMap.set(String(l.id),id);let platform=null;
  if(i&&l.platform){const w=n(l.platform.w,6,.6,s.building.w),len=n(l.platform.l,4,.6,s.building.l);platform={w,l:len,x:n(l.platform.x,0,0,s.building.w-w),y:n(l.platform.y,0,0,s.building.l-len)};}
  return{id,name:String(l.name||(i?'Étage '+i:'Rez-de-chaussée')).slice(0,45),kind:i?(l.kind==='mezzanine'?'mezzanine':'floor'):'ground',elevation:i?n(l.elevation,i*2.8,.3,30):0,thickness:i?n(l.thickness,.2,.05,1):0,height:n(l.height,2.6,1,15),platform};
 });if(!s.levels.length)s.levels=[D.levels[0]];
 s.rooms=raw.rooms.slice(0,100).filter(r=>r&&typeof r==='object').map(r=>{const id=safeId(r.id);roomsMap.set(String(r.id),id);const levelId=levelsMap.get(String(r.levelId))||s.levels[0].id,type=Object.hasOwn(ROOM_TYPES,r.type)?r.type:'other',w=n(r.w,3,.6,s.building.w),l=n(r.l,3,.6,s.building.l);return{id,type,name:String(r.name||ROOM_TYPES[type].name).slice(0,50),levelId,h:n(r.h,levelOf(s,levelId).height,1,15),w,l,x:n(r.x,0,0,s.building.w-w),y:n(r.y,0,0,s.building.l-l),lux:n(r.lux,ROOM_TYPES[type].lux,50,2000)};});
 s.surfaces=(Array.isArray(raw.surfaces)?raw.surfaces:[]).slice(0,100).filter(o=>o&&typeof o==='object').map(o=>{const kind=o.kind==='terrace'?'terrace':'mezzanine',probe={kind,w:1,l:1},limits=surfaceLimits(s,probe),w=n(o.w,kind==='terrace'?4:6,.6,limits.maxW),l=n(o.l,kind==='terrace'?3:4,.6,limits.maxL),q={id:safeId(o.id),kind,name:String(o.name||(kind==='terrace'?'Terrasse':'Mezzanine')).slice(0,50),levelId:levelsMap.get(String(o.levelId))||s.levels[0].id,w,l,railing:o.railing!==false,finish:o.finish==='concrete'?'concrete':'wood'};const bounds=surfaceLimits(s,q);return{...q,x:n(o.x,0,bounds.minX,bounds.maxX),y:n(o.y,0,bounds.minY,bounds.maxY)};});
 s.objects=(Array.isArray(raw.objects)?raw.objects:[]).slice(0,250).filter(o=>o&&Object.hasOwn(OBJECTS,o.kind)).map(o=>{const r=s.rooms.find(r=>r.id===roomsMap.get(String(o.roomId))),p=r||s.building,k=OBJECTS[o.kind],w=n(o.w,k.w,.15,p.w),l=n(o.l,k.l,.15,p.l),levelId=r?.levelId||levelsMap.get(String(o.levelId))||s.levels[0].id,targetLevelId=levelsMap.get(String(o.targetLevelId))||null;return{id:safeId(o.id),kind:o.kind,roomId:r?.id||null,levelId,targetLevelId,w,l,x:n(o.x,0,0,p.w-w),y:n(o.y,0,0,p.l-l),rotation:Math.round(n(o.rotation,0,0,359)/90)*90%360,price:n(o.price,k.price,0,1e6),...(k.h?{equipmentHeight:n(o.equipmentHeight,k.h,o.kind==='pool'?.2:.02,3)}:{}),...(k.group==='ceiling'?{mountHeight:n(o.mountHeight,0,0,30)}:{})};});
 s.openings=(raw.openings||[]).slice(0,150).filter(o=>o&&['window','door','bay'].includes(o.kind)).map(o=>{const r=s.rooms.find(r=>r.id===roomsMap.get(String(o.roomId))),host=o.host==='room'&&r?'room':o.host==='free'?'free':'building',p=host==='room'?r:s.building,wall=['north','south','west','east'].includes(o.wall)?o.wall:'north',len=['north','south'].includes(wall)?p.w:p.l,w=n(o.w,1.2,.3,len);return{id:safeId(o.id),kind:o.kind,host,roomId:host==='room'?r.id:null,levelId:r&&host==='room'?r.levelId:levelsMap.get(String(o.levelId))||s.levels[0].id,wall,w,h:n(o.h,1.2,.3,15),sill:n(o.sill,o.kind==='window'?.9:0,0,15),offset:n(o.offset,0,0,len-w),anchorX:n(o.anchorX,0,0,s.building.w),anchorY:n(o.anchorY,0,0,s.building.l)};});
 for(const [key,min,max] of [['lambda',.015,.1],['wall',0,500],['roof',0,600],['floor',0,500],['wallprice',0,1000],['roofprice',0,1000],['floorprice',0,1000],['waste',0,50],['inside',5,30],['outside',-30,25],['shop',-15,25],['ground',-5,25],['air',0,5],['ug',.3,7],['ud',.3,7]])s.thermal[key]=n(s.thermal[key],D.thermal[key],min,max);
 s.thermal.scope=s.thermal.scope==='all'?'all':'home';
 for(const [key,min,max] of [['lumens',100,50000],['watt',1,1000],['shoplumens',100,100000],['shopwatt',1,3000],['shoplux',50,2000],['hours',0,24],['factor',.1,1],['kwhPrice',0,3],['target',1,50]])s.light[key]=n(s.light[key],D.light[key],min,max);
 for(const [key,min,max] of [['fitout',0,5000],['partition',0,1000],['glazing',0,5000],['door',0,5000],['contingency',0,50],['fees',0,20],['structure',0,5000],['railing',0,2000],['terrace',0,5000]])s.budget[key]=n(s.budget[key],D.budget[key],min,max);
 s.orientation=n(raw.orientation,0,0,359);s.version=5;return s;
}
export function deckRects(s,levelId){const l=levelOf(s,levelId);return[...s.rooms.filter(r=>r.levelId===levelId),...(s.surfaces||[]).filter(q=>q.levelId===levelId),...(l.platform?[l.platform]:[])];}
export function stairHoles(s,levelId){return s.objects.filter(o=>o.kind==='stairs'&&o.targetLevelId===levelId&&levelOf(s,objectLevel(s,o)).elevation<levelOf(s,levelId).elevation).map(o=>objectRect(s,o));}
export function preset(size){const s=defaults(),map={100:[10,10,7,6],150:[15,10,8,7],200:[20,10,9,8]},[w,l,zw,zl]=map[size]||map[150],sx=zw/8,sy=zl/7;s.name=`Projet ${size} m²`;s.building.w=w;s.building.l=l;s.building.price=size*933.33;for(const r of s.rooms){r.x*=sx;r.y*=sy;r.w*=sx;r.l*=sy;}for(const o of s.objects)if(o.roomId){o.x*=sx;o.y*=sy;}else o.x*=w/15;for(const o of s.openings)if(o.host==='building'&&['north','south'].includes(o.wall))o.offset*=sx;return normalize(s);}
