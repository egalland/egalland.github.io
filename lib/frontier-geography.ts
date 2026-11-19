import { FACE_ORDER, SIDE, facePoint, pointOnFace, type Face, type Focus } from './planet';

export type Place = Focus & {depth:0};
export type Trip = {from:Place; to:Place; start:number; due:number};
export function geologyNoise(a:number,b:number,c=0) {
  let n=Math.imul(a+1337,374761393)^Math.imul(b+71,668265263)^Math.imul(c+17,1274126177);
  n=Math.imul(n^(n>>>13),1274126177);
  return ((n^(n>>>16))>>>0)/4294967296;
}
export function naturalDeposit(face:Face,x:number,y:number) {
  const f=FACE_ORDER.indexOf(face);
  const ore=geologyNoise(x,y,f)>.55?'cuivre' as const:'ferrite' as const;
  const point:Place={face,u:x*384+50+Math.round(geologyNoise(x,y,f+3)*280),v:y*384+50+Math.round(geologyNoise(y,x,f+7)*280),depth:0};
  return {id:face+'/'+x+'/'+y,point,ore,total:ore==='cuivre'?160000:210000};
}
/** Static geology for the observer's atlas. Exploration still discovers each site through local sensors. */
let naturalSites:ReturnType<typeof naturalDeposit>[]|undefined;
export function planetGeology():ReadonlyArray<ReturnType<typeof naturalDeposit>> {
  if(naturalSites)return naturalSites;
  naturalSites=[];
  const last=Math.floor((SIDE-1)/384);
  for(const face of FACE_ORDER)for(let x=0;x<=last;x++)for(let y=0;y<=last;y++){
    const site=naturalDeposit(face,x,y);
    if(site.point.u<SIDE&&site.point.v<SIDE)naturalSites.push(site);
  }
  return naturalSites;
}
export const surface = (f:Focus):Place => ({face:f.face,u:f.u,v:f.v,depth:0});
export const clampPlace = (f:Focus):Place => ({face:f.face,u:Math.max(0,Math.min(SIDE-1,Math.round(f.u))),v:Math.max(0,Math.min(SIDE-1,Math.round(f.v))),depth:0});
export const keyFor = (f:Focus, size=256) => f.face+'/'+Math.floor(f.u/size)+'/'+Math.floor(f.v/size);
export function scoutWaypoint(home:Place,step:number):Place {
  // Sweep the region repeatedly. A destination past an edge lands on the
  // adjacent face instead of pinning the scout to the same edge or corner.
  const radius = 650 + Math.sqrt((step-1) % 32) * 310;
  const angle = step * 1.618;
  const u = home.u + Math.cos(angle)*radius, v = home.v + Math.sin(angle)*radius;
  const center = (SIDE-1)/2;
  const extended = facePoint(home.face,u,v);
  const offset = {x:extended.x-center,y:extended.y-center,z:extended.z-center};
  const scale = center/Math.max(Math.abs(offset.x),Math.abs(offset.y),Math.abs(offset.z));
  const point = {x:center+offset.x*scale,y:center+offset.y*scale,z:center+offset.z*scale};
  const face = FACE_ORDER.find(f => Math.abs(pointOnFace(f,point).depth) < .01) ?? home.face;
  return clampPlace(pointOnFace(face,point));
}
export function range(a:Focus,b:Focus) {
  if(a.face===b.face)return Math.hypot(a.u-b.u,a.v-b.v);
  const x=facePoint(a.face,a.u,a.v),y=facePoint(b.face,b.u,b.v);
  return 1.5*Math.hypot(x.x-y.x,x.y-y.y,x.z-y.z);
}
export function along(trip:Trip, now:number):Place {
  const t=Math.min(1,Math.max(0,(now-trip.start)/Math.max(1,trip.due-trip.start)));
  const {from:a,to:b}=trip;
  if(a.face===b.face)return {face:a.face,u:a.u+(b.u-a.u)*t,v:a.v+(b.v-a.v)*t,depth:0};
  const center=(SIDE-1)/2, axes=['x','y','z'] as const;
  const x=facePoint(a.face,a.u,a.v),y=facePoint(b.face,b.u,b.v);
  const start=axes.map(k=>x[k]-center),end=axes.map(k=>y[k]-center);
  let p=start.map((v,i)=>v+(end[i]-v)*t);
  const main=start.findIndex(v=>Math.abs(v)===center);
  if(start[main]*end[main]<-center*center*.9){
    const middle=[0,0,0];middle[(main+1)%3]=center;
    p=t<=.5?start.map((v,i)=>v*(1-2*t)+middle[i]*2*t):middle.map((v,i)=>v*(2-2*t)+end[i]*(2*t-1));
  }
  const scale=center/Math.max(1,...p.map(Math.abs));
  const q={x:center+p[0]*scale,y:center+p[1]*scale,z:center+p[2]*scale};
  const face=FACE_ORDER.find(f=>pointOnFace(f,q).depth!<.01)??a.face;
  return surface(pointOnFace(face,q));
}
export function tripTo(from:Place,to:Place,now:number,speed:number):Trip {
  return {from:{...from},to:{...to},start:now,due:now+Math.max(1000,range(from,to)/speed*1000)};
}
export function terrainHeight(u:number,v:number) {
  return 11*Math.sin(u/230)*Math.cos(v/310)+5*Math.sin((u+v)/97)+2*Math.cos((u-v)/43);
}
