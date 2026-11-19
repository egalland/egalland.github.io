import {technicalOverlay} from './technical.js';
import {envelopeWalls} from './volume-geometry.js';
import {equipmentHeight} from './equipment.js';
import {ROOM_TYPES,OBJECTS,area,compute,objectRect,objectLevel,openingSegment,openingLevel,levelOf,boundarySegments,overlap,unionCells} from './engine.js';
import {SURFACE_TYPES} from './surfaces.js';
import {rect,line,text,fmt,esc,objectGlyph} from './assets.js';
export function plan2D(s,u,exporting=false){
 const B=s.building,C=compute(s),active=C.levels.find(l=>l.id===u.levelId)||C.levels[0],rooms=active.rooms,sel=u.selected;
 let out=`<defs><pattern id="grid" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M1 0H0V1" fill="none" stroke="#bdb9ae" stroke-width=".015"/></pattern><pattern id="wood" width=".22" height="2" patternUnits="userSpaceOnUse"><path d="M0 0V2M.015 1h.19" fill="none" stroke="#726b5624" stroke-width=".012"/></pattern><pattern id="tile" width=".45" height=".45" patternUnits="userSpaceOnUse"><path d="M.45 0H0V.45" stroke="#9db4a530" fill="none" stroke-width=".012"/></pattern><pattern id="hatch" width=".13" height=".13" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V.13" stroke="#7e9b5d" stroke-width=".035"/></pattern><filter id="shadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx=".02" dy=".04" stdDeviation=".035" flood-color="#32412c" flood-opacity=".15"/></filter><clipPath id="deckClip">${active.deck.map(r=>rect(r.x,r.y,r.w,r.l,'white','none',0,0)).join('')}</clipPath></defs>`;
 out+=rect(-.13,-.13,B.w+.26,B.l+.26,'#dfdcd3','#9a9285',.02,.02)+rect(0,0,B.w,B.l,active.kind==='ground'?'#e5e2d9':'#f1eee6','#9c958a',.025,0);
 if(u.grid)out+=rect(0,0,B.w,B.l,'url(#grid)','none',0,0);
 for(const q of active.surfaces||[]){const color=SURFACE_TYPES[q.kind].color;out+=`<g data-entity="surface" data-id="${q.id}" tabindex="0" aria-label="${esc(q.name)}, surface ouverte de ${fmt(q.w*q.l)} mètres carrés">${rect(q.x,q.y,q.w,q.l,q.finish==='concrete'?'#d9ded3':color,'#a29170',.04,0)}${q.finish==='wood'?rect(q.x+.03,q.y+.03,Math.max(.1,q.w-.06),Math.max(.1,q.l-.06),'url(#wood)','none',0,0):''}${text(q.x+.16,q.y+.28,q.name,.21,'#655b43','font-weight="600"')}${text(q.x+.16,q.y+.53,`${fmt(q.w*q.l)} m² · ouvert`,.17,'#84785c')}</g>`;}
 if(active.kind!=='ground'&&u.ghost!==false){out+=`<g opacity=".16" pointer-events="none">${s.rooms.filter(r=>levelOf(s,r.levelId).elevation<active.elevation).map(r=>rect(r.x,r.y,r.w,r.l,'#c7cebc','#788a6d',.05,0)).join('')}</g>`;}
 if(active.kind!=='ground'){
  for(const r of active.deck)out+=rect(r.x,r.y,r.w,r.l,'#e9dec6','none',0,0);
  if(active.platform)out+=`<rect data-entity="platform" data-id="${active.id}" x="${active.platform.x}" y="${active.platform.y}" width="${active.platform.w}" height="${active.platform.l}" fill="transparent" stroke="#ae9771" stroke-width=".04" stroke-dasharray=".12 .08"/>`;
 }
 for(const r of rooms){
  const k=ROOM_TYPES[r.type],row=C.roomRows.find(q=>q.id===r.id);let fill=k.color;if(u.layer==='light')fill=row.area&&row.glass/row.area>=s.light.target/100?'#dce6bb':'#eee0ba';if(u.layer==='thermal')fill='#e1e7c9';
  out+=`<g data-entity="room" data-id="${r.id}" tabindex="0" aria-label="${esc(r.name)}, ${fmt(row.area)} mètres carrés" ${active.kind!=='ground'?'clip-path="url(#deckClip)"':''}>${rect(r.x,r.y,r.w,r.l,fill,'none',0,0)}${rect(r.x+.03,r.y+.03,r.w-.06,r.l-.06,r.type==='bath'?'url(#tile)':'url(#wood)','none',0,0)}</g>`;
 }
 const wallTop=Math.min(B.h,active.elevation+1.05);
 for(const p of envelopeWalls(s,wallTop-.004,wallTop)){const h=p.axis==='h';out+=line(h?p.start:p.pos,h?p.pos:p.start,h?p.start+p.length:p.pos,h?p.pos:p.start+p.length,'#4b4941',B.wallThickness,'pointer-events="none"');}
 for(const b of active.boundaries){if(B.walls&&b.external)continue;const horiz=b.axis==='h';out+=line(horiz?b.a:b.pos,horiz?b.pos:b.a,horiz?b.b:b.pos,horiz?b.pos:b.b,'#625e51',b.partition?.075:.115,'pointer-events="none"');}
 if(u.layer==='thermal')for(const b of active.boundaries.filter(b=>!b.partition)){const horiz=b.axis==='h';out+=line(horiz?b.a:b.pos,horiz?b.pos:b.a,horiz?b.b:b.pos,horiz?b.pos:b.b,'url(#hatch)',.22,'pointer-events="none"');}
 if(u.layer==='layout'||u.layer==='ceiling')for(const o of s.objects.filter(o=>(objectLevel(s,o)===active.id||o.kind==='stairs'&&o.targetLevelId===active.id)&&(u.layer==='ceiling'?OBJECTS[o.kind].group==='ceiling':OBJECTS[o.kind].group!=='ceiling')).sort((a,b)=>({ceiling:-2,pool:-1}[a.kind]??0)-({ceiling:-2,pool:-1}[b.kind]??0))){
  const p=objectRect(s,o),landing=o.kind==='stairs'&&o.targetLevelId===active.id;
  out+=`<g data-entity="object" data-id="${o.id}" transform="translate(${p.x} ${p.y})" filter="url(#shadow)" ${landing?'opacity=".7"':''}>${objectGlyph(o)}${landing?text(o.w/2,o.l/2,'TRÉMIE',.12,'#68775c','text-anchor="middle"'):''}</g>`;
 }
 if(u.layer==='light')for(const row of C.roomRows.filter(r=>r.levelId===active.id)){
  const cols=Math.max(1,Math.ceil(Math.sqrt(row.fixtures*row.w/row.l))),rows=Math.max(1,Math.ceil(row.fixtures/cols));
  for(let i=0;i<Math.min(row.fixtures,70);i++){const x=row.x+(i%cols+.5)*row.w/cols,y=row.y+(Math.floor(i/cols)+.5)*row.l/rows;out+=`<g pointer-events="none"><circle cx="${x}" cy="${y}" r=".27" fill="#faf3c0" opacity=".45"/><circle cx="${x}" cy="${y}" r=".065" fill="#fffdf0" stroke="#b5a45f" stroke-width=".02"/></g>`;}
 }
 for(const o of s.openings.filter(o=>openingLevel(s,o)===active.id)){
  const p=openingSegment(s,o),chosen=sel?.type==='opening'&&sel.id===o.id;
  out+=`<g data-entity="opening" data-id="${o.id}">${line(p.x1,p.y1,p.x2,p.y2,'#f5f3ed',.17)}${line(p.x1,p.y1,p.x2,p.y2,o.kind==='window'?'#80aab0':o.kind==='bay'?'#8b9b8a':'#baa782',chosen?.12:.065)}${line(p.x1,p.y1,p.x2,p.y2,'transparent',.36)}</g>`;
  if(o.kind==='door'){const horizontal=Math.abs(p.y1-p.y2)<.01;out+=horizontal?`<path d="M${p.x1} ${p.y1}v${-o.w}a${o.w} ${o.w} 0 0 1 ${o.w} ${o.w}" stroke="#9b9e83" stroke-width=".015" fill="none" pointer-events="none"/>`:`<path d="M${p.x1} ${p.y1}h${-o.w}a${o.w} ${o.w} 0 0 0 ${o.w} ${o.w}" stroke="#9b9e83" stroke-width=".015" fill="none" pointer-events="none"/>`;}
 }
 for(const r of rooms){const row=C.roomRows.find(q=>q.id===r.id),x=r.x+.17,y=r.y+.31,name=r.w<1.6?r.name.slice(0,9):r.name;out+=`<g pointer-events="none">${text(x,y,name,r.w<1.6?.18:.235,'#2b2923',`font-weight="650" paint-order="stroke" stroke="${ROOM_TYPES[r.type].color}" stroke-width=".08"`)}${text(x,y+.28,u.layer==='light'?`${fmt(row.area?row.glass/row.area*100:0,0)} % vitrés · ${row.fixtures} points`:u.layer==='thermal'?`R murs ${fmt(C.Rs[0])}`:`${fmt(row.area)} m²`,r.w<1.6?.15:.19,'#7f8f70',`paint-order="stroke" stroke="${ROOM_TYPES[r.type].color}" stroke-width=".06"`)}</g>`;}
 const freeCells=unionCells([{x:0,y:0,w:B.w,l:B.l}],active.kind==='ground'?[...rooms,...(active.surfaces||[])]:active.deck).sort((a,b)=>area(b)-area(a)),big=freeCells[0];
 if(big&&big.w>2.5&&big.l>2){const x=big.x+big.w/2,y=big.y+big.l*.65;out+=`<g pointer-events="none">${text(x,y,active.kind==='ground'?'ATELIER & ESPACE LIBRE':'VIDE SUR LE NIVEAU INFÉRIEUR',.15,'#655f54','text-anchor="middle" letter-spacing=".045"')}${text(x,y+.42,`${fmt(active.kind==='ground'?C.free:Math.max(0,C.total-active.deckArea))} m²`,.38,'#74886c','text-anchor="middle"')}</g>`;}
 out+=line(0,-.55,B.w,-.55,'#827b6e',.012)+line(0,-.7,0,-.37,'#827b6e',.012)+line(B.w,-.7,B.w,-.37,'#827b6e',.012)+rect(B.w/2-.7,-.72,1.4,.34,'#f2f0eb','none',0,0)+text(B.w/2,-.47,`${fmt(B.w)} m`,.23,'#554e45','text-anchor="middle"');
 out+=line(-.55,0,-.55,B.l,'#827b6e',.012)+line(-.7,0,-.37,0,'#827b6e',.012)+line(-.7,B.l,-.37,B.l,'#827b6e',.012)+`<g transform="translate(-.55 ${B.l/2}) rotate(-90)">${rect(-.7,-.17,1.4,.34,'#f2f0eb','none',0,0)}${text(0,.08,`${fmt(B.l)} m`,.23,'#554e45','text-anchor="middle"')}</g>`;
 if(exporting)out+=text(B.w/2,B.l+.55,`${active.name.toLocaleUpperCase('fr')}  ·  +${fmt(active.elevation)} m  ·  ${fmt(active.home)} m² DE PIÈCES`,.17,'#8b9a79','text-anchor="middle" letter-spacing=".025"');
 if(sel&&!exporting){let r;if(sel.type==='room')r=rooms.find(r=>r.id===sel.id);if(sel.type==='object'){const o=s.objects.find(o=>o.id===sel.id);if(o&&(objectLevel(s,o)===active.id||o.targetLevelId===active.id))r=objectRect(s,o);}if(sel.type==='platform'&&sel.id===active.id)r=active.platform;if(sel.type==='surface')r=(active.surfaces||[]).find(q=>q.id===sel.id);if(r)out+=`<g pointer-events="none"><rect x="${r.x-.04}" y="${r.y-.04}" width="${r.w+.08}" height="${r.l+.08}" fill="none" stroke="#b64227" stroke-width=".035" stroke-dasharray=".12 .065" rx=".04"/></g>${!u.mobile||u.tool==='select'&&u.mobileResize?`<g data-handle="1"><rect x="${r.x+r.w-(u.touchHandleSize||.22)/2}" y="${r.y+r.l-(u.touchHandleSize||.22)/2}" width="${u.touchHandleSize||.22}" height="${u.touchHandleSize||.22}" fill="transparent"/><rect x="${r.x+r.w-.11}" y="${r.y+r.l-.11}" width=".22" height=".22" rx=".035" fill="#e35635" stroke="#f7faed" stroke-width=".04" pointer-events="none"/></g>`:''}`;}
 if(u.draft&&!exporting)out+=`<rect x="${u.draft.x}" y="${u.draft.y}" width="${u.draft.w}" height="${u.draft.l}" fill="#ff643e30" stroke="#b64227" stroke-width=".04" stroke-dasharray=".13 .07" pointer-events="none"/>${text(u.draft.x+u.draft.w/2,u.draft.y+u.draft.l/2,`${fmt(u.draft.w)} × ${fmt(u.draft.l)} m`,.24,'#8c301e','text-anchor="middle" pointer-events="none"')}`;
 if(u.techNet)out+=technicalOverlay(s,active.id,u.techNet);
 return out;
}
function shade(hex,f){return '#'+hex.slice(1).match(/../g).map(x=>Math.max(0,Math.min(255,parseInt(x,16)+f)).toString(16).padStart(2,'0')).join('');}
export function volume(s,u){
 const B=s.building,C=compute(s),angle=u.yaw*Math.PI/180,c=Math.cos(angle),sn=Math.sin(angle),all=u.allLevels!==false,levels=(all?C.levels:C.levels.filter(l=>l.id===u.levelId));if(!levels.length)levels.push(C.levels[0]);
 const P=(x,y,z=0)=>{x-=B.w/2;y-=B.l/2;return[x*c-y*sn,(x*sn+y*c)*.56-z*.85];},depth=(x,y)=>(x-B.w/2)*sn+(y-B.l/2)*c;
 const polygon=(points,col)=>`<polygon points="${points.map(p=>P(...p).join(',')).join(' ')}" fill="${col}" stroke="#50664d30" stroke-width=".016" stroke-linejoin="round"/>`;
 const box=(x,y,z,w,l,h,col)=>{let out='';const edges=[[[x,y,z],[x+w,y,z],[x+w,y,z+h],[x,y,z+h]],[[x+w,y,z],[x+w,y+l,z],[x+w,y+l,z+h],[x+w,y,z+h]],[[x+w,y+l,z],[x,y+l,z],[x,y+l,z+h],[x+w,y+l,z+h]],[[x,y+l,z],[x,y,z],[x,y,z+h],[x,y+l,z+h]]];for(let i=0;i<4;i++){const e=edges[i],mx=(e[0][0]+e[1][0])/2,my=(e[0][1]+e[1][1])/2;if(depth(mx,my)>=depth(x+w/2,y+l/2)-.01)out+=polygon(e,shade(col,i%2?-24:-12));}return out+polygon([[x,y,z+h],[x+w,y,z+h],[x+w,y+l,z+h],[x,y+l,z+h]],col);};
 let markup=box(0,0,-.2,B.w,B.l,.2,'#dce1d4');const labels=[];const add=(nodes,x,y,w,l,shape,entity=null)=>nodes.push({depth:depth(x+w/2,y+l/2),markup:`<g ${entity?`data-entity="${entity.type}" data-id="${entity.id}"`:''}>${shape}</g>`});
 const sorted=[...levels].sort((a,b)=>a.elevation-b.elevation);
 const shellTop=Math.max(...sorted.map(l=>l.elevation));
 const ceiling=!!B.shellCeiling&&u.overhead==='closed'&&(all||shellTop===Math.max(...C.levels.map(l=>l.elevation)));
 for(const lev of sorted){
  const z=lev.elevation+(u.exploded&&all?C.levels.indexOf(lev)*1.6:0),nodes=[];
  if(lev.kind!=='ground'){
   if(!u.exploded&&(lev.platform||lev.rooms.length)){const p=lev.platform||{x:Math.min(...lev.rooms.map(r=>r.x)),y:Math.min(...lev.rooms.map(r=>r.y)),w:Math.max(...lev.rooms.map(r=>r.x+r.w))-Math.min(...lev.rooms.map(r=>r.x)),l:Math.max(...lev.rooms.map(r=>r.y+r.l))-Math.min(...lev.rooms.map(r=>r.y))};for(const [x,y] of [[p.x,p.y],[p.x+p.w-.12,p.y],[p.x,p.y+p.l-.12],[p.x+p.w-.12,p.y+p.l-.12]])markup+=box(x,y,0,.12,.12,Math.max(0,z-lev.thickness),'#859782');}
   for(const d of lev.deck)markup+=box(d.x,d.y,z-lev.thickness,d.w,d.l,lev.thickness,'#cdbb98');
  }
  for(const r of lev.rooms)for(const d of unionCells([r],lev.holes))markup+=`<g data-entity="room" data-id="${r.id}">${box(d.x,d.y,z+.01,d.w,d.l,.05,ROOM_TYPES[r.type].color)}</g>`;
  if(B.walls&&lev.kind==='ground'){const backN=depth(B.w/2,0)<0,backW=depth(0,B.l/2)<0;for(const [x,y,w,l,h] of [[-.08,-.08,B.w+.16,.12,backN?1:.22],[-.08,B.l-.04,B.w+.16,.12,backN?.22:1],[-.08,0,.12,B.l,backW?1:.22],[B.w-.04,0,.12,B.l,backW?.22:1]])add(nodes,x,y,w,l,box(x,y,0,w,l,h,'#b7c4ad'));}
  for(const b of lev.boundaries){const horizontal=b.axis==='h',x=horizontal?b.a:b.pos,y=horizontal?b.pos:b.a,w=horizontal?b.b-b.a:.065,l=horizontal?.065:b.b-b.a;add(nodes,x,y,w,l,box(x,y,z+.065,w,l,.5,'#a1b18f'));}
  if(lev.kind!=='ground')for(const b of boundarySegments(lev.deck,B)){
   if(b.partition||b.external)continue;const mid=(b.a+b.b)/2,attached=lev.rooms.some(r=>b.axis==='v'?(Math.abs(r.x-b.pos)<.01||Math.abs(r.x+r.w-b.pos)<.01)&&mid>r.y&&mid<r.y+r.l:(Math.abs(r.y-b.pos)<.01||Math.abs(r.y+r.l-b.pos)<.01)&&mid>r.x&&mid<r.x+r.w);if(attached)continue;
   const horizontal=b.axis==='h',len=b.b-b.a;let shape='';for(let a=b.a;a<=b.b+.01;a+=Math.min(1,len)){const x=horizontal?a:b.pos,y=horizontal?b.pos:a;shape+=box(x,y,z,.045,.045,.95,'#74866d');if(len<.01)break;}for(const h of [.48,.95])shape+=box(horizontal?b.a:b.pos,horizontal?b.pos:b.a,z+h,horizontal?len:.04,horizontal?.04:len,.035,'#7f8d71');add(nodes,horizontal?b.a:b.pos,horizontal?b.pos:b.a,horizontal?len:.04,horizontal?.04:len,shape);
  }
  for(const o of s.objects.filter(o=>objectLevel(s,o)===lev.id)){
   const r=objectRect(s,o),col=OBJECTS[o.kind].color;const obox=(x,y,h,w,l,hh,color)=>box(x,y,z+h,w,l,hh,color);let shape='';
   if(OBJECTS[o.kind].group==='ceiling'){
    if(!u.overhead||u.overhead==='open'||o.kind==='ceiling'&&u.overhead!=='closed')continue;
    const mount=z+equipmentHeight(s,o),height=o.equipmentHeight??OBJECTS[o.kind].h;
    shape=box(r.x,r.y,mount-height,r.w,r.l,height,col);
   }else if(o.kind==='pool'){
    shape=box(r.x,r.y,z+.015,r.w,r.l,.11,'#d4c8ae')+box(r.x+.12,r.y+.12,z+.12,Math.max(.02,r.w-.24),Math.max(.02,r.l-.24),.015,'#72b9c3');
   }else if(o.kind==='stairs'){
    const rise=Math.max(.3,levelOf(s,o.targetLevelId).elevation-lev.elevation),count=Math.max(3,Math.ceil(rise/.18));
    for(let i=0;i<count;i++){const q=o.rotation%360,vertical=q===0||q===180,w=vertical?r.w:r.w/count,l=vertical?r.l/count:r.l,x=r.x+(vertical?0:q===90?(count-1-i)*w:i*w),y=r.y+(vertical?q===180?(count-1-i)*l:i*l:0);shape+=obox(x,y,0,w,l,rise*(i+1)/count,'#c9b896');}
   }else{
    const h={sofa:.5,bed:.35,table:.65,coffee:.35,kitchen:.83,island:.83,fridge:1.5,shower:.06,wc:.4,sink:.75,desk:.7,wardrobe:1.65,shelf:1.5,workbench:.8,printer:.65,car:1.3,plant:.35}[o.kind]||.5;shape=obox(r.x,r.y,.08,r.w,r.l,h,col);
    if(o.kind==='sofa'){shape+=obox(r.x,r.y,.08,r.w,.18,.9,'#a1b58c')+obox(r.x,r.y,.08,.15,r.l,.72,'#a4b88f')+obox(r.x+r.w-.15,r.y,.08,.15,r.l,.72,'#a4b88f');for(let i=0;i<3;i++)shape+=obox(r.x+.19+i*(r.w-.38)/3,r.y+.25,.59,(r.w-.44)/3,Math.max(.12,r.l-.35),.04,'#c5d1b3');}
    if(o.kind==='bed')shape+=obox(r.x+.08,r.y+.08,.44,r.w-.16,r.l-.16,.1,'#e7eadf')+obox(r.x+.13,r.y+.12,.55,r.w*.36,.33,.06,'#faf8ed')+obox(r.x+r.w*.53,r.y+.12,.55,r.w*.36,.33,.06,'#faf8ed')+obox(r.x+.09,r.y+r.l*.4,.55,r.w-.18,r.l*.54,.025,'#c9d7d0');
    if(o.kind==='plant')shape+=obox(r.x+.04,r.y+.04,.45,Math.max(.1,r.w-.08),Math.max(.1,r.l-.08),.43,'#8fa773');
    if(o.kind==='kitchen')shape+=obox(r.x+.1,r.y+.1,.94,r.w*.2,Math.max(.1,r.l-.2),.02,'#d2ded5')+obox(r.x+r.w*.65,r.y+.07,.94,r.w*.25,Math.max(.1,r.l-.14),.02,'#566e5d');
    if(o.kind==='shelf')for(let x=.1;x<r.w-.2;x+=.65)shape+=obox(r.x+x,r.y+.06,.08+h,Math.min(.52,r.w-x-.05),Math.max(.1,r.l-.12),.14,'#c4b89b');
    if(o.kind==='printer')shape+=obox(r.x+.07,r.y+.07,h+.1,Math.max(.1,r.w-.14),Math.max(.1,r.l-.14),.02,'#b6d4b5');
   }add(nodes,r.x,r.y,r.w,r.l,shape,{type:'object',id:o.id});
  }
  for(const o of s.openings.filter(o=>openingLevel(s,o)===lev.id&&o.kind==='window')){const a=openingSegment(s,o),h=Math.min(o.h,.6),base=z+o.sill;if(Math.abs(a.y1-a.y2)<.01)add(nodes,a.x1,a.y1,o.w,.07,box(a.x1,a.y1-.035,base,o.w,.07,h,'#b7d4ce'),{type:'opening',id:o.id});else add(nodes,a.x1,a.y1,.07,o.w,box(a.x1-.035,a.y1,base,.07,o.w,h,'#b7d4ce'),{type:'opening',id:o.id});}
  nodes.sort((a,b)=>a.depth-b.depth);markup+=`<g data-level="${lev.id}">${nodes.map(n=>n.markup).join('')}</g>`;
  const p=P(B.w+.5,B.l*.75,z);labels.push({x:p[0],y:p[1],label:`${lev.name} · +${fmt(lev.elevation)} m`});
 }
 if(ceiling)markup+=box(0,0,B.h+(u.exploded&&all?(C.levels.length-1)*1.6:0)-B.ceilingThickness,B.w,B.l,B.ceilingThickness,'#ecebde');
 let lastLabelY=-Infinity;for(const label of labels.sort((a,b)=>a.y-b.y)){const y=Math.max(label.y,lastLabelY+.4);markup+=text(label.x,y,label.label,.21,'#708365','font-weight="550" pointer-events="none"');lastLabelY=y;}
 const maxZ=Math.max(ceiling?B.h+(u.exploded&&all?(C.levels.length-1)*1.6:0):2,...sorted.map(l=>l.elevation+(u.exploded&&all?C.levels.indexOf(l)*1.6:0)+2)),corners=[[0,0],[B.w+3.5,0],[B.w+3.5,B.l],[0,B.l]].flatMap(p=>[P(...p),P(...p,maxZ)]),xs=corners.map(p=>p[0]),ys=corners.map(p=>p[1]),bounds={x:Math.min(...xs)-1.1,y:Math.min(...ys)-.7,w:Math.max(...xs)-Math.min(...xs)+2.2,h:Math.max(...ys)-Math.min(...ys)+1.5};return{markup,bounds};
}
