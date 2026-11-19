// Actor navigation is independent of the accelerated business clock.
const STEP=.2,R=.41,MINX=-4,MINZ=-3,NX=40,NZ=30;
export function workshopObstacles(s,footFor){const boxes=[];for(const o of s.objects){const foot=footFor(o),w=o.rot%2?foot[1]:foot[0],d=o.rot%2?foot[0]:foot[1],cx=o.x-4+w/2,cz=o.z-3+d/2;boxes.push({id:o.id,minX:cx-w/2-R,maxX:cx+w/2+R,minZ:cz-d/2-R,maxZ:cz+d/2+R,cx,cz,w,d});if(o.type==='desk'){const a=o.rot*Math.PI/2,lx=-.16,lz=.83,x=cx+lx*Math.cos(a)+lz*Math.sin(a),z=cz-lx*Math.sin(a)+lz*Math.cos(a);boxes.push({id:o.id+'-chair',minX:x-.32-R,maxX:x+.32+R,minZ:z-.32-R,maxZ:z+.32+R});}}return boxes;}
export const pointIsFree=(p,boxes)=>p.x>=MINX+R&&p.x<=4-R&&p.z>=MINZ+R&&p.z<=3-R&&!boxes.some(b=>p.x>b.minX&&p.x<b.maxX&&p.z>b.minZ&&p.z<b.maxZ);
const grids=new WeakMap();
function nodes(boxes){if(grids.has(boxes))return grids.get(boxes);const list=[],byKey=new Map();for(let z=0;z<NZ;z++)for(let x=0;x<NX;x++){const p={x:MINX+(x+.5)*STEP,z:MINZ+(z+.5)*STEP,ix:x,iz:z,key:z*NX+x};if(pointIsFree(p,boxes)){list.push(p);byKey.set(p.key,p);}}const grid={list,byKey};grids.set(boxes,grid);return grid;}
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.z-b.z);
export function nearestFree(point,boxes){return nodes(boxes).list.reduce((best,p)=>!best||distance(p,point)<distance(best,point)?p:best,null);}
export function findWorkshopPath(start,target,boxes){
 const grid=nodes(boxes),from=grid.list.reduce((a,b)=>!a||distance(b,start)<distance(a,start)?b:a,null),to=grid.list.reduce((a,b)=>!a||distance(b,target)<distance(a,target)?b:a,null);if(!from||!to)return [];
 const open=new Map([[from.key,{p:from,g:0,f:distance(from,to)}]]),closed=new Set(),parents=new Map();let found=false;
 while(open.size){let current;for(const n of open.values())if(!current||n.f<current.f)current=n;open.delete(current.p.key);if(current.p.key===to.key){found=true;break;}closed.add(current.p.key);
  for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=current.p.ix+dx,z=current.p.iz+dz;if(x<0||x>=NX||z<0||z>=NZ)continue;const n=grid.byKey.get(z*NX+x);if(!n||closed.has(n.key))continue;const g=current.g+STEP;if(!open.has(n.key)||g<open.get(n.key).g){parents.set(n.key,current.p.key);open.set(n.key,{p:n,g,f:g+distance(n,to)});}}
 }
 if(!found)return [];const path=[];let key=to.key;while(key!==undefined){const p=grid.byKey.get(key);path.unshift({x:p.x,z:p.z});if(key===from.key)break;key=parents.get(key);}return path;
}
export function routeToObject(start,objectId,boxes){const b=boxes.find(b=>b.id===objectId);if(!b)return findWorkshopPath(start,{x:2.5,z:0},boxes);const gap=R+.12,goals=[{x:b.cx,z:b.cz+b.d/2+gap},{x:b.cx-b.w/2-gap,z:b.cz},{x:b.cx+b.w/2+gap,z:b.cz},{x:b.cx,z:b.cz-b.d/2-gap}],paths=goals.filter(p=>pointIsFree(p,boxes)).map(p=>findWorkshopPath(start,p,boxes)).filter(p=>p.length);return paths.sort((a,b)=>a.length-b.length)[0]||[];}
export function stepAlongPath(position,path,distanceBudget){let pos={x:position.x,z:position.z},next=[...path];while(next.length&&distanceBudget>0){const target=next[0],dx=target.x-pos.x,dz=target.z-pos.z,len=Math.hypot(dx,dz);if(len<=distanceBudget){pos={...target};next.shift();distanceBudget-=len;}else{pos.x+=dx/len*distanceBudget;pos.z+=dz/len*distanceBudget;distanceBudget=0;}}return {position:pos,path:next};}
