import {coreBoundary} from './core-boundary.js';
import {areaAt} from './grand-paris.js';

export const sectorRadius=660;
export const bundledSectors=[
  {key:'eiffel',lon:2.29232,lat:48.85935,name:'Tour Eiffel'},
  {key:'notre-dame',lon:2.34790,lat:48.85348,name:'Notre-Dame de Paris'},
  {key:'sacre-coeur',lon:2.34318,lat:48.88480,name:'Sacré-Cœur'}
];
const core={key:'core',name:'Paris · Axe historique'};
const lonLat=(x,y)=>({lon:2.25+x/73190,lat:48.88-y/111320});
const mapPoint=(lon,lat)=>({x:Math.round((lon-2.25)*73190),y:Math.round((48.88-lat)*111320)});
function pointAlong(start,dir,distance){return {x:start.x+dir.x*distance,y:start.y+dir.y*distance};}
function signedMargin(p,ring){
  let inside=false,margin=Infinity;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const [x,y]=ring[j],[u,v]=ring[i],dx=u-x,dy=v-y;
    if((y>p.y)!==(v>p.y)&&p.x<x+dx*(p.y-y)/dy)inside=!inside;
    const t=Math.max(0,Math.min(1,((p.x-x)*dx+(p.y-y)*dy)/(dx*dx+dy*dy||1)));
    margin=Math.min(margin,Math.hypot(p.x-x-t*dx,p.y-y-t*dy));
  }
  return inside?margin:-margin;
}
function squareMargin(p,center){return sectorRadius-Math.max(Math.abs(p.x-center.x),Math.abs(p.y-center.y));}
export function adjacentSector(position,edge,direction,last){
  if(!edge.closest||!direction||edge.distanceToEdge>260)return null;
  if(direction.x*edge.outward.x+direction.y*edge.outward.y<.32)return null;
  const heading={x:direction.x*.55+edge.outward.x*.45,y:direction.y*.55+edge.outward.y*.45};
  const beyond=pointAlong(edge.closest,heading,380);
  const arrival=pointAlong(edge.closest,heading,34);
  const loc=lonLat(arrival.x,arrival.y),area=areaAt(loc.lon,loc.lat);
  if(!area)return null;
  // Reuse the large embedded map, or an offline landmark sector, where there
  // is enough overlap to enter on the same road and keep travelling.
  if(edge.current&&signedMargin(position,coreBoundary)>40&&signedMargin(beyond,coreBoundary)>45)return core;
  for(const preset of bundledSectors){
    const center=mapPoint(preset.lon,preset.lat);
    if(preset.key===edge.current?.preset||squareMargin(position,center)<55||squareMargin(beyond,center)<55)continue;
    return preset;
  }
  if(last?.key?.startsWith('ign:')&&last.edge===edge.edge&&
    squareMargin(position,last)>55&&squareMargin(beyond,last)>115)return last;
  const grid=200,x=Math.round(beyond.x/grid)*grid,y=Math.round(beyond.y/grid)*grid;
  const fixed=lonLat(x,y),lon=Number(fixed.lon.toFixed(5)),lat=Number(fixed.lat.toFixed(5));
  if(lon<2.05||lon>2.67||lat<48.62||lat>49.05)return null;
  if(squareMargin(position,{x,y})<40)return null;
  if(edge.current&&Math.hypot(x-edge.current.x,y-edge.current.y)<240)return null;
  return {key:'ign:'+x+':'+y,x,y,lon,lat,name:area.name,edge:edge.edge};
}

export function atSectorCut(edge,motion) {
  return edge.distanceToEdge<(motion.boundary?8:Math.min(12,2.4+motion.speed*.28))&&
    (motion.speed>.14||motion.boundary===true);
}
