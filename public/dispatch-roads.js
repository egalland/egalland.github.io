import { vehicleSpec, vehicleDoorways } from './vehicle-types.js';

const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

function streetGeometry(road,scene) {
  const arc=[0]; let nearest=0,dist=Infinity;
  for(let i=1;i<road.path.length;i++){
    const [x,y]=road.path[i-1],[bx,by]=road.path[i],dx=bx-x,dy=by-y,len=Math.hypot(dx,dy);
    const along=clamp(((scene.x-x)*dx+(scene.y-y)*dy)/(len||1),0,len);
    const d=Math.hypot(scene.x-x-dx*along/(len||1),scene.y-y-dy*along/(len||1));
    if(d<dist){dist=d;nearest=arc[i-1]+along;}
    arc.push(arc[i-1]+len);
  }
  return {road,arc,nearest,length:arc.at(-1)};
}

function streetPoint(line,d){
  const {arc,road}=line;
  d=clamp(d,0,line.length);
  let i=1,end=arc.length-1;
  while(i<end){const mid=(i+end)>>1;if(arc[mid]<d)i=mid+1;else end=mid;}
  const [x,y]=road.path[i-1],[bx,by]=road.path[i],frac=(d-arc[i-1])/(arc[i]-arc[i-1]||1);
  return {x:x+(bx-x)*frac,y:y+(by-y)*frac};
}

function roadPosition(plan,metres){
  const {line,sign,from,length,spec}=plan,at=from+sign*clamp(metres,0,length);
  const center=streetPoint(line,at),a=streetPoint(line,at-sign*1.6),b=streetPoint(line,at+sign*1.6);
  const angle=Math.atan2(b.y-a.y,b.x-a.x);
  const curb=Math.max(0,line.road.w*.5-spec.halfWidth-.2);
  const lane=Math.min(curb,clamp(line.road.w*.22,.85,3));
  const t=clamp(1-(length-metres)/Math.min(14,length),0,1);
  const lateral=lane+(curb-lane)*t*t*(3-2*t);
  return {x:center.x-Math.sin(angle)*lateral,y:center.y+Math.cos(angle)*lateral};
}

export function dispatchRoadPose(plan,metres){
  const point=roadPosition(plan,metres),a=roadPosition(plan,metres-.36),b=roadPosition(plan,metres+.36);
  return {...point,angle:Math.atan2(b.y-a.y,b.x-a.x)};
}

export function dispatchDoor(pose,type,scene,walkable){
  return vehicleDoorways({...pose,type},.78).filter(p=>walkable(p))
    .sort((a,b)=>distance(a,scene)-distance(b,scene))[0];
}

// Plan only the final approach. Cars use the right-hand lane, then ease in to the curb.
export function planDispatch(scene,type,roads,clear,walkable){
  const spec=vehicleSpec(type),candidates=[];
  for(const road of roads.slice(0,12)){
    if(road.w<spec.halfWidth*2+.6)continue;
    const line=streetGeometry(road,scene),margin=spec.halfLength+2.5;
    if(line.length<2*margin+5)continue;
    for(const sign of [-1,1]){
      if((road.oneway===1&&sign===-1)||(road.oneway===-1&&sign===1))continue;
      const seen=new Set();
      for(const along of [0,7,-7,14,-14,21,-21]){
        const stop=clamp(line.nearest+along,margin,line.length-margin);
        if(seen.has(stop))continue;
        seen.add(stop);
        const length=Math.min(22,sign>0?stop-margin:line.length-margin-stop);
        if(length<5)continue;
        const candidate={type,spec,line,sign,length,from:stop-sign*length};
        candidate.park=dispatchRoadPose(candidate,length);
        const d=distance(candidate.park,scene);
        if(d>54)continue;
        candidate.score=d+.32*Math.max(0,15-length);
        candidates.push(candidate);
      }
    }
  }
  candidates.sort((a,b)=>a.score-b.score);
  for(const plan of candidates){
    if(!clear(plan.park,spec,true))continue;
    plan.door=dispatchDoor(plan.park,type,scene,walkable);
    if(!plan.door)continue;
    let ok=true;
    for(let d=0;d<plan.length;d+=1.2){
      if(!clear(dispatchRoadPose(plan,d),spec,false)){ok=false;break;}
    }
    if(ok)return plan;
  }
  return null;
}

export function stepDispatch(state,age,dt,clear){
  const {plan}=state;
  if(!plan)return null;
  if(state.distance==null){
    // Late joiners see the incident at its current stage; the car still needs a clear footprint.
    const target=Math.min(plan.length,Math.max(0,age)*5.8);
    let d=target;
    while(!clear(dispatchRoadPose(plan,d),plan.spec)){
      if(!d)return null;
      d=Math.max(0,d-.75);
    }
    state.distance=d;
    state.speed=d<plan.length-.01?4:0;
    if(d===plan.length)state.arrived=Math.min(age,plan.length/5.8+.45);
  }
  let moved=0;
  if(state.arrived==null){
    const remaining=plan.length-state.distance;
    const limit=Math.min(6.3,Math.sqrt(2*4*remaining));
    let speed=clamp(limit,state.speed-8*dt,state.speed+4*dt);
    const sight=Math.min(remaining,.5+speed*.35+speed*speed/12);
    for(let ahead=Math.min(.65,sight);ahead<sight+.65&&sight>0;ahead+=.65){
      if(clear(dispatchRoadPose(plan,state.distance+Math.min(ahead,sight)),plan.spec))continue;
      speed=Math.min(speed,Math.sqrt(12*Math.max(0,ahead-.85)));
      break;
    }
    moved=Math.min(remaining,Math.max(0,speed)*dt);
    if(!clear(dispatchRoadPose(plan,state.distance+moved),plan.spec))moved=0;
    state.distance+=moved;
    state.speed=moved/dt;
    if(remaining-moved<.025){state.arrived=age;state.speed=0;}
    // Ambulances can disembark in a queue once the vehicle has come to rest.
    if(state.speed<.15)state.wait=(state.wait||0)+dt;else state.wait=0;
    if(state.wait>2.4){state.arrived=age;state.speed=0;}
  }
  return {...dispatchRoadPose(plan,state.distance),speed:state.speed,moving:state.speed>.12};
}

export function footApproach(scene,walkable){
  for(const radius of [7,5,3,1])for(let i=0;i<12;i++){
    const angle=i*Math.PI/6,q={x:scene.x+Math.cos(angle)*radius,y:scene.y+Math.sin(angle)*radius};
    if(walkable(q))return q;
  }
  return {...scene};
}

const directions=[[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[-1,-1],[1,-1]];
function clearWalk(from,to,walkable){
  const n=Math.max(1,Math.ceil(distance(from,to)/.72));
  for(let i=1;i<=n;i++)if(!walkable({x:from.x+(to.x-from.x)*i/n,y:from.y+(to.y-from.y)*i/n}))return false;
  return true;
}

// Search only when a wall or parked vehicle actually obstructs the direct approach.
export function dispatchWalkPath(from,to,walkable){
  if(clearWalk(from,to,walkable))return [from,to];
  const cell=1.75,start={...from,i:0,j:0,g:0,h:distance(from,to)};
  const open=[start],best=new Map([['0/0',0]]),pointCache=new Map();
  let closest=start;
  for(let iteration=0;open.length&&iteration<460;iteration++){
    let index=0;
    for(let i=1;i<open.length;i++)if(open[i].g+open[i].h<open[index].g+open[index].h)index=i;
    const node=open[index];open[index]=open.at(-1);open.pop();
    if(node.g>best.get(node.i+'/'+node.j))continue;
    if(node.h<closest.h)closest=node;
    if(node.h<6&&clearWalk(node,to,walkable)){closest={...to,prev:node};break;}
    for(const [di,dj] of directions){
      const i=node.i+di,j=node.j+dj,key=i+'/'+j,g=node.g+cell*Math.hypot(di,dj);
      if(g>start.h+19||g>=(best.get(key)??Infinity))continue;
      const x=from.x+i*cell,y=from.y+j*cell;
      if(!pointCache.has(key))pointCache.set(key,walkable({x,y}));
      if(!pointCache.get(key)||!clearWalk(node,{x,y},walkable))continue;
      const h=Math.hypot(x-to.x,y-to.y);
      open.push({x,y,i,j,g,h,prev:node});best.set(key,g);
    }
  }
  const points=[];
  for(let node=closest;node;node=node.prev)points.push({x:node.x,y:node.y});
  return points.reverse();
}

export function stepDispatchFoot(state,target,age,stride,walkable){
  let walker=state.walker;
  if(!walker)walker=state.walker={...state.foot,last:state.arrived+.3,angle:0};
  if(!walker.target||distance(walker.target,target)>1.3){
    const angle=Math.atan2(target.y-walker.y,target.x-walker.x);
    const reach=Math.max(0,distance(walker,target)-1.05);
    const goal={x:walker.x+Math.cos(angle)*reach,y:walker.y+Math.sin(angle)*reach};
    walker.path=dispatchWalkPath(walker,goal,walkable);walker.next=1;
    walker.target={x:target.x,y:target.y};
  }
  let remaining=Math.max(0,age-walker.last)*stride;walker.last=age;
  while(remaining>0&&walker.next<walker.path.length){
    const next=walker.path[walker.next],dx=next.x-walker.x,dy=next.y-walker.y,length=Math.hypot(dx,dy);
    if(length>0){
      walker.angle=Math.atan2(dy,dx);
      const k=Math.min(1,remaining/length);
      walker.x+=dx*k;walker.y+=dy*k;remaining-=Math.min(remaining,length);
    }
    if(remaining>0||length<.00001||distance(walker,next)<.001)walker.next++;
  }
  const moving=walker.next<walker.path.length;
  return {x:walker.x,y:walker.y,angle:moving?walker.angle:Math.atan2(target.y-walker.y,target.x-walker.x),moving,move:moving,speed:moving?stride:0};
}
