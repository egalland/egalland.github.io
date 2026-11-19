// Paris coordinates are east/south, so the right lane is to (-dy,+dx) of travel.
const dist=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
const wrap=(d,length)=>((d%length)+length)%length;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const keyFor=(p,level)=>`${p[0]},${p[1]},${level}`;
const heading=(a,b)=>Math.atan2(b[1]-a[1],b[0]-a[0]);
const direction=(a,b)=>{const l=dist(a,b)||1;return [(b[0]-a[0])/l,(b[1]-a[1])/l];};
function hash(text){let h=2166136261;for(const c of text)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
function measure(points){
  const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+dist(points[i-1],points[i]));
  return {points,lengths,length:lengths.at(-1)};
}
function lowerBound(values,value,key=x=>x){
  let lo=0,hi=values.length;
  while(lo<hi){const mid=(lo+hi)>>1;if(key(values[mid])<value)lo=mid+1;else hi=mid;}
  return lo;
}
function pose(line,d){
  const i=clamp(lowerBound(line.lengths,d),1,line.points.length-1),a=line.points[i-1],b=line.points[i];
  const t=clamp((d-line.lengths[i-1])/(line.lengths[i]-line.lengths[i-1]||1),0,1);
  return {x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t,angle:heading(a,b)};
}
function makeLane(edge){
  if(edge.lane)return edge.lane;
  const path=edge.reversed?edge.record.path.slice().reverse():edge.record.path;
  const {w,oneway}=edge.record.road;
  const offset=oneway&&w<5.5?Math.max(0,w-3.4)*.15:Math.min(w*.25,3.45);
  const points=path.map((p,i)=>{
    const a=direction(path[Math.max(0,i-1)],p),b=direction(p,path[Math.min(i+1,path.length-1)]);
    const sum=[a[0]+b[0],a[1]+b[1]],length=Math.hypot(...sum)||1;
    return [p[0]-sum[1]/length*offset,p[1]+sum[0]/length*offset];
  });
  return edge.lane=measure(points);
}
function possibleTurn(a,b){
  return a.record!==b.record && Math.cos(b.startAngle-a.endAngle)>-.84;
}
// Shortest return path to the start of a seed street. The state includes the incoming
// street, since a permissible turn depends on the approach. Never reverse into a street.
function findCircuit(first,usable){
  if(first.from===first.to)return [first];
  const queue=[{edge:first,cost:0,previous:null}],visited=new Set();
  for(let i=0;i<320&&queue.length;i++){
    const current=queue.pop(),edge=current.edge;
    if(visited.has(edge))continue;
    visited.add(edge);
    if(edge.to===first.from&&possibleTurn(edge,first)){
      const path=[];for(let s=current;s;s=s.previous)path.push(s.edge);
      return path.reverse();
    }
    for(const next of edge.to.out){
      if(next.record===first.record||visited.has(next)||!possibleTurn(edge,next))continue;
      const bend=1-Math.cos(next.startAngle-edge.endAngle);
      const cost=current.cost+next.record.length+9*bend;
      if(cost>1450||!usable(next))continue;
      // Small local search: descending priority queue, inexpensive removal from tail.
      const at=lowerBound(queue,-cost,x=>-x.cost);
      queue.splice(at,0,{edge:next,cost,previous:current});
    }
  }
  return null;
}
function throughRoute(first,atEdge,usable){
  const used=new Set([first.record]);
  function extend(initial,reverse){
    const path=[];let edge=initial;
    for(let i=0;i<40;i++){
      const node=reverse?edge.from:edge.to;
      if(atEdge(node.point))return path;
      let best=null,score=-Infinity;
      for(const next of reverse?node.in:node.out){
        const a=reverse?next:edge,b=reverse?edge:next;
        if(used.has(next.record)||!possibleTurn(a,b)||!usable(next))continue;
        const turn=Math.cos(b.startAngle-a.endAngle)+(a.record.road.name&&a.record.road.name===b.record.road.name ? .25 : 0);
        if(turn>score){best=next;score=turn;}
      }
      if(!best)break;
      used.add(best.record);path.push(best);edge=best;
    }
    return null;
  }
  const after=extend(first,false);if(!after)return null;
  const before=extend(first,true);return before?[...before.reverse(),first,...after]:null;
}
function laneSection(edge,first,last){
  const lane=makeLane(edge),trim=Math.min(6,edge.record.road.w*.65,lane.length*.28);
  const start=first?0:trim,end=last?lane.length:lane.length-trim;
  const a=pose(lane,start),b=pose(lane,end),points=[[a.x,a.y]];
  for(let i=1;i<lane.points.length-1;i++)if(lane.lengths[i]>start+.08&&lane.lengths[i]<end-.08)points.push(lane.points[i]);
  points.push([b.x,b.y]);return {points,start:a,end:b};
}
function roundJoin(a,b,append){
  const len=Math.hypot(b.x-a.x,b.y-a.y),handle=len*.46;
  const x1=a.x+Math.cos(a.angle)*handle,y1=a.y+Math.sin(a.angle)*handle;
  const x2=b.x-Math.cos(b.angle)*handle,y2=b.y-Math.sin(b.angle)*handle;
  const steps=Math.max(4,Math.ceil(len/1.25));let middle=0;
  for(let i=1;i<=steps;i++){
    const t=i/steps,s=1-t;
    const d=append([s**3*a.x+3*s*s*t*x1+3*s*t*t*x2+t**3*b.x,s**3*a.y+3*s*s*t*y1+3*s*t*t*y2+t**3*b.y]);
    if(i===Math.round(steps/2))middle=d;
  }
  return middle;
}
function makeRoute(edges,closed,id){
  const sections=edges.map((e,i)=>laneSection(e,!closed&&i===0,!closed&&i===edges.length-1));
  const points=[],lengths=[],junctions=[];let length=0;
  const append=p=>{
    const d=points.length?dist(p,points.at(-1)):0;
    if(!points.length||d>.00001){length+=d;points.push(p);lengths.push(length);}
    return length;
  };
  for(let i=0;i<edges.length;i++){
    const edge=edges[i],section=sections[i];
    section.points.forEach(append);
    if(!closed&&i===edges.length-1)break;
    const d=roundJoin(section.end,sections[(i+1)%sections.length].start,append);
    if(edge.to.degree>=3)junctions.push({d,id:edge.to.id,x:edge.to.point[0],y:edge.to.point[1],angle:edge.endAngle});
  }
  const minWidth=Math.min(...edges.map(e=>e.record.road.w));
  const availableWidth=Math.min(...edges.map(({record:{road}})=>road.oneway&&road.w<5.5?road.w*1.58:road.w));
  return {id,key:hash(id),points,lengths,length,junctions,closed,minWidth,availableWidth,count:Math.max(1,Math.round(length/195))};
}
// End the trip just before the map border, with space for the whole car. Otherwise
// a driver's collision box reaches the invisible boundary before its route ends.
function trimEdgePortals(route,portalClear){
  const safe=d=>{const p=pose(route,d);return portalClear(p.x,p.y);};
  let first=0,last=route.length;
  while(first<last&&!safe(first))first+=1;
  while(last>first&&!safe(last))last-=1;
  if(last-first<40)return false;
  if(first===0&&last===route.length)return true;
  const a=pose(route,first),b=pose(route,last);
  const points=route.points.filter((point,i)=>route.lengths[i]>first+.01&&route.lengths[i]<last-.01);
  Object.assign(route,measure([[a.x,a.y],...points,[b.x,b.y]]));
  route.junctions=route.junctions.filter(j=>j.d>=first&&j.d<=last).map(j=>({...j,d:j.d-first}));
  route.count=Math.max(1,Math.round(route.length/195));return true;
}
export function buildTrafficRoutes(records,seedGroups,{atEdge=()=>false,laneClear=()=>true,portalClear=()=>true}={}){
  const nodes=new Map(),directions=new Map(),routes=new Map();
  function node(point,level){
    const id=keyFor(point,level);
    if(!nodes.has(id))nodes.set(id,{id,point,out:[],in:[],roads:new Set()});
    return nodes.get(id);
  }
  for(const record of records){
    const {road,path}=record;
    if(road.kind==='path'||road.kind==='motorway'||road.level<0||road.w<(road.oneway?3:4)||record.length<2)continue;
    const ends=[node(path[0],road.level),node(path.at(-1),road.level)],options=[];
    for(const reversed of [false,true]){
      if((road.oneway===1&&reversed)||(road.oneway===-1&&!reversed))continue;
      const from=ends[+reversed],to=ends[+!reversed],second=path[reversed?path.length-2:1],before=path[reversed?1:path.length-2];
      const edge={record,reversed,tag:record.id+(reversed?'~':'^'),from,to,startAngle:heading(from.point,second),endAngle:heading(before,to.point)};
      from.out.push(edge);to.in.push(edge);from.roads.add(record);to.roads.add(record);options.push(edge);
    }
    directions.set(record,options);
  }
  for(const n of nodes.values()){
    n.degree=n.roads.size;n.out.sort((a,b)=>a.tag.localeCompare(b.tag));n.in.sort((a,b)=>a.tag.localeCompare(b.tag));
  }
  function usable(edge){
    if(edge.usable!==undefined)return edge.usable;
    const lane=makeLane(edge),steps=Math.max(1,Math.ceil(lane.length/8));
    for(let i=0;i<steps;i++){
      const p=pose(lane,(i+.5)*lane.length/steps);
      if(!laneClear(p))return edge.usable=false;
    }
    return edge.usable=true;
  }
  function routeForSeed(seed){
    const options=directions.get(seed);if(!options?.length)return null;
    // If only the other orientation has a return path (e.g. one-way streets), use it.
    for(let i=0;i<options.length;i++){
      const first=options[(seed.key+i)%options.length];if(!usable(first))continue;
      const cycle=findCircuit(first,usable),edges=cycle||throughRoute(first,atEdge,usable);
      if(edges)return {edges,cycle};
    }
    return null;
  }
  for(const group of seedGroups){
    for(const seed of group){
      const found=routeForSeed(seed);if(!found)continue;
      const {edges,cycle}=found;
      const tags=edges.map(e=>e.tag);let start=0;
      if(cycle)for(let i=1;i<tags.length;i++)if(tags[i]<tags[start])start=i;
      const canonical=edges.slice(start).concat(edges.slice(0,start)),signature=canonical.map(e=>e.tag).join('/');
      const id=`r${canonical[0].record.id}_${hash(signature).toString(36)}`;
      if(routes.has(id))break;
      const route=makeRoute(canonical,!!cycle,id);
      if(route.length<40||(!cycle&&!trimEdgePortals(route,portalClear)))continue;
      routes.set(id,route);break;
    }
  }
  return routes;
}
export function sampleRoadRoute(route,distance){
  if(!route||!Number.isFinite(distance)||(!route.closed&&(distance<0||distance>route.length)))return null;
  const {length,closed,junctions}=route,d=closed?wrap(distance,length):distance;
  const p=pose(route,d),before=pose(route,closed?wrap(d-1.15,length):Math.max(d-1.15,0)),after=pose(route,closed?wrap(d+1.15,length):Math.min(d+1.15,length));
  p.angle=Math.atan2(after.y-before.y,after.x-before.x);p.junction=null;
  if(junctions.length){
    // Keep reporting the same crossing until the back of a large vehicle is clear.
    const lo=d-7,i=lowerBound(junctions,lo,v=>v.d);
    let j=junctions[i],delta=j?j.d-d:Infinity;
    if(closed&&lo<0&&junctions.at(-1).d-length>=lo){j=junctions.at(-1);delta=j.d-length-d;}
    else if(!j&&closed){j=junctions[0];delta=j.d+length-d;}
    if(j&&delta<=35)p.junction={id:j.id,x:j.x,y:j.y,angle:j.angle,distance:delta};
  }
  p.routeLength=length;p.routeLoop=closed;return p;
}
