import { drawDepot, drawFieldCrate } from './depot-render';
import { FACE_ORDER, SIDE, facePoint, pointOnFace, prismOutcropsIn, type Face, type Focus, type Point } from './planet';
import { orbitalRelief, paintRockRows, paintRockTile, reliefHeight, type OrbitalRelief } from './planet-orbit-detail';
import { drawGlobeMesh } from './planet-globe';
import { convoyPoint, type Convoy } from './logistics';

import { drawSurveySurface } from './planet-survey';

import { paintCliff, paintSurface } from './rock-materials';

type XY = { x: number; y: number };
export type PlanetTile = {
  point: Point; u: number; v: number; depth: number;
  ore: string | null; status: 'solid' | 'air' | 'unknown';
  territory: 'home' | 'owned' | 'foreign' | null;
};
export type PlanetRegion = {
  face: Face; u: number; v: number; depth: number; originU: number; originV: number; size: number; tiles: PlanetTile[];
};
export type PlanetMachine = { id: string; label: string; point: Point; kind?: string; hp?: number; maxHp?: number; docked?: boolean; heading?:number; cargoColor?:string|null };
export type ConvoyFleet = {base:Point; convoys:readonly Convoy[]};
export type PlanetRelay = { id: string; name: string; focus: Focus; color?: string };
type FaceHit = { face:Face; origin:XY; du:XY; dv:XY; rise:XY; relief:OrbitalRelief; mesh:Float32Array|null; dir:Point };
type TileHit = { tile: PlanetTile; points: XY[] };
export type PlanetScene = { faces: FaceHit[]; tiles: TileHit[]; relays: { at: XY; relay: PlanetRelay }[] };
export type Orbit = { yaw: number; pitch: number; zoom: number; centerU?: number; centerV?: number };
export type Survey = { focus: Focus; span: number };
type Ctx = CanvasRenderingContext2D;

const SIZE = 512;
const textures = new Map<Face, HTMLCanvasElement>();
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
const lerp = (a: number, b: number, t: number) => a + (b-a)*t;
function hash(x: number, y: number, s: number) {
  let i = Math.imul(x + s * 193, 374761393) + Math.imul(y - s * 71, 668265263);
  i = Math.imul(i ^ (i >>> 13), 1274126177);
  return ((i ^ (i >>> 16)) >>> 0) / 4294967296;
}
type Bake = { face:Face; canvas:HTMLCanvasElement; row:number };
const bakes:Bake[]=[];
const textureListeners=new Set<()=>void>();
let bakeScheduled=false;
export function subscribeOrbitTextures(listener:()=>void) {
  textureListeners.add(listener);
  return ()=>{textureListeners.delete(listener);};
}
function scheduleBake() {
  if(bakeScheduled||!bakes.length)return;
  bakeScheduled=true;
  const next=()=>{
    bakeScheduled=false;
    const job=bakes[0],rows=Math.min(8,SIZE-job.row);
    paintRockRows(job.canvas.getContext('2d')!,job.face,0,0,SIDE,SIZE,job.row,rows);
    job.row+=rows;
    if(job.row===SIZE){
      textures.set(job.face,job.canvas);bakes.shift();
      for(const listener of textureListeners)listener();
    }
    scheduleBake();
  };
  if(typeof window==='undefined')return;
  if('requestIdleCallback' in window)window.requestIdleCallback(next,{timeout:180});
  else setTimeout(next,16);
}
function texture(face:Face) {
  const cached=textures.get(face);
  if(cached)return cached;
  const canvas=document.createElement('canvas'),initialSize=128;
  canvas.width=initialSize;canvas.height=initialSize;
  paintRockTile(canvas.getContext('2d')!,face,0,0,SIDE,initialSize);
  textures.set(face,canvas);
  const fine=document.createElement('canvas');fine.width=SIZE;fine.height=SIZE;
  bakes.push({face,canvas:fine,row:0});scheduleBake();
  return canvas;
}
function poly(ctx:Ctx,points:XY[], fill?:string|CanvasGradient,stroke?:string,width=1){
  ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);
  for(const p of points.slice(1))ctx.lineTo(p.x,p.y);
  ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill()}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}
}
function inside(p:XY,pts:XY[]){
  let odd=false;
  for(let i=0,j=pts.length-1;i<pts.length;j=i++){
    const a=pts[i],b=pts[j];
    if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)odd=!odd;
  }
  return odd;
}
function normal(face:Face):Point{
  return {top:{x:0,y:1,z:0},bottom:{x:0,y:-1,z:0},north:{x:0,y:0,z:-1},south:{x:0,y:0,z:1},east:{x:1,y:0,z:0},west:{x:-1,y:0,z:0}}[face];
}
function project(p:Point, cam:Orbit, cx:number, cy:number, scale:number):XY{
  const x=p.x/(SIDE-1)*2-1,y=p.y/(SIDE-1)*2-1,z=p.z/(SIDE-1)*2-1;
  const sy=Math.sin(cam.yaw),cyaw=Math.cos(cam.yaw),sp=Math.sin(cam.pitch),cp=Math.cos(cam.pitch);
  return {x:cx+scale*(x*cyaw-z*sy),y:cy-scale*(y*cp-(x*sy+z*cyaw)*sp)};
}
const emptyScene = ():PlanetScene=>({faces:[],tiles:[],relays:[]});
function atmosphere(ctx:Ctx,w:number,h:number) {
  const bg=ctx.createRadialGradient(w*.47,h*.42,0,w*.50,h*.53,Math.max(w,h)*.8);
  bg.addColorStop(0,'#322b30');bg.addColorStop(.42,'#1b191f');bg.addColorStop(1,'#100f15');
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  const count=Math.min(310,Math.ceil(w*h/3000));
  for(let i=0;i<count;i++){
    const x=hash(i,1,42)*w,y=hash(i,7,43)*h;
    const bright=hash(i,4,8);
    ctx.fillStyle=bright>.91?'#b59d8290':'#c8bcb030';
    ctx.fillRect(x,y,bright>.91?1.5:.8,bright>.91?1.5:.8);
  }
}
function relayGlyph(ctx:Ctx,p:XY,relay:PlanetRelay,small:boolean){
  const r=small?3.6:5;
  ctx.save();ctx.translate(p.x,p.y);ctx.beginPath();ctx.arc(0,0,r+3.5,0,Math.PI*2);
  ctx.lineWidth=1;ctx.strokeStyle='#f7d79e88';ctx.fillStyle='#20191a';ctx.fill();ctx.stroke();
  poly(ctx,[{x:0,y:-r},{x:r,y:0},{x:0,y:r},{x:-r,y:0}],relay.color||'#ffcf88');
  ctx.restore();
}
let orbitalBackdrop:HTMLCanvasElement|null=null;
function drawOrbitalBackdrop(ctx:Ctx,w:number,h:number,cx:number,cy:number,scale:number) {
  const width=Math.ceil(w),height=Math.ceil(h);
  if(!orbitalBackdrop||orbitalBackdrop.width!==width||orbitalBackdrop.height!==height){
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const sky=canvas.getContext('2d')!;
    atmosphere(sky,w,h);
    const radius=Math.min(w*.29,h*.27);
    const halo=sky.createRadialGradient(cx,cy,radius*.55,cx,cy,radius*2.15);
    halo.addColorStop(0,'#b888602c');halo.addColorStop(.71,'#92725b17');halo.addColorStop(1,'#b98c6a00');
    sky.fillStyle=halo;sky.fillRect(0,0,w,h);
    orbitalBackdrop=canvas;
  }
  ctx.drawImage(orbitalBackdrop,0,0,w,h);
  ctx.save();ctx.translate(cx,cy);ctx.rotate(-.31);ctx.strokeStyle='#bf9f7738';ctx.lineWidth=.7;
  ctx.setLineDash([2,8]);ctx.beginPath();ctx.ellipse(0,0,scale*1.91,scale*1.27,0,0,Math.PI*2);ctx.stroke();ctx.restore();
}
function screenMesh(origin:XY,du:XY,dv:XY,rise:XY,relief:OrbitalRelief) {
  const n=relief.segments,mesh=new Float32Array((n+1)**2*2);
  for(let y=0;y<=n;y++)for(let x=0;x<=n;x++){
    const i=y*(n+1)+x,h=relief.heights[i],u=x/n,v=y/n;
    mesh[i*2]=origin.x+du.x*u+dv.x*v+rise.x*h;
    mesh[i*2+1]=origin.y+du.y*u+dv.y*v+rise.y*h;
  }
  return mesh;
}
export function drawOrbit(ctx:Ctx,w:number,h:number,cam:Orbit,relays:PlanetRelay[],hover?:Face) {
  const scene=emptyScene();
  const cx=w*.5,cy=h*.48,scale=Math.min(w*.29,h*.27)*cam.zoom;
  const sy=Math.sin(cam.yaw),cyaw=Math.cos(cam.yaw),sp=Math.sin(cam.pitch),cp=Math.cos(cam.pitch);
  const dir={x:sy*cp,y:sp,z:cyaw*cp};
  drawOrbitalBackdrop(ctx,w,h,cx,cy,scale);
  const displaced=drawGlobeMesh(ctx,w,h,cam,cx,cy,scale,texture);
  for(const face of FACE_ORDER){
    const n=normal(face),view=n.x*dir.x+n.y*dir.y+n.z*dir.z;
    if(view<.002)continue;
    const corners=[[0,0],[SIDE-1,0],[SIDE-1,SIDE-1],[0,SIDE-1]].map(([u,v])=>project(facePoint(face,u,v,0),cam,cx,cy,scale));
    const [o,a,,b]=corners,du={x:a.x-o.x,y:a.y-o.y},dv={x:b.x-o.x,y:b.y-o.y};
    if(!displaced){
      ctx.save();ctx.transform(du.x,du.y,dv.x,dv.y,o.x,o.y);
      ctx.imageSmoothingEnabled=true;ctx.drawImage(texture(face),0,0,1,1);ctx.restore();
      const exposure=clamp(n.x*(-.40)+n.y*.76+n.z*.49,-.70,1);
      poly(ctx,corners,'rgba(15,13,23,'+(.25-exposure*.23)+')');
    }
    const rise=displaced?{x:scale*(n.x*cyaw-n.z*sy),y:-scale*(n.y*cp-(n.x*sy+n.z*cyaw)*sp)}:{x:0,y:0};
    const relief=orbitalRelief(face),mesh=displaced?screenMesh(o,du,dv,rise,relief):null;
    poly(ctx,corners,hover===face?'#f8d1a710':undefined,hover===face?'#efc59dd2':'#edcba64a',.85);
    scene.faces.push({face,origin:o,du,dv,rise,relief,mesh,dir});
    for(const relay of relays){
      if(relay.focus.face!==face)continue;
      const u=relay.focus.u/(SIDE-1),v=relay.focus.v/(SIDE-1),lift=reliefHeight(relief,u,v);
      const at={x:o.x+du.x*u+dv.x*v+rise.x*lift,y:o.y+du.y*u+dv.y*v+rise.y*lift};
      relayGlyph(ctx,at,relay,true);scene.relays.push({at,relay});
    }
  }
  return scene;
}
function inTriangle(mesh:Float32Array,p:XY,a:number,b:number,c:number) {
  const ax=mesh[2*a],ay=mesh[2*a+1],bx=mesh[2*b]-ax,by=mesh[2*b+1]-ay;
  const cx=mesh[2*c]-ax,cy=mesh[2*c+1]-ay,px=p.x-ax,py=p.y-ay;
  const determinant=bx*cy-by*cx;
  if(Math.abs(determinant)<1e-5)return null;
  const beta=(px*cy-py*cx)/determinant,gamma=(bx*py-by*px)/determinant;
  if(beta<-.00001||gamma<-.00001||beta+gamma>1.00001)return null;
  return [1-beta-gamma,beta,gamma];
}
export function pickOrbit(scene:PlanetScene,p:XY):Focus|null {
  let best:Focus|null=null,nearest=-Infinity;
  for(const {face,origin,du,dv,mesh,relief,dir} of scene.faces){
    const x=p.x-origin.x,y=p.y-origin.y,d=du.x*dv.y-du.y*dv.x;
    if(Math.abs(d)<1e-6)continue;
    const flatU=(x*dv.y-y*dv.x)/d,flatV=(y*du.x-x*du.y)/d;
    if(!mesh){
      if(flatU>=0&&flatV>=0&&flatU<=1&&flatV<=1)return {face,u:Math.round(flatU*(SIDE-1)),v:Math.round(flatV*(SIDE-1)),depth:0};
      continue;
    }
    // Preserve exact block coordinates along the corrugated surface, including
    // grazing angles where two projected mountain slopes partially overlap.
    const n=relief.segments,rows=n+1,normalDir=normal(face);
    for(let j=0;j<n;j++)for(let i=0;i<n;i++){
      const a=j*rows+i,b=a+1,c=a+rows,e=c+1;
      for(let side=0;side<2;side++){
        const ids=side===0?[a,b,c]:[e,c,b],weights=inTriangle(mesh,p,ids[0],ids[1],ids[2]);
        if(!weights)continue;
        let u=0,v=0,h=0;
        for(let k=0;k<3;k++){u+=(ids[k]%rows)*weights[k]/n;v+=Math.floor(ids[k]/rows)*weights[k]/n;h+=relief.heights[ids[k]]*weights[k];}
        const world=facePoint(face,u*(SIDE-1),v*(SIDE-1),0);
        const depth=(world.x/(SIDE-1)*2-1+h*normalDir.x)*dir.x+(world.y/(SIDE-1)*2-1+h*normalDir.y)*dir.y+(world.z/(SIDE-1)*2-1+h*normalDir.z)*dir.z;
        if(depth>nearest){nearest=depth;best={face,u:clamp(Math.round(u*(SIDE-1)),0,SIDE-1),v:clamp(Math.round(v*(SIDE-1)),0,SIDE-1),depth:0};}
      }
    }
  }
  return best;
}
export function surveyFocus(s:Survey,p:XY,w:number,h:number):Focus {
  const unit=s.span/Math.min(w,h);
  const u=clamp(s.focus.u+(p.x-w/2)*unit,0,SIDE-1), v=clamp(s.focus.v+(p.y-h/2)*unit,0,SIDE-1);
  if (s.span <= 1600) {
    const radius=unit*8;
    const target=prismOutcropsIn(s.focus.face,u-radius,v-radius,u+radius,v+radius)
      .find(field => Math.hypot(field.u-u,field.v-v) <= radius);
    if (target) return {face:s.focus.face,u:target.u,v:target.v,depth:0};
  }
  return {face:s.focus.face,u:Math.round(u),v:Math.round(v),depth:0};
}
export function drawSurvey(ctx:Ctx,w:number,h:number,s:Survey,relays:PlanetRelay[]){
  const scene = emptyScene();
  const unit = Math.min(w, h) / s.span;
  const ox = w / 2 - s.focus.u * unit, oy = h / 2 - s.focus.v * unit;
  if (ox > 0 || oy > 0 || ox + SIDE * unit < w || oy + SIDE * unit < h) atmosphere(ctx, w, h);
  drawSurveySurface(ctx, w, h, s, texture(s.focus.face));

  const gap = Math.max(8, 2 ** Math.ceil(Math.log2(48 / unit)));
  const minX = Math.max(0, ox), minY = Math.max(0, oy);
  const maxX = Math.min(w, ox + SIDE * unit), maxY = Math.min(h, oy + SIDE * unit);
  const firstU = Math.max(0, Math.ceil(-ox / (unit * gap)) * gap);
  const firstV = Math.max(0, Math.ceil(-oy / (unit * gap)) * gap);
  ctx.save();
  for (const major of [false, true]) {
    ctx.strokeStyle = major ? '#f5d7ae38' : '#f8dec31b';
    ctx.lineWidth = major ? .8 : .55;
    ctx.beginPath();
    for (let u = firstU; u <= SIDE && ox + u * unit <= maxX; u += gap) {
      if ((u % (gap * 4) === 0) !== major) continue;
      const x = ox + u * unit;
      ctx.moveTo(x, minY); ctx.lineTo(x, maxY);
    }
    for (let v = firstV; v <= SIDE && oy + v * unit <= maxY; v += gap) {
      if ((v % (gap * 4) === 0) !== major) continue;
      const y = oy + v * unit;
      ctx.moveTo(minX, y); ctx.lineTo(maxX, y);
    }
    ctx.stroke();
  }
  // The survey records geological traces. Only the live local view shows
  // whether any of this outcrop's individually contested voxels remain.
  if (s.span<=1600) {
    const signatures=prismOutcropsIn(s.focus.face,-ox/unit,-oy/unit,(w-ox)/unit,(h-oy)/unit);
    for (const field of signatures) {
      const x=ox+field.u*unit,y=oy+field.v*unit;
      ctx.save();ctx.translate(x,y);ctx.rotate(field.angle);
      const half=Math.max(4.6,field.length*unit), breadth=Math.max(1.9,field.width*unit);
      ctx.fillStyle='#192d31bf';ctx.beginPath();ctx.ellipse(.6,1,half+2,breadth+2,0,0,Math.PI*2);ctx.fill();
      poly(ctx,[{x:-half,y:.5},{x:-half*.48,y:-breadth*.8},{x:half*.17,y:-breadth},{x:half,y:-.3},
        {x:half*.28,y:breadth*.71},{x:-half*.72,y:breadth}], '#70c6af');
      stroke(ctx,[{x:-half*.68,y:0},{x:-half*.26,y:-breadth*.48},{x:half*.49,y:-breadth*.17}],'#daffdf',1.15);
      ctx.restore();
    }
    if (signatures.length && s.span<=480) {
      const nearest=signatures.reduce((a,b)=>Math.hypot(a.u-s.focus.u,a.v-s.focus.v)<=Math.hypot(b.u-s.focus.u,b.v-s.focus.v)?a:b);
      const x=ox+nearest.u*unit,y=oy+nearest.v*unit;
      ctx.font='600 10px ui-monospace, monospace';ctx.textAlign='center';ctx.textBaseline='middle';
      const text='Trace de prisme', width=ctx.measureText(text).width+14;
      const left=clamp(x-width/2,1,Math.max(1,w-width-1)),top=clamp(y-28,1,Math.max(1,h-19));
      ctx.fillStyle='#1c292bde';ctx.fillRect(left,top,width,17);
      ctx.fillStyle='#c5efdc';ctx.fillText(text,left+width/2,top+8.5);
    }
  }
  for (const relay of relays.filter(r => r.focus.face === s.focus.face)) {
    const at = {x:ox + relay.focus.u * unit, y:oy + relay.focus.v * unit};
    if (at.x < 0 || at.x > w || at.y < 0 || at.y > h) continue;
    relayGlyph(ctx, at, relay, false);
    scene.relays.push({ at, relay });
    ctx.font = '600 10px ui-monospace, monospace';
    const labelWidth = ctx.measureText(relay.name).width + 14;
    const left = Math.min(Math.max(2, at.x + 12), Math.max(2, w - labelWidth - 2));
    const top = Math.min(Math.max(2, at.y - 22), Math.max(2, h - 19));
    ctx.fillStyle = '#241f25dd';
    ctx.fillRect(left, top, labelWidth, 17);
    ctx.fillStyle = '#e9d4ac';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(relay.name, left + 7, top + 8.5);
  }
  ctx.restore();
  return scene;
}

const oreColors: Record<string, string> = {
  ferrite: '#c0a796', cuivre: '#f0ae74', titane: '#cbcaef', prisme: '#9eedd5',
};
const edges = [
  { du: 0, dv: -1, i: 0, j: 1 },
  { du: 1, dv: 0, i: 1, j: 2 },
  { du: 0, dv: 1, i: 2, j: 3 },
  { du: -1, dv: 0, i: 3, j: 0 },
];

function localCamera(w: number, h: number, region: PlanetRegion, cam: Orbit) {
  const unit = Math.min(w / (region.size * 1.10), h / (region.size * .89)) * cam.zoom;
  const sp = Math.sin(cam.pitch), cp = Math.cos(cam.pitch);
  const sy = Math.sin(cam.yaw), cyaw = Math.cos(cam.yaw);
  const cu = cam.centerU ?? region.u, cv = cam.centerV ?? region.v;
  const pos = (u: number, v: number, depth: number) => {
    const x = u - cu, y = v - cv, d = clamp(depth - region.depth, -4, 6);
    return {
      x: w * .5 + (x * cyaw - y * sy) * unit,
      y: h * .48 + (x * sy + y * cyaw) * sp * unit + d * cp * unit,
    };
  };
  return { pos, unit, sy, cyaw, cp, face:region.face };
}

type LocalCamera = ReturnType<typeof localCamera>;
const tileId = (u: number, v: number) => v * SIDE + u;

/** Only personal trips use live positions. Nearby strangers remain visible through the regional snapshot. */
export function fleetInView(region:PlanetRegion,cam:Orbit,w:number,h:number,fleet:ConvoyFleet,now:number) {
  const projection=localCamera(w,h,region,cam);
  const machines:PlanetMachine[]=[];
  let active=false,moving=false;
  for(const convoy of fleet.convoys) {
    const length=convoy.point?Math.hypot(convoy.point.x-fleet.base.x,convoy.point.y-fleet.base.y,convoy.point.z-fleet.base.z):0;
    const onRoute=(convoy.phase==='outbound' || convoy.phase==='returning') && convoy.due>now && length>0;
    active ||= onRoute;
    const point=convoyPoint(convoy,fleet.base,now,true) ?? fleet.base;
    const at=pointOnFace(region.face,point);
    const ahead=onRoute?convoyPoint(convoy,fleet.base,Math.min(now+180,convoy.due),true):null;
    const next=ahead && pointOnFace(region.face,ahead);
    const heading=next?Math.atan2(next.v-at.v,next.u-at.u):0;
    const docked=length===0 || convoy.phase==='idle' || convoy.phase==='unloading';
    if(pointOnFace(region.face,fleet.base).depth===0) {
      // Separate parking bays, with a continuous approach for each truck.
      const along=Math.min(1,Math.max(0,(now-convoy.started)/Math.max(1,convoy.due-convoy.started)));
      const progress=convoy.phase==='returning'?1-along:along;
      const dock=docked?1:Math.max(0,1-progress*Math.max(1,length/3));
      at.u+=(1.6+Math.floor((convoy.id-1)/3)*1.16)*dock;
      at.v+=((convoy.id-1)%3-1)*1.13*dock;
    }
    const screen=projection.pos(at.u,at.v,at.depth),margin=projection.unit;
    if(screen.x < -margin || screen.x > w+margin || screen.y < -margin || screen.y > h+margin) continue;
    const cell=region.tiles.find(t=>t.u===Math.round(at.u) && t.v===Math.round(at.v));
    const atSurfaceDock=docked && region.depth===0 && at.depth===0;
    if(!cell || cell.status==='unknown' || (!atSurfaceDock && Math.abs(cell.depth-at.depth)>1)) continue;
    moving ||= onRoute;
    const cargo=(['prisme','titane','cuivre','ferrite'] as const).find(ore=>convoy.cargo[ore]>0);
    machines.push({id:'convoy-'+convoy.id,point:facePoint(region.face,at.u,at.v,at.depth),kind:'hauler',
      label:'Transporteur '+convoy.id,hp:100,maxHp:100,docked:atSurfaceDock,heading,cargoColor:cargo?oreColors[cargo]:null});
  }
  return {machines,active,moving};
}

function stroke(ctx: Ctx, points: XY[], color: string, width: number) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function localModel(ctx: Ctx, tile: PlanetTile, camera: LocalCamera, heading=0) {
  const { pos, unit, cp, sy, cyaw } = camera;
  const sin=Math.sin(heading),cos=Math.cos(heading);
  const facingU=sy*cos+cyaw*sin,facingV=cyaw*cos-sy*sin;
  const point = (u: number, v: number, z: number) => {
    const p = pos(tile.u + u*cos-v*sin, tile.v + u*sin+v*cos, tile.depth);
    return { x: p.x, y: p.y - z * unit * cp };
  };
  function box(u: number, v: number, spanU: number, spanV: number, bottom: number,
    height: number, top: string, left: string, right: string) {
    const xy = [[u,v], [u+spanU,v], [u+spanU,v+spanV], [u,v+spanV]];
    const base = xy.map(([x,y]) => point(x,y,bottom));
    const roof = xy.map(([x,y]) => point(x,y,bottom+height));
    for (const e of edges) {
      if (e.du * facingU + e.dv * facingV <= 0) continue;
      poly(ctx, [roof[e.i], roof[e.j], base[e.j], base[e.i]], e.du ? right : left);
    }
    poly(ctx, roof, top);
  }
  return { point, box, facingV };
}

function drawSurfaceCrystals(ctx:Ctx,tile:PlanetTile,camera:LocalCamera,scene:PlanetScene) {
  const {point}=localModel(ctx,tile,camera);
  const {unit}=camera;
  const oreTint=['#b6eccd','#dcecc6','#b4e6d4'];
  const phase=hash(tile.u,tile.v,783)*Math.PI*2;
  const spikes=[
    {u:0,v:0,height:.39+hash(tile.u,tile.v,494)*.48,width:.107+hash(tile.u,tile.v,190)*.035,lean:.068},
    {u:.24*Math.cos(phase),v:.24*Math.sin(phase),height:.27+hash(tile.u,tile.v,902)*.24,width:.102,lean:.16},
    {u:-.23*Math.cos(phase+.35),v:-.23*Math.sin(phase+.35),height:.19+hash(tile.u,tile.v,271)*.19,width:.075,lean:-.12},
  ];
  const c=camera.pos(tile.u,tile.v,tile.depth);
  ctx.beginPath();ctx.ellipse(c.x+unit*.14,c.y+unit*.050,unit*.33,unit*.115,-.24,0,Math.PI*2);
  ctx.fillStyle='#202f334a';ctx.fill();
  spikes.sort((a,b)=>(a.u-b.u)*camera.sy+(a.v-b.v)*camera.cyaw);
  for (const spike of spikes) {
    const {u,v,height,width,lean}=spike;
    const dx=Math.cos(phase)*lean, dy=Math.sin(phase)*lean;
    const foot=point(u,v,.010), shoulder=point(u+dx*.68,v+dy*.68,height*.72), tip=point(u+dx,v+dy,height);
    const radius=unit*width;
    const a={x:foot.x-radius*.81,y:foot.y}, b={x:foot.x-radius*.08,y:foot.y+radius*.33};
    const e={x:foot.x+radius*.87,y:foot.y-radius*.08};
    const left={x:shoulder.x-radius,y:shoulder.y},ridge={x:shoulder.x-radius*.15,y:shoulder.y+radius*.52};
    const right={x:shoulder.x+radius,y:shoulder.y-radius*.13};
    poly(ctx,[a,left,ridge,b],'#8ad7ba');
    poly(ctx,[b,ridge,right,e],'#397b80');
    poly(ctx,[left,tip,ridge],oreTint[Math.floor(phase*1.3)%oreTint.length]);
    poly(ctx,[ridge,tip,right],'#80abae');
    if(unit>18) {
      const between=(a:XY,b:XY,t:number)=>({x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t)});
      for(const band of [.18,.30,.57]) {
        stroke(ctx,[between(a,left,band),between(b,ridge,band+.03),between(e,right,band)],'#d9e7d077',.65);
      }
      stroke(ctx,[a,left,tip],'#efffdc',Math.max(.65,unit*.018));
      stroke(ctx,[between(b,ridge,.12),between(b,ridge,.66)],'#bdf2d4c4',Math.max(.5,unit*.012));
    }
    scene.tiles.push({tile,points:[a,left,tip,right,e,b]});
  }
}

function drawMachine(ctx: Ctx, tile: PlanetTile, camera: LocalCamera, machine: PlanetMachine) {
  const { unit } = camera;
  const center = camera.pos(tile.u,tile.v,tile.depth);
  const { point, box, facingV } = localModel(ctx,tile,camera,machine.heading);
  const health = machine.maxHp ? clamp((machine.hp ?? machine.maxHp) / machine.maxHp, 0, 1) : 1;
  const squad = machine.kind === 'squad';
  const paint = health === 0 ? '#79706b' : squad ? '#bc7868' : '#d5a85f';
  const shade = health === 0 ? '#574d4d' : squad ? '#724a49' : '#8d633f';
  ctx.fillStyle = '#211b2785';
  ctx.beginPath();
  ctx.ellipse(center.x + unit*.08, center.y + unit*.09, unit*.58, unit*.27, 0, 0, TAU);
  ctx.fill();
  if (machine.kind==='hauler') {
    const wheels = facingV > 0 ? [-.33,.22] : [.22,-.33];
    for(const v of wheels) for(const u of [-.47,-.12,.26]) {
      box(u,v,.18,.14,0,.18,'#746965','#423d44','#312f36');
    }
    box(-.52,-.27,.99,.53,.14,.10,'#968a73','#665d56','#544d4b');
    box(.20,-.24,.32,.48,.24,.24,'#a2c4b1','#547b73','#45636b');
    box(.23,-.255,.22,.52,.35,.09,'#7a9fa0','#466b6d','#314f58');
    box(.17,-.27,.37,.54,.48,.05,'#d7d4a5','#958f74','#938c6a');
    box(-.48,-.245,.61,.49,.24,.07,'#777b71','#5b5a57','#494649');
    if(machine.cargoColor!==null) {
      box(-.47,-.23,.59,.46,.30,.20,'#b48b63','#886144','#694d41');
      for(const u of [-.40,-.02]) box(u,-.24,.048,.48,.30,.21,machine.cargoColor || '#e2b77f','#b08b60','#9a7452');
    } else {
      for(const v of [-.24,.18]) box(-.47,v,.59,.055,.30,.085,'#c6ab7d','#8a7966','#6a5e54');
      box(-.48,-.235,.06,.47,.30,.08,'#bba586','#897a69','#6d6259');
    }
    const lamp=point(.52,.2,.29);
    ctx.fillStyle='#ffdda4';ctx.fillRect(lamp.x-1,lamp.y-1,Math.max(1.6,unit*.055),Math.max(1.4,unit*.04));
    return;
  }
  // Twin crawler tracks with individual transverse shoes.
  const tracks = camera.cyaw > 0 ? [-.42, .24] : [.24, -.42];
  for (const track of tracks) {
    box(-.45,track,.90,.18,.015,.14,'#575253','#423940','#302b34');
    if (unit>22) for (let i=0;i<5;i++) {
      box(-.41+i*.17,track-.012,.042,.202,.03,.13,'#8a7e70','#64594f','#51484c');
    }
  }
  box(-.35,-.28,.67,.56,.13,.22,'#9b8d79','#695e58','#4e464a');
  box(-.32,-.26,.60,.52,.34,.12,paint,shade,'#574b49');
  if (squad) {
    box(-.21,-.17,.34,.32,.46,.15,'#c18e79','#8a6156','#75534f');
    box(.06,-.06,.49,.095,.52,.075,'#a7a39a','#655f60','#504a50');
    box(.46,-.08,.13,.13,.515,.09,'#746f72','#3e3943','#49424c');
    stroke(ctx,[point(-.22,.20,.45),point(-.26,.20,.82)],'#bdb5a6',Math.max(.8,unit*.025));
  } else {
    box(-.31,-.23,.26,.46,.46,.24,'#8c9997','#5e706f','#415255');
    box(-.34,-.25,.31,.50,.69,.055,paint,shade,'#644a3d');
    // Open derrick with interlocking braces, cable and rotary head.
    for (const v of [-.13,.13]) {
      stroke(ctx,[point(.04,v,.43),point(.31,v,.99),point(.43,v,.44)],'#51433d',Math.max(1.5,unit*.095));
      stroke(ctx,[point(.04,v,.43),point(.31,v,.99),point(.43,v,.44)],paint,Math.max(.8,unit*.045));
      stroke(ctx,[point(.18,v,.72),point(.39,v,.63)],shade,Math.max(1,unit*.035));
    }
    stroke(ctx,[point(.31,-.13,.99),point(.31,.13,.99)],'#ecd29d',Math.max(1.4,unit*.065));
    stroke(ctx,[point(.32,0,.96),point(.44,0,.085)],'#36333a',Math.max(1.5,unit*.08));
    stroke(ctx,[point(.43,0,.34),point(.44,0,.09)],'#b9ada0',Math.max(.8,unit*.026));
  }
  const lamp = point(.28,.22,.37);
  ctx.fillStyle = health === 0 ? '#90544e' : '#f5d897';
  ctx.fillRect(lamp.x-1,lamp.y-1,Math.max(1.5,unit*.055),Math.max(1.5,unit*.04));
  if (machine.hp !== undefined && machine.maxHp) {
    const width = clamp(unit*.68,14,48), y = center.y+unit*.40;
    ctx.fillStyle = '#231c25d9'; ctx.fillRect(center.x-width/2-1,y-1,width+2,4);
    ctx.fillStyle = health<=.25 ? '#e18377' : health<.6 ? '#dfb372' : '#b2ccb0';
    ctx.fillRect(center.x-width/2,y,width*health,2);
  }
}

function drawLocalObject(ctx: Ctx, tile: PlanetTile, camera: LocalCamera, machine: PlanetMachine) {
  if (machine.kind === 'depot') {
    const surface = {...tile,depth:0};
    const accent = tile.territory==='foreign' ? '#f29588' : '#95e0d5';
    drawDepot(ctx,localModel(ctx,surface,camera),camera.unit,accent);
  } else if (machine.kind === 'crate') {
    drawFieldCrate(localModel(ctx,tile,camera));
  } else if (machine.kind === 'hauler') {
    const at=pointOnFace(camera.face,machine.point);
    drawMachine(ctx,{...tile,u:at.u,v:at.v,depth:at.depth},camera,machine);
  } else {
    drawMachine(ctx,tile,camera,machine);
  }
}

const TAU = Math.PI * 2;

export function drawRegion(ctx: Ctx, w: number, h: number, region: PlanetRegion, cam: Orbit,
  hover: Point | null, machines: PlanetMachine[], relays: PlanetRelay[] = []) {
  const scene = emptyScene();
  atmosphere(ctx,w,h);
  const camera = localCamera(w,h,region,cam);
  const { pos,unit,sy,cyaw,cp } = camera;
  const lookup = new Map(region.tiles.map(t => [tileId(t.u,t.v),t]));
  const equipment = new Map<number,PlanetMachine[]>();
  for (const machine of machines) {
    const f = pointOnFace(region.face,machine.point), id = tileId(Math.round(f.u),Math.round(f.v));
    const tile = lookup.get(id);
    if (!tile || tile.status === 'unknown' || (machine.kind!=='depot' && !machine.docked && Math.abs(f.depth-tile.depth)>2)) continue;
    const list = equipment.get(id);
    if (list) list.push(machine); else equipment.set(id,[machine]);
  }
  const sorted = region.tiles.filter(t => {
    const p = pos(t.u,t.v,t.depth);
    return p.x > -unit && p.x < w+unit && p.y > -unit*7 && p.y < h+unit*2;
  }).sort((a,b) => (a.u-b.u)*sy+(a.v-b.v)*cyaw);
  const depotsToPaint:{tile:PlanetTile;machine:PlanetMachine}[]=[];
  function paintEquipment(tile:PlanetTile) {
    for(const machine of equipment.get(tileId(tile.u,tile.v)) ?? []) {
      if(machine.kind==='depot') depotsToPaint.push({tile,machine});
      else drawLocalObject(ctx,tile,camera,machine);
    }
  }
  for (const tile of sorted) {
    const { u,v,depth:d } = tile;
    const corners = [[u-.5,v-.5],[u+.5,v-.5],[u+.5,v+.5],[u-.5,v+.5]].map(([x,y]) => pos(x,y,d));
    if (tile.status === 'air') {
      poly(ctx,corners,'#15131b5c','#a68f771a',.6);
      paintEquipment(tile);
      scene.tiles.push({tile,points:corners});
      continue;
    }
    const hidden = tile.status === 'unknown';
    let veinMask = 0;
    const shadows: number[] = [];
    for (let i=0;i<edges.length;i++) {
      const e=edges[i], nb=lookup.get(tileId(u+e.du,v+e.dv));
      shadows.push(nb && nb.status!=='air' ? Math.max(0,d-nb.depth) : 0);
      if (!hidden && tile.ore !== 'ferrite' && nb?.status==='solid' && nb.ore===tile.ore && nb.depth===d) {
        const seam = hash(Math.min(u,nb.u),Math.min(v,nb.v),e.du ? 137 : 89);
        if (seam>.45) veinMask |= 1<<i;
      }
      const facing=e.du*sy+e.dv*cyaw;
      if (facing<=0) continue;
      const floor = nb ? nb.status==='air' ? d+1 : nb.depth : d+.55;
      const levels=clamp(floor-region.depth,-4,6)-clamp(d-region.depth,-4,6);
      if (levels <= 0) continue;
      const a=corners[e.i],b=corners[e.j],drop=levels*cp*unit;
      const wall=[a,b,{x:b.x,y:b.y+drop},{x:a.x,y:a.y+drop}];
      poly(ctx,wall,hidden?'#302c36':'#584a48');
      if (!hidden) {
        paintCliff(ctx,wall,e.du?v:u,d,levels,!!e.du,Math.abs(e.du));
        stroke(ctx,[a,b],'#e7c5a359',Math.max(.65,unit*.023));
      }
      scene.tiles.push({tile,points:wall});
    }
    poly(ctx,corners,hidden?'#322e37':'#74625c');
    if (!hidden) {
      paintSurface(ctx,corners,u,v,d,tile.ore,veinMask,unit,shadows);
      if (d===0 && tile.ore==='prisme') drawSurfaceCrystals(ctx,tile,camera,scene);
      if (tile.territory) {
        const accent = tile.territory==='foreign' ? '#e49688' : tile.territory==='home' ? '#f0ce92' : '#8ec2ad';
        for (const e of edges) {
          if (lookup.get(tileId(u+e.du,v+e.dv))?.territory===tile.territory) continue;
          stroke(ctx,[corners[e.i],corners[e.j]],accent,1.25);
        }
        if (u%4===0 && v%4===0) {
          const center=pos(u,v,d);
          stroke(ctx,[{x:center.x-2,y:center.y},{x:center.x+2,y:center.y}],accent+'a3',.9);
        }
      }
      paintEquipment(tile);
    }
    scene.tiles.push({tile,points:corners});
  }
  for(const {tile,machine} of depotsToPaint) drawLocalObject(ctx,tile,camera,machine);
  for (const relay of relays) {
    const f=relay.focus, tile=lookup.get(tileId(f.u,f.v));
    if (region.depth>1 || f.face!==region.face || !tile || tile.status==='unknown') continue;
    const p=pos(f.u,f.v,tile.depth), at={x:p.x,y:p.y-unit*.8};
    stroke(ctx,[p,at],'#e7ba7b',2);
    relayGlyph(ctx,at,relay,false);scene.relays.push({at,relay});
  }
  if (hover) {
    const hit=scene.tiles.findLast(t=>t.tile.status!=='unknown' && t.tile.point.x===hover.x
      && t.tile.point.y===hover.y && t.tile.point.z===hover.z);
    if (hit) poly(ctx,hit.points,'#ffd18130','#ffe0a1',1.9);
  }
  return scene;
}
export function pickTile(scene:PlanetScene,p:XY){
  for(let i=scene.tiles.length-1;i>=0;i--){const t=scene.tiles[i];if(inside(p,t.points))return t.tile}
  return null;
}
export function closestRelay(scene:PlanetScene,p:XY){
  return scene.relays.find(r=>Math.hypot(r.at.x-p.x,r.at.y-p.y)<=11)?.relay||null;
}

export type FragmentBurst={tile:PlanetTile;at:number};
export type MineProgress={point:Point;ready:number;started?:number};
/** Paint only the short-lived overlay, independently of the terrain. */
export function drawMiningOverlay(ctx:Ctx,w:number,h:number,r:PlanetRegion,cam:Orbit,bursts:FragmentBurst[],job:MineProgress|null,now:number,renderChips:boolean){
  const {pos,unit}=localCamera(w,h,r,cam);
  const wallNow=Date.now();
  let pending=false;
  if(job){
    const cell=r.tiles.find(t=>t.status==='solid'&&t.point.x===job.point.x&&t.point.y===job.point.y&&t.point.z===job.point.z);
    if(cell){
      const started=job.started??job.ready-5000;
      const ratio=clamp((wallNow-started)/Math.max(1,job.ready-started),0,1);
      const center=pos(cell.u,cell.v,cell.depth);
      ctx.save();
      const cracks=[
        [[0,0],[-.08,-.11],[-.23,-.08],[-.36,-.26]],
        [[0,0],[.12,.02],[.19,.17],[.37,.24]],
        [[0,0],[-.06,.12],[-.18,.19],[-.27,.33]],
        [[.12,.02],[.19,-.09],[.30,-.14],[.36,-.27]]
      ];
      for(let j=0;j<cracks.length;j++){
        const visible=clamp(ratio*1.42-j*.12,.04,1);
        const points=cracks[j],length=(points.length-1)*visible;
        const xys=points.map(([x,y])=>pos(cell.u+x,cell.v+y,cell.depth));
        const seg=Math.min(xys.length-2,Math.floor(length));
        for(const [stroke,width] of [['#f7c99d',2.5],['#3b2628',1.4]] as const){
          ctx.beginPath();ctx.moveTo(xys[0].x,xys[0].y);
          for(let i=1;i<=seg;i++)ctx.lineTo(xys[i].x,xys[i].y);
          const a=xys[seg],b=xys[seg+1],t=length-seg;
          ctx.lineTo(lerp(a.x,b.x,t),lerp(a.y,b.y,t));
          ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();
        }
      }
      const y=center.y-unit*.65,bar=clamp(unit*.9,17,48);
      ctx.fillStyle='#261c21';ctx.fillRect(center.x-bar/2-1,y-1,bar+2,4);
      ctx.fillStyle='#efbc83';ctx.fillRect(center.x-bar/2,y,bar*ratio,2);
      ctx.restore();
      pending=wallNow<job.ready;
    }
  }
  if(renderChips)for(const b of bursts){
    const t=(now-b.at)/530;
    if(t<0||t>=1)continue;
    const tile=b.tile,c=pos(tile.u,tile.v,tile.depth),seed=tile.u+tile.v*7+tile.depth*11;
    ctx.save();ctx.globalAlpha=(1-t)**.68;
    for(let i=0;i<8;i++){
      const angle=hash(i,seed,2)*Math.PI*2;
      const spread=unit*(.20+.82*hash(seed,i,6)),lift=unit*(.62+hash(i,seed,11)*.78);
      const x=c.x+Math.cos(angle)*spread*t,y=c.y+Math.sin(angle)*spread*.44*t-lift*t+unit*1.3*t*t;
      const radius=clamp(unit*.09,1.7,5)*(1-t*.35),twist=angle+t*4;
      ctx.translate(x,y);ctx.rotate(twist);
      poly(ctx,[{x:-radius,y:-radius*.45},{x:radius*.45,y:-radius*.76},{x:radius,y:radius*.18},{x:-radius*.34,y:radius*.83}],i%3===0?'#f5dcbb':oreColors[tile.ore||'ferrite']||'#b8a396');
      ctx.rotate(-twist);ctx.translate(-x,-y);
    }
    ctx.restore();
  }
  return pending;
}
