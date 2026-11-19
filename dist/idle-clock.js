import {presence} from './lifestyle.js';
const fast=kind=>kind==='away'||kind==='sleep';
const workPeriod=kind=>fast(kind)||kind==='remote';
export function transitionSpeed(from,to,speed,life){
 if(from===to||speed===0)return speed;
 if(workPeriod(from)&&!workPeriod(to))return life.pauseOnReturn?0:life.normalSpeed;
 if(fast(to)&&life.autoSpeed!==false)return life.awaySpeed;
 return speed;
}

// Wall time is shared by the visible animation and the background heartbeat.
// Throttled tabs catch up in bounded slices, with schedule changes evaluated
// minute by minute, so one fast night cannot accelerate the following day.
export class IdleClock{
 constructor({getState,advance,getSpeed,setSpeed,onReturn=()=>{},onCritical=()=>{},stepBudget=2400}){Object.assign(this,{getState,advance,getSpeed,setSpeed,onReturn,onCritical,stepBudget});this.last=null;this.fraction=0;this.pending=0;}
 reset(now){this.last=now;this.fraction=0;this.pending=0;}
 tick(now,{hidden=false,menu=false}={}){
  if(this.last===null){this.last=now;return 0;}
  const elapsed=Math.max(0,(now-this.last)/1000);this.last=now;const s=this.getState();
  if(menu||hidden&&s.life.backgroundProgress===false||this.getSpeed()<=0){this.pending=0;return 0;}
  this.pending+=elapsed;let steps=0;
  while(this.pending>1e-8&&steps<this.stepBudget){const speed=this.getSpeed();if(speed<=0){this.pending=0;break;}const rate=speed/60,seconds=(1-this.fraction)/rate;if(this.pending+1e-9<seconds){this.fraction+=this.pending*rate;this.pending=0;break;}this.pending=Math.max(0,this.pending-seconds);this.fraction=0;const before=presence(s).kind;this.advance(s,1);steps++;const after=presence(s).kind;
   if(before!==after){const changed=transitionSpeed(before,after,speed,s.life);if(changed!==speed)this.setSpeed(changed);if(workPeriod(before)&&!workPeriod(after))this.onReturn(changed===0);}
   if(s.autoPaused){this.setSpeed(0);this.pending=0;this.onCritical();break;}
   if(this.getSpeed()===0){this.pending=0;break;}
  }
  return steps;
 }
}
