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

export function createTrafficFlow(sample){
  const cars=new Map(),permits=new Map(),refused=new Map();
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
  function exitOpen(car,bodies){
    const {body,pose,seed}=car,j=pose.junction;
    if(j.distance<stopLine+body.length-.4)return true;
    const near=bodies.filter(b=>b!==body&&distanceSquared(b,j)<(19+b.radius)**2&&Math.hypot(b.vx,b.vy)<1.5);
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
        if(touches(probe,other,.25))return false;
      }
    }
    return true;
  }
  function planJunctions(states,bodies){
    const groups=new Map();
    for(const [id,permit] of permits){
      const car=cars.get(permit.owner),j=car?.pose.junction;
      if(j&&sameCrossing(j,permit.crossing)){
        permit.clearAt=Math.max(permit.clearAt,car.distance+j.distance+clearLine+car.body.length);
      }
      if(!car||car.distance>=permit.clearAt){permits.delete(id);continue;}
      if(car.distance-permit.lastDistance>.35){permit.lastDistance=car.distance;permit.lastProgress=tick;}
      if(car.distance<permit.enterAt+.55 && tick-permit.lastProgress>3.2){
        car.yieldUntil=tick+2;permits.delete(id);
      }else groups.set(id,{crossing:permit.crossing,drivers:[]});
    }
    for(const car of states){
      const j=car.pose.junction;
      car.gate=null;
      if(!j||j.distance>27||j.distance < -clearLine-car.body.length){car.arrival=null;continue;}
      let group=groups.get(j.id);
      if(!group)for(const g of groups.values())if(sameCrossing(g.crossing,j)){group=g;break;}
      if(!group){group={crossing:j,drivers:[]};groups.set(j.id,group);}
      group.drivers.push(car);car.gate=group.crossing.id;
      // Keep arrival order while drivers wait at the stop line.
      if(!car.arrival||!sameCrossing(j,car.arrival.crossing)){
        car.arrival={crossing:j,time:tick+Math.max(0,j.distance-stopLine-car.body.length)/Math.max(2.4,car.speed)};
      }
    }
    for(const [id,group] of groups){
      if(permits.has(id))continue;
      const eligible=group.drivers.filter(car=>car.yieldUntil<=tick&&exitOpen(car,bodies));
      if(!eligible.length)continue;
      eligible.sort((a,b)=>{
        const ja=a.pose.junction,jb=b.pose.junction;
        const aInside=ja.distance<stopLine+a.body.length-.25,bInside=jb.distance<stopLine+b.body.length-.25;
        if(aInside!==bInside)return aInside?-1:1;
        if(aInside && Math.abs(ja.distance-jb.distance)>.15)return ja.distance-jb.distance;
        return a.arrival.time-b.arrival.time||byId(a.seed,b.seed);
      });
      const car=eligible[0],at=car.distance+car.pose.junction.distance;
      permits.set(id,{owner:car.seed.id,crossing:group.crossing,enterAt:at-stopLine-car.body.length,
        clearAt:at+clearLine+car.body.length,lastProgress:tick,lastDistance:car.distance});
    }
  }

  function planSpeed(car,bodies,blockedPose){
    const {pose,body,seed,spec}=car,j=pose.junction;
    let target=seed.cruiseSpeed;
    const roadBrake=Math.min(4.1,spec.brake*.45),stopping=car.speed**2/(2*roadBrake);
    if(j && j.distance>=-body.length && j.distance<32){
      const holder=permits.get(car.gate);
      if(!holder||holder.owner!==seed.id){
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
    const j=pose.junction;
    if(j&&j.distance<stopLine+body.length){
      for(const car of cars.values()){
        const occupied=car.pose.junction;
        if(occupied&&occupied.distance<stopLine+car.body.length&&sameCrossing(j,occupied))return null;
      }
      for(const permit of permits.values())if(sameCrossing(j,permit.crossing))return null;
    }
    return {seed,distance,pose,body,spec,speed,target:speed,arrival:null,yieldUntil:-1,
      stamp:checkpoint?seed.stamp:-Infinity,correction:0,roadChecked:distance,scanned:distance,roadBlock:null};
  }
  function reconcile(car,check,bodies,epoch,observer,blockedPose){
    if(check.routeId!==car.seed.routeId||!Number.isFinite(check.stamp)||check.stamp<=car.stamp)return;
    car.stamp=check.stamp;
    const speed=clamp(check.speed||0,0,car.seed.cruiseSpeed*1.3);
    const distance=check.routeDistance+clamp((epoch-check.stamp)/1000,0,.42)*speed;
    const delta=routeDelta(car,distance),dest=car.distance+delta;
    const pose=sample(car.seed.routeId,dest);
    if(!pose)return;
    const far=!observer||(distanceSquared(observer,car.pose)>24**2 && distanceSquared(observer,pose)>24**2);
    if(Math.abs(delta)>7.5 && far){
      const probe=bodyAt({...car.body},pose);
      if(!bodies.some(b=>b!==car.body&&touches(probe,b,.15))&&!blockedPose?.(pose.x,pose.y,pose.angle,car.spec)){
        car.distance=dest;car.pose=pose;bodyAt(car.body,pose);
        car.speed=speed;car.correction=0;car.roadChecked=dest;car.scanned=dest;car.roadBlock=null;car.arrival=null;
        for(const [id,grant] of permits)if(grant.owner===car.seed.id)permits.delete(id);
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
        planIn=planPeriod;planJunctions(states,bodies);
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
