export const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
export const mix=(a,b,t)=>a+(b-a)*t;
export const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
export const PROJECT_STARTS=[1,3,6,8,10,13,14];
export const LAST_SCENE=16;
export const projectFor=i=>i<1||i>=LAST_SCENE?-1:PROJECT_STARTS.findLastIndex(start=>start<=i);
export const nextProjectFor=i=>PROJECT_STARTS.find(start=>start>i)??(i<LAST_SCENE?LAST_SCENE:0);
// The gesture selects a destination. The formation then completes on its own clock.
export function magneticDestination(position,direction,last=LAST_SCENE){
 const rounded=direction>0?Math.ceil(position-.09):direction<0?Math.floor(position+.09):Math.round(position);
 return clamp(rounded,0,last);
}
export function formationProgress(elapsed,duration,seed=0){
 if(duration===0)return 1;
 return smooth((elapsed/duration-seed*.1)/.9);
}
export function cursorForce(dx,dy,radius,attraction=0){
 const d=Math.hypot(dx,dy);if(d>=radius)return [0,0];
 const f=Math.pow(1-d/radius,1.25),sign=mix(1,-2.4,attraction);
 return [dx/Math.max(d,1)*f*48*sign,dy/Math.max(d,1)*f*48*sign];
}
export function springStep(value,velocity,target,dt){
 const speed=velocity+((target-value)*95-velocity*17)*dt;
 return [value+speed*dt,speed];
}
