import {contactAt,moveBody,supportAt,surfaceTop,vaultableProp} from './paris-world.js';
import {PLAYER_RADIUS} from './crowd-motion.js';

const cap=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=t=>{t=cap(t,0,1);return t*t*(3-2*t);};
const lerp=(a,b,t)=>a+(b-a)*t;
const gravity=15.2, impulse=5.75, bodyHeight=1.56;
const motionDefaults={lift:0,supportHeight:0,verticalSpeed:0,motion:'idle',motionPhase:0,stride:0,slope:0};

// The contact approach, raised crossing and landing each have a separate sweep.
// No obstacle is disabled during traversal, including the obstacle being climbed.
function samplePlan(plan,t){
  const up=smooth(t/.38),across=smooth((t-.36)/.44),down=smooth((t-.78)/.22);
  const advance=lerp(lerp(0,plan.approach,up),plan.length,across);
  return {x:plan.x+advance*plan.dx,y:plan.y+advance*plan.dy,z:lerp(lerp(plan.startZ,plan.peak,up),plan.endZ,down)};
}

export function createParkour(p,ground,gradient,{onImpact=()=>{}}={}){
  let airborne=false,grace=0,queued=0,held=false,landing=0,vertical=0,airTime=0,plan=null;
  let speedX=0,speedY=0;
  function reset(vx=0,vy=0){
    Object.assign(p,motionDefaults);
    airborne=held=false;grace=queued=landing=vertical=airTime=0;plan=null;speedX=vx;speedY=vy;
  }
  reset();
  function setPressed(pressed){
    if(pressed&&!held)queued=.15;
    held=pressed;
  }
  function clearInput(){held=false;queued=0;}
  function interrupt(){
    clearInput();speedX=speedY=0;
    if(plan){plan=null;airborne=p.lift>.01;vertical=0;airTime=0;}
  }
  const options=world=>({radius:PLAYER_RADIUS,bodyHeight,...world});
  function buildPlan(angle,world){
    if(airborne||plan)return null;
    const dx=Math.cos(angle),dy=Math.sin(angle),geometry=options(world),startZ=ground(p.x,p.y)+p.lift;
    let obstacle,reach;
    for(reach=.10;reach<=1.55;reach+=.14){
      const x=p.x+dx*reach,y=p.y+dy*reach;
      obstacle=contactAt(x,y,{...geometry,footZ:p.lift,footWorldZ:p.lift>.01?startZ:null});
      if(obstacle)break;
    }
    if(!obstacle?.id || obstacle.taperCenter)return null;
    const vault=vaultableProp(obstacle)&&!obstacle.climbable;
    if(!vault && !obstacle.climbable && obstacle.type!=='building')return null;
    const hitX=p.x+reach*dx,hitY=p.y+reach*dy;
    const top=surfaceTop(obstacle,hitX,hitY),rise=ground(hitX,hitY)+top-startZ;
    if(rise<.12||rise>(vault?1.34:2.22))return null;
    // Favor a firm foothold inside the roof edge. For a vault, both feet must
    // be beyond the far side before descending to the pavement.
    for(let length=reach+PLAYER_RADIUS+.17;length<reach+(vault?3.7:3.15);length+=.15){
      const x=p.x+dx*length,y=p.y+dy*length;
      const support=supportAt(x,y,ground(hitX,hitY)+top-ground(x,y)+.035,geometry);
      if(vault ? support.id===obstacle.id : support.id!==obstacle.id)continue;
      if(!vault && obstacle.type==='pickup' && ground(x,y)+support.top<ground(obstacle.x,obstacle.y)+obstacle.h-.02)continue;
      const endZ=ground(x,y)+support.top;
      if(Math.abs(endZ-startZ)>2.27 || contactAt(x,y,{...geometry,footZ:support.top}))continue;
      const peak=Math.max(startZ,endZ,ground(hitX,hitY)+top)+ (vault ? .23 : .11);
      const trial={kind:vault?'vault':'climb',id:obstacle.id,dx,dy,x:p.x,y:p.y,startZ,endZ,peak,length,
        approach:Math.max(0,reach-.18),duration:vault ? .62+.038*length : .82+.07*rise,time:0,hitX,hitY};
      let clear=true;
      for(let n=1;n<=20;n++){
        const q=samplePlan(trial,n/20);
        if(contactAt(q.x,q.y,{...geometry,footZ:q.z-ground(q.x,q.y)})){clear=false;break;}
      }
      if(clear)return trial;
      // A denser landing can occasionally clear an edge; keep probing.
    }
    return null;
  }
  function onLanding(impact){
    if(impact>1.35)landing=cap(.12+impact*.016,.13,.25);
    airborne=false;airTime=0;vertical=0;grace=.09;
    if(impact>8.5)onImpact(impact);
  }
  function step(dt,input,world){
    const oldX=p.x,oldY=p.y,oldGround=ground(p.x,p.y),oldZ=oldGround+p.lift;
    const raw=Math.hypot(input.x,input.y),magnitude=Math.min(raw,1);
    const dx=raw?input.x/raw:0,dy=raw?input.y/raw:0;
    const facing=magnitude>.12?Math.atan2(dy,dx):input.angle;
    const geometry=options(world);
    if(!airborne&&!plan)grace=.09;
    if(queued>0 && !plan && (!airborne||grace>0)){
      plan=buildPlan(facing,world);queued=0;grace=0;landing=0;
      if(!plan){airborne=true;vertical=impulse;airTime=0;}
    }
    queued=Math.max(0,queued-dt);grace=Math.max(0,grace-dt);landing=Math.max(0,landing-dt);
    if(plan){
      plan.time+=dt;
      const phase=Math.min(1,plan.time/plan.duration),point=samplePlan(plan,phase);
      const lift=point.z-ground(point.x,point.y);
      const target=contactAt(plan.hitX,plan.hitY,{...geometry,footZ:plan.startZ-ground(plan.hitX,plan.hitY)});
      if(target?.id===plan.id && !contactAt(point.x,point.y,{...geometry,footZ:lift})){
        p.x=point.x;p.y=point.y;p.lift=Math.max(0,lift);
        p.supportHeight=p.lift>.025?Math.min(p.lift,supportAt(p.x,p.y,p.lift+.01,geometry).top):0;
        p.motion=plan.kind;p.motionPhase=phase;p.verticalSpeed=(point.z-oldZ)/dt;p.slope=0;p.stride=0;
        const heading=Math.atan2(plan.dy,plan.dx);
        speedX=(p.x-oldX)/dt;speedY=(p.y-oldY)/dt;
        if(phase>=1){
          const endSpeed=Math.min(magnitude*(input.sprint?6.4:3.45),plan.kind==='vault'?2.5:1);
          speedX=plan.dx*endSpeed;speedY=plan.dy*endSpeed;plan=null;onLanding(2);
        }
        return {vx:speedX,vy:speedY,actual:Math.hypot(p.x-oldX,p.y-oldY)/dt,heading};
      }
      // A passing car, a broken prop or a newly occupied landing interrupts the move.
      plan=null;airborne=true;vertical=0;airTime=0;
    }
    const slope=gradient(p.x,p.y);
    const grade=cap(dx*slope.x+dy*slope.y,-.45,.45);
    p.slope+=((magnitude>.1?grade:0)-p.slope)*(1-Math.exp(-9*dt));
    const maxSpeed=(input.sprint?6.4:3.45)*cap(1-grade*.75,.72,1.12);
    const braking=magnitude<.065, reversing=speedX*dx+speedY*dy<0;
    const response=airborne?(braking ? .65 : 3.0):braking?12.2:reversing?12:8.9;
    const k=1-Math.exp(-response*dt);
    speedX+=(dx*magnitude*maxSpeed-speedX)*k;speedY+=(dy*magnitude*maxSpeed-speedY)*k;
    if(Math.hypot(speedX,speedY)<.035){speedX=0;speedY=0;}
    const result=moveBody(p.x,p.y,speedX*dt,speedY*dt,{...geometry,footZ:p.lift,footWorldZ:p.lift>.01?oldZ:null});
    if(result.hit){
      const inward=speedX*result.normalX+speedY*result.normalY;
      if(inward<0){speedX-=inward*result.normalX;speedY-=inward*result.normalY;}
    }
    p.x=result.x;p.y=result.y;
    const groundZ=ground(p.x,p.y);
    if(!airborne&&p.lift<.04&&oldZ-groundZ>.27){
      p.lift=oldZ-groundZ;airborne=true;vertical=0;airTime=0;
    }
    const support=p.lift>.015?supportAt(p.x,p.y,Math.max(0,oldZ-groundZ)+.07,geometry,PLAYER_RADIUS+.003).top:0;
    const floor=groundZ+support;
    if(!airborne&&p.lift>.03&&p.lift-support>.13){airborne=true;vertical=0;airTime=0;}
    if(airborne){
      airTime+=dt;
      const nextZ=oldZ+vertical*dt-.5*gravity*dt*dt;
      const nextLift=Math.max(0,nextZ-groundZ);
      if(vertical>0){
        const ceiling=contactAt(p.x,p.y,{...geometry,footZ:nextLift});
        const underside=ceiling?.minHeight>0?surfaceTop(ceiling,p.x,p.y)-ceiling.h+ceiling.minHeight:Infinity;
        if(Number.isFinite(underside)&&oldZ-groundZ+bodyHeight<=underside+.02){
          vertical=0;p.lift=Math.max(0,underside-bodyHeight-.003);
        }else{p.lift=nextLift;vertical-=gravity*dt;}
      }else if(nextZ<=floor+.002){p.lift=support;onLanding(-vertical);}
      else{p.lift=nextLift;vertical-=gravity*dt;}
    }else p.lift=support;
    p.supportHeight=airborne ? (support>0?Math.min(p.lift,supportAt(p.x,p.y,p.lift+.01,geometry).top):0) : p.lift;
    const actual=Math.hypot(p.x-oldX,p.y-oldY)/dt;
    p.stride=cap(actual/6.4,0,1);p.verticalSpeed=vertical;
    if(airborne){p.motion=vertical>.15?'jump':'fall';p.motionPhase=cap(airTime/(2*impulse/gravity),0,1);}
    else if(landing>0){p.motion='land';p.motionPhase=cap(1-landing/.25,0,1);}
    else{p.motion=actual>.1?(input.sprint&&actual>4?'run':'walk'):'idle';p.motionPhase=0;}
    return {vx:speedX,vy:speedY,actual,heading:Math.atan2(speedY,speedX),boundary:result.touched?.id==='boundary'};
  }
  return {step,reset,setPressed,clearInput,interrupt,get grounded(){return !airborne&&!plan;},
    hint:(angle,world)=>buildPlan(angle,world)?.kind||'jump'};
}
