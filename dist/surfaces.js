import {boundarySegments,segmentOnRect} from './geometry.js';
export const SURFACE_TYPES={mezzanine:{name:'Mezzanine',description:'Un plancher ouvert en hauteur',color:'#d9c49d',icon:'layers',w:6,l:4},terrace:{name:'Terrasse',description:'Une surface ouverte, au sol ou à l’étage',color:'#cdbca0',icon:'sun',w:4,l:3}};
export function surfaceLimits(s,o){const outside=o.kind==='terrace',B=s.building;return{minX:outside?-B.w:0,minY:outside?-B.l:0,maxX:(outside?2:1)*B.w-o.w,maxY:(outside?2:1)*B.l-o.l,maxW:(outside?2:1)*B.w,maxL:(outside?2:1)*B.l};}
export function planBounds(s,levelId){const B=s.building,items=(s.surfaces||[]).filter(q=>!levelId||q.levelId===levelId),xs=[0,B.w,...items.flatMap(q=>[q.x,q.x+q.w])],ys=[0,B.l,...items.flatMap(q=>[q.y,q.y+q.l])],x=Math.min(...xs),y=Math.min(...ys);return{x:x-1.15,y:y-1.2,w:Math.max(...xs)-x+2.3,h:Math.max(...ys)-y+2.4};}
export function railingSegments(level,building){
 if(level.kind==='ground')return[];
 return boundarySegments(level.deck,building).filter(b=>{
  if(b.partition)return false;
  const seg=b.axis==='h'?{x1:b.a,y1:b.pos,x2:b.b,y2:b.pos}:{x1:b.pos,y1:b.a,x2:b.pos,y2:b.b};
  const explicit=(level.surfaces||[]).some(q=>q.railing&&segmentOnRect(seg,q)>.001);
  if(b.external&&!explicit)return false;
  if(!explicit&&!(level.platform&&segmentOnRect(seg,level.platform)>.001))return false;
  const mid=(b.a+b.b)/2;
  return !level.rooms.some(r=>b.axis==='v'?(Math.abs(r.x-b.pos)<.01||Math.abs(r.x+r.w-b.pos)<.01)&&mid>r.y&&mid<r.y+r.l:(Math.abs(r.y-b.pos)<.01||Math.abs(r.y+r.l-b.pos)<.01)&&mid>r.x&&mid<r.x+r.w);
 });
}
