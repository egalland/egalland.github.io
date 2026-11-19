import {unionCells} from './geometry.js';
import {openingLevel,openingSegment} from './model.js';
export function wallPieces(s,level,{omitExterior=false}={}){
 const out=[];
 for(const b of level.boundaries){
  if(omitExterior&&b.external)continue;
  const horizontal=b.axis==='h',holes=[];
  for(const o of s.openings){if(openingLevel(s,o)!==level.id)continue;const p=openingSegment(s,o);if(horizontal?Math.abs(p.y1-p.y2)>.001||Math.abs(p.y1-b.pos)>.01:Math.abs(p.x1-p.x2)>.001||Math.abs(p.x1-b.pos)>.01)continue;const start=Math.max(b.a,horizontal?p.x1:p.y1),end=Math.min(b.b,horizontal?p.x2:p.y2);if(end>start)holes.push({x:start,y:o.sill,w:end-start,l:o.h});}
  const mid=(b.a+b.b)/2,inside=delta=>level.rooms.some(r=>horizontal?mid>r.x&&mid<r.x+r.w&&b.pos+delta>r.y&&b.pos+delta<r.y+r.l:b.pos+delta>r.x&&b.pos+delta<r.x+r.w&&mid>r.y&&mid<r.y+r.l),minus=inside(-.005),plus=inside(.005),normal=minus&&!plus?1:plus&&!minus?-1:0;
  for(const p of unionCells([{x:b.a,y:0,w:b.b-b.a,l:b.h}],holes))out.push({axis:b.axis,pos:b.pos,start:p.x,length:p.w,bottom:p.y,height:p.l,normal,partition:b.partition});
 }
 return out;
}
export function levelOffsets(levels,exploded){const sorted=[...levels].sort((a,b)=>a.elevation-b.elevation);return new Map(sorted.map((l,i)=>[l.id,l.elevation+(exploded?i*2.2:0)]));}

export function envelopeWalls(s,lower=0,upper=s.building.h){
 const b=s.building;
 if(!b.walls||upper<=lower)return [];
 const sides=[
  {axis:'h',pos:0,length:b.w,normal:-1},
  {axis:'h',pos:b.l,length:b.w,normal:1},
  {axis:'v',pos:0,length:b.l,normal:-1},
  {axis:'v',pos:b.w,length:b.l,normal:1}
 ];
 const openings=s.openings.map(o=>({segment:openingSegment(s,o),sill:o.sill+(s.levels.find(l=>l.id===openingLevel(s,o))?.elevation||0),height:o.h}));
 return sides.flatMap(side=>{
  const horizontal=side.axis==='h';
  const holes=openings.filter(o=>horizontal
   ? Math.abs(o.segment.y1-side.pos)<.01&&Math.abs(o.segment.y2-side.pos)<.01
   : Math.abs(o.segment.x1-side.pos)<.01&&Math.abs(o.segment.x2-side.pos)<.01
  ).map(o=>({
   x:horizontal?o.segment.x1:o.segment.y1,
   y:o.sill-lower,
   w:horizontal?o.segment.x2-o.segment.x1:o.segment.y2-o.segment.y1,
   l:o.height
  }));
  return unionCells([{x:0,y:0,w:side.length,l:upper-lower}],holes).map(p=>({
   axis:side.axis,pos:side.pos,normal:side.normal,start:p.x,length:p.w,bottom:p.y,height:p.l
  }));
 });
}
