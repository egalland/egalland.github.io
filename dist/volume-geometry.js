import {unionCells} from './geometry.js';
import {openingLevel,openingSegment} from './model.js';
export function wallPieces(s,level){
 const out=[];
 for(const b of level.boundaries){
  const horizontal=b.axis==='h',holes=[];
  for(const o of s.openings){if(openingLevel(s,o)!==level.id)continue;const p=openingSegment(s,o);if(horizontal?Math.abs(p.y1-p.y2)>.001||Math.abs(p.y1-b.pos)>.01:Math.abs(p.x1-p.x2)>.001||Math.abs(p.x1-b.pos)>.01)continue;const start=Math.max(b.a,horizontal?p.x1:p.y1),end=Math.min(b.b,horizontal?p.x2:p.y2);if(end>start)holes.push({x:start,y:o.sill,w:end-start,l:o.h});}
  const mid=(b.a+b.b)/2,inside=delta=>level.rooms.some(r=>horizontal?mid>r.x&&mid<r.x+r.w&&b.pos+delta>r.y&&b.pos+delta<r.y+r.l:b.pos+delta>r.x&&b.pos+delta<r.x+r.w&&mid>r.y&&mid<r.y+r.l),minus=inside(-.005),plus=inside(.005),normal=minus&&!plus?1:plus&&!minus?-1:0;
  for(const p of unionCells([{x:b.a,y:0,w:b.b-b.a,l:b.h}],holes))out.push({axis:b.axis,pos:b.pos,start:p.x,length:p.w,bottom:p.y,height:p.l,normal,partition:b.partition});
 }
 return out;
}
export function levelOffsets(levels,exploded){const sorted=[...levels].sort((a,b)=>a.elevation-b.elevation);return new Map(sorted.map((l,i)=>[l.id,l.elevation+(exploded?i*2.2:0)]));}
