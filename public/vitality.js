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
    lifeEvent=null;
  }
  function report(kind,amount,cause){lifeEvent={id:++serial,kind,amount:Math.round(amount),cause};}
  function snapshot(){return {health,medkits,downUntil,protectedUntil,hitAt,medicAt,ragdoll:fall};}
  function state(clock){
    const down=health===0,gettingUp=protectedUntil>clock;
    const regenerating=health<100&&!down&&hitAt>0&&clock-hitAt>11000;
    return {health,maxHealth,medkits,lifeEvent,canHeal:medkits>0&&health<100&&!down&&!fall,
      downSeconds:down?Math.max(0,Math.ceil((downUntil-clock)/1000)):0,
      recovering:!down&&(gettingUp||regenerating),
      lifeState:down?'down':gettingUp?'recovering':health<=25?'critical':health<65?'hurt':regenerating?'recovering':'healthy'};
  }
  function hurt(amount,{at,angle=0,force=0,cause='weapon',canFall=true,seed=0}){
    if(!Number.isFinite(amount)||!Number.isFinite(at)||amount<=0||health===0||at<protectedUntil)return false;
    const before=health,stagger=clamp(force+(hitAt>0&&at-hitAt<850 ? .16 : 0),0,1);
    health=Math.max(0,health-Math.min(100,amount));hitAt=at;
    const down=health===0;
    if(down){downUntil=at+koDurationMs;fall=impactEvent(at,angle,Math.max(.75,force),koDurationMs,seed);}
    else if(canFall&&stagger>=.36&&!(fall?.until>at))fall=impactEvent(at,angle,stagger,600+stagger*860,seed);
    report(down?'down':'damage',before-health,cause);return true;
  }
  function aid(clock,medic=false){
    if(health===0||(!medic&&(medkits===0||health===100||fall))||(medic&&clock<medicAt))return false;
    if(medic){medicAt=clock+2200;medkits=1;}else medkits=0;
    const gain=Math.min(100-health,medic?18:25);health+=gain;
    if(gain)report('heal',gain,medic?'medic':'medkit');
    return true;
  }
  function tick(clock,medic=false){
    const delta=clamp((clock-lastTick)/1000,0,.25);lastTick=clock;
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
    get health(){return health;},get down(){return health===0;},get ragdoll(){return fall;},get downUntil(){return downUntil;}};
}

export function npcHealthAt(state,now){
  if(!state||!Number.isFinite(state.health))return 100;
  if(state.downUntil>now)return 0;
  const recovering=state.health===0,from=recovering?state.downUntil:state.healthAt;
  const base=recovering?65:state.health;
  return clamp(base+Math.max(0,now-(from||now)-10000)*.004,0,100);
}
