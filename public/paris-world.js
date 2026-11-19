// Local coordinates are metres, east and south. All map layers share the IGN projection in paris-data.
import { buildings, streets, water, green, metadata } from './paris-data.js';

import { vehicleSpec, vehicleDoorways } from './vehicle-types.js';
import { buildTrafficRoutes, indexTrafficDetours, sampleRoadRoute } from './traffic-roads.js';

const EMPTY = new Set();
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sq = v => v * v;
const wrap = (v, p) => (v % p + p) % p;
const hash = text => {
  let n = 2166136261;
  for (const c of String(text)) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  return n >>> 0;
};

function nearestPoint(x,y,a,b) {
  const dx=b[0]-a[0], dy=b[1]-a[1];
  const t=clamp(((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy || 1),0,1);
  return [a[0]+t*dx,a[1]+t*dy];
}
function lineDist2(x,y,a,b) {
  const dx=b[0]-a[0],dy=b[1]-a[1],aX=x-a[0],aY=y-a[1];
  const t=clamp((aX*dx+aY*dy)/(dx*dx+dy*dy || 1),0,1);
  return sq(aX-dx*t)+sq(aY-dy*t);
}
function inRing(x,y,ring) {
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++) {
    const a=ring[i],b=ring[j];
    if((a[1]>y)!==(b[1]>y) && x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) inside=!inside;
  }
  return inside;
}
function inShape(x,y,item) {
  return inRing(x,y,item.poly) && !item.holes?.some(r=>inRing(x,y,r));
}
function bounds(points,margin=0) {
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const [x,y] of points){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
  return {minX:minX-margin,minY:minY-margin,maxX:maxX+margin,maxY:maxY+margin};
}
function overlaps(a,b) {
  return a.minX<=b.maxX && a.maxX>=b.minX && a.minY<=b.maxY && a.maxY>=b.minY;
}
class Grid {
  constructor(size){this.size=size;this.cells=new Map();}
  cellsFor(b,callback) {
    for(let y=Math.floor(b.minY/this.size);y<=Math.floor(b.maxY/this.size);y++)
      for(let x=Math.floor(b.minX/this.size);x<=Math.floor(b.maxX/this.size);x++)callback(x+4096*y);
  }
  insert(item,b){
    item.box=b;
    this.cellsFor(b,key=>{if(!this.cells.has(key))this.cells.set(key,[]);this.cells.get(key).push(item);});
  }
  area(x,y,r){
    return this.areaBox({minX:x-r,maxX:x+r,minY:y-r,maxY:y+r});
  }
  areaBox(b){
    const result=new Set();
    this.cellsFor(b,key=>{for(const item of this.cells.get(key)||[])if(overlaps(b,item.box))result.add(item);});
    return result;
  }
}
const terrain=new Grid(48),roadGrid=new Grid(56),decor=new Grid(32);
const boundary=metadata.boundary;
const viewpoints={
  eiffel:{name:'Tour Eiffel',x:3257.7,y:2420.6,h:105,margin:62},
  'notre-dame':{name:'Notre-Dame de Paris',x:7317.25,y:3007.75,h:34,margin:55},
  'sacre-coeur':{name:'Sacré-Cœur de Montmartre',x:6807.6,y:-739.5,h:35,margin:32}
};
const focalPoint=viewpoints[metadata.sector?.preset];
const sector=metadata.sector ? {...metadata.sector,name:focalPoint?.name||metadata.sector.name||'Secteur local'} : null;
const landBounds=bounds(boundary);
const boundaryItem={id:'boundary',type:'boundary'};
const midX=(landBounds.minX+landBounds.maxX)/2,midY=(landBounds.minY+landBounds.maxY)/2;
const anchors=[['north','Nord',0,-1],['east','Est',1,0],['south','Sud',0,1],['west','Ouest',-1,0]];
const neighborSectors=sector ? anchors.map(([direction,label,dx,dy])=>{
  const x=midX+dx*(landBounds.maxX-landBounds.minX),y=midY+dy*(landBounds.maxY-landBounds.minY);
  return {direction,label,x,y,lon:2.25+x/73190,lat:48.88-y/111320};
}):[];
export function sectorInfo(x,y){
  let closest=null,normal=null,min=Infinity;
  for(let i=0,j=boundary.length-1;i<boundary.length;j=i++){
    const d=lineDist2(x,y,boundary[i],boundary[j]);
    if(d>=min)continue;
    min=d;closest=nearestPoint(x,y,boundary[i],boundary[j]);
    const tx=boundary[i][0]-boundary[j][0],ty=boundary[i][1]-boundary[j][1],len=Math.hypot(tx,ty)||1;
    normal={x:-ty/len,y:tx/len};
  }
  if(inRing(closest[0]+normal.x*.2,closest[1]+normal.y*.2,boundary)){normal.x*=-1;normal.y*=-1;}
  const dx=normal.x,dy=normal.y;
  const edge=Math.abs(dx)>Math.abs(dy)?(dx>0?'east':'west'):(dy>0?'south':'north');
  return {current:sector,distanceToEdge:Math.sqrt(min),edge,closest:{x:closest[0],y:closest[1]},outward:normal,neighbors:neighborSectors};
}
export const monuments = {
  arc:{id:'arc',x:3296.7,y:693.2,yaw:1.127,side:22.5,depth:11,innerSide:7.31,innerDepth:4.22,h:49.5,clearance:27},
  arche:{id:'arche',x:-1034.4,y:-1399,yaw:1.019,side:53.5,depth:56,innerSide:32,innerDepth:0,h:110,clearance:84}
};
function modelXZ(m,x,z) {
  return [m.x+x*Math.cos(m.yaw)+z*Math.sin(m.yaw),m.y-x*Math.sin(m.yaw)+z*Math.cos(m.yaw)];
}
function monumentRect(m,left,right,front,back,minHeight=0) {
  return {type:'building',id:m.id+'-'+left+':'+front+':'+minHeight,h:m.h,minHeight,
    poly:[[left,front],[right,front],[right,back],[left,back]].map(([x,z])=>modelXZ(m,x,z))};
}
function importedMonument(b) {
  const center=b.poly.reduce((sum,p)=>[sum[0]+p[0]/b.poly.length,sum[1]+p[1]/b.poly.length],[0,0]);
  for(const m of Object.values(monuments)){
    const dx=center[0]-m.x,dy=center[1]-m.y,c=Math.cos(m.yaw),s=Math.sin(m.yaw);
    if((m.id==='arc' && String(b.id)==='157326') || (m.id==='arche' && String(b.id)==='444657'))return true;
    if(Math.abs(dx*c-dy*s)<m.side-2 && Math.abs(dx*s+dy*c)<m.depth-2)return true;
  }
  return false;
}
const eiffel={id:'eiffel',x:3257.7,y:2420.6,yaw:.802,h:330};
const eiffelFeet=new Set(['162158','162159','162160','162699']);
const pyramidIds=new Set(['245184969','253248239','253248246','253248248']);
for(const b of buildings){
  if(!b.poly?.length || eiffelFeet.has(String(b.id)) || importedMonument(b))continue;
  const item={...b,type:'building'};
  if(pyramidIds.has(String(b.id))){
    item.h=String(b.id)==='245184969'?21.6:21.6*Math.hypot(b.poly[0][0]-b.poly[1][0],b.poly[0][1]-b.poly[1][1])/35;
    item.taperCenter=b.poly.reduce((pt,v)=>[pt[0]+v[0]/b.poly.length,pt[1]+v[1]/b.poly.length],[0,0]);
  }else if(String(b.id)==='245198908')item.h=27.1;
  terrain.insert(item,bounds(item.poly));
}
for(const m of Object.values(monuments)){
  if(m.x+m.side<landBounds.minX || m.x-m.side>landBounds.maxX || m.y+m.depth<landBounds.minY || m.y-m.depth>landBounds.maxY)continue;
  const local=[];
  if(m.innerDepth){
    for(const [left,right] of [[-m.side,-m.innerSide],[m.innerSide,m.side]])
      for(const [front,back] of [[-m.depth,-m.innerDepth],[m.innerDepth,m.depth]])local.push(monumentRect(m,left,right,front,back));
  }else{
    local.push(monumentRect(m,-m.side,-m.innerSide,-m.depth,m.depth),monumentRect(m,m.innerSide,m.side,-m.depth,m.depth));
  }
  local.push(monumentRect(m,-m.side,m.side,-m.depth,m.depth,m.clearance));
  for(const b of local)terrain.insert(b,bounds(b.poly));
}
if(eiffel.x+86>landBounds.minX && eiffel.x-86<landBounds.maxX && eiffel.y+86>landBounds.minY && eiffel.y-86<landBounds.maxY){
  for(const cx of [-50,50])for(const cz of [-50,50]){
    const pier=monumentRect(eiffel,cx-12.4,cx+12.4,cz-12.4,cz+12.4);
    // At pedestrian/camera height only the separate anchored legs occupy the ground.
    pier.h=56;terrain.insert(pier,bounds(pier.poly));
  }
  const platform=monumentRect(eiffel,-35.3,35.3,-35.3,35.3,55);platform.h=62;
  terrain.insert(platform,bounds(platform.poly));
}
for(const w of water){if(w.poly?.length){const item={...w,type:'water'};terrain.insert(item,bounds(w.poly));}}
const streetList=streets.filter(s=>s.path?.length>=2 && s.level>=0);
for(const road of streetList){
  for(let i=1;i<road.path.length;i++){
    const a=road.path[i-1],b=road.path[i];
    if(a[0]===b[0]&&a[1]===b[1])continue;
    roadGrid.insert({road,a,b},bounds([a,b],road.w*.5+3));
  }
}
function prefix(text){return String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
export const pontDeNeuilly = {start:[203,-804],end:[447,-684],halfWidth:20.5};
function isBridge(x,y,r=0){
  if(lineDist2(x,y,pontDeNeuilly.start,pontDeNeuilly.end) <= sq(pontDeNeuilly.halfWidth-Math.min(r,2.5)))return true;
  for(const {road,a,b} of roadGrid.area(x,y,4+r)){
    if(!(road.bridge || road.level>0 || /pont de neuilly/i.test(road.name||'')))continue;
    if(lineDist2(x,y,a,b)<=sq(Math.max(2.2,road.w*.5+2.25)-Math.min(r,1)))return true;
  }
  return false;
}
function ringTouchesCircle(x,y,r,ring){
  for(let i=0,j=ring.length-1;i<ring.length;j=i++)
    if(lineDist2(x,y,ring[j],ring[i])<r*r)return true;
  return false;
}
function shapeCircle(x,y,r,b){
  return inShape(x,y,b) || (r>0 && (ringTouchesCircle(x,y,r,b.poly)||b.holes?.some(h=>ringTouchesCircle(x,y,r,h))));
}
// Liang-Barsky clipping in local vehicle coordinates allows a thin wall or a small pier
// to intersect a long vehicle along its side even when all four corners remain outside.
function segmentIntersectsRect(a,b,l,w) {
  let lo=0,hi=1;
  for(const [v,d,half] of [[a[0],b[0]-a[0],l],[a[1],b[1]-a[1],w]]){
    if(Math.abs(d)<1e-7){if(Math.abs(v)>half)return false;continue;}
    const t1=(-half-v)/d,t2=(half-v)/d;
    lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));
    if(lo>hi)return false;
  }
  return true;
}
function rectShape(x,y,c,s,l,w,poly){
  if(inShape(x,y,poly))return true;
  for(const h of [-l,l])for(const k of [-w,w])
    if(inShape(x+c*h-s*k,y+s*h+c*k,poly))return true;
  for(const ring of [poly.poly,...(poly.holes||[])]){
    let last=ring[ring.length-1];let a=[(last[0]-x)*c+(last[1]-y)*s,-(last[0]-x)*s+(last[1]-y)*c];
    for(const t of ring){
      const b=[(t[0]-x)*c+(t[1]-y)*s,-(t[0]-x)*s+(t[1]-y)*c];
      if(segmentIntersectsRect(a,b,l,w))return true;
      a=b;
    }
  }
  return false;
}
function rectCircle(x,y,c,s,l,w,px,py,r){
  const dx=px-x,dy=py-y;
  const a=Math.max(0,Math.abs(dx*c+dy*s)-l),b=Math.max(0,Math.abs(-dx*s+dy*c)-w);
  return a*a+b*b<r*r;
}
function rectAgainstRect(x,y,angle,l,w,b){
  const c=Math.cos(angle),s=Math.sin(angle),bc=Math.cos(b.angle||0),bs=Math.sin(b.angle||0),dx=b.x-x,dy=b.y-y;
  for(const [a,k] of [[c,s],[-s,c],[bc,bs],[-bs,bc]]){
    if(Math.abs(dx*a+dy*k)>=l*Math.abs(c*a+s*k)+w*Math.abs(-s*a+c*k)+
      b.halfLength*Math.abs(bc*a+bs*k)+b.halfWidth*Math.abs(-bs*a+bc*k))return false;
  }
  return true;
}
function withinBoundary(x,y,r=0) {
  if(x<landBounds.minX+r||x>landBounds.maxX-r||y<landBounds.minY+r||y>landBounds.maxY-r)return false;
  return inRing(x,y,boundary) && (r<=0 || !ringTouchesCircle(x,y,r,boundary));
}
function testPose(x,y,opt={},propsEnabled=true) {
  const r=opt.radius??.42, l=opt.halfLength,w=opt.halfWidth, box=!!(l&&w);
  const reach=box?Math.hypot(l,w):r, a=opt.angle||0,c=Math.cos(a),s=Math.sin(a);
  const z=opt.height??1.3;
  if(!withinBoundary(x,y,reach))return boundaryItem;
  for(const b of terrain.area(x,y,reach)){
    if(b.type==='water' && (opt.camera || isBridge(x,y,reach)))continue;
    if(b.type==='building' && (z >= (b.h||11) || z<(b.minHeight||0)))continue;
    // The glass pyramids narrow with height, so the camera can clear their sloped faces.
    let volume=b;
    if(b.taperCenter && opt.camera){
      const [cx,cy]=b.taperCenter,k=1-z/b.h;
      volume={...b,poly:b.poly.map(p=>[cx+(p[0]-cx)*k,cy+(p[1]-cy)*k])};
    }
    if(box ? rectShape(x,y,c,s,l,w,volume) : shapeCircle(x,y,reach,volume))return b;
  }
  const touchDynamic = d => {
    if(d.id && d.id===opt.ignoreId)return false;
    if(opt.camera && d.h && z>d.h)return false;
    if(d.halfLength&&d.halfWidth){
      if(box)return rectAgainstRect(x,y,a,l,w,d);
      return rectCircle(d.x,d.y,Math.cos(d.angle||0),Math.sin(d.angle||0),d.halfLength,d.halfWidth,x,y,r);
    }
    return box ? rectCircle(x,y,c,s,l,w,d.x,d.y,d.r||.5) : sq(x-d.x)+sq(y-d.y)<sq(reach+(d.r||.5));
  };
  if(propsEnabled){
    for(const d of decor.area(x,y,reach)){
      if(opt.destroyed?.has(d.id) || !touchDynamic(d))continue;
      return d;
    }
  }
  if(opt.colliders)for(const d of opt.colliders)if(touchDynamic(d))return d;
  return null;
}
export function blocked(x,y,radius=.42,destroyed=EMPTY,height=1.4) {
  return !!testPose(x,y,{radius,destroyed,height});
}
export function contactAt(x,y,opt={}){return testPose(x,y,opt);}
// Outward normal and signed clearance between a point and an oriented rectangle.
function pointBoxContact(px,py,x,y,angle,l,w) {
  const c=Math.cos(angle),s=Math.sin(angle);
  const u=(px-x)*c+(py-y)*s,v=-(px-x)*s+(py-y)*c;
  const du=u-clamp(u,-l,l),dv=v-clamp(v,-w,w),outside=Math.hypot(du,dv);
  if(outside>0)return [(du*c-dv*s)/outside,(du*s+dv*c)/outside,outside];
  if(l-Math.abs(u)<w-Math.abs(v)){
    const sign=u<0?-1:1;return [sign*c,sign*s,Math.abs(u)-l];
  }
  const sign=v<0?-1:1;return [-sign*s,sign*c,Math.abs(v)-w];
}
function bodyContact(x,y,opt,d,dx,dy){
  const bx=x-d.x,by=y-d.y,rect=!!(opt.halfLength&&opt.halfWidth),otherRect=!!(d.halfLength&&d.halfWidth);
  if(rect&&otherRect){
    const c=Math.cos(opt.angle||0),s=Math.sin(opt.angle||0),bc=Math.cos(d.angle||0),bs=Math.sin(d.angle||0);
    let gap=-Infinity,nx=0,ny=0;
    for(const [ax,ay] of [[c,s],[-s,c],[bc,bs],[-bs,bc]]){
      const projection=bx*ax+by*ay;
      const distance=Math.abs(projection)-opt.halfLength*Math.abs(ax*c+ay*s)-opt.halfWidth*Math.abs(-ax*s+ay*c)
        -d.halfLength*Math.abs(ax*bc+ay*bs)-d.halfWidth*Math.abs(-ax*bs+ay*bc);
      if(distance>gap){const sign=projection<0?-1:1;gap=distance;nx=ax*sign;ny=ay*sign;}
    }
    return [nx,ny,gap];
  }
  if(otherRect){
    const [nx,ny,gap]=pointBoxContact(x,y,d.x,d.y,d.angle||0,d.halfLength,d.halfWidth);
    return [nx,ny,gap-(opt.radius??.42)];
  }
  if(rect){
    const [nx,ny,gap]=pointBoxContact(d.x,d.y,x,y,opt.angle||0,opt.halfLength,opt.halfWidth);
    return [-nx,-ny,gap-(d.r||.5)];
  }
  const len=Math.hypot(bx,by),gap=len-(opt.radius??.42)-(d.r||.5);
  if(len>0)return [bx/len,by/len,gap];
  const movement=Math.hypot(dx,dy);
  return movement?[dx/movement,dy/movement,gap]:[1,0,gap];
}
function boxBuildingNormal(x,y,opt,building){
  const angle=opt.angle||0,c=Math.cos(angle),s=Math.sin(angle),l=opt.halfLength,w=opt.halfWidth;
  const corners=[];
  for(const u of [-l,l])for(const v of [-w,w])corners.push([x+u*c-v*s,y+u*s+v*c]);
  let best=Infinity,nx=0,ny=0;
  // Between two disjoint polygon edges, a closest pair includes an endpoint.
  // Either a building corner grazes the car flank, or a bumper corner grazes a wall.
  for(const ring of [building.poly,...(building.holes||[])]){
    for(let i=0,j=ring.length-1;i<ring.length;j=i++){
      const a=ring[i],b=ring[j];
      const [vx,vy,gap]=pointBoxContact(a[0],a[1],x,y,angle,l,w);
      if(gap<=0)return null;
      if(gap*gap<best){best=gap*gap;nx=-vx;ny=-vy;}
      for(const [px,py] of corners){
        const d2=lineDist2(px,py,a,b);if(d2>=best)continue;
        if(d2<1e-14)return null;
        const q=nearestPoint(px,py,a,b),distance=Math.sqrt(d2);
        best=d2;nx=(px-q[0])/distance;ny=(py-q[1])/distance;
      }
    }
  }
  return best<Infinity?[nx,ny]:null;
}
function contactNormal(x,y,opt,d,dx,dy) {
  if(!d.poly&&d!==boundaryItem)return bodyContact(x,y,opt,d,dx,dy);
  if(opt.halfLength&&opt.halfWidth&&d.poly){
    const normal=boxBuildingNormal(x,y,opt,d);
    if(normal)return normal;
  }
  let mx,my;
  let best=Infinity;
  for(const ring of d===boundaryItem?[boundary]:[d.poly,...(d.holes||[])]){
    for(let i=0,j=ring.length-1;i<ring.length;j=i++){
      const nd=lineDist2(x,y,ring[i],ring[j]);if(nd>=best)continue;
      best=nd;const q=nearestPoint(x,y,ring[i],ring[j]);mx=x-q[0];my=y-q[1];
    }
  }
  let len=Math.hypot(mx,my);
  if(!len){mx=-dx;my=-dy;len=Math.hypot(mx,my)||1;}
  return [mx/len,my/len];
}
function canSeparateBody(x,y,dx,dy,opt){
  const overlapping=[],others=[];
  for(const body of opt.colliders){
    if(opt.ignoreId&&body.id===opt.ignoreId)continue;
    const gap=bodyContact(x,y,opt,body,dx,dy)[2];
    if(gap<0)overlapping.push({body,gap});
    else others.push(body);
  }
  const geometry={...opt,colliders:others},steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/.18));
  for(let i=1;i<=steps;i++){
    const px=x+dx*i/steps,py=y+dy*i/steps;
    if(testPose(px,py,geometry))return false;
    for(const {body,gap} of overlapping){
      if(bodyContact(px,py,opt,body,dx,dy)[2]<gap-.00001)return false;
    }
  }
  return true;
}
// When two newly received poses enclose a walker from opposite sides, a push along
// either normal would deepen the other contact. Look for a short swept exit beside them.
function leaveMultipleContacts(x,y,opt,nx,ny){
  if(opt.halfLength)return null;
  const overlapping=opt.colliders.filter(b=>(!opt.ignoreId||b.id!==opt.ignoreId)&&bodyContact(x,y,opt,b,0,0)[2]<0);
  if(overlapping.length<2)return null;
  const tangent=Math.atan2(nx,-ny);
  const step=.18,limit=Math.min(4,(opt.radius??.42)+Math.max(...overlapping.map(b=>b.halfWidth||b.r||.5))+.5);
  for(let reach=step;reach<=limit+step;reach+=step){
    for(let i=0;i<16;i++){
      const angle=tangent+i*Math.PI/8,dx=Math.cos(angle)*reach,dy=Math.sin(angle)*reach;
      if(!testPose(x+dx,y+dy,opt)&&canSeparateBody(x,y,dx,dy,opt))return {x:x+dx,y:y+dy};
    }
  }
  return null;
}
export function moveBody(x,y,dx,dy,opt={}) {
  let touched=null,nx=0,ny=0;
  const length=Math.hypot(dx,dy),steps=Math.max(1,Math.ceil(length/(opt.halfLength ? .7 : .35)));
  const sx=dx/steps,sy=dy/steps;
  for(let i=0;i<steps;i++){
    const d=testPose(x+sx,y+sy,opt);
    if(!d){x+=sx;y+=sy;continue;}
    if(!touched)touched=d;
    const contact=contactNormal(x,y,opt,d,sx,sy);
    [nx,ny]=contact;
    // A newly received peer pose can start inside our body. Only separate dynamic
    // overlaps, sweeping the correction against walls, props and all other bodies.
    if(contact[2]<-.0001&&opt.colliders?.includes(d)){
      const push=-contact[2]+.002;
      if(canSeparateBody(x,y,nx*push,ny*push,opt)){x+=nx*push;y+=ny*push;}
      else if(bodyContact(x+sx,y+sy,opt,d,sx,sy)[2]>contact[2]+.00001&&canSeparateBody(x,y,sx,sy,opt)){
        x+=sx;y+=sy;continue;
      }else{
        const clear=leaveMultipleContacts(x,y,opt,nx,ny);
        if(clear){x=clear.x;y=clear.y;}
      }
    }
    const along=sx*nx+sy*ny,tx=sx-nx*Math.min(along,0),ty=sy-ny*Math.min(along,0);
    if((Math.abs(tx)+Math.abs(ty))>.0001&&!testPose(x+tx,y+ty,opt)){x+=tx;y+=ty;}
    else if(sx && !testPose(x+sx,y,opt))x+=sx;
    else if(sy && !testPose(x,y+sy,opt))y+=sy;
    else break;
  }
  return {x,y,hit:!!touched,touched,normalX:nx,normalY:ny};
}
export function cameraDistance(x,y,height,angle,distance,endHeight=height,destroyed=EMPTY) {
  const c=Math.cos(angle),s=Math.sin(angle), step=.35;
  for(let l=step;l<distance+step;l+=step){
    const dist=Math.min(l,distance),z=height+(endHeight-height)*dist/(distance||1);
    if(testPose(x+c*dist,y+s*dist,{radius:.16,height:z,camera:true,destroyed}))
      return Math.max(.15,dist-step-.12);
  }
  return distance;
}

function closestRoad(x,y,range,predicate){
  let best=null,d2=range*range;
  for(const seg of roadGrid.area(x,y,range)){
    if(predicate && !predicate(seg.road))continue;
    const q=nearestPoint(x,y,seg.a,seg.b),d=sq(q[0]-x)+sq(q[1]-y);
    if(d>=d2)continue;
    d2=d;const angle=Math.atan2(seg.b[1]-seg.a[1],seg.b[0]-seg.a[0]);
    best={x:q[0],y:q[1],angle,road:seg.road,d:Math.sqrt(d)};
  }
  return best;
}
export function streetAt(x,y){
  const seg=closestRoad(x,y,29,s=>!!s.name&&s.kind!=='motorway');
  if(!seg)return '';
  return seg.road.name===seg.road.name.toUpperCase()
    ?seg.road.name.toLocaleLowerCase('fr').replace(/(^|[ -])\p{L}/gu,c=>c.toLocaleUpperCase('fr'))
    :seg.road.name;
}
// Road sections close enough for an emergency vehicle to pull up beside the caller.
export function nearbyDrivableStreets(x,y,radius){
  const found=new Map();
  for(const {road,a,b} of roadGrid.area(x,y,radius)){
    if(road.kind==='path'||road.kind==='motorway'||road.w<3.2)continue;
    const d=lineDist2(x,y,a,b);
    if(d<=radius*radius && (!found.has(road)||d<found.get(road)))found.set(road,d);
  }
  return [...found.keys()].sort((a,b)=>found.get(a)-found.get(b)||String(a.id).localeCompare(String(b.id)));
}
function practicalPoint(key,label,x,y,match,target,justRoad=false){
  const take=s=>s.kind!=='motorway' && (!match||match.test(prefix(s.name)));
  const seg=closestRoad(x,y,110,take)||closestRoad(x,y,100,s=>s.kind!=='motorway');
  const candidates=match?[]:[{x,y}];
  if(seg){
    const w=seg.road.w/2;
    for(const along of [0,-3,4,-9,12])for(const off of (justRoad?[0,w*.5,-w*.5]:[w+1.3,-w-1.3,w*.65,-w*.65,0])){
      const c=Math.cos(seg.angle),s=Math.sin(seg.angle);candidates.push({x:seg.x+c*along-s*off,y:seg.y+s*along+c*off});
    }
  }
  candidates.push({x,y});
  for(let radius=3;radius<=30;radius+=3)for(let i=0;i<12;i++)candidates.push({x:x+radius*Math.cos(i*Math.PI/6),y:y+radius*Math.sin(i*Math.PI/6)});
  const open=candidates.find(p=>!testPose(p.x,p.y,{radius:.95},false))||candidates[0];
  return {...open,key,id:key,label,angle:Math.atan2(target[1]-open.y,target[0]-open.x)};
}
const historicStops=[
  ['etoile','Arc de Triomphe',3094,566,/grande armee/,[3296,693]],
  ['maillot','Porte Maillot',2369,234,/maillot/,[1800,-50]],
  ['sablons','Les Sablons',1685,-95,/charles de gaulle/,[535,-668]],
  ['neuilly','Neuilly-sur-Seine',1094,-394,/charles de gaulle/,[535,-668]],
  ['pont','Pont de Neuilly',273,-767,/pont de neuilly|charles de gaulle/,[-275,-1020],true],
  ['esplanade','Esplanade de La Défense',-265,-1029,/esplanade/,[monuments.arche.x,monuments.arche.y]],
  ['arche','Grande Arche',-912,-1337,/parvis|defense/,[monuments.arche.x,monuments.arche.y]],
  ['champs','Champs-Élysées',4180,1116,/champs.elysees/,[3296,693]],
  ['concorde','Place de la Concorde',5207,1614,/concorde/,[5207,1614]],
  ['louvre','Cour Napoléon du Louvre',6245,2099,null,[6283,2114]]
];
export const coreDestinations=historicStops.map(stop=>{
  if(!sector)return practicalPoint(...stop);
  const [key,label,x,y,,target]=stop;
  return {id:key,key,label,x,y,angle:Math.atan2(target[1]-y,target[0]-x)};
});
function genuineSectorStop(){
  const x=clamp(Number.isFinite(sector.x)?sector.x:midX,landBounds.minX+3,landBounds.maxX-3);
  const y=clamp(Number.isFinite(sector.y)?sector.y:midY,landBounds.minY+3,landBounds.maxY-3);
  const label=sector.name||'Secteur local';
  const reach=Math.hypot(landBounds.maxX-landBounds.minX,landBounds.maxY-landBounds.minY);
  const candidates=[];
  for(const seg of roadGrid.area(x,y,reach)){
    const {road,a,b}=seg;
    if(road.kind==='motorway')continue;
    const q=nearestPoint(x,y,a,b),d=Math.hypot(x-q[0],y-q[1]);
    const score=d+(road.kind==='path'?85:0)+(road.bridge?70:0)+(road.name?0:9);
    candidates.push({q,seg,score});
  }
  candidates.sort((a,b)=>a.score-b.score);
  let fallback=null;
  const parkAndWalk=(origin,angle,lateral)=>{
    const c=Math.cos(angle),s=Math.sin(angle);
    for(const side of [1,-1]){
      const px=origin[0]-s*lateral*side,py=origin[1]+c*lateral*side;
      if(testPose(px,py,{radius:.95},false))continue;
      const cx=px+s*3.8*side,cy=py-c*3.8*side;
      if(testPose(cx,cy,{angle,halfLength:2.2,halfWidth:.99},false))continue;
      const headings=focalPoint?[Math.atan2(focalPoint.y-py,focalPoint.x-px)]:[angle,angle+Math.PI];
      for(const heading of headings){
        if(cameraDistance(px,py,1.6,heading+Math.PI,5,3.2)<4.8)continue;
        const stop={id:'sector',key:'sector',label,x:px,y:py,angle:heading,park:{x:cx,y:cy,angle}};
        if(focalPoint){
          fallback ||= stop;
          const distance=Math.hypot(focalPoint.x-px,focalPoint.y-py),c=Math.cos(heading),s=Math.sin(heading);
          let hidden=false;
          for(let d=5;d<distance-focalPoint.margin;d+=5){
            const h=2.5+(focalPoint.h-2.5)*d/distance;
            if(testPose(px+d*c,py+d*s,{radius:.15,camera:true,height:h},false)){hidden=true;break;}
          }
          if(hidden)continue;
        }
        return stop;
      }
    }
    return null;
  };
  for(const {q,seg:{a,b,road}} of candidates){
    const angle=Math.atan2(b[1]-a[1],b[0]-a[0]);
    // Test the point nearest the selection, then positions away from busy junction centers.
    for(const origin of [q,[(a[0]+b[0])/2,(a[1]+b[1])/2]]){
      for(const lateral of [road.w*.5+1.4,road.w*.50,2.5]){
        const stop=parkAndWalk(origin,angle,lateral);
        if(stop)return stop;
      }
    }
  }
  if(fallback)return fallback;
  // A park or pedestrian island can lack drivable centre lines, but still have valid open ground.
  for(let r=0;r<reach;r+=12){
    const count=Math.max(1,Math.ceil(r*Math.PI/8));
    for(let i=0;i<count;i++){
      const a=i*TAU/count,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;
      if(!withinBoundary(px,py,5))continue;
      const stop=parkAndWalk([px,py],a,0);
      if(stop)return stop;
    }
  }
  if(fallback)return fallback;
  throw Error('Ce secteur ne contient aucun départ praticable.');
}
export const destinations=sector?[genuineSectorStop()]:coreDestinations;
export const SPAWN=destinations[0];
export function getTravelPoint(key){return destinations.find(d=>d.key===key)||null;}
export function districtAt(x,y){
  if(sector)return sector.name||'Secteur local';
  if(x>5940)return 'Le Louvre';
  if(x>5410)return 'Jardin des Tuileries';
  if(x>4880)return 'Place de la Concorde';
  if(x>3550)return 'Champs-Élysées';
  if(x>2690)return 'Charles-de-Gaulle – Étoile';
  if(x>2050)return 'Porte Maillot';
  if(x>1380)return 'Les Sablons';
  if(x>480)return 'Neuilly-sur-Seine';
  if(x>120)return 'Pont de Neuilly';
  if(x>-665)return 'Esplanade de La Défense';
  return 'Parvis de La Défense';
}
function pathGeometry(path){
  const lengths=[0];let length=0;
  for(let i=1;i<path.length;i++){length+=Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]);lengths.push(length);}
  return {path,length,lengths};
}
function alongPath(path,d){
  const {lengths,length}=path;d=clamp(d,0,length);
  let low=1,high=lengths.length-1;
  while(low<high){const mid=(low+high)>>1;if(lengths[mid]<d)low=mid+1;else high=mid;}
  const a=path.path[low-1],b=path.path[low],k=clamp((d-lengths[low-1])/(lengths[low]-lengths[low-1]||1),0,1);
  return {x:a[0]+(b[0]-a[0])*k,y:a[1]+(b[1]-a[1])*k,angle:Math.atan2(b[1]-a[1],b[0]-a[0])};
}
// Clipping a long IGN section can restart path-relative furniture numbers in another tile.
const clippedKey=(road)=>{
  if(!sector)return '';
  const first=road.path[0],last=road.path.at(-1);
  const onEdge=([x,y])=>x<=landBounds.minX+1||x>=landBounds.maxX-1||y<=landBounds.minY+1||y>=landBounds.maxY-1;
  return onEdge(first)||onEdge(last)?hash(first.join(',')+';'+last.join(',')).toString(36):'';
};
const routeRecords=streetList.map(road=>{
  const part=clippedKey(road),id=part?road.id+':'+part:road.id;
  return {...pathGeometry(road.path),road,id,part,key:hash(road.id)};
}).filter(p=>p.length>2);
export const props=[];
const heights={tree:3.5,lamp:5,bollard:.87,bench:.85,hydrant:.85,bin:1.1,postbox:1.2};
const radii={tree:.42,lamp:.20,bollard:.22,bench:.85,hydrant:.31,bin:.34,postbox:.36};
function putProp(path,side,index,type,p){
  const road=path.road;
  const r=radii[type],offset=road.w*.5+(type==='tree'?1.9:1.16);
  const x=p.x-Math.sin(p.angle)*offset*side,y=p.y+Math.cos(p.angle)*offset*side;
  if(destinations.some(d=>Math.hypot(x-d.x,y-d.y)<8))return;
  const nearArc=Math.hypot(x-monuments.arc.x,y-monuments.arc.y);
  if(nearArc<128||Math.hypot(x-monuments.arche.x,y-monuments.arche.y)<58)return;
  if(testPose(x,y,{radius:Math.max(r,.7)},false))return;
  for(const d of decor.area(x,y,5))if(Math.hypot(x-d.x,y-d.y)<(d.type==='tree'&&type==='tree'?6.5:2))return;
  for(const seg of roadGrid.area(x,y,6)){
    if(seg.road.id===road.id || seg.road.kind==='path')continue;
    if(lineDist2(x,y,seg.a,seg.b)<sq(Math.max(1,seg.road.w*.5-.2)))return;
  }
  const item={id:'g'+path.id+'-'+(side===1?'d':'g')+'-'+index,type,x,y,r,h:heights[type],angle:p.angle};
  props.push(item);decor.insert(item,{minX:x-r,maxX:x+r,minY:y-r,maxY:y+r});
}
const ordered=routeRecords.slice().sort((a,b)=>(b.road.kind==='primary')-(a.road.kind==='primary') || (b.road.w-a.road.w) || a.key-b.key);
for(const path of ordered){
  const road=path.road;
  if(road.kind==='path'||road.kind==='motorway'||road.level>0||path.length<21)continue;
  const major=road.kind==='primary'||/avenue|boulevard/i.test(road.name);
  const step=major?13:27;
  const kinds=major?['tree','lamp','tree','bench','tree','postbox','lamp','tree','bin','hydrant','tree','bollard']:['tree','bin','lamp','bench','bollard','postbox','lamp','hydrant'];
  for(const side of [-1,1]){
    let serial=0;
    for(let d=7+(path.key%13)+(side>0?3:0);d<path.length-6;d+=step){
      const type=kinds[(path.key+serial+(side>0?2:0))%kinds.length];putProp(path,side,serial,type,alongPath(path,d));serial++;
    }
  }
}
export function nearbyProps(x,y,radius){
  return [...decor.area(x,y,radius)].filter(o=>sq(x-o.x)+sq(y-o.y)<=sq(radius));
}
const tintedCars=['#8ac7b4','#bb6681','#bb8657','#65829d','#ab6256','#98aaa4','#bc9975'];
const tintedPeds=['#91bcae','#c98a82','#c1a17c','#929dc3','#b7738c','#8fa27f','#9d81b4'];
const serviceTypes=['police','firefighter','medic','swat'];
const parkedFleet=['compact','taxi','sedan','van','compact','taxi','sport','sport','sedan','compact'];
const trafficSeeds=new Map(),walkerSeeds=new Map();
const cellKey=(x,y,size)=>Math.floor(x/size)+4096*Math.floor(y/size);
function considerSeed(store,key,candidate,rank){
  if(!store.has(key)||store.get(key).rank<rank)store.set(key,{p:candidate,rank});
}
for(const p of routeRecords){
  const road=p.road,mid=alongPath(p,p.length*.5);
  if(road.kind==='motorway')continue;
  const rank=Math.min(p.length,160)+(road.kind==='primary'?40:0)+(p.key%13)/20;
  if(road.kind!=='path'&&p.length>18&&road.w>=(road.oneway?3:4)){
    const key=cellKey(mid.x,mid.y,106),candidates=trafficSeeds.get(key)||[];
    candidates.push({p,rank});trafficSeeds.set(key,candidates);
  }
  if(!road.bridge&&p.length>15)considerSeed(walkerSeeds,cellKey(mid.x,mid.y,60),p,rank+(road.kind==='path'?60:0));
}
const circulation=new Grid(96),footPatrol=new Grid(64);
const seedGroups=[...trafficSeeds.values()].map(group=>group.sort((a,b)=>b.rank-a.rank||a.p.id.localeCompare(b.p.id)).slice(0,4).map(s=>s.p));
const trafficRoutes=buildTrafficRoutes(routeRecords,seedGroups,{
  atEdge:([x,y])=>!withinBoundary(x,y,4),
  portalClear:(x,y)=>withinBoundary(x,y,5),
  laneClear:p=>{
    const hit=testPose(p.x,p.y,{angle:p.angle,halfLength:1.75,halfWidth:.83},false);
    return !hit||hit===boundaryItem;
  }
});
// An offset inside a bend can place furniture from a neighbouring carriageway in a
// driver's swept path. Clear that generated furniture where the actual lane passes.
function clearTrafficFurniture(){
  const excluded=new Set();
  const envelopes=[vehicleSpec('compact'),{halfLength:2.32,halfWidth:.96},vehicleSpec('firetruck'),vehicleSpec('bus')];
  for(const route of trafficRoutes.values()){
    let capacity=route.availableWidth>=6?3:route.availableWidth>=4.25?2:1;
    const body=envelopes[capacity];
    for(let i=1;i<route.points.length;i++){
      const a=route.points[i-1],b=route.points[i],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);
      if(!len)continue;
      const x=(a[0]+b[0])*.5,y=(a[1]+b[1])*.5,c=dx/len,s=dy/len;
      const longitudinal=len*.5+body.halfLength+.45,lateral=body.halfWidth+.38;
      const w=Math.abs(c)*longitudinal+Math.abs(s)*lateral,h=Math.abs(s)*longitudinal+Math.abs(c)*lateral;
      const box={minX:x-w,minY:y-h,maxX:x+w,maxY:y+h};
      for(const b of terrain.areaBox(box)){
        if(b.type!=='building'||b.minHeight>1.3||b.h<=1.3)continue;
        while(capacity>=0){
          const limit=envelopes[capacity];
          if(!rectShape(x,y,c,s,len*.5+limit.halfLength+.14,limit.halfWidth+.10,b))break;
          capacity--;
        }
        if(capacity<0)break;
      }
      if(capacity<0)break;
      for(const prop of decor.areaBox(box)){
        if(rectCircle(x,y,c,s,longitudinal,lateral,prop.x,prop.y,prop.r))excluded.add(prop);
      }
    }
    if(capacity<0)trafficRoutes.delete(route.id);
    else route.clearance=envelopes[capacity];
  }
  if(!excluded.size)return;
  for(const [key,items] of decor.cells)decor.cells.set(key,items.filter(p=>!excluded.has(p)));
  let retained=0;for(const p of props)if(!excluded.has(p))props[retained++]=p;
  props.length=retained;
}
clearTrafficFurniture();
const detours=indexTrafficDetours(trafficRoutes);
export const trafficAlternatives=detours.alternatives;
for(const route of trafficRoutes.values())circulation.insert(route,bounds(route.points,4));
export const sampleTrafficRoute=(routeId,distance)=>sampleRoadRoute(trafficRoutes.get(routeId),distance);
// Build the swept envelopes of the traffic lanes once, near each travel stop.
// A stationary car needs to clear the rear of a turning bus as well as its centre line.
function lanesNearStop(stop,radius){
  const lanes=[];
  for(const route of circulation.area(stop.x,stop.y,radius)){
    const largest=route.clearance;
    const range=radius+largest.halfLength;
    for(let i=1;i<route.points.length;i++){
      const a=route.points[i-1],b=route.points[i],point=nearestPoint(stop.x,stop.y,a,b);
      if(sq(point[0]-stop.x)+sq(point[1]-stop.y)>range*range)continue;
      const nearest=route.lengths[i-1]+Math.hypot(point[0]-a[0],point[1]-a[1]);
      const from=Math.max(route.lengths[i-1],nearest-range),to=Math.min(route.lengths[i],nearest+range);
      for(let d=from;;d=Math.min(d+1,to)){
        const pose=sampleRoadRoute(route,d);
        lanes.push({...pose,halfLength:largest.halfLength+.75,halfWidth:largest.halfWidth+.43});
        if(d>=to)break;
      }
    }
  }
  return lanes;
}
function parkedVehicleAtStop(stop,i){
  const preferred=sector?parkedFleet[hash(Math.round(midX)+':'+Math.round(midY))%parkedFleet.length]:parkedFleet[i];
  const lanes=lanesNearStop(stop,34);
  const street=closestRoad(stop.x,stop.y,35,s=>s.kind!=='motorway'&&s.kind!=='path');
  const roadAngle=street?.angle??stop.angle;
  function usable(p,type){
    const {halfLength,halfWidth}=vehicleSpec(type);
    const shape={x:p.x,y:p.y,angle:p.angle,halfLength,halfWidth};
    if(testPose(p.x,p.y,shape)||lanes.some(b=>rectAgainstRect(p.x,p.y,p.angle,halfLength,halfWidth,b)))return false;
    if(rectCircle(p.x,p.y,Math.cos(p.angle),Math.sin(p.angle),halfLength,halfWidth,stop.x,stop.y,.65))return false;
    return vehicleDoorways({...p,type},.75).some(d=>!testPose(d.x,d.y,{radius:.43}));
  }
  const coords=[];
  if(stop.park)coords.push({...stop.park,angle:stop.park.angle??stop.angle});
  for(const radius of [3.75,4.35,5.1,6.5,9,13,19,29]){
    for(const offset of [-Math.PI/2,Math.PI/2,Math.PI,0,2.22,-2.22,...Array.from({length:20},(_,k)=>k*Math.PI/10)]){
      const x=stop.x+radius*Math.cos(stop.angle+offset),y=stop.y+radius*Math.sin(stop.angle+offset);
      coords.push({x,y,angle:stop.angle},{x,y,angle:roadAngle},{x,y,angle:roadAngle+Math.PI});
    }
  }
  for(const type of new Set([preferred,'compact'])){
    const v=coords.find(p=>usable(p,type));
    if(v)return {...v,id:stop.key==='sector'?'car-region-'+hash((sector.key||'')+':'+Math.round(midX)+':'+Math.round(midY)):'car-'+stop.key,
      kind:'car',type,color:tintedCars[(i+1)%tintedCars.length],speed:0,moving:false,parked:true};
  }
  return null;
}
export const parkedCars=destinations.map(parkedVehicleAtStop).filter(Boolean);
function addPatrol(patrol,id,name){
  if(patrol.length<4)return;
  const path=pathGeometry(patrol);
  if(path.length<8)return;
  const rec={...path,key:hash(id),id,name,count:Math.max(1,Math.round(path.length/24))};
  footPatrol.insert(rec,bounds(path.path,2));
}
for(const {p} of walkerSeeds.values()){
  const sides=p.road.kind==='path'?[0]:[-1,1];
  for(const side of sides){
    let run=[],number=0;
    const start=2+(p.key%5),end=p.length-2;
    for(let d=start;d<end;d+=3.5){
      const pos=alongPath(p,d),off=(p.road.w*.5+1.9)*side;
      const x=pos.x-Math.sin(pos.angle)*off,y=pos.y+Math.cos(pos.angle)*off;
      if(testPose(x,y,{radius:.28})){
        if(run.length)addPatrol(run,p.id+':'+side+':'+(number++),p.road.name);
        run=[];continue;
      }
      run.push([x,y]);
    }
    if(run.length)addPatrol(run,p.id+':'+side+':'+number,p.road.name);
  }
}
const flocks=['pedestrian','pedestrian','pedestrian','pedestrian','police','pedestrian','pedestrian','firefighter','pedestrian','medic','pedestrian','swat','pedestrian','pedestrian'];
const fleet=['compact','sedan','taxi','police','van','compact','sport','ambulance','sedan','bus','firetruck','van','taxi','swat','compact','sedan','car','bus'];
// Stable global identities let a delayed car keep the same wardrobe and footprint on every client.
export function trafficVehicleAt(originRouteId,index,routeId=originRouteId){
  const route=trafficRoutes.get(originRouteId);
  if(!route||!Number.isSafeInteger(index)||index<0||(route.closed&&index>=route.count))return null;
  const slot=index%route.count,seed=route.key+slot*5;
  // Large vehicles get a scheduled slot on routes wide enough for their envelope.
  const canBus=route.availableWidth>=6&&route.clearance.halfLength>=vehicleSpec('bus').halfLength;
  let type=slot===0&&canBus?'bus':fleet[seed%fleet.length];
  const body=vehicleSpec(type);
  if((type==='bus'&&!canBus)||body.halfWidth*4+.12>route.availableWidth||body.halfWidth>route.clearance.halfWidth||body.halfLength>route.clearance.halfLength)type='compact';
  const cruiseSpeed=(4.7+(route.key%51)*.08)*vehicleSpec(type).cruise;
  const active=routeId===originRouteId?route:trafficRoutes.get(routeId);
  if(!active||(routeId!==originRouteId&&!detours.canReach(originRouteId,routeId,vehicleSpec(type))))return null;
  return {id:'v'+originRouteId+'-'+index,originRouteId,routeId,routeIndex:index,routeLength:active.length,routeLoop:active.closed,
    type,kind:type,color:tintedCars[(route.key+slot)%tintedCars.length],speed:cruiseSpeed,cruiseSpeed,moving:true};
}
export function routeAgents(x,y,radius=140,epochMs=Date.now()){
  const actors=[],cars=[],r2=radius*radius,sec=epochMs*.001;
  const consider=(list,entity)=>{
    const d2=sq(x-entity.x)+sq(y-entity.y);
    if(d2<=r2){entity.distanceSq=d2;list.push(entity);}
  };
  for(const route of circulation.area(x,y,radius)){
    for(let slot=0;slot<route.count;slot++){
      let car=trafficVehicleAt(route.id,slot);
      const elapsed=sec*car.cruiseSpeed+route.key%route.length+slot*route.length/route.count;
      if(!route.closed)car=trafficVehicleAt(route.id,Math.floor(elapsed/route.length)*route.count+slot);
      if(!car)continue;
      const routeDistance=wrap(elapsed,route.length),p=sampleRoadRoute(route,routeDistance);
      if(sq(x-p.x)+sq(y-p.y)>r2)continue;
      const spec=vehicleSpec(car.type);
      if(testPose(p.x,p.y,{angle:p.angle,halfLength:spec.halfLength,halfWidth:spec.halfWidth},false))continue;
      consider(cars,{...p,...car,routeDistance});
    }
  }
  for(const route of footPatrol.area(x,y,radius)){
    const speed=.85+(route.key%67)*.009,period=2*route.length;
    for(let i=0;i<route.count;i++){
      const d=wrap(sec*speed+route.key%period+i*period/route.count,period),ret=d>route.length;
      const pos=alongPath(route,ret?period-d:d);
      if(ret)pos.angle+=Math.PI;
      const n=(route.key+i*3)>>>0, type=flocks[n%flocks.length];
      consider(actors,{...pos,id:'n'+route.id+'-'+i,type,kind:type,variant:n%8,color:tintedPeds[n%tintedPeds.length],speed,moving:true,walk:sec*speed*4.6+i});
    }
  }
  for(const v of parkedCars)consider(cars,{...v});
  return {actors:actors.sort((a,b)=>a.distanceSq-b.distanceSq).slice(0,32),cars:cars.sort((a,b)=>a.distanceSq-b.distanceSq).slice(0,24)};
}

const mapStreets=new Grid(112),mapParks=new Grid(160);
for(const park of green)mapParks.insert({...park},bounds(park.poly));
for(const s of streetList)mapStreets.insert({road:s},bounds(s.path,s.w*.5+2));
const mapPalette={land:'#272838',inside:'#37384a',building:'#655c73',industrial:'#645b66',commercial:'#655f7e',water:'#386778',
  path:'#797986',residential:'#898494',secondary:'#a99bac',primary:'#ccb5a4',motorway:'#988e9d'};
function makeMapCanvas(w,h){
  if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(w,h);
  const c=document.createElement('canvas');c.width=w;c.height=h;return c;
}
function traceRing(ctx,pts){
  if(!pts?.length)return;
  ctx.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);
  ctx.closePath();
}
function drawSolid(ctx,b,color){
  ctx.beginPath();traceRing(ctx,b.poly);
  for(const h of b.holes||[])traceRing(ctx,h);
  ctx.fillStyle=color;ctx.fill('evenodd');
}
function drawBaseMap(ctx,x,y,radius,scale,full){
  ctx.beginPath();traceRing(ctx,boundary);ctx.fillStyle=mapPalette.inside;ctx.fill();
  ctx.save();ctx.clip();
  for(const park of mapParks.area(x,y,radius))drawSolid(ctx,park,'#4b6b62');
  const shapes=terrain.area(x,y,radius),paths=mapStreets.area(x,y,radius);
  for(const s of shapes){
    if(s.type==='water')drawSolid(ctx,s,mapPalette.water);
    else if(s.type==='building'&&!s.minHeight)drawSolid(ctx,s,mapPalette[s.kind]||mapPalette.building);
  }
  ctx.lineCap='round';ctx.lineJoin='round';
  for(const k of ['path','residential','secondary','motorway','primary']){
    ctx.strokeStyle=mapPalette[k];ctx.globalAlpha=k==='path'?.58:1;
    if(full&&k==='path')continue;
    for(const {road} of paths){
      if(road.kind!==k)continue;
      ctx.lineWidth=Math.max(full?(k==='primary'?.95:.33)/scale:.85/scale,road.w*.69);
      ctx.beginPath();ctx.moveTo(...road.path[0]);
      for(let i=1;i<road.path.length;i++)ctx.lineTo(...road.path[i]);
      ctx.stroke();
    }
  }
  ctx.globalAlpha=1;ctx.restore();
}
let atlas=null,atlasRatio=0;
function ensureAtlas(){
  if(atlas)return;
  const w=2048,dx=landBounds.maxX-landBounds.minX,dy=landBounds.maxY-landBounds.minY;
  atlasRatio=w/dx;atlas=makeMapCanvas(w,Math.ceil(dy*atlasRatio));
  const c=atlas.getContext('2d');c.fillStyle=mapPalette.land;c.fillRect(0,0,atlas.width,atlas.height);
  c.setTransform(atlasRatio,0,0,atlasRatio,-landBounds.minX*atlasRatio,-landBounds.minY*atlasRatio);
  drawBaseMap(c,(landBounds.minX+landBounds.maxX)/2,(landBounds.minY+landBounds.maxY)/2,Math.max(dx,dy),atlasRatio,true);
}
function mapView(w,h,player,full){
  if(full){
    const mx=landBounds.maxX-landBounds.minX,my=landBounds.maxY-landBounds.minY;
    const scale=Math.min((w-16)/mx,(h-22)/my);
    return {x:(landBounds.minX+landBounds.maxX)*.5,y:(landBounds.minY+landBounds.maxY)*.5,scale};
  }
  return {x:player.x,y:player.y,scale:Math.max(w/275,h/175)};
}
export function paintMap(canvas,player,{full=false,peers=[],vehicles=[],pickups=[],dpr=Math.min(2,globalThis.devicePixelRatio||1)}={}){
  if(!canvas||!player)return;
  const rect=canvas.getBoundingClientRect?.(),w=Math.round(rect?.width||canvas.width),h=Math.round(rect?.height||canvas.height);
  if(!w||!h)return;
  const outW=Math.round(w*dpr),outH=Math.round(h*dpr);
  if(canvas.width!==outW||canvas.height!==outH){canvas.width=outW;canvas.height=outH;}
  const c=canvas.getContext('2d');const v=mapView(w,h,player,full);
  const ux=w*.5-v.x*v.scale,uy=h*.5-v.y*v.scale,px=x=>x*v.scale+ux,py=y=>y*v.scale+uy;
  c.setTransform(dpr,0,0,dpr,0,0);
  c.fillStyle=mapPalette.land;c.fillRect(0,0,w,h);
  c.save();c.translate(ux,uy);c.scale(v.scale,v.scale);
  if(full){
    ensureAtlas();c.drawImage(atlas,landBounds.minX,landBounds.minY,atlas.width/atlasRatio,atlas.height/atlasRatio);
  }else drawBaseMap(c,v.x,v.y,Math.max(w,h)/(2*v.scale)+20,v.scale,false);
  c.restore();
  const circle=(x,y,r,color,stroke)=>{
    c.beginPath();c.arc(x,y,r,0,TAU);c.fillStyle=color;c.fill();
    if(stroke){c.strokeStyle=stroke;c.lineWidth=1.7;c.stroke();}
  };
  // Keep pickup markers at a fixed screen size and below place names and players.
  for(const drop of pickups){
    const x=px(drop.x),y=py(drop.y),r=full?3.6:4.8;
    if(x<-r||x>w+r||y<-r||y>h+r)continue;
    c.beginPath();c.moveTo(x,y-r);c.lineTo(x+r,y);c.lineTo(x,y+r);c.lineTo(x-r,y);c.closePath();
    c.fillStyle='#f4ca83';c.fill();c.strokeStyle='#403344';c.lineWidth=1.4;c.stroke();
    c.fillStyle='#42333a';c.fillRect(x-1,y-1,2,2);
  }
  if(full){
    const labels=destinations.filter(d=>['etoile','maillot','neuilly','arche','concorde','louvre','sector'].includes(d.key));
    c.font='600 '+(w>450?11:9)+'px system-ui';c.textBaseline='middle';
    for(const d of labels){
      const x=px(d.x),y=py(d.y),j=['etoile','neuilly','louvre'].includes(d.key)?15:-14;
      circle(x,y,3.2,'#ffd49e','#3e3442');
      const label=d.key==='sector'?d.label:d.key==='arche'?'La Défense':d.key==='etoile'?'Étoile':d.key==='maillot'?'Maillot':d.key==='neuilly'?'Neuilly':d.key==='concorde'?'Concorde':'Louvre';
      const width=c.measureText(label).width;let lx=clamp(x-width/2,3,w-width-3);
      c.fillStyle='#2a2633e8';c.fillRect(lx-3,y+j-7,width+6,14);c.fillStyle='#fff0d6';c.fillText(label,lx,y+j);
    }
  } else {
    for(const vcar of vehicles){
      const x=px(vcar.x),y=py(vcar.y);
      if(x<1||x>w-1||y<1||y>h-1)continue;
      c.fillStyle='#f3ccb0';c.save();c.translate(x,y);c.rotate(vcar.angle||0);c.fillRect(-2,-1,4,2);c.restore();
    }
  }
  for(const p of peers){
    const x=px(p.x),y=py(p.y);
    if(x>=0&&x<=w&&y>=0&&y<=h)circle(x,y,3.5,'#ff93ba','#38283b');
  }
  c.save();c.translate(px(player.x),py(player.y));c.rotate(player.angle||0);c.beginPath();c.moveTo(7,0);c.lineTo(-5,5);c.lineTo(-2,0);c.lineTo(-5,-5);c.closePath();
  c.fillStyle='#99ffdc';c.fill();c.strokeStyle='#273332';c.lineWidth=1.7;c.stroke();c.restore();
}
