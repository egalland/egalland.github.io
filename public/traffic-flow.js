import { vehicleSpec } from './vehicle-types.js';

const clamp=(value,min,max)=>Math.max(min,Math.min(value,max));
const stopLine=6.4, clearLine=6.8, followingGap=1.6;
const planPeriod=.12, stepLimit=.065;
const distanceSquared=(a,b)=>(a.x-b.x)**2+(a.y-b.y)**2;
const byId=(a,b)=>a.id<b.id?-1:a.id>b.id?1:0;

function makeBody(entity,traffic=false){
  const box=traffic||entity.isCar||entity.vehicle||entity.halfLength;
  const spec=box?(entity.halfLength?entity:vehicleSpec(entity.vehicle?.type||entity.type)):null;
  const angle=entity.angle||0,c=Math.cos(angle),s=Math.sin(angle);
  const hasSpeed=Number.isFinite(entity.speed);
  const speed=hasSpeed?entity.speed:Math.hypot(entity.vx||0,entity.vy||0);
  const vx=entity.vx??(c*speed),vy=entity.vy??(s*speed);
  const radius=spec?Math.hypot(spec.halfLength,spec.halfWidth):(entity.r??entity.radius??.40);
  return {id:entity.id,x:entity.x,y:entity.y,c,s,length:spec?.halfLength||0,width:spec?.halfWidth||0,radius,vx,vy,traffic};
}
function bodyAt(body,pose){
  body.x=pose.x;body.y=pose.y;body.c=Math.cos(pose.angle);body.s=Math.sin(pose.angle);
  return body;
}
// Exact bumper-to-bumper and bumper-to-disc tests; this also leaves adjacent lanes independent.
function touches(car,other,gap=0,leadTime=0){
  const dx=other.x+other.vx*leadTime-car.x,dy=other.y+other.vy*leadTime-car.y;
  const range=car.radius+other.radius+gap;
  if(dx*dx+dy*dy>range*range)return false;
  const front=Math.abs(dx*car.c+dy*car.s),side=Math.abs(dy*car.c-dx*car.s);
  if(!other.length){
    const a=Math.max(0,front-car.length),b=Math.max(0,side-car.width);
    return a*a+b*b<(other.radius+gap)**2;
  }
  const forward=Math.abs(car.c*other.c+car.s*other.s),cross=Math.abs(car.c*other.s-car.s*other.c);
  return front<car.length+other.length*forward+other.width*cross+gap
    && side<car.width+other.length*cross+other.width*forward+gap
    && Math.abs(dx*other.c+dy*other.s)<other.length+car.length*forward+car.width*cross+gap
    && Math.abs(dy*other.c-dx*other.s)<other.width+car.width*forward+car.length*cross+gap;
}
function safeSpeed(clearance,leadSpeed,brake){
  const space=Math.max(0,clearance-followingGap);
  return Math.max(0,Math.min(Math.sqrt(leadSpeed**2+2*brake*space),leadSpeed+(space-leadSpeed*.95)*.83));
}
function routeDelta(state,d){
  let delta=d-state.distance;
  const span=state.pose.routeLength||state.seed.routeLength;
  if(span>0 && state.seed.routeLoop!==false && state.pose.routeLoop!==false){
    delta-=Math.round(delta/span)*span;
  }
  return delta;
}

export function createTrafficFlow(sample,chooseDetour){
  const cars=new Map(),permits=new Set(),refused=new Map();
  let planIn=0,tick=0;
  function reset(){cars.clear();permits.clear();refused.clear();planIn=0;tick=0;}

  function sameCrossing(a,b){
    // A boulevard with a median can have a distinct graph node on each carriageway.
    // Their turning envelopes form one conflict area, unless the roads are on different levels.
    if(a.id===b.id)return true;
    if(distanceSquared(a,b)>10**2)return false;
    const level=j=>j.level??String(j.id).split(',')[2]??0;
    return level(a)===level(b);
  }
  function releasePermits(owner){
    for(const permit of permits)if(permit.owner===owner)permits.delete(permit);
  }
  function permitted(owner,j){
    for(const permit of permits)if(permit.owner===owner&&sameCrossing(j,permit.crossing))return true;
    return false;
  }
  // Reserve only the part of the intersection occupied by this movement. Cache the swept
  // rectangles while approaching; opposite lanes and disjoint right turns can share a grant.
  function movementFor(car,j){
    const at=car.distance+j.distance;
    if(car.movement?.id===j.id && Math.abs(car.movement.at-at)<.3)return car.movement;
    const samples=[],line=[];
    const min= -stopLine-car.body.length,max=clearLine+car.body.length,spacing=1.35;
    for(let d=min;d<max+spacing;d+=spacing){
      const pose=sample(car.seed.routeId,at+Math.min(max,d));
      if(!pose)continue;
      const hull=bodyAt({...car.body},pose);
      hull.length+=spacing*.5;hull.radius=Math.hypot(hull.length,hull.width);
      samples.push(hull);
    }
    for(const d of [-7,-3,0,3,7,10]){
      const pose=sample(car.seed.routeId,at+d);
      if(pose)line.push(pose);
    }
    const entering=line[0]?.angle??j.angle,leaving=line.at(-1)?.angle??entering;
    const turn=Math.atan2(Math.sin(leaving-entering),Math.cos(leaving-entering));
    car.movement={id:j.id,at,samples,line,entering,left:turn<-.48};
    return car.movement;
  }
  function conflicts(a,b){
    if(!a?.samples.length||!b?.samples.length)return true;
    // Cars following precisely the same lane can enter as a queue; car-following still
    // enforces their bumper distance and the downstream check must admit each separately.
    if(a.line.length===6 && b.line.length===6 && a.line.every((p,i)=>
      distanceSquared(p,b.line[i])<.5**2 && Math.cos(p.angle-b.line[i].angle)>.97))return false;
    return a.samples.some(p=>b.samples.some(q=>touches(p,q,.045)));
  }
  function exitOpen(car,bodies){
    const {body,pose,seed}=car,j=pose.junction;
    if(j.distance<stopLine+body.length-.4)return true;
    const near=bodies.filter(b=>b!==body&&distanceSquared(b,j)<(20+b.radius)**2);
    if(!near.length)return true;
    const probe={...body};
    for(let d=1.5;d<=clearLine+body.length+1.5;d+=2){
      const pos=sample(seed.routeId,car.distance+j.distance+d);
      if(!pos)continue;
      bodyAt(probe,pos);
      for(const other of near){
        // Waiting cross traffic has its own stop line. A stationary queue on our
        // outgoing lane, or a pedestrian in the crossing, leaves no room to exit.
        if(other.traffic && other.c*probe.c+other.s*probe.s<.53)continue;
        const slow=Math.hypot(other.vx,other.vy)<1.5;
        if(slow && touches(probe,other,.25))return false;
        const lateral=Math.abs(other.vy*probe.c-other.vx*probe.s);
        if(!slow && !other.traffic && lateral>.6){
          const ahead=clamp((j.distance+d)/Math.max(car.speed,3),.2,1.8);
          if(touches(probe,other,.25,ahead))return false;
        }
      }
    }
    return true;
  }
  function planJunctions(states,bodies){
    const groups=new Map();
    function groupFor(j){
      let group=groups.get(j.id);
      if(!group)for(const g of groups.values())if(sameCrossing(g.crossing,j)){group=g;break;}
      if(!group){group={crossing:j,drivers:[],grants:[]};groups.set(j.id,group);}
      return group;
    }
    for(const permit of permits){
      const car=cars.get(permit.owner),j=car?.pose.junction;
      if(j&&sameCrossing(j,permit.crossing)){
        permit.clearAt=Math.max(permit.clearAt,car.distance+j.distance+clearLine+car.body.length);
        if(j.id!==permit.movement.id)permit.movement=movementFor(car,j);
      }
      if(!car||car.distance>=permit.clearAt){permits.delete(permit);continue;}
      if(car.distance-permit.lastDistance>.35){permit.lastDistance=car.distance;permit.lastProgress=tick;}
      if(car.distance<permit.enterAt+.55){
        if(j&&!exitOpen(car,bodies)){permits.delete(permit);continue;}
        if(tick-permit.lastProgress>3.2){car.yieldUntil=tick+2;permits.delete(permit);continue;}
      }
      groupFor(permit.crossing).grants.push(permit);
    }
    for(const car of states){
      if(!cars.has(car.seed.id))continue;
      const j=car.pose.junction;
      if(!j||j.distance>27||j.distance < -clearLine-car.body.length){car.arrival=null;continue;}
      const group=groupFor(j);
      group.drivers.push(car);
      // Keep arrival order while drivers wait at the stop line.
      if(!car.arrival||!sameCrossing(j,car.arrival.crossing)){
        car.arrival={crossing:j,time:tick+Math.max(0,j.distance-stopLine-car.body.length)/Math.max(2.4,car.speed)};
      }
    }
    for(const group of groups.values()){
      const eligible=group.drivers.filter(car=>!permitted(car.seed.id,car.pose.junction)&&car.yieldUntil<=tick&&exitOpen(car,bodies));
      if(!eligible.length)continue;
      const turningLeft=new Set();
      for(const car of eligible){
        const movement=movementFor(car,car.pose.junction);
        if(!movement.left||tick-car.arrival.time>3.5)continue;
        const oncoming=eligible.some(other=>{
          if(other===car||Math.abs(other.arrival.time-car.arrival.time)>.8)return false;
          const their=movementFor(other,other.pose.junction);
          return !their.left&&Math.cos(their.entering-movement.entering)<-.8&&conflicts(their,movement);
        });
        if(oncoming)turningLeft.add(car);
      }
      eligible.sort((a,b)=>{
        const ja=a.pose.junction,jb=b.pose.junction;
        const aInside=ja.distance<stopLine+a.body.length-.25,bInside=jb.distance<stopLine+b.body.length-.25;
        if(aInside!==bInside)return aInside?-1:1;
        if(aInside && Math.abs(ja.distance-jb.distance)>.15)return ja.distance-jb.distance;
        if(turningLeft.has(a)!==turningLeft.has(b))return turningLeft.has(a)?1:-1;
        return a.arrival.time-b.arrival.time||byId(a.seed,b.seed);
      });
      const waiting=[];
      for(const car of eligible){
        const j=car.pose.junction,movement=movementFor(car,j);
        if(group.grants.some(grant=>conflicts(grant.movement,movement))||waiting.some(a=>conflicts(a,movement))){
          // A stream of later cars cannot repeatedly take a slot needed by an earlier
          // conflicting movement. An unrelated movement can still use the intersection.
          waiting.push(movement);continue;
        }
        const at=car.distance+j.distance;
        const permit={owner:car.seed.id,crossing:group.crossing,movement,enterAt:at-stopLine-car.body.length,
          clearAt:at+clearLine+car.body.length,lastProgress:tick,lastDistance:car.distance};
        permits.add(permit);group.grants.push(permit);
      }
    }
  }

  function planSpeed(car,bodies,blockedPose){
    const {pose,body,seed,spec}=car,j=pose.junction;
    let target=seed.cruiseSpeed;
    const roadBrake=Math.min(4.1,spec.brake*.45),stopping=car.speed**2/(2*roadBrake);
    if(j && j.distance>=-body.length && j.distance<32){
      if(!permitted(seed.id,j)){
        const space=j.distance-stopLine-body.length;
        if(space>=-1.2)target=Math.min(target,safeSpeed(space+followingGap,0,roadBrake));
        else if(j.distance>1.2)target=0;
      }else {
        // Reduce speed through a tight turn; through traffic can cross at its normal speed.
        const exit=sample(seed.routeId,car.distance+j.distance+6.5);
        if(exit && Math.cos(exit.angle-(j.angle??pose.angle))<.84){
          const bendSpeed=spec.halfLength>3?3.45:4.25;
          target=Math.min(target,Math.sqrt(bendSpeed**2+2*roadBrake*Math.max(0,j.distance-4)));
        }
      }
    }
    const horizon=Math.min(32,Math.max(7,stopping+car.speed*1.2+followingGap+2));
    if(blockedPose){
      // Cache the verified strip ahead in route metres. Scenery is stationary, except for
      // destructible props which are rechecked while a driver waits for clearance.
      if(car.roadBlock && tick>=car.roadBlock.retry){
        const pos=sample(seed.routeId,car.roadBlock.distance);
        if(!pos||!blockedPose(pos.x,pos.y,pos.angle,spec))car.roadBlock=null;
        else car.roadBlock.retry=tick+.65;
      }
      if(!car.roadBlock){
        car.scanned=Math.max(car.scanned,car.distance);
        for(let d=car.scanned+1;d<=car.distance+horizon;d++){
          const pos=sample(seed.routeId,d);
          if(!pos)break;
          if(blockedPose(pos.x,pos.y,pos.angle,spec)){car.roadBlock={distance:d,retry:tick+.65};break;}
          car.scanned=d;
        }
      }
      if(car.roadBlock)target=Math.min(target,safeSpeed(car.roadBlock.distance-car.distance-.4,0,roadBrake));
    }
    const nearby=bodies.filter(other=>other!==body &&
      distanceSquared(other,body)<(horizon+body.radius+other.radius+4)**2);
    if(!nearby.length)return target;
    const probe={...body};
    const stride=1.15;
    for(let offset=stride;offset<=horizon+stride*.5;offset+=stride){
      const pos=sample(seed.routeId,car.distance+offset);
      if(!pos)break;
      bodyAt(probe,pos);
      const expected=Math.min(.85,offset/Math.max(2,car.speed));
      for(const other of nearby){
        // Pedestrians and player-driven crossing vehicles can enter our lane during braking.
        const normalSpeed=Math.abs(other.vy*probe.c-other.vx*probe.s);
        const opposing=other.length&&other.c*probe.c+other.s*probe.s<-.84;
        const clearance=opposing ? .035 : .18;
        if(!touches(probe,other,clearance) && !(normalSpeed>.24 && touches(probe,other,clearance,expected)))continue;
        const lead=Math.max(0,other.vx*probe.c+other.vy*probe.s);
        target=Math.min(target,safeSpeed(offset-stride*.5,lead,roadBrake));
      }
      if(target<.05)break;
    }
    return target;
  }

  function clear(body,bodies){return !bodies.some(other=>other!==body && touches(body,other,.075));}
  function spawn(seed,blockers,epoch,blockedPose){
    if(!Number.isFinite(seed.routeDistance)||!(seed.cruiseSpeed>0))return null;
    const checkpoint=Number.isFinite(seed.stamp);
    const age=checkpoint?clamp((epoch-seed.stamp)/1000,0,.42):0;
    const speed=clamp(seed.speed??seed.cruiseSpeed,0,seed.cruiseSpeed*1.3);
    const distance=seed.routeDistance+speed*age,pose=sample(seed.routeId,distance);
    if(!pose)return null;
    const spec=vehicleSpec(seed.type),body=makeBody({...seed,...pose,speed},true);
    if(!clear(body,blockers)||blockedPose?.(pose.x,pose.y,pose.angle,spec))return null;
    const car={seed:{...seed,originRouteId:seed.originRouteId||seed.routeId},distance,pose,body,spec,speed,target:speed,arrival:null,yieldUntil:-1,
      stamp:checkpoint?seed.stamp:-Infinity,correction:0,roadChecked:distance,scanned:distance,roadBlock:null,
      nextDetourCheck:tick,obstruction:null,detourAfter:tick,lastCheckpoint:checkpoint?tick:-Infinity};
    const j=pose.junction;
    if(j&&j.distance<stopLine+body.length){
      const movement=movementFor(car,j);
      for(const other of cars.values()){
        const occupied=other.pose.junction;
        if(occupied&&occupied.distance<stopLine+other.body.length&&sameCrossing(j,occupied)&&conflicts(movement,movementFor(other,occupied)))return null;
      }
      for(const permit of permits.values())if(sameCrossing(j,permit.crossing)&&conflicts(movement,permit.movement))return null;
    }
    return car;
  }
  function changeRoute(car,id,distance,pose){
    car.seed={...car.seed,routeId:id,routeLength:pose.routeLength,routeLoop:pose.routeLoop};
    car.distance=distance;car.pose=pose;bodyAt(car.body,pose);
    car.body.vx=car.body.c*car.speed;car.body.vy=car.body.s*car.speed;
    car.arrival=null;car.movement=null;car.obstruction=null;car.correction=0;
    car.scanned=distance;car.roadChecked=distance;car.roadBlock=null;
    car.detourAfter=tick+10;releasePermits(car.seed.id);
  }
  function considerDetour(car,bodies,blockedPose){
    if(!chooseDetour||tick<car.nextDetourCheck||tick<car.detourAfter||tick-car.lastCheckpoint<1.7)return;
    car.nextDetourCheck=tick+.46;
    const j=car.pose.junction;
    if(!j||j.distance<1){car.obstruction=null;return;}
    // Look beyond the fork. Braking range alone will often see a parked van only
    // after the last opportunity to take the other street.
    const horizon=Math.min(49,j.distance+21),near=bodies.filter(b=>b!==car.body&&
      Math.hypot(b.vx,b.vy)<.48&&distanceSquared(car.body,b)<(horizon+2*car.body.length+b.radius+9)**2);
    const probe={...car.body},atPose=(pose,gap=.16)=>{
      bodyAt(probe,pose);return near.find(b=>touches(probe,b,gap));
    };
    let blockedDistance=Infinity,key=null;
    if(car.roadBlock){blockedDistance=car.roadBlock.distance-car.distance;key='scenery';}
    if(near.length){
      for(let ahead=2;ahead<=Math.min(horizon,blockedDistance);ahead+=1.65){
        const p=sample(car.seed.routeId,car.distance+ahead);
        if(!p)break;
        const hit=atPose(p);
        if(!hit)continue;
        // A car waiting normally for the intersecting street is traffic, not a closure.
        // A queue whose lead car is physically obstructed can eventually reroute.
        if(hit.traffic&&!cars.get(hit.id)?.obstruction&&!cars.get(hit.id)?.roadBlock)continue;
        key=hit.id??(Math.round(hit.x*2)+','+Math.round(hit.y*2));blockedDistance=ahead;break;
      }
    }
    if(key===null||blockedDistance>horizon){car.obstruction=null;return;}
    if(car.obstruction?.key!==key){car.obstruction={key,since:tick};return;}
    if(tick-car.obstruction.since<1.8)return;
    car.nextDetourCheck=tick+.95;
    const vehicle={...car.seed,...car.pose,routeDistance:car.distance,speed:car.speed};
    const blockers=near.map(b=>({id:b.id,x:b.x,y:b.y,angle:Math.atan2(b.s,b.c),vx:b.vx,vy:b.vy,
      isCar:!!b.length,halfLength:b.length,halfWidth:b.width,r:b.radius}));
    const alternative=chooseDetour({routeId:car.seed.routeId,routeDistance:car.distance,vehicle,spec:car.spec,
      blockedDistance,blockers,blockedPose,obstructedAt:(pose,gap)=>!!atPose(pose,gap)});
    if(!alternative||alternative.routeId===car.seed.routeId||!Number.isFinite(alternative.routeDistance))return;
    const pose=sample(alternative.routeId,alternative.routeDistance);
    if(!pose||distanceSquared(pose,car.pose)>.22**2||Math.cos(pose.angle-car.pose.angle)<.991)return;
    changeRoute(car,alternative.routeId,alternative.routeDistance,pose);
  }
  function joinPeerRoute(car,check,distance,bodies,observer,blockedPose){
    const probe={...car.body},near=observer && distanceSquared(car.pose,observer)<24**2;
    let best=null,bestError=Infinity;
    const consider=d=>{
      const pose=sample(check.routeId,d);if(!pose)return;
      const diff=distanceSquared(car.pose,pose);
      if(diff>bestError||Math.cos(pose.angle-car.pose.angle)<.88)return;
      best={pose,distance:d};bestError=diff;
    };
    // Prefer matching this car onto the common piece of road. The authority may
    // already be several metres ahead on the new branch when its message arrives.
    consider(distance);
    for(let delta=.75;delta<=30;delta+=.75){consider(distance-delta);consider(distance+delta);}
    if(bestError>.85**2){
      const pose=sample(check.routeId,distance);
      if(!pose||near||(observer&&distanceSquared(pose,observer)<24**2))return false;
      best={pose,distance};
    }
    if(!best)return false;
    bodyAt(probe,best.pose);
    if(bodies.some(b=>b!==car.body&&touches(probe,b,.075))||blockedPose?.(probe.x,probe.y,best.pose.angle,car.spec))return false;
    changeRoute(car,check.routeId,best.distance,best.pose);
    return true;
  }
  function reconcile(car,check,bodies,epoch,observer,blockedPose){
    if(!Number.isFinite(check.stamp)||check.stamp<=car.stamp||
      (check.originRouteId||check.routeId)!==car.seed.originRouteId)return;
    car.stamp=check.stamp;car.lastCheckpoint=tick;
    const speed=clamp(check.speed||0,0,car.seed.cruiseSpeed*1.3);
    const distance=check.routeDistance+clamp((epoch-check.stamp)/1000,0,.42)*speed;
    if(check.routeId!==car.seed.routeId && !joinPeerRoute(car,check,distance,bodies,observer,blockedPose))return;
    const delta=routeDelta(car,distance),dest=car.distance+delta;
    const pose=sample(car.seed.routeId,dest);
    if(!pose)return;
    const far=!observer||(distanceSquared(observer,car.pose)>24**2 && distanceSquared(observer,pose)>24**2);
    if(Math.abs(delta)>7.5 && far){
      const probe=bodyAt({...car.body},pose);
      if(!bodies.some(b=>b!==car.body&&touches(probe,b,.15))&&!blockedPose?.(pose.x,pose.y,pose.angle,car.spec)){
        car.distance=dest;car.pose=pose;bodyAt(car.body,pose);
        car.speed=speed;car.correction=0;car.roadChecked=dest;car.scanned=dest;car.roadBlock=null;car.arrival=null;
        releasePermits(car.seed.id);car.movement=null;car.obstruction=null;
        return;
      }
    }
    car.correction=clamp(delta,-22,22);
    // A peer reaching a stop is visible on both clients even before their avoidance ticks align.
    if(Math.abs(delta)<1.5)car.speed+=(speed-car.speed)*.35;
  }

  function advance(car,bodies,dt,blockedPose){
    const adjust=clamp(car.correction*.8,-2.25,2.25);
    let target=car.target+adjust;
    // Position correction may catch up on an open road, never beyond a stop or a slower leader.
    if(adjust>0 && car.target<car.seed.cruiseSpeed-.05)target=car.target;
    target=clamp(target,0,car.seed.cruiseSpeed+2.25);
    if(target<.15)target=0;
    const accel=Math.min(2.8,car.spec.accel*.43),brake=car.spec.brake*.76;
    const speed=car.speed+clamp(target-car.speed,-brake*dt,accel*dt);
    const movement=(car.speed+speed)*.5*dt;
    car.speed=speed<.035?0:speed;
    if(movement<.0001){car.body.vx=0;car.body.vy=0;return true;}
    const distance=car.distance+movement,pose=sample(car.seed.routeId,distance);
    if(!pose)return false;
    const probe=bodyAt({...car.body},pose);
    let blocked=bodies.some(other=>{
      if(other===car.body)return false;
      const opposing=other.length && other.c*probe.c+other.s*probe.s<-.84;
      return touches(probe,other,opposing ? .025 : .065);
    });
    if(!blocked && blockedPose && car.roadChecked<distance){
      const ahead=sample(car.seed.routeId,distance+.42);
      blocked=blockedPose(pose.x,pose.y,pose.angle,car.spec);
      if(!blocked)car.roadChecked=ahead&&!blockedPose(ahead.x,ahead.y,ahead.angle,car.spec)?distance+.42:distance;
      else car.roadBlock={distance,retry:tick+.65};
    }
    if(blocked){car.speed=0;car.target=0;car.body.vx=0;car.body.vy=0;return true;}
    car.distance=distance;car.pose=pose;bodyAt(car.body,pose);
    car.body.vx=car.body.c*car.speed;car.body.vy=car.body.s*car.speed;
    if(adjust<0||target>car.target)car.correction-=adjust*dt;
    return true;
  }

  function step(seeds,{dt=0,epoch=Date.now(),blockers=[],observer=null,excluded=new Set(),checkpoints=[],blockedPose}={}){
    const actualDt=clamp(dt,0,.5);
    const fixed=blockers.filter(b=>b&&Number.isFinite(b.x)&&Number.isFinite(b.y)).map(b=>makeBody(b));
    const candidates=new Map(seeds.filter(s=>s.routeId!=null&&!excluded.has(s.id)).map(s=>[s.id,s]));
    const remote=new Map();
    for(const s of checkpoints){
      if(!s||excluded.has(s.id)||s.routeId==null||!Number.isFinite(s.routeDistance))continue;
      if(!remote.has(s.id)||remote.get(s.id).stamp<s.stamp)remote.set(s.id,s);
    }
    for(const [id,s] of remote)if(!candidates.has(id))candidates.set(id,s);
    for(const [id,car] of cars){
      if(excluded.has(id)||(observer?distanceSquared(observer,car.pose)>153**2:!candidates.has(id)))cars.delete(id);
    }
    for(const [id,expires] of refused)if(expires<tick||!candidates.has(id))refused.delete(id);
    const bodies=[...fixed,...Array.from(cars.values(),c=>c.body)];
    for(const check of remote.values()){
      const car=cars.get(check.id);
      if(car)reconcile(car,check,bodies,epoch,observer,blockedPose);
    }
    for(const seed of [...candidates.values()].sort(byId)){
      if(cars.has(seed.id)||refused.has(seed.id))continue;
      const incoming=remote.get(seed.id)||seed;
      const car=spawn(incoming,bodies,epoch,blockedPose);
      if(!car){refused.set(seed.id,tick+.6);continue;}
      if(observer && distanceSquared(observer,car.pose)>149**2)continue;
      cars.set(seed.id,car);bodies.push(car.body);planIn=0;
    }

    const states=[...cars.values()].sort((a,b)=>byId(a.seed,b.seed));
    const steps=Math.max(1,Math.ceil(actualDt/stepLimit));
    for(let i=0;i<steps;i++){
      const elapsed=actualDt/steps;tick+=elapsed;planIn-=elapsed;
      if(planIn<=0){
        planIn=planPeriod;
        for(const car of states)if(cars.has(car.seed.id))considerDetour(car,bodies,blockedPose);
        planJunctions(states,bodies);
        for(const car of states)if(cars.has(car.seed.id))car.target=planSpeed(car,bodies,blockedPose);
      }
      for(const car of states)if(cars.has(car.seed.id)&&!advance(car,bodies,elapsed,blockedPose)){
        cars.delete(car.seed.id);refused.set(car.seed.id,Infinity);car.body.x=Infinity;
      }
    }
    return states.filter(c=>cars.has(c.seed.id)).map(c=>({...c.seed,...c.pose,isCar:true,
      routeDistance:c.distance,routeLength:c.pose.routeLength||c.seed.routeLength,
      moving:c.speed>.07,move:c.speed>.07,speed:c.speed,brake:c.target<c.speed-.25||c.target<.45,
      ...(observer?{distanceSq:distanceSquared(observer,c.pose)}:{})}));
  }
  return {step,reset};
}
