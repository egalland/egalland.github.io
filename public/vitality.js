import {activeBleeding, bleedDamageBetween, bleedingAfterHit, hitSeverity} from './bleeding.js';

export const maxHealth=100;
export const koDurationMs=6200;
const finite=(v,fallback)=>Number.isFinite(v)?v:fallback;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function impactEvent(at,angle,force,duration,seed){
  return {at,until:at+clamp(duration,250,8000),angle:Math.atan2(Math.sin(angle),Math.cos(angle)),force:clamp(force,0,1),seed:seed&65535};
}
export function pedestrianDamage(speed){return clamp(Math.round((Math.abs(speed)-1)*2.9),3,66);}
export function crashDamage(speed){return clamp(Math.round((Math.abs(speed)-8)*1.65),0,43);}
export function createVitality(initial,now=Date.now()){
  let health,medkits,downUntil,protectedUntil,hitAt,medicAt,lastTick,fall,lifeEvent=null,serial=0;
  let bleeding=null,bleedThrough=0;
  function settleBleeding(clock){
    if(!bleeding||clock<bleedThrough)return;
    const loss=bleedDamageBetween(bleeding,bleedThrough,clock);
    if(loss&&health>1)health=Math.max(1,health-loss);
    bleedThrough=clock;
    if(clock>=bleeding.until)bleeding=null;
  }
  function restore(s,clock){
    const valid=s&&typeof s==='object'?s:{};
    const boundTime=(v,after)=>clamp(finite(v,0),0,clock+after);
    downUntil=boundTime(valid.downUntil,koDurationMs);
    health=clamp(finite(valid.health,100),0,100);
    if(health===0&&!downUntil)health=100;
    medkits=Math.trunc(clamp(finite(valid.medkits,1),0,1));
    protectedUntil=boundTime(valid.protectedUntil,3000);hitAt=boundTime(valid.hitAt,0);medicAt=boundTime(valid.medicAt,2500);lastTick=clock;
    const r=valid.ragdoll;
    fall=r&&[r.at,r.until,r.angle,r.force,r.seed].every(Number.isFinite)&&r.at<=clock+250&&r.until>clock&&r.until-r.at>=100&&r.until-r.at<=8000
      ?impactEvent(r.at,r.angle,r.force,r.until-r.at,r.seed):null;
    const saved=valid.bleeding;
    bleeding=health>0&&saved?.at<=clock+500?activeBleeding(saved,saved.at):null;
    bleedThrough=bleeding?clamp(finite(valid.bleedThrough,bleeding.at),bleeding.at,bleeding.until):clock;
    settleBleeding(clock);
    lifeEvent=null;
  }
  function report(kind,amount,cause){lifeEvent={id:++serial,kind,amount:Math.round(amount),cause};}
  function snapshot(){return {health,medkits,downUntil,protectedUntil,hitAt,medicAt,ragdoll:fall,bleeding,bleedThrough};}
  function state(clock){
    const down=health===0,gettingUp=protectedUntil>clock;
    const regenerating=health<100&&!down&&hitAt>0&&clock-hitAt>11000;
    const wound=activeBleeding(bleeding,clock);
    return {health,maxHealth,medkits,lifeEvent,bleeding:wound,bleedSeconds:wound?Math.ceil((wound.until-clock)/1000):0,canHeal:medkits>0&&health<100&&!down&&!fall,
      downSeconds:down?Math.max(0,Math.ceil((downUntil-clock)/1000)):0,
      recovering:!down&&(gettingUp||regenerating),
      lifeState:down?'down':gettingUp?'recovering':health<=25?'critical':health<65?'hurt':regenerating?'recovering':'healthy'};
  }
  function hurt(amount,{at,angle=0,force=0,cause='weapon',weapon,canFall=true,seed=0}){
    if(!Number.isFinite(amount)||!Number.isFinite(at)||amount<=0||health===0||at<protectedUntil)return false;
    settleBleeding(at);
    const before=health,stagger=clamp(force+(hitAt>0&&at-hitAt<850 ? .16 : 0),0,1);
    health=Math.max(0,health-Math.min(100,amount));hitAt=at;
    const down=health===0;
    const severity=hitSeverity(cause,amount,weapon);
    bleeding=down?null:bleedingAfterHit(bleeding,severity,at);
    bleedThrough=severity?at:Math.max(bleedThrough,at);
    if(down){downUntil=at+koDurationMs;fall=impactEvent(at,angle,Math.max(.75,force),koDurationMs,seed);}
    else if(canFall&&stagger>=.36&&!(fall?.until>at))fall=impactEvent(at,angle,stagger,600+stagger*860,seed);
    report(down?'down':'damage',before-health,cause);return true;
  }
  function aid(clock,medic=false){
    settleBleeding(clock);
    if(health===0||(!medic&&(medkits===0||health===100||fall))||(medic&&clock<medicAt))return false;
    if(medic){medicAt=clock+2200;medkits=1;}else medkits=0;
    const gain=Math.min(100-health,medic?18:25);health+=gain;bleeding=null;
    if(gain)report('heal',gain,medic?'medic':'medkit');
    return true;
  }
  function tick(clock,medic=false){
    const delta=clamp((clock-lastTick)/1000,0,.25);lastTick=clock;
    settleBleeding(clock);
    if(health===0){
      if(medic&&downUntil-clock>1250){downUntil=clock+1250;if(fall)fall={...fall,until:downUntil};}
      if(clock<downUntil)return false;
      health=75;medkits=1;protectedUntil=clock+2800;hitAt=clock;downUntil=0;fall=null;
      report('revive',health,medic?'medic':'rescue');return true;
    }
    if(fall&&clock>=fall.until)fall=null;
    if(medic)aid(clock,true);
    if(health<100&&clock-hitAt>11000)health=Math.min(100,health+delta*1.65);
    return false;
  }
  restore(initial,now);
  return {state,snapshot,restore,hurt,aid,tick,
    get health(){return health;},get down(){return health===0;},get ragdoll(){return fall;},get downUntil(){return downUntil;},get bleeding(){return bleeding;}};
}

export function npcHealthAt(state,now){
  if(!state||!Number.isFinite(state.health))return 100;
  if(state.downUntil>now)return 0;
  const recovering=state.health===0,from=recovering?state.downUntil:state.healthAt;
  const loss=bleedDamageBetween(state.bleeding,from,now);
  const base=recovering?65:Math.max(Math.min(state.health,1),state.health-loss);
  return clamp(base+Math.max(0,now-finite(from,now)-10000)*.004,0,100);
}
