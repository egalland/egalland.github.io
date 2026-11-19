// Shared geographic positions. The IGN road layer determines which regional candidates can be reached on foot.
import { authoredWeaponDrops, dropCellSize, gridDrop, isActiveGridDrop } from './drop-id.js';
import { streets } from './paris-data.js';
import { contactAt, moveBody, parkedCars } from './paris-world.js';

const gridKey=(x,y)=>x+4096*y;
const parked=parkedCars.map(car=>({...car,halfLength:2.06,halfWidth:.9}));
const shapes={radius:.47,colliders:parked};
const maxAccess=9;
const roadCells=new Map();
for(const street of streets){
  if(street.kind==='motorway'||street.level<0)continue;
  for(let i=1;i<street.path.length;i++){
    const a=street.path[i-1],b=street.path[i];
    const dx=b[0]-a[0],dy=b[1]-a[1],squared=dx*dx+dy*dy;
    if(!squared)continue;
    const width=street.w*.5,reach=maxAccess+width;
    const left=Math.floor((Math.min(a[0],b[0])-reach)/dropCellSize),right=Math.floor((Math.max(a[0],b[0])+reach)/dropCellSize);
    const top=Math.floor((Math.min(a[1],b[1])-reach)/dropCellSize),bottom=Math.floor((Math.max(a[1],b[1])+reach)/dropCellSize);
    const segment={a,dx,dy,squared,width,path:street.kind==='path'};
    for(let iy=top;iy<=bottom;iy++)for(let ix=left;ix<=right;ix++){
      const key=gridKey(ix,iy);if(!roadCells.has(key))roadCells.set(key,{ix,iy,segments:[]});roadCells.get(key).segments.push(segment);
    }
  }
}
function onReachableGround(drop,segments){
  if(contactAt(drop.x,drop.y,{...shapes,radius:.75}))return false;
  for(const {a,dx,dy,squared,width,path} of segments){
    const t=Math.max(0,Math.min(1,((drop.x-a[0])*dx+(drop.y-a[1])*dy)/squared));
    const cx=a[0]+t*dx,cy=a[1]+t*dy,dist=Math.hypot(drop.x-cx,drop.y-cy);
    if(dist>width+maxAccess || (!path && dist<width+.25))continue;
    const curb=path?0:Math.min(dist,width+.85);
    // One end of the walk touches a mapped public footway or road edge, the other is the collectible.
    const nx=cx+(drop.x-cx)*curb/(dist||1),ny=cy+(drop.y-cy)*curb/(dist||1);
    if(contactAt(nx,ny,shapes))continue;
    const result=moveBody(nx,ny,drop.x-nx,drop.y-ny,shapes);
    if(!result.hit && Math.hypot(result.x-drop.x,result.y-drop.y)<.1)return true;
  }
  return false;
}
const items=authoredWeaponDrops.filter(item=>!contactAt(item.x,item.y,{...shapes,radius:.65}));
for(const {ix,iy,segments} of roadCells.values()){
  const item=gridDrop(ix,iy);
  if(!isActiveGridDrop(item.x,item.y))continue;
  if(onReachableGround(item,segments))items.push(item);
}
export const weaponDrops=Object.freeze(items);
const byCell=new Map();
for(const drop of weaponDrops){
  const key=gridKey(Math.floor(drop.x/dropCellSize),Math.floor(drop.y/dropCellSize));
  if(!byCell.has(key))byCell.set(key,[]);byCell.get(key).push(drop);
}
export function nearbyWeaponDrops(x,y,radius=100){
  if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(radius)||radius<0)return [];
  const result=[],r2=radius*radius;
  for(let iy=Math.floor((y-radius)/dropCellSize);iy<=Math.floor((y+radius)/dropCellSize);iy++){
    for(let ix=Math.floor((x-radius)/dropCellSize);ix<=Math.floor((x+radius)/dropCellSize);ix++){
      const cell=byCell.get(gridKey(ix,iy));if(!cell)continue;
      for(const d of cell){if((x-d.x)**2+(y-d.y)**2<=r2)result.push(d);}
    }
  }
  return result.sort((a,b)=>((a.x-x)**2+(a.y-y)**2)-((b.x-x)**2+(b.y-y)**2));
}
