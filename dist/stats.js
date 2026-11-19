import {technicalEstimate} from './technical.js';
import {OBJECTS} from './catalog.js';
import {area,overlap,unionArea,unionCells,boundarySegments,intersect,segmentOnRect} from './geometry.js';
import {levelOf,objectLevel,openingLevel,openingSegment,objectRect,deckRects,stairHoles} from './model.js';
import {railingSegments} from './surfaces.js';
const EPS=.001;
export function compute(s){
 const B=s.building,T=s.thermal,L=s.light,total=area(B),br={x:0,y:0,...B};
 const levels=s.levels.map(l=>{const rooms=s.rooms.filter(r=>r.levelId===l.id),holes=stairHoles(s,l.id),cells=unionCells(rooms,holes),deck=unionCells(deckRects(s,l.id),holes);return{...l,rooms,surfaces:(s.surfaces||[]).filter(q=>q.levelId===l.id),cells,holes,deck,home:cells.reduce((a,r)=>a+area(r),0),deckArea:deck.reduce((a,r)=>a+area(r),0),boundaries:boundarySegments(rooms,B)};});
 const home=levels.reduce((a,l)=>a+l.home,0),groundHome=levels[0].home,groundStairs=s.objects.filter(o=>o.kind==='stairs'&&objectLevel(s,o)===levels[0].id).map(o=>objectRect(s,o));
 const groundPools=s.objects.filter(o=>o.kind==='pool'&&objectLevel(s,o)===levels[0].id).map(o=>objectRect(s,o));
 const groundSurfaces=levels[0].surfaces,groundOccupied=unionArea([...levels[0].cells,...groundStairs,...groundPools,...groundSurfaces.map(q=>intersect(q,br)).filter(Boolean)]),free=Math.max(0,total-groundOccupied),upperArea=levels.slice(1).reduce((a,l)=>a+l.deckArea,0),upperOpen=levels.slice(1).reduce((a,l)=>a+Math.max(0,l.deckArea-l.home),0),pairs=[],verticalConflicts=[],heightWarnings=[];
 for(let i=0;i<s.rooms.length;i++){
  const a=s.rooms[i],la=levelOf(s,a.levelId);
  if(la.elevation+a.h>B.h+.001)heightWarnings.push(`${a.name} : plafond à ${(la.elevation+a.h).toFixed(2)} m, au-dessus du bâtiment`);
  for(let j=i+1;j<s.rooms.length;j++){const b=s.rooms[j],lb=levelOf(s,b.levelId);if(!overlap(a,b))continue;if(a.levelId===b.levelId)pairs.push([a.name,b.name]);else if(la.elevation<lb.elevation+b.h-EPS&&la.elevation+a.h>lb.elevation-EPS)verticalConflicts.push([a.name,b.name]);}
 }
 for(const l of levels.slice(1)){
  for(const r of s.rooms.filter(r=>levelOf(s,r.levelId).elevation<l.elevation))if(l.deck.some(d=>overlap(d,r))&&levelOf(s,r.levelId).elevation+r.h>l.elevation-l.thickness+.01)heightWarnings.push(`${r.name} : plafond traversé par le plancher de ${l.name}`);
  if(l.elevation+l.height>B.h+.001&&!l.rooms.length)heightWarnings.push(`${l.name} : hauteur disponible ${Math.max(0,B.h-l.elevation).toFixed(2)} m`);
 }
 for(let i=1;i<levels.length;i++)for(let j=i+1;j<levels.length;j++){const a=levels[i],b=levels[j];if(Math.max(a.elevation-a.thickness,b.elevation-b.thickness)>=Math.min(a.elevation,b.elevation)-EPS)continue;let shared=0;for(const ra of a.deck)for(const rb of b.deck){const q=intersect(ra,rb);if(q)shared+=area(q);}if(shared>EPS)heightWarnings.push(`Planchers de ${a.name} et ${b.name} superposés sur ${shared.toFixed(1)} m²`);}
 const glazing=s.openings.filter(o=>o.kind==='window').map(o=>({o,seg:openingSegment(s,o),levelId:openingLevel(s,o),z:levelOf(s,openingLevel(s,o)).elevation+o.sill}));
 const roomRows=s.rooms.map((r,index)=>{
  const l=levels.find(l=>l.id===r.levelId),z=l.elevation,windows=glazing.filter(w=>w.levelId===r.levelId&&segmentOnRect(w.seg,br)>EPS&&segmentOnRect(w.seg,r)>EPS),groups=new Map();
  for(const w of windows){const seg=w.seg,horiz=Math.abs(seg.y1-seg.y2)<EPS,key=(horiz?'h':'v')+(horiz?seg.y1:seg.x1),start=Math.max(horiz?seg.x1:seg.y1,horiz?r.x:r.y),end=Math.min(horiz?seg.x2:seg.y2,horiz?r.x+r.w:r.y+r.l),bottom=Math.max(z,w.z),top=Math.min(z+r.h,w.z+w.o.h);if(end>start&&top>bottom){if(!groups.has(key))groups.set(key,[]);groups.get(key).push({x:start,y:bottom,w:end-start,l:top-bottom});}}
  const glass=[...groups.values()].reduce((a,list)=>a+unionArea(list),0),net=unionArea([r],l.holes),previous=s.rooms.slice(0,index).filter(q=>q.levelId===r.levelId),allocated=Math.max(0,unionArea([...previous,r],l.holes)-unionArea(previous,l.holes));
  return{...r,area:net,gross:area(r),glass,fixtures:Math.ceil(allocated*r.lux/(L.lumens*L.factor)-1e-9)};
 });
 const outdoorUpper=levels.slice(1).reduce((sum,l)=>sum+unionArea(l.surfaces.filter(q=>q.kind==='terrace'),[...l.rooms,...l.holes]),0);
 const homeFixtures=roomRows.reduce((a,r)=>a+r.fixtures,0),shopFixtures=Math.ceil((free+Math.max(0,upperOpen-outdoorUpper))*L.shoplux/(L.shoplumens*L.factor)-1e-9),watts=homeFixtures*L.watt+shopFixtures*L.shopwatt,kwh=watts/1000*L.hours*365;
 let externalWalls=0,internalWalls=0,partitionArea=0,insideLength=0,extLen=0,extGlass=0,intGlass=0,extDoor=0,intDoor=0;
 function cutoutArea(b,l,kind){
  const rects=[];
  for(const o of s.openings){
   if(openingLevel(s,o)!==l.id||(kind==='window'?o.kind!=='window':o.kind==='window'))continue;
   const seg=openingSegment(s,o),horizontal=b.axis==='h';
   if(horizontal?Math.abs(seg.y1-seg.y2)>EPS||Math.abs(seg.y1-b.pos)>.01:Math.abs(seg.x1-seg.x2)>EPS||Math.abs(seg.x1-b.pos)>.01)continue;
   const a=Math.max(b.a,horizontal?seg.x1:seg.y1),end=Math.min(b.b,horizontal?seg.x2:seg.y2),bottom=l.elevation+o.sill,top=Math.min(l.elevation+b.h,l.elevation+o.sill+o.h);
   if(end>a&&top>bottom)rects.push({x:a,y:bottom,w:end-a,l:top-bottom});
  }return unionArea(rects);
 }
 for(const l of levels)for(const b of l.boundaries){
  const gross=(b.b-b.a)*b.h;partitionArea+=gross;
  if(b.partition){insideLength+=b.b-b.a;continue;}
  const glass=cutoutArea(b,l,'window'),door=cutoutArea(b,l,'door');
  if(b.external){extLen+=b.b-b.a;externalWalls+=Math.max(0,gross-glass-door);extGlass+=glass;extDoor+=door;}
  else{internalWalls+=Math.max(0,gross-glass-door);intGlass+=glass;intDoor+=door;}
 }
 let sharedFloor=0;
 for(let i=0;i<levels.length;i++)for(let j=i+1;j<levels.length;j++){
  const lo=levels[i].elevation<levels[j].elevation?levels[i]:levels[j],hi=lo===levels[i]?levels[j]:levels[i];
  for(const a of lo.cells){const h=Math.max(0,...lo.rooms.filter(r=>overlap(r,a)).map(r=>r.h));if(Math.abs(lo.elevation+h-(hi.elevation-hi.thickness))>.025)continue;for(const b of hi.cells){const q=intersect(a,b);if(q)sharedFloor+=area(q);}}
 }
 let roof=Math.max(0,home-sharedFloor),floor=roof;const all=T.scope==='all',windows=extGlass,allWindows=glazing.reduce((a,w)=>a+segmentOnRect(w.seg,br)*w.o.h,0);
 if(all){extDoor=s.openings.filter(o=>o.kind!=='window').reduce((a,o)=>a+segmentOnRect(openingSegment(s,o),br)*o.h,0);externalWalls=Math.max(0,2*(B.w+B.l)*B.h-allWindows-extDoor);internalWalls=0;roof=total;floor=total;extGlass=allWindows;intGlass=0;intDoor=0;}
 const walls=externalWalls+internalWalls,Rs=['wall','roof','floor'].map(k=>T[k]/1000/T.lambda),U=Rs.map((r,i)=>1/(r+[.17,.14,.17][i])),dt=Math.max(0,T.inside-T.outside),di=all?dt:Math.max(0,T.inside-T.shop),df=Math.max(0,T.inside-T.ground);
 const volume=all?total*B.h:levels.reduce((sum,l)=>sum+l.cells.reduce((a,c)=>a+area(c)*Math.max(0,...l.rooms.filter(r=>overlap(r,c)).map(r=>r.h)),0),0),groundFloor=all?total:groundHome,elevatedFloor=Math.max(0,floor-groundFloor);
 const heat=(externalWalls*U[0]+extGlass*T.ug+extDoor*T.ud)*dt+(internalWalls*U[0]+intGlass*T.ug+intDoor*T.ud+roof*U[1]+elevatedFloor*U[2])*di+groundFloor*U[2]*df+volume*.34*T.air*dt;
 const waste=1+T.waste/100,matWall=walls*T.wallprice*waste,matRoof=roof*T.roofprice*waste,matFloor=floor*T.floorprice*waste,materials=matWall+matRoof+matFloor;
 const railing=levels.reduce((sum,l)=>sum+railingSegments(l,B).reduce((a,b)=>a+b.b-b.a,0),0);
 const surfaceAreas=kind=>levels.reduce((sum,l)=>sum+unionArea(l.surfaces.filter(q=>q.kind===kind),[...l.rooms,...l.holes]),0),mezzanineArea=surfaceAreas('mezzanine'),terraceArea=surfaceAreas('terrace'),groundDeckArea=unionArea(groundSurfaces,levels[0].rooms);
 const furniture=s.objects.reduce((a,o)=>a+(o.price??OBJECTS[o.kind].price),0),structureCost=upperArea*s.budget.structure+railing*s.budget.railing+groundDeckArea*(s.budget.terrace??120);
 const lots=[
  {key:'insulation',name:'Matériaux isolants',value:materials,color:'#799274',note:'Enveloppe des pièces, hors parois entre pièces chauffées'},
  {key:'partition',name:'Murs & cloisons',value:partitionArea*s.budget.partition,color:'#b4bc9b',note:'Parois dessinées, cloisons communes comptées une fois'},
  {key:'fitout',name:'Aménagement & finitions',value:home*s.budget.fitout,color:'#c5ad89',note:'Surfaces cumulées par niveau, trémies retirées'},
  {key:'structure',name:'Planchers & garde-corps',value:structureCost,color:'#a6b4b6',note:'Planchers ajoutés, terrasses au sol et garde-corps ; escalier dans les équipements'},
  {key:'openings',name:'Menuiseries',value:s.openings.reduce((a,o)=>a+o.w*o.h*(o.kind==='window'?s.budget.glazing:s.budget.door),0),color:'#8ba5ad',note:'Toutes les ouvertures dessinées'},
  {key:'furniture',name:'Mobilier & escaliers',value:furniture,color:'#a897b1',note:'Montants modifiables par élément'}
 ];
 if(s.technical?.points.length){
  const {budget}=technicalEstimate(s);
  lots.push({key:'networks',name:'Électricité & plomberie',value:budget,color:'#818eb2',note:'Métrés horizontaux ; fournitures et pose aux prix renseignés'});
 }
 const works=lots.reduce((a,l)=>a+l.value,0),contingency=works*s.budget.contingency/100,fees=B.price*s.budget.fees/100,budget=B.price+works+contingency+fees,openingPairs=[];
 for(let i=0;i<s.openings.length;i++)for(let j=i+1;j<s.openings.length;j++){
  const oa=s.openings[i],ob=s.openings[j];if(openingLevel(s,oa)!==openingLevel(s,ob)||oa.sill>=ob.sill+ob.h||ob.sill>=oa.sill+oa.h)continue;
  const a=openingSegment(s,oa),b=openingSegment(s,ob);
  if(Math.abs(a.y1-a.y2)<EPS&&Math.abs(b.y1-b.y2)<EPS&&Math.abs(a.y1-b.y1)<EPS&&a.x1<b.x2&&a.x2>b.x1||Math.abs(a.x1-a.x2)<EPS&&Math.abs(b.x1-b.x2)<EPS&&Math.abs(a.x1-b.x1)<EPS&&a.y1<b.y2&&a.y2>b.y1)openingPairs.push([i,j]);
 }
 const unexposed=glazing.filter(w=>segmentOnRect(w.seg,br)<EPS).length,stairsWarnings=s.objects.filter(o=>o.kind==='stairs'&&(!o.targetLevelId||levelOf(s,o.targetLevelId).elevation<=levelOf(s,objectLevel(s,o)).elevation)).map(()=> 'Escalier : choisissez un niveau d’arrivée plus haut');
 for(const o of s.objects.filter(o=>o.kind==='stairs'&&o.targetLevelId)){const r=objectRect(s,o),q=o.rotation,landing=q===90?{x:r.x+.01,y:r.y+r.l/2}:q===180?{x:r.x+r.w/2,y:r.y+.01}:q===270?{x:r.x+r.w-.01,y:r.y+r.l/2}:{x:r.x+r.w/2,y:r.y+r.l-.01};if(!deckRects(s,o.targetLevelId).some(d=>landing.x>=d.x&&landing.x<=d.x+d.w&&landing.y>=d.y&&landing.y<=d.y+d.l))stairsWarnings.push(`Escalier : arrivée hors du plancher de ${levelOf(s,o.targetLevelId).name}`);}
 return{total,home,groundHome,mezzanineArea,terraceArea,groundDeckArea,groundOccupied,free,covered:home,spare:0,upperArea,upperOpen,levels,pairs,verticalConflicts,heightWarnings,stairsWarnings,windows,allWindows,unexposed,roomRows,homeFixtures,shopFixtures,watts,kwh,energy:kwh*L.kwhPrice,extLen,walls,externalWalls,internalWalls,roof,floor,sharedFloor,volume,Rs,heat,materials,matWall,matRoof,matFloor,insideLength,partitionArea,railing,structureCost,furniture,lots,works,contingency,fees,budget,openingPairs};
}
