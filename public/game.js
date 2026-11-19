import { SPAWN, destinations, districtAt, streetAt, nearbyProps, blocked, contactAt, moveBody, supportAt, routeAgents, sampleTrafficRoute, trafficVehicleAt, trafficAlternatives, getTravelPoint, paintMap } from './paris-world.js';
import { nearbyDrivableStreets } from './paris-world.js';
import { planDispatch, stepDispatch, dispatchDoor, footApproach, dispatchWorkSpot, stepDispatchFoot } from './dispatch-roads.js';
import { createDetourPlanner } from './traffic-detour.js';
import { createTrafficFlow } from './traffic-flow.js';
import { combo, meleeMoves, meleeContact, recoilPhase, recoilSeconds } from './melee.js';
import { createParkour } from './parkour.js';
import { terrainHeight, terrainGradient } from './terrain-height.js';
import { createCrowdMotion, pedestrianBody, PLAYER_RADIUS, WALKER_RADIUS } from './crowd-motion.js';
import { packTraffic, receiveTraffic } from './traffic-sync.js';
import { peerViewTime, recordPeerMotion, readPeerMotion } from './peer-motion-net.js';
import { createView } from './game-render.js';
import { nearbyWeaponDrops, weaponDrops } from './weapon-drops.js';
import { createWanted } from './wanted.js';
import { createVitality, impactEvent, npcHealthAt, pedestrianDamage, crashDamage } from './vitality.js';
import { activeBleeding, bleedingAfterHit, hitSeverity } from './bleeding.js';
import { ragdollPose } from './ragdoll.js';
import { vehicleSpec, isVehicleType, vehicleDoorways } from './vehicle-types.js';
import { weaponCatalog as weapons, starterWeapons, weaponList } from './weapon-catalog.js';
import { resolveWeaponShot } from './weapon-patterns.js';
import { effectDuration } from './weapon-effects.js';
import { createShotPlayback } from './shot-playback.js';
import { applyPropDamage, propMaxHealth, vehiclePropDamage } from './prop-damage.js';
import { chooseTouchShot, traceShot, targetHeight } from './aim-assist.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const blend=(k,dt)=>1-Math.exp(-k*dt);
const deltaAngle=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const turnTo=(a,b,k,dt)=>a+deltaAngle(a,b)*blend(k,dt);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const offset=(o,angle,length)=>({x:o.x+Math.cos(angle)*length,y:o.y+Math.sin(angle)*length});
const isInput=el=>el?.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(el?.tagName);
const weaponLabels=Object.fromEntries(weaponList.map(w=>[w.id,w.name]));
const maxShotRange=Math.max(...weaponList.map(w=>w.range));
const pickupRadius=1.9;
const PEER_RANGE=212;
const services={police:'police',firefighter:'firetruck',medic:'ambulance',swat:'swat'};
const dimensions=e=>{const {halfLength,halfWidth}=vehicleSpec(e.type);return {halfLength,halfWidth};};
const softProp=o=>!!propMaxHealth(o?.type);
function collisionBody(e){
  const {id,x,y,angle,speed}=e;
  const vx=e.vx??((speed||0)*Math.cos(angle||0)),vy=e.vy??((speed||0)*Math.sin(angle||0));
  if(e.isCar){
    const spec=vehicleSpec(e.type),parked=!e.peer&&!e.routeId&&!e.moving&&!e.occupied&&!e.id?.startsWith('unit-')&&!spec.openSeat;
    return {id,x,y,angle,vx,vy,speed,isCar:true,type:e.type,...dimensions(e),h:spec.height,climbable:parked,standable:parked};
  }
  return {...pedestrianBody(e),lift:e.lift||0};
}

export function createGame({canvas,minimap,net,onState=()=>{},onNotice=()=>{},onAimLock=()=>{},initialPursuit=null,initialVitality=null,loadout=[],onLoadoutChange=()=>{},buildView=createView}){
  const p={...SPAWN,id:'local',type:'fox',health:100,wanted:0,walk:0,angle:SPAWN.angle||0,moving:false};
  const traversal=createParkour(p,terrainHeight,terrainGradient);
  const view=buildView(canvas,SPAWN,onNotice),keys=new Set(),destroyed=new Set(),peers=new Map(),carsShared=new Map(),npcShared=new Map(),incidents=new Map(),bubbles=new Map();
  const propHealth=new Map(),confirmedProps=new Map(),soloProps=new Map(),pendingImpacts=new Map(),rewardedProps=new Set();
  let propDamageRevision=0,impactNumber=0;
  const traffic=createTrafficFlow(sampleTrafficRoute,createDetourPlanner(trafficAlternatives,sampleTrafficRoute));
  const crowd=createCrowdMotion({
    blocked:(x,y,r)=>blocked(x,y,r,destroyed),
    move:(x,y,dx,dy,r)=>moveBody(x,y,dx,dy,{radius:r,destroyed})
  });
  const streetBlocked=(x,y,angle,spec)=>!!contactAt(x,y,{angle,halfLength:spec.halfLength,halfWidth:spec.halfWidth,destroyed});
  let trafficPeers={checkpoints:[],followers:new Set()};
  let drives=[],trafficSnapshot=null;
  const owned=new Set(starterWeapons);
  const ownedWeapons=()=>Object.keys(weapons).filter(k=>owned.has(k));
  function addLoadout(list){
    if(Array.isArray(list))for(const k of list)if(typeof k==='string'&&Object.hasOwn(weapons,k))owned.add(k);
  }
  addLoadout(loadout);
  const pursuit=createWanted(initialPursuit),pickupWait=new Map(),pendingPickup=new Set();
  p.wanted=pursuit.state().level;
  let wantedEvent=null,actionNumber=0,nearPickup=null,pickups=[],pickupArea=[],pickupCenter=null,noticePickup=null;
  const ammo=Object.fromEntries(Object.entries(weapons).map(([k,v])=>[k,v.mag]));
  let weapon='pistol',car=null,nearCar=null,speed=0,vx=0,vy=0,steer=0,turn=0,impact=0,shootPose=0,braking=false;
  let yaw=p.angle,pitch=.13,drag=null,freeLookUntil=0,cameraSnap=true,stickX=0,stickY=0,aimX=0,aimY=0,fireHeld=false,sprintHeld=false,paused=false;
  let time=0,epoch=net?.serverTime?.()||Date.now(),networkTick=0,hudTick=0,mapTick=0,popTick=0,trafficTick=0,routeClock=0,lastState='',ready=false,sound=false,audio=null;
  let reloading=0,cooldown=0,contactLock=0,actionAt=-2,score=0,arrivalChecked=false,isRunning=true;
  let roadMotion=null;
  let actors=[],cars=[],routeActors=[],routeCars=[],remotes=[],obstacles=[],previousFrame=performance.now(),frameId;
  let driftX=0,driftY=0,aimPointer=null,shotFacingUntil=-1,meleeCameraAim=false,levelPlace=null,streetName=streetAt(p.x,p.y),streetTime=-1;
  let travelClaim=null,touchFireHeld=false,aimAssist=true,aimLock=null,lockPoint=null,markImpactUntil=0,nextLockCheck=0,heldSource='pointer';
  const life=createVitality(initialVitality,epoch),receivedHits=new Map();
  let acceptShotsFrom=life.snapshot().protectedUntil||0;
  p.health=life.health;
  let appearance=null,impactSerial=0,trafficImpactAt=0;
  let swing=null,comboIndex=0,chainUntil=-1,meleeHeld=false,swingQueued=false,lastSwingStamp=0,selfRecoil=null;
  const witnessedSwings=new Map(),witnessedRecoils=new Map(),witnessedShots=new Map();
  const shotPlayback=createShotPlayback();
  const incapacitated=()=>life.down||!!life.ragdoll;
  const emit=(type,data)=>net?.emit?.(type,data);
  function publish(){
    // Traffic followers advance along known routes between these checkpoints.
    // Keep local aiming and player movement independent of this slower stream.
    if(!drives.length)trafficSnapshot=null;
    else if(!trafficSnapshot||epoch-trafficSnapshot.at>=300||epoch<trafficSnapshot.at)
      trafficSnapshot=packTraffic(drives,p,trafficPeers.followers,epoch);
    net?.publish?.({x:p.x,y:p.y,angle:p.angle,vx,vy,moving:p.moving,sprinting:p.sprinting,shooting:shootPose>.6,
      melee:swing?{kind:swing.kind,started:swing.started,angle:deltaAngle(0,swing.angle)}:undefined,recoil:recoilPhase(selfRecoil,epoch)?{at:selfRecoil.at,angle:selfRecoil.angle,force:selfRecoil.force}:undefined,
      walk:p.walk,lift:p.lift,verticalSpeed:p.verticalSpeed,motion:p.motion,motionPhase:p.motionPhase,stride:p.stride,slope:p.slope,turn,traffic:trafficSnapshot||undefined,type:'fox',health:Math.ceil(p.health),downUntil:life.downUntil,ragdoll:life.ragdoll,bleeding:life.bleeding,appearance,wanted:p.wanted,weapon,
      speed:car?speed:Math.hypot(vx,vy),vehicle:car&&!travelClaim?{...car,x:p.x,y:p.y,angle:p.angle,moving:Math.abs(speed)>.2,speed}:null});
  }
  function unlock(){if(!sound)return;try{audio ||=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{}}
  function tone(hz,seconds=.08,wave='triangle',volume=.04,end=hz){
    if(!sound||!audio||audio.state!=='running')return;
    const t=audio.currentTime,o=audio.createOscillator(),g=audio.createGain();o.type=wave;o.frequency.setValueAtTime(hz,t);o.frequency.exponentialRampToValueAtTime(Math.max(16,end),t+seconds);
    g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.001,t+seconds);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+seconds+.02);
  }
  function district(){
    const d=districtAt(p.x,p.y);return typeof d==='string'?d:d?.name||d?.district||'Paris';
  }
  function sendHud(force=false){
    if(force||time-streetTime>.64){streetName=streetAt(p.x,p.y);streetTime=time;}
    const wanted=pursuit.state();
    const traversalReady=!paused&&!car&&!incapacitated()&&traversal.grounded;
    const traversalAction=traversalReady?traversal.hint(p.angle,{destroyed,colliders:obstacles}):'jump';
    const state={traversalReady,traversalAction,...life.state(epoch),health:Math.ceil(life.health),vehicleName:car?vehicleSpec(car.type).label:'',nearVehicleName:nearCar?vehicleSpec(nearCar.type).label:'',wanted:p.wanted,wantedPoints:wanted.points,wantedProgress:wanted.progress,wantedEvent,ownedWeapons:ownedWeapons(),nearPickup,district:district(),street:streetName,weapon,ammo:Number.isFinite(ammo[weapon])?ammo[weapon]:'∞',
      maxAmmo:Number.isFinite(weapons[weapon].mag)?weapons[weapon].mag:'∞',nearVehicle:!!nearCar,inVehicle:!!car,speed:Math.round(Math.abs(speed)*3.6),score,
      reloading:reloading>0,ready,graphics:view.mode||(view.available?'webgl':'unavailable')};
    const packed=JSON.stringify(state);if(force||packed!==lastState){onState(state);lastState=packed;}
  }
  function dispatch(kind){
    const id='unit-'+kind+'-'+(net?.id||'self'),old=incidents.get(id);
    if(old&&old.level>=p.wanted&&epoch-old.started<6500&&dist(old,p)<14)return;
    const d={id,kind,x:p.x,y:p.y,started:epoch,level:p.wanted};
    incidents.set(id,d);emit('npc',d);
  }
  function dispatchPursuit(){
    for(const role of (p.wanted>=3?['police','swat']:p.wanted?['police']:[])){
      const old=incidents.get('unit-'+role+'-'+(net?.id||'self'));
      if(!old||old.level<p.wanted||epoch-old.started>25500||dist(old,p)>70)dispatch(role);
    }
  }
  function recordAction(action){
    const result=pursuit.add(action,time);
    p.wanted=result.level;
    if(result.lastGain)wantedEvent={id:++actionNumber,action,points:Math.round(result.lastGain*10)/10};
    if(action==='destroy')dispatch('firefighter');
    if(['hitCivilian','hitOfficer','hitPlayer'].includes(action))dispatch('medic');
    dispatchPursuit();
  }
  function refreshProp(o){
    const maxHealth=propMaxHealth(o.type);
    if(!maxHealth)return;
    const base=soloProps.get(o.id)||confirmedProps.get(o.id);
    const before=base?.health??maxHealth;
    let pendingDamage=0;
    for(const item of pendingImpacts.values())if(item.prop.id===o.id&&item.predict)pendingDamage+=item.damage;
    // Keep the final thread and its collider until the world's lethal hit is confirmed.
    const health=before===0?0:Math.max(1,before-pendingDamage);
    const previous=propHealth.get(o.id);
    if(health===(previous?.health??maxHealth))return;
    if(health===0)destroyed.add(o.id);
    else if(previous?.health===0)destroyed.delete(o.id);
    if(health===maxHealth)propHealth.delete(o.id);
    else propHealth.set(o.id,{id:o.id,type:o.type,x:o.x,y:o.y,health,maxHealth});
    propDamageRevision++;
  }
  function rewardProp(id){
    if(rewardedProps.has(id))return false;
    rewardedProps.add(id);score+=10;return true;
  }
  function propEffect(kind,o,angle){
    if(dist(o,p)<125)view.effect(kind,o.x,o.y,angle||0,0,{type:o.type,health:o.health,maxHealth:o.maxHealth});
  }
  function settlePropImpact(impactId,broken){
    const item=pendingImpacts.get(impactId);
    if(!item)return;
    pendingImpacts.delete(impactId);refreshProp(item.prop);
    item.finish(!!broken&&rewardProp(item.prop.id));
  }
  function confirmProp(d){
    const maxHealth=propMaxHealth(d?.type);
    if(!maxHealth||!d.id||![d.x,d.y,d.health].every(Number.isFinite)||d.health<0||d.health>maxHealth)return false;
    if(d.health>=(confirmedProps.get(d.id)?.health??maxHealth))return false;
    confirmedProps.set(d.id,{id:d.id,type:d.type,x:d.x,y:d.y,health:d.health,maxHealth});
    refreshProp(d);return true;
  }
  function syncPropDamage(world){
    if(net?.status==='online'){
      if(soloProps.size){
        const previous=[...soloProps.values()];soloProps.clear();
        for(const item of previous)refreshProp(item);
      }
      for(const item of Object.values(world.propHealth||{}))confirmProp(item);
    }
    for(const id of world.destroyed||[])destroyed.add(id);
    for(const item of pendingImpacts.values())if(item.predict&&time>=item.expires){
      // A slow reply may still award the finishing hit after the provisional mark fades.
      item.predict=false;refreshProp(item.prop);
    }
  }
  function damageProp(o,amount,details,angle,finish){
    if(!softProp(o)||!o.id||destroyed.has(o.id)){finish(false);return;}
    const result=applyPropDamage(o.type,(soloProps.get(o.id)||confirmedProps.get(o.id))?.health,amount);
    if(!result?.damage){finish(false);return;}
    const prop={id:o.id,type:o.type,x:o.x,y:o.y};
    if(net?.status!=='online'){
      const record={...prop,...result};soloProps.set(o.id,record);refreshProp(o);
      propEffect(result.health===0?'propBreak':'propHit',record,angle);
      finish(result.health===0&&rewardProp(o.id));return;
    }
    const impactId='p'+Math.round(epoch).toString(36)+'-'+(++impactNumber).toString(36);
    const request={...prop,...details,damage:amount,angle,impactId};
    pendingImpacts.set(impactId,{prop,damage:amount,finish,predict:true,expires:time+5});
    if(emit('propDamage',request)===false){settlePropImpact(impactId,false);return;}
    refreshProp(prop);
    if(pendingImpacts.has(impactId))propEffect('propHit',propHealth.get(o.id)||{...prop,...result},angle);
  }
  function vandalism(broken){if(broken)recordAction('destroy');}
  function nextSeed(){return ((++impactSerial*32719)^Math.round(epoch))&65535;}
  function fallDirection(actor,preferred){
    const colliders=cars.filter(v=>dist(v,actor)<7).map(collisionBody);
    const opt={radius:.2,height:.4,destroyed,colliders};
    let best=preferred,clearance=0;
    for(const delta of [0,-.72,.72,-1.49,1.49,-2.25,2.25,Math.PI]){
      const heading=preferred+delta;let reach=.25;
      for(;reach<=1.65;reach+=.2){
        const q=offset(actor,heading,reach);
        if(contactAt(q.x,q.y,opt))break;
      }
      if(reach>1.65)return heading;
      if(reach>clearance){clearance=reach;best=heading;}
    }
    return best;
  }
  function rememberNpc(d,canonical=false){
    if(!d?.id||!Number.isFinite(d.x)||!Number.isFinite(d.y))return;
    const prev=npcShared.get(d.id),stamp=d.healthAt||d.stunnedUntil||0;
    if(stamp+90000<epoch||(d.stunnedUntil<=epoch&&npcHealthAt(d,epoch)>=100))return;
    if(!prev||stamp>(prev.healthAt||prev.stunnedUntil||0)||(canonical&&stamp===(prev.healthAt||prev.stunnedUntil||0)))npcShared.set(d.id,d);
  }
  function hurtNpc(actor,amount,angle,force,strike=null,weaponId=null){
    const old=npcShared.get(actor.id),before=npcHealthAt(old,epoch);
    if(before<=0)return false;
    const health=Math.max(0,before-amount),downUntil=health===0?epoch+6500:0;
    let fall=old?.ragdoll?.until>epoch?old.ragdoll:null;
    if(downUntil||(!fall&&force>=.36))fall=impactEvent(epoch,fallDirection(actor,angle),force,downUntil?6500:680+force*840,nextSeed());
    const cause=strike?'melee':weaponId?'weapon':'traffic';
    const bleeding=downUntil?null:bleedingAfterHit(old?.bleeding,hitSeverity(cause,amount,weaponId),epoch);
    const update={id:actor.id,x:actor.x,y:actor.y,type:actor.type,angle:actor.angle,color:actor.color,
      damage:amount,health,healthAt:epoch,downUntil,stunnedUntil:fall?.until||0,ragdoll:fall,bleeding,cause,...(weaponId?{weapon:weaponId}:{})};
    if(strike){
      const landing=knockbackEnd(actor,angle,meleeMoves[strike.kind].push,WALKER_RADIUS);
      update.recoil={at:epoch,fromX:actor.x,fromY:actor.y,angle,force};
      Object.assign(update,landing,{swingAt:strike.started,swingKind:strike.kind});
      update.stunnedUntil=Math.max(update.stunnedUntil,epoch+recoilSeconds*1000);
    }
    npcShared.set(actor.id,update);emit('npc',update);
    actor.health=health;actor.stunned=!!fall;actor.bleeding=bleeding;return true;
  }
  function trafficContact(v,person,margin=.1){
    const dx=person.x-v.x,dy=person.y-v.y,c=Math.cos(v.angle),s=Math.sin(v.angle),shape=vehicleSpec(v.type);
    return Math.abs(dx*c+dy*s)<shape.halfLength+margin&&Math.abs(dy*c-dx*s)<shape.halfWidth+margin;
  }
  function availableDrops(list){
    const shared=net?.world?.().pickups||{};
    return list.filter(drop=>{
      const wait=pickupWait.get(drop.id);
      if(wait&&Math.max(wait.availableAt||0,wait.retryAt||0)<=epoch)pickupWait.delete(drop.id);
      return !(shared[drop.id]>epoch)&&!(wait?.availableAt>epoch);
    });
  }
  function pickupNotice(id,text){
    if(noticePickup!==id){noticePickup=id;onNotice(text);}
  }
  async function collect(drop){
    // One claim per item can be outstanding, including across temporary disconnects.
    pendingPickup.add(drop.id);
    publish();
    try{
      const receipt=await net.claimPickup(drop.id,drop.weapon);
      if(!isRunning)return;
      if(Number.isFinite(receipt?.availableAt)&&receipt.availableAt>epoch){
        pickupWait.set(drop.id,{availableAt:receipt.availableAt});
      }
      if(!receipt?.ok){
        if(receipt?.availableAt>epoch)pickupNotice(drop.id,'Un autre joueur a déjà ramassé cet objet.');
        else{
          pickupWait.set(drop.id,{retryAt:epoch+1700});
          pickupNotice(drop.id,'Ramassage en attente de connexion au monde partagé.');
        }
        return;
      }
      nearPickup=null;
      const isNew=!owned.has(drop.weapon);
      owned.add(drop.weapon);
      ammo[drop.weapon]=weapons[drop.weapon].mag;
      if(isNew){
        equipOwned(drop.weapon);onLoadoutChange(ownedWeapons());
      }else if(weapon===drop.weapon)reloading=0;
      if(!(receipt.availableAt>epoch))pickupWait.set(drop.id,{availableAt:epoch+1700});
      onNotice(weaponLabels[drop.weapon]+(isNew?' · Arme ramassée et équipée.':' · Chargeur rempli.'));
      sendHud(true);
    }catch{
      if(!isRunning)return;
      pickupWait.set(drop.id,{retryAt:epoch+1700});
      pickupNotice(drop.id,'Ramassage en attente de connexion au monde partagé.');
    }finally{
      pendingPickup.delete(drop.id);
    }
  }
  function updatePickups(){
    if(!pickupCenter||dist(pickupCenter,p)>12){
      pickupCenter={x:p.x,y:p.y};pickupArea=nearbyWeaponDrops(p.x,p.y,115);
    }
    pickups=availableDrops(pickupArea);
    nearPickup=null;
    if(paused||car||incapacitated()||!traversal.grounded||p.lift>.8){noticePickup=null;return;}
    let closest=null,closestDistance=pickupRadius;
    for(const drop of pickups){
      if(owned.has(drop.weapon)&&ammo[drop.weapon]>=weapons[drop.weapon].mag)continue;
      const distance=dist(drop,p);
      if(distance<=closestDistance){closest=drop;closestDistance=distance;}
    }
    if(!closest){noticePickup=null;return;}
    const online=net?.status==='online'&&typeof net.claimPickup==='function';
    nearPickup={id:closest.id,weapon:closest.weapon,distance:Math.round(closestDistance*10)/10,online};
    if(!online){
      pickupNotice(closest.id,'Ramassage disponible à la reconnexion au monde partagé.');return;
    }
    if(pendingPickup.has(closest.id)||pickupWait.get(closest.id)?.retryAt>epoch)return;
    void collect(closest);
  }
  function clearAimLock(){
    aimLock=null;markImpactUntil=0;
    if(lockPoint){onAimLock(null);lockPoint=null;}
  }
  function drawAimLock(){
    if(!aimLock)return;
    let target=aimLock;
    if(aimLock.hitKind==='npc')target=actors.find(a=>a.id===aimLock.id&&!a.stunned);
    if(aimLock.hitKind==='peer')target=remotes.find(a=>a.id===aimLock.id);
    if(aimLock.hitKind==='prop'&&destroyed.has(aimLock.id))target=null;
    // A falling character or vanished prop still gets a short, visible confirmation at its impact point.
    if(!target&&time<markImpactUntil)target=aimLock;
    if(!target){clearAimLock();return;}
    const angle=Math.atan2(target.y-p.y,target.x-p.x);
    if(Math.abs(deltaAngle(yaw,angle))>13*Math.PI/180){clearAimLock();return;}
    if(target!==aimLock&&time>=nextLockCheck){
      nextLockCheck=time+.12;
      if(shotScene(weapons[weapon].range).trace(angle).hit?.id!==target.id){clearAimLock();return;}
    }
    aimLock.x=target.x;aimLock.y=target.y;aimLock.lift=target.lift;
    const point=view.projectTarget?.(target.x,target.y,targetHeight(aimLock));
    if(!point){clearAimLock();return;}
    if(!lockPoint||Math.abs(point.x-lockPoint.x)+Math.abs(point.y-lockPoint.y)>.0008){
      lockPoint={x:point.x,y:point.y};onAimLock(lockPoint);
    }
  }
  function resetInputs(){
    traversal.clearInput();swing=null;swingQueued=meleeHeld=false;chainUntil=-1;keys.clear();fireHeld=touchFireHeld=sprintHeld=false;stickX=stickY=aimX=aimY=0;
    drag=null;driftX=driftY=0;aimPointer=null;shotFacingUntil=-1;meleeCameraAim=false;clearAimLock();
  }
  function closestBoardableCar(){
    if(!traversal.grounded||p.lift>.5)return null;
    let closest=null,best=4.4;
    for(const v of cars){
      if(dist(p,v)>vehicleSpec(v.type).halfLength+5)continue;
      for(const door of vehicleDoorways(v)){
        const distance=dist(door,p);
        if(distance<best){best=distance;closest=v;}
      }
    }
    return closest;
  }
  function dropCar(denied=false){
    if(!car)return true;
    const exits=vehicleDoorways({...p,type:car.type},.87);
    const geometry={radius:PLAYER_RADIUS,destroyed,colliders:obstacles,ignoreId:car.id};
    const clear=exits.find(q=>!contactAt(q.x,q.y,geometry));
    if(!clear&&!denied){onNotice('Les portières sont bloquées. Avance un peu.');return false;}
    if(!denied&&(!travelClaim||travelClaim.sent)){const record={...car,x:p.x,y:p.y,angle:p.angle,moving:false,occupied:false,speed:0,owner:''};
      carsShared.set(car.id,{...record,protect:epoch+1600});emit('vehicle',record);}
    if(clear){p.x=clear.x;p.y=clear.y;}
    traversal.reset();travelClaim=null;car=null;speed=vx=vy=steer=0;p.moving=false;popTick=0;publish();return true;
  }
  function resetPopulation(){
    selfRecoil=null;witnessedSwings.clear();witnessedRecoils.clear();
    witnessedShots.clear();
    traffic.reset();crowd.reset();drives=[];trafficSnapshot=null;actors=[];cars=[];routeActors=[];routeCars=[];
    trafficPeers={checkpoints:[],followers:new Set()};trafficTick=0;popTick=0;
  }
  function placeAt(place){
    const angle=place.angle??SPAWN.angle;
    const clear=travelSpot(place.x,place.y,angle,null);
    if(!clear){onNotice('Le point d’arrivée est encombré.');return false;}
    if(car&&!dropCar())return false;
    acceptShotsFrom=Math.max(acceptShotsFrom,Math.floor(net?.serverTime?.()??epoch));
    traversal.reset();p.x=clear.x;p.y=clear.y;p.angle=angle;p.moving=false;p.sprinting=false;
    yaw=p.angle;pitch=.13;vx=vy=speed=turn=0;cameraSnap=true;popTick=trafficTick=mapTick=hudTick=0;nearCar=null;
    routeClock=0;resetPopulation();resetInputs();publish();return true;
  }
  function damage(amount,angle=p.angle,force=0,cause='weapon',moveName=null){
    const direction=(!car&&force>=.18)||amount>=life.health?fallDirection(p,angle):angle;
    if(!life.hurt(amount,{at:epoch,angle:direction,force,cause,weapon:cause==='weapon'?moveName:undefined,canFall:!car,seed:nextSeed()}))return;
    if(cause==='melee'&&meleeMoves[moveName]&&!car){
      const landing=knockbackEnd(p,angle,meleeMoves[moveName].push,PLAYER_RADIUS);
      selfRecoil={at:epoch,angle,force,fromX:p.x,fromY:p.y,toX:landing.x,toY:landing.y,progress:0};
    }
    p.health=life.health;impact=1;tone(120,.14,'triangle',.05,60);
    if(life.down&&car){
      if(!travelClaim||travelClaim.sent){
        const parked={...car,x:p.x,y:p.y,angle:p.angle,moving:false,occupied:false,speed:0,owner:''};
        carsShared.set(car.id,{...parked,protect:epoch+1500});emit('vehicle',parked);
      }
      dropCar(true);
    }
    if(incapacitated()){resetInputs();traversal.interrupt();reloading=0;vx=vy=speed=0;p.moving=p.sprinting=false;}
    if(life.down){dispatch('medic');onNotice('K.O. · Les secours sont en route.');}
    publish();sendHud(true);
  }
  function useMedkit(){
    if(!life.aid(epoch)){onNotice(life.health===100?'Ta santé est au maximum.':'Approche un ambulancier pour obtenir une trousse.');return;}
    p.health=life.health;tone(520,.16,'sine',.04,730);publish();sendHud(true);
  }
  function interact(){
    if(paused||incapacitated()||time-actionAt<.27)return;
    actionAt=time;unlock();
    if(car){if(dropCar())tone(165,.12);return;}
    if(!traversal.grounded||p.lift>.5)return;
    const v=closestBoardableCar();
    if(!v){onNotice('Approche-toi d’une portière pour monter.');return;}
    traversal.reset();car={id:v.id,type:v.type||'car',color:v.color,...(v.skin?{skin:v.skin}:{})};
    p.x=v.x;p.y=v.y;p.angle=v.angle||0;speed=0;vx=vy=0;impact=.15;freeLookUntil=0;popTick=0;
    const record={...car,x:p.x,y:p.y,angle:p.angle,moving:false,occupied:true,owner:net?.id||'local'};
    carsShared.set(car.id,{...record,protect:epoch+1500});emit('vehicle',record);publish();
    if(Object.values(services).includes(v.type))recordAction('stealService');
    else if(v.moving)recordAction('stealVehicle');
    tone(95,.19,'triangle',.04,235);onNotice(vehicleSpec(car.type).label+' · Haut pour accélérer, gauche et droite pour braquer.');
  }
  let peerRoster=[],lastRosterRevision;
  function receivePeerSnapshots(){
    if(!net?.peers)return;
    const revision=net.rosterRevision;
    if(revision!==undefined && revision===lastRosterRevision)return;
    lastRosterRevision=revision;
    peerRoster=net.peers()||[];
    const present=new Set();
    for(const d of peerRoster){
      if(!Number.isFinite(d.x)||!Number.isFinite(d.y))continue;
      present.add(d.id);
      let e=peers.get(d.id);
      if(!e){e={id:d.id,x:d.x,y:d.y,angle:d.angle||0,walk:0};peers.set(d.id,e);}
      recordPeerMotion(e,d,epoch);
    }
    for(const id of peers.keys())if(!present.has(id))peers.delete(id);
  }
  function syncPeers(){
    const roster=peerRoster;
    if(!arrivalChecked&&net?.status==='online'){
      arrivalChecked=true;
      if(!car&&dist(p,SPAWN)<.75){
        const clear=travelSpot(p.x,p.y,p.angle,null);
        if(clear&&(clear.x!==p.x||clear.y!==p.y)){p.x=clear.x;p.y=clear.y;traversal.reset();cameraSnap=true;publish();}
      }
    }
    const joinedAt=net?.players?.().find(member=>member.id===net?.id)?.joinedAt??Infinity;
    trafficPeers=receiveTraffic(roster,{x:p.x,y:p.y,id:net?.id||'self',joinedAt},drives,epoch,trafficVehicleAt,sampleTrafficRoute);
    const world=net?.world?.()||{};
    settleTravelClaim(roster,world);
    syncPropDamage(world);
    for(const [id,d] of Object.entries(world.vehicles||{})){
      const current=carsShared.get(id);
      if(!current||!(current.protect>epoch))carsShared.set(id,d);
    }
    for(const [id,d] of Object.entries(world.npcs||{})){if(d.kind){if(d.started>epoch-34000&&(!incidents.has(id)||incidents.get(id).started<d.started))incidents.set(id,d);}
      else rememberNpc(d);}
  }
  function updateRemote(dt){
    remotes=[];let shadowCars;
    const viewAt=peerViewTime(epoch),gaitBlend=blend(7.5,dt);
    for(const e of peers.values()){
      const d=e.data;
      if(dist(d,p)>PEER_RANGE){e.x=d.x;e.y=d.y;e.angle=d.angle||0;continue;}
      const pose=readPeerMotion(e,viewAt);
      e.x=pose.x;e.y=pose.y;
      const snap=!!e.snapPose;
      if(snap){e.angle=d.angle||0;e.snapPose=false;}
      const elapsed=Math.max(0,(epoch-(d.updatedAt||epoch))/1000);
      const verticalHorizon=Math.min(elapsed,.10);
      const moving=!!d.moving&&elapsed<.55;
      const desiredSpeed=moving?(Number.isFinite(d.speed)?Math.abs(d.speed):d.sprinting?5.6:3.1):0;
      e.gaitSpeed=snap||e.gaitSpeed==null?desiredSpeed:e.gaitSpeed+(desiredSpeed-e.gaitSpeed)*gaitBlend;
      if(e.gaitSpeed>.025 && !d.vehicle && !['jump','fall','vault','climb'].includes(d.motion))e.walk+=dt*e.gaitSpeed*3.25;
      if(Number.isFinite(d.stride)){
        e.stride=snap||e.stride==null?d.stride:e.stride+(d.stride-e.stride)*gaitBlend;
      }else e.stride=undefined;
      const lift=Math.max(0,(d.lift||0)+(['jump','fall'].includes(d.motion)?(d.verticalSpeed||0)*verticalHorizon:0));
      e.lift=snap||e.lift==null?lift:e.lift+(lift-e.lift)*blend(18,dt);
      let supportHeight=0;
      if(e.lift>.03&&!d.vehicle){
        shadowCars??=cars.filter(v=>!v.moving&&!v.routeId).map(collisionBody);
        const margin=['idle','walk','run','land'].includes(d.motion)?PLAYER_RADIUS:0;
        supportHeight=Math.min(e.lift,supportAt(e.x,e.y,e.lift+.045,{destroyed,colliders:shadowCars},margin).top);
      }
      const phase=clamp((d.motionPhase||0)+(['jump','fall','vault','climb'].includes(d.motion)?verticalHorizon:0),0,1);
      e.phase=e.motion===d.motion&&e.phase!=null?e.phase+(phase-e.phase)*blend(18,dt):phase;e.motion=d.motion;
      const fallen=!d.vehicle&&ragdollPose(d.ragdoll,d.angle||0,epoch);
      const down=d.downUntil>epoch||d.health===0;
      const seen=witnessedSwings.get(d.id);
      const animated=seen&&(!d.melee||seen.started>=d.melee.started)?seen:d.melee;
      const attack=animated&&meleeMoves[animated.kind],punchPhase=attack?Math.max(0,epoch-(animated.playAt??animated.started))/(1000*attack.duration):1;
      const shot=witnessedShots.get(d.id);
      const shooting=!d.vehicle&&!down&&!fallen&&shot&&epoch-shot.at<200;
      let desiredAngle=d.angle||0;
      if(!d.vehicle&&punchPhase<1){
        const reported=d.melee?.started===animated.started?d.melee.angle:null;
        if(Number.isFinite(reported))desiredAngle=reported;
        else if(Number.isFinite(animated.angle)&&!(d.updatedAt>animated.started+140))desiredAngle=animated.angle;
      }
      if(!d.vehicle&&punchPhase<1){
        if(e.swingAt!==animated.started){e.swingAt=animated.started;e.swingFrom=e.angle;}
        const t=Math.min(1,punchPhase*attack.duration/attack.contact);
        e.angle=e.swingFrom+deltaAngle(e.swingFrom,desiredAngle)*t*t*(3-2*t);
      }else e.angle=shooting?shot.angle:turnTo(e.angle,desiredAngle,12,dt);
      const reaction=witnessedRecoils.get(d.id);
      const recoil=recoilPhase(reaction&&(!d.recoil||reaction.at>d.recoil.at)?reaction:d.recoil,epoch);
      const firePose=shooting?Math.max(0,1-(epoch-shot.at)/215):(d.shooting&&elapsed<.20 ? .75 : 0);
      remotes.push({...d,...(d.vehicle||{}),bleeding:down?null:activeBleeding(d.bleeding,epoch),ragdoll:fallen,stunned:!!fallen||down,down,id:d.id,peer:true,name:d.name,type:d.vehicle?.type||'fox',x:e.x,y:e.y,viewAt:Math.round(pose.at),angle:e.angle,isCar:!!d.vehicle,
        melee:!down&&!fallen&&!d.vehicle&&punchPhase<1?{kind:animated.kind,phase:punchPhase}:null,recoil,
        lift:e.lift,supportHeight,stride:e.stride,speed:d.vehicle?(moving?d.speed:0):e.gaitSpeed,motionPhase:e.phase,moving,move:moving,fire:firePose,walk:e.walk,bubble:bubbles.get(d.id)?.symbol});
    }
  }
  const dispatchStates=new WeakMap();
  function serviceResponse(d,t,dt=1/60,trafficBlockers=[]){
    const age=(epoch-d.started)/1000;
    const role=d.kind,type=services[role];
    if(age<0||age>29||!type||dist(d,p)>115)return;
    const vehicleId=d.id+'-car',footId=d.id+'-foot';
    const playerBody=car?collisionBody({...p,...car,isCar:true,vx,vy,speed}):
      pedestrianBody({...p,player:true,vx,vy,down:life.down,stunned:incapacitated(),ragdoll:ragdollPose(life.ragdoll,p.angle,epoch)});
    const bodies=[playerBody,...[...actors,...remotes,...cars,...trafficBlockers]
      .filter(e=>e.id!==vehicleId&&e.id!==footId&&dist(e,d)<83)
      .map(e=>e.halfLength||e.r?e:collisionBody(e))];
    const walkable=q=>!contactAt(q.x,q.y,{radius:WALKER_RADIUS,destroyed});
    const freeFoot=q=>!contactAt(q.x,q.y,{radius:WALKER_RADIUS+.12,destroyed,colliders:bodies});
    const carClear=(q,spec,colliders=[])=>!contactAt(q.x,q.y,{angle:q.angle,halfLength:spec.halfLength+.16,
      halfWidth:spec.halfWidth+.12,destroyed,colliders});
    let state=dispatchStates.get(d);
    if(!state){
      const reserved=[...bodies];
      for(const other of incidents.values()){
        const plan=dispatchStates.get(other)?.plan;
        if(plan)reserved.push({...plan.park,halfLength:plan.spec.halfLength+.8,halfWidth:plan.spec.halfWidth+.35});
      }
      const plan=planDispatch(d,type,nearbyDrivableStreets(d.x,d.y,62),
        (q,spec,parking)=>carClear(q,spec,parking?reserved:[]),walkable);
      state={plan,arrived:plan?null:2,foot:null};
      dispatchStates.set(d,state);
    }
    if(state.plan){
      const claimed=car?.id===vehicleId||carsShared.has(vehicleId)||remotes.some(e=>e.vehicle?.id===vehicleId);
      if(!claimed){
        const vehicle=stepDispatch(state,age,dt,(q,spec)=>carClear(q,spec,bodies));
        if(vehicle){
          cars.push({...vehicle,id:vehicleId,type,isCar:true,siren:true,move:vehicle.moving});
          if(state.arrived!=null&&!state.foot)state.foot=dispatchDoor(vehicle,type,d,freeFoot);
        }else if(age>3){
          // An occupied street can have no safe entry. Send the crew in on foot.
          state.plan=null;state.arrived=age;
        }
      }else if(!state.foot){
        const vehicle=car?.id===vehicleId?p:carsShared.get(vehicleId)||state.plan.park;
        state.foot=dispatchDoor(vehicle,type,d,freeFoot)??footApproach(d,freeFoot,role);state.arrived=age;
      }
    }
    if(!state.plan&&!state.foot&&age>=(state.nextEntry||0)){
      state.foot=footApproach(d,freeFoot,role);state.nextEntry=age+.5;
    }
    if(!state.foot||age<state.arrived+.3)return;
    const sourceId=d.id.slice(('unit-'+role+'-').length);
    const local=sourceId===(net?.id||'self');
    const suspect=local?p:remotes.find(r=>r.id===sourceId);
    const level=clamp(d.level||0,0,5),chasing=(role==='police'||role==='swat')&&suspect?.wanted;
    const target=(chasing||role==='medic')&&suspect&&dist(suspect,d)<24+level*9?suspect:d;
    const velocity=local?{vx,vy}:suspect;
    const moving=target===suspect&&Math.hypot(velocity?.vx||0,velocity?.vy||0)>.8;
    const heading=moving?Math.atan2(velocity.vy,velocity.vx):(suspect?.angle||0);
    const down=suspect&&(local?incapacitated():suspect.stunned||suspect.down);
    const closeContact=!!(chasing&&target===suspect&&!down&&!(local?car:suspect.isCar));
    const stride=(role==='swat'?2.4:1.7)+(chasing ? .25*level : 0);
    const parked=cars.find(v=>v.id===vehicleId);
    let occupied;
    const available=q=>{
      if(!occupied){
        occupied=bodies.filter(body=>dist(body,target)<12);
        for(const other of incidents.values()){
          const work=other!==d&&dispatchStates.get(other)?.work;
          if(work&&dist(work,target)<12)occupied.push({...work,r:.96});
        }
      }
      return !contactAt(q.x,q.y,{radius:WALKER_RADIUS+.19,destroyed,colliders:occupied});
    };
    const spot=dispatchWorkSpot(state,target,age,{role,heading,moving,closeContact,down,walkable,available});
    const protectedArea=target===suspect&&(local?car:suspect.isCar)
      ? (local?playerBody:collisionBody(suspect))
      : {x:target.x,y:target.y,r:(closeContact?1.48:down?1.92:1.70)-WALKER_RADIUS};
    const colliders=parked?[collisionBody(parked),protectedArea]:[protectedArea];
    if(down&&target===suspect)colliders.push(local?playerBody:collisionBody(suspect));
    const canWalk=q=>!contactAt(q.x,q.y,{radius:WALKER_RADIUS,destroyed,colliders});
    if(state.walker&&!canWalk(state.walker)){
      const actual=trafficBlockers.find(b=>b.id===footId);
      if(actual&&canWalk(actual))Object.assign(state.walker,{x:actual.x,y:actual.y,target:null});
      else if(!protectedArea.halfLength&&dist(state.walker,target)<protectedArea.r+WALKER_RADIUS){
        // When the suspect moves onto a unit, allow it to walk out of the exclusion disc.
        const gap=dist(state.walker,target);
        protectedArea.r=Math.max(.02,Math.min(protectedArea.r,gap-WALKER_RADIUS-.025));
        state.walker.target=null;
      }
    }
    const foot=stepDispatchFoot(state,spot,age,stride,canWalk,target);
    actors.push({...foot,id:footId,type:role,responder:true,closeContact,walk:t*8});
  }
  function population(dt){
    updateRemote(dt);trafficTick-=dt;
    if(trafficTick<=0){trafficTick=.09;routeClock=epoch;const list=routeAgents(p.x,p.y,130,epoch);
      routeActors=list.actors;routeCars=list.cars;}
    const extrap=clamp((epoch-routeClock)/1000,0,.12);
    const step=e=>{const v=e.moving===false?0:e.speed||0;return {...e,x:e.x+Math.cos(e.angle||0)*v*extrap,y:e.y+Math.sin(e.angle||0)*v*extrap,moving:!!v,move:!!v,walk:time*(Math.abs(v)*3.4+2),speed:v};};
    const lastWalkers=new Map(actors.map(e=>[e.id,e]));
    const previousBodies=incidents.size?[...cars,...actors].map(collisionBody):[];
    actors=routeActors.map(step);cars=[];
    const occupied=new Set(remotes.map(r=>r.vehicle?.id).filter(Boolean));if(car)occupied.add(car.id);
    const excluded=new Set([...occupied,...carsShared.keys()]);
    const ambient=[];
    for(const raw of routeCars){
      if(excluded.has(raw.id))continue;
      if(raw.routeId)ambient.push(raw);
      else cars.push({...step(raw),isCar:true});
    }
    for(const d of carsShared.values())if(!occupied.has(d.id)&&dist(d,p)<135){
      if(d.occupied&&(peers.has(d.owner)||d.owner===net?.id))continue;
      cars.push({...d,angle:d.angle||0,isCar:true,moving:false,speed:0});}
    for(const [id,d] of incidents){if(epoch-d.started>30000)incidents.delete(id);else serviceResponse(d,time,dt,previousBodies);}
    for(const [id,state] of npcShared){
      const health=npcHealthAt(state,epoch),until=Math.max(state.stunnedUntil||0,state.downUntil||0);
      if(health>=100&&until+800<epoch){npcShared.delete(id);continue;}
      if(dist(state,p)>135)continue;
      let actor=actors.find(e=>e.id===id);
      if(until<=epoch&&!actor)continue;
      if(!actor){actor={...state,type:state.type||'pedestrian'};actors.push(actor);}
      actor.health=health;actor.down=state.downUntil>epoch;actor.bleeding=actor.down?null:activeBleeding(state.bleeding,epoch);
      if(until>epoch){
        Object.assign(actor,{x:state.x,y:state.y,angle:state.angle,moving:false,move:false,stunned:true,speed:0,
          ragdoll:ragdollPose(state.ragdoll,state.angle||0,epoch)});
        const reaction=recoilPhase(state.recoil,epoch);
        if(reaction){
          const progress=1-(1-reaction.phase)**3;
          actor.x=state.recoil.fromX+(state.x-state.recoil.fromX)*progress;
          actor.y=state.recoil.fromY+(state.y-state.recoil.fromY)*progress;actor.recoil=reaction;
        }
      }else if(until&&epoch-until<1800&&dist(actor,state)<24){
        const t=(epoch-until)/1800,x=state.x+(actor.x-state.x)*t,y=state.y+(actor.y-state.y)*t;
        if(!blocked(x,y,.36,destroyed)){actor.x=x;actor.y=y;}
      }
    }
    const selfBody=car
      ? collisionBody({...p,...car,isCar:true,vx,vy,speed})
      : pedestrianBody({...p,id:net?.id||'self',self:true,vx,vy,stunned:incapacitated(),
        ragdoll:ragdollPose(life.ragdoll,p.angle,epoch)});
    const fixedBodies=[{...selfBody,lift:p.lift},...remotes.map(collisionBody),...cars.map(collisionBody)];
    // Begin with the pedestrians' last resolved positions, then let them react to this frame's actual vehicles.
    const walkerBodies=actors.map(e=>collisionBody((!e.stunned&&lastWalkers.get(e.id))||e));
    drives=traffic.step(ambient,{dt,epoch,observer:p,excluded,checkpoints:trafficPeers.checkpoints,
      blockers:[...fixedBodies.filter(body=>!(body.lift>3.15)),...walkerBodies],blockedPose:streetBlocked});
    cars.push(...drives);
    crowd.step(actors,[...fixedBodies.filter(body=>!(body.lift>1.62)),...drives.map(collisionBody)],dt);
    if(epoch>=trafficImpactAt){
      trafficImpactAt=epoch+250;
      outer: for(const v of cars){
        if(!v.moving||Math.abs(v.speed)<3||dist(v,p)>32)continue;
        // Neighbours observe the same simulated traffic. Only one nearby client publishes each collision.
        const authority=[net?.id||'self',...remotes.filter(e=>dist(e,v)<34).map(e=>e.id)].sort()[0];
        if(authority!==(net?.id||'self'))continue;
        for(const actor of actors){
          if(actor.stunned||!trafficContact(v,actor,-.04)||(npcShared.get(actor.id)?.healthAt||0)>epoch-2300)continue;
          hurtNpc(actor,pedestrianDamage(v.speed),v.angle,clamp(Math.abs(v.speed)/13,.42,1));break outer;
        }
      }
    }
    const near=[...actors,...cars,...remotes].filter(e=>dist(e,p)<(car?14:9));
    obstacles=near.map(collisionBody);
    nearCar=car?null:closestBoardableCar();
  }
  function readyReload(){
    if(incapacitated()||reloading||!Number.isFinite(ammo[weapon])||ammo[weapon]>=weapons[weapon].mag)return;
    reloading=weapons[weapon].reload;tone(305,.06,'square',.012);
  }
  function exportTravelState(){
    return {
      version:2,sourceId:net?.id||'',x:p.x,y:p.y,angle:p.angle,yaw,pitch,vx,vy,health:p.health,vitality:life.snapshot(),wanted:p.wanted,pursuit:pursuit.snapshot(time),
      score,weapon,ownedWeapons:ownedWeapons(),reloading,
      ammo:Object.fromEntries(ownedWeapons().filter(k=>Number.isFinite(ammo[k])).map(k=>[k,ammo[k]])),
      vehicle:car?{...car,speed,angle:p.angle,owner:net?.id||'',previousOwners:travelClaim?.previousOwners||[]}:null
    };
  }
  function settleTravelClaim(roster,world){
    if(!travelClaim||!car||net?.status!=='online')return;
    const owner=world.vehicles?.[car.id]?.owner;
    if(owner===net.id){travelClaim=null;publish();return;}
    if(travelClaim.sent||epoch<travelClaim.retryAt)return;
    // The last tab's keepalive leave can arrive after the new tab's join.
    if(travelClaim.previousOwners.includes(owner)&&roster.some(r=>r.id===owner))return;
    const claim={...car,x:p.x,y:p.y,angle:p.angle,speed,occupied:true,owner:net.id};
    travelClaim.sent=emit('vehicle',claim)!==false;
  }
  function travelSpot(x,y,angle,vehicle,sourceId,clearance=55){
    const nearby=routeAgents(x,y,64,epoch),world=net?.world?.()||{};
    const occupants=net?.peers?.()||[],occupied=new Set(occupants.map(r=>r.vehicle?.id));
    const at={x,y},entities=new Map();
    const add=e=>{if(dist(e,at)<62)entities.set(e.id,e);};
    nearby.actors.forEach(add);
    for(const v of nearby.cars)if(!occupied.has(v.id))add({...v,isCar:true});
    // Prefer the simulated or replicated pose when the nominal clock has run ahead of a queue.
    for(const v of [...cars,...Object.values(world.vehicles||{}),...carsShared.values()]){
      entities.delete(v.id);if(!occupied.has(v.id))add({...v,isCar:true});
    }
    for(const a of actors){entities.delete(a.id);add(a);}
    for(const a of [...Object.values(world.npcs||{}),...npcShared.values()]){
      if(a.id&&Math.max(a.stunnedUntil||0,a.downUntil||0)>epoch){
        add({...a,stunned:true,ragdoll:ragdollPose(a.ragdoll,a.angle||0,epoch)});
      }
    }
    for(const r of occupants)if(r.id!==sourceId&&(!vehicle||r.vehicle?.id!==vehicle.id)){
      add({...r,peer:true,type:r.vehicle?.type||'fox',isCar:!!r.vehicle,
        stunned:r.downUntil>epoch||r.health===0,ragdoll:ragdollPose(r.ragdoll,r.angle||0,epoch)});
    }
    if(vehicle)entities.delete(vehicle.id);
    const geometry={radius:PLAYER_RADIUS,angle,destroyed,colliders:Array.from(entities.values(),collisionBody)};
    if(vehicle)Object.assign(geometry,dimensions(vehicle));
    if(!contactAt(x,y,geometry))return {x,y};
    for(const radius of [.8,1.8,3.5,6,8,10,16,25,40,55]){
      if(radius>clearance)break;
      const count=Math.max(12,Math.ceil(Math.PI*radius));
      for(let i=0;i<count;i++){
        const q=offset({x,y},angle+i*Math.PI*2/count,radius);
        if(!contactAt(q.x,q.y,geometry))return q;
      }
    }
    return null;
  }
  function restoreTravelState(s,{clearance=55}={}){
    if(!s||![1,2].includes(s.version)||![s.x,s.y,s.angle].every(Number.isFinite)||Math.max(Math.abs(s.x),Math.abs(s.y))>100000)return false;
    const finite=(v,fallback,min,max)=>Number.isFinite(v)?clamp(v,min,max):fallback;
    const safeAngle=v=>Math.atan2(Math.sin(v),Math.cos(v));
    let ride=null;
    if(s.vehicle){
      const v=s.vehicle;
      if(typeof v.id!=='string'||!/^[-\w:]{1,68}$/.test(v.id)||!isVehicleType(v.type))return false;
      ride={id:v.id,type:v.type};
      if(typeof v.color==='string'&&/^#[a-f\d]{6}$/i.test(v.color))ride.color=v.color;
      if(typeof v.skin==='string'&&/^[\w-]{1,40}$/.test(v.skin))ride.skin=v.skin;
    }
    const angle=safeAngle(s.angle);
    for(const id of net?.world?.().destroyed||[])destroyed.add(id);
    const q=travelSpot(s.x,s.y,angle,ride,s.sourceId,clearance);
    if(!q || (car&&car.id!==ride?.id&&!dropCar()))return false;
    resetInputs();resetPopulation();arrivalChecked=true;cameraSnap=true;levelPlace=null;
    p.x=q.x;p.y=q.y;p.angle=angle;
    life.restore({...s.vitality,health:finite(s.health,100,0,100)},epoch);p.health=life.health;
    acceptShotsFrom=Math.max(Math.floor(net?.serverTime?.()??epoch),life.snapshot().protectedUntil||0);
    p.wanted=pursuit.restore(s.version===2?s.pursuit:{wanted:s.wanted,heat:s.heat,sinceCrime:s.sinceCrime},time).level;
    wantedEvent=null;nearPickup=null;score=Math.round(finite(s.score,0,0,1e9));
    const before=owned.size;
    if(s.version===2)addLoadout(s.ownedWeapons);
    if(owned.size!==before)onLoadoutChange(ownedWeapons());
    weapon=owned.has(s.weapon)?s.weapon:'pistol';
    for(const [k,w] of Object.entries(weapons)){
      ammo[k]=Number.isFinite(w.mag)?Math.floor(finite(s.ammo?.[k],w.mag,0,w.mag)):Infinity;
    }
    reloading=weapon===s.weapon?finite(s.reloading,0,0,weapons[weapon].reload):0;
    yaw=safeAngle(Number.isFinite(s.yaw)?s.yaw:angle);pitch=finite(s.pitch,.13,-.47,1.35);
    const ownerChain=ride&&Array.isArray(s.vehicle.previousOwners)?s.vehicle.previousOwners:[];
    const previousOwners=[...new Set([s.vehicle?.owner,...ownerChain].filter(id=>typeof id==='string'&&id.length<=64))].slice(0,4);
    car=ride;travelClaim=ride&&net&&s.sourceId!==net.id?{previousOwners,sent:false,retryAt:0}:null;
    speed=ride?finite(s.vehicle.speed,0,-vehicleSpec(ride.type).reverse,vehicleSpec(ride.type).forward):0;
    vx=ride?Math.cos(angle)*speed:finite(s.vx,0,-6.4,6.4);vy=ride?Math.sin(angle)*speed:finite(s.vy,0,-6.4,6.4);
    traversal.reset(vx,vy);p.moving=Math.hypot(vx,vy)>.1;p.sprinting=!ride&&Math.hypot(vx,vy)>4;
    nearCar=null;steer=turn=impact=shootPose=cooldown=0;braking=false;
    freeLookUntil=0;mapTick=hudTick=networkTick=trafficTick=popTick=0;
    settleTravelClaim(net?.peers?.()||[],net?.world?.()||{});
    publish();sendHud(true);return true;
  }
  function shotScene(range){
    const muzzle=car?1.8:.35;
    const targets=[...nearbyProps(p.x,p.y,range+2).filter(o=>!destroyed.has(o.id)).map(o=>({...o,hitKind:'prop'})),
      ...actors.filter(o=>!o.down).map(o=>({...o,r:.65,hitKind:'npc'})),...remotes.filter(o=>!o.down&&o.id!==net?.id&&o.id!==p.id).map(o=>({...o,r:o.isCar?1.4:.67,hitKind:'peer'}))];
    const vehicles=[...cars,...remotes.filter(e=>e.isCar)].filter(v=>dist(v,p)<range+6).map(collisionBody);
    const geometry={radius:.12,height:1.05+p.lift,camera:true,destroyed,colliders:vehicles,ignoreId:null};
    const contact=(x,y,ignoreId)=>{geometry.ignoreId=ignoreId;return contactAt(x,y,geometry);};
    const trace=angle=>traceShot(p,angle,muzzle,range,targets,contact);
    function visible(from,to,sourceId){
      const ignoreProps=sourceId?new Set([...destroyed,sourceId]):destroyed;
      const opt={...geometry,destroyed:ignoreProps,colliders:vehicles.filter(v=>v.id!==sourceId)};
      const clip=(x,y,ignoreId)=>{opt.ignoreId=ignoreId;return contactAt(x,y,opt);};
      const angle=Math.atan2(to.y-from.y,to.x-from.x);
      if(dist(from,to)<.05)return !clip(from.x,from.y,to.id);
      return traceShot(from,angle,0,dist(from,to)+(to.r||.5)+.1,targets.filter(o=>o.id!==sourceId),clip).hit?.id===to.id;
    }
    return {muzzle,targets,trace,visible};
  }
  // All shoves have a swept straight path. Sampling includes the victim's capsule
  // and other people, parked cars, live traffic, walls and the edge of the world.
  function knockbackEnd(actor,angle,length,radius){
    const colliders=obstacles.filter(body=>body.id!==actor.id);
    if(actor!==p)colliders.push({...pedestrianBody(p),lift:p.lift});
    const options={radius,footZ:actor.lift||0,bodyHeight:1.52,destroyed,colliders};
    const steps=Math.ceil(length/.075);
    let x=actor.x,y=actor.y;
    for(let i=1;i<=steps;i++){
      const nx=actor.x+Math.cos(angle)*length*i/steps,ny=actor.y+Math.sin(angle)*length*i/steps;
      if(contactAt(nx,ny,options))break;
      x=nx;y=ny;
    }
    return {x,y};
  }
  function aimBearing(source,melee=false){
    if((source==='touch'||source==='button')&&Math.hypot(aimX,aimY)>.15)
      return yaw+Math.atan2(aimX,-aimY);
    if((source==='pointer'||source==='key')&&aimPointer){
      const angle=view.aim(aimPointer.x,aimPointer.y,p);
      if(Number.isFinite(angle))return angle;
    }
    if(!melee)return yaw;
    const x=stickX+Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('q')||keys.has('a')||keys.has('arrowleft'));
    const y=-stickY+Number(keys.has('z')||keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown'));
    if(Math.hypot(x,y)>.15)return yaw+Math.atan2(x,y);
    return meleeCameraAim?yaw:p.angle;
  }
  function startSwing(source='button'){
    if(paused||incapacitated()||car||!view.available||['climb','vault'].includes(p.motion))return;
    if(swing){
      if(time-swing.begin>=.07)swingQueued=true;
      return;
    }
    if(time>chainUntil)comboIndex=0;
    const kind=combo[comboIndex],move=meleeMoves[kind];
    comboIndex=(comboIndex+1)%combo.length;
    const started=Math.max(Math.round(epoch),lastSwingStamp+1);lastSwingStamp=started;
    const bearing=aimBearing(source,true);
    const angle=swingContact(bearing,move)?.angle??bearing;
    swing={kind,started,source,begin:time,from:p.angle,bearing,angle,step:0,resolved:false};
    chainUntil=time+move.duration+.48;shotFacingUntil=-1;shootPose=0;
    clearAimLock();publish();emit('melee',{kind,started,angle:deltaAngle(0,angle),x:p.x,y:p.y,lift:p.lift});
    tone(kind==='kick'?195:255,.09,'sine',.024,90);
  }
  function swingContact(bearing,move){
    const targets=[...actors.filter(e=>!e.down).map(e=>({...e,r:WALKER_RADIUS,hitKind:'npc'})),
      ...remotes.filter(e=>!e.isCar&&!e.down).map(e=>({...e,r:PLAYER_RADIUS,hitKind:'peer'})),
      ...nearbyProps(p.x,p.y,3).filter(e=>softProp(e)&&!destroyed.has(e.id)).map(e=>({...e,hitKind:'prop'}))];
    const walls={radius:.075,camera:true,destroyed,colliders:obstacles.filter(o=>o.isCar)};
    const occluded=(x,y,height,ignoreId)=>contactAt(x,y,{...walls,height,ignoreId});
    return meleeContact(p,bearing,move,targets,terrainHeight,occluded);
  }
  function contactSwing(strike,move){
    const hit=swingContact(strike.bearing,move);
    if(!hit)return;
    const {target,angle}=hit;
    p.angle=strike.angle=angle;
    publish();
    if(target.hitKind==='npc'){
      if(!hurtNpc(target,move.damage,angle,move.force,strike))return;
      recordAction(['police','swat'].includes(target.type)?'hitOfficer':'hitCivilian');
    }else if(target.hitKind==='peer'){
      emit('hit',{target:target.id,cause:'melee',kind:strike.kind,swingAt:strike.started,damage:move.damage,angle,force:move.force});
      recordAction('hitPlayer');
    }else if(target.hitKind==='prop'){
      damageProp(target,move.damage,{cause:'melee',swingAt:strike.started,swingKind:strike.kind},angle,vandalism);
    }
    view.effect('meleeImpact',hit.x,hit.y,angle,move.force,[],hit.height);
    tone(strike.kind==='kick'?92:128,.105,'triangle',.065,51);
  }
  function stepSwing(){
    if(!swing)return;
    if(paused||incapacitated()||car||['climb','vault'].includes(p.motion)){swing=null;swingQueued=false;return;}
    const move=meleeMoves[swing.kind],age=time-swing.begin;
    if(!swing.resolved){
      // Keep the original arc for an unsteered swing. An explicit mouse or thumb
      // direction can still guide the wind-up, including the first touch strike.
      const steerThumb=(swing.source==='touch'||swing.source==='button')&&Math.hypot(aimX,aimY)>.15;
      if(steerThumb||((swing.source==='key'||swing.source==='pointer')&&aimPointer))
        swing.bearing=aimBearing(swing.source,true);
      swing.angle=swingContact(swing.bearing,move)?.angle??swing.bearing;
      const t=clamp(age/move.contact,0,1);
      p.angle=swing.from+deltaAngle(swing.from,swing.angle)*t*t*(3-2*t);
    }
    if(!swing.resolved && traversal.grounded){
      // Plant the leading foot during extension. The lunge uses the same swept
      // body as walking, even when punching against a car or the edge of a pier.
      const t=clamp((age/move.contact-.40)/.60,0,1);
      const distance=move.step*t*t*(3-2*t),advance=distance-swing.step;
      if(advance>0){
        const next=moveBody(p.x,p.y,Math.cos(swing.angle)*advance,Math.sin(swing.angle)*advance,
          {radius:PLAYER_RADIUS,footZ:p.lift,bodyHeight:1.52,destroyed,colliders:obstacles});
        p.x=next.x;p.y=next.y;swing.step=distance;
      }
    }
    if(!swing.resolved&&age>=move.contact){
      swing.resolved=true;contactSwing(swing,move);
    }
    if(age>=move.duration){
      const source=swing.source;swing=null;
      if(swingQueued){swingQueued=false;startSwing(source);}
    }
  }
  function fire(source='manual'){
    if(paused||incapacitated()||!view.available||cooldown>0)return;
    if(weapon==='fist'){
      if(!swing)startSwing(source);
      return;
    }
    if(swing||reloading>0)return;
    const w=weapons[weapon];if(ammo[weapon]<=0){readyReload();return;}
    const firedAt=Math.round(net?.serverTime?.()??epoch);
    cooldown=w.interval;shootPose=1;ammo[weapon]--;
    const touch=source==='touch',manualDrag=(touch||source==='button')&&Math.hypot(aimX,aimY)>.15;
    const bearing=deltaAngle(0,aimBearing(source));
    const {muzzle,targets,trace,visible}=shotScene(w.range);
    let shot=trace(bearing);
    if(touch&&!manualDrag&&aimAssist){
      const lock=chooseTouchShot({position:p,yaw,muzzle,range:w.range,targets,wanted:p.wanted,previousId:aimLock?.id,
        project:view.projectTarget,trace,direct:shot});
      if(lock){shot=lock.shot;aimLock=lock.target;markImpactUntil=time+.19;nextLockCheck=time+.12;drawAimLock();}else clearAimLock();
    }else clearAimLock();
    const a=shot.angle;
    if(!car){p.angle=a;shotFacingUntil=time+.21;}
    publish();
    const peerHits=[];
    const pattern=resolveWeaponShot(weapon,a,trace,targets,visible,shot);
    const severity=['gunshot','destroy','hitCivilian','hitPlayer','hitOfficer'];
    let worst=w.noise?0:-1,unsettled=1;
    // A fan or chain can hit multiple targets. Charge a single offence after all its hits settle.
    const settleShot=broken=>{
      if(broken)worst=Math.max(worst,1);
      if(--unsettled===0&&worst>=0)recordAction(severity[worst]);
    };
    for(const {target,damage:amount} of pattern.hits){
      const direction=Math.atan2(target.y-p.y,target.x-p.x),force=clamp(amount/45,.12,1);
      if(target.hitKind==='prop'){
        unsettled++;
        damageProp(target,amount,{cause:'weapon',weapon},direction,settleShot);
      }
      if(target.hitKind==='npc'&&hurtNpc(target,amount,direction,force,null,weapon))worst=Math.max(worst,['police','swat'].includes(target.type)?4:2);
      if(target.hitKind==='peer'){
        peerHits.push({target:target.id,damage:amount,angle:direction,force,
          ...(Number.isFinite(target.viewAt)?{viewedAt:Math.round(target.viewAt)}:{})});
        worst=Math.max(worst,3);
      }
    }
    const rays=pattern.rays.map(r=>({x:r.origin.x,y:r.origin.y,angle:r.angle,length:r.length}));
    for(const r of rays)view.effect(w.effect,r.x,r.y,r.angle,r.length,[],p.lift);
    if(pattern.impact)view.effect('burst',pattern.impact.x,pattern.impact.y);
    if(rays.length)emit('fire',{...rays[0],kind:weapon,lift:p.lift,shotId:crypto.randomUUID(),firedAt,viewAt:peerViewTime(epoch),
      hits:peerHits,...(rays.length>1?{rays}:{}),...(pattern.impact?{impact:pattern.impact}:{})});
    settleShot(false);
    tone(w.frequency,.1,w.noise?'triangle':'sine',.055,w.frequency*.42);
    if(!ammo[weapon])readyReload();
  }
  function move(dt){
    roadMotion=null;
    if(selfRecoil){
      const r=selfRecoil,t=Math.min(1,r.progress+dt/recoilSeconds);
      const advance=(1-r.progress)**3-(1-t)**3;
      const next=moveBody(p.x,p.y,(r.toX-r.fromX)*advance,(r.toY-r.fromY)*advance,
        {radius:PLAYER_RADIUS,footZ:p.lift,bodyHeight:1.52,destroyed,colliders:obstacles});
      p.x=next.x;p.y=next.y;r.progress=t;if(t===1)selfRecoil=null;
    }
    if(incapacitated()){
      if(!car&&(!traversal.grounded||p.lift>.01))traversal.step(dt,{x:0,y:0,angle:p.angle,sprint:false},{destroyed,colliders:obstacles});
      return;
    }
    const has=(...a)=>a.some(k=>keys.has(k));
    let sx=paused?0:stickX+Number(has('d','arrowright'))-Number(has('q','a','arrowleft'));
    let sy=paused?0:-stickY+Number(has('z','w','arrowup'))-Number(has('s','arrowdown'));
    const m=Math.hypot(sx,sy);if(m>1){sx/=m;sy/=m;}
    const oldAngle=p.angle;
    if(car){
      const oldSpeed=speed,spec=vehicleSpec(car.type);braking=Math.sign(speed)!==Math.sign(sy)&&Math.abs(sy)>.12&&Math.abs(speed)>.45;
      const drive=sy<0?spec.accel*.63:spec.accel,limit=sy<0?spec.reverse:spec.forward;
      const resistance=sy&&!braking?(drive-.46)/(limit*limit):.012;
      const throttle=sy*(braking?spec.brake:drive),dragForce=Math.sign(speed)*(.46+resistance*speed*speed);
      const grade=terrainGradient(p.x,p.y);
      const incline=(grade.x*Math.cos(p.angle)+grade.y*Math.sin(p.angle));
      const gravityAlongRoad=(Math.abs(speed)>.10||sy)?-9.81*clamp(incline,-.35,.35):0;
      const nextSpeed=speed+(throttle+gravityAlongRoad-dragForce)*dt;speed=clamp(!sy&&Math.sign(nextSpeed)!==Math.sign(speed)?0:nextSpeed,-spec.reverse,spec.forward);
      if(!sy&&Math.abs(speed)<.10)speed=0;
      steer+=(sx-steer)*blend(9,dt);
      const wheel=clamp(speed/6,-1,1),targetAngle=p.angle+steer*wheel*spec.steering*dt/(1+Math.abs(speed)*.029);
      const dx=Math.cos(targetAngle)*speed*dt,dy=Math.sin(targetAngle)*speed*dt;
      const options={radius:1,angle:targetAngle,...dimensions(car),footZ:0,bodyHeight:spec.height,destroyed,colliders:obstacles};
      let result=moveBody(p.x,p.y,dx,dy,options);
      if(!paused&&(Math.abs(sy)>.12||Math.abs(speed)>.6)){
        const sign=Math.sign(sy||speed);
        roadMotion={x:Math.cos(targetAngle)*sign,y:Math.sin(targetAngle)*sign,speed:Math.abs(speed),boundary:result.touched?.id==='boundary'};
      }
      if(result.hit&&softProp(result.touched)&&contactLock<=0){
        const normalSpeed=Math.max(0,-speed*(Math.cos(targetAngle)*result.normalX+Math.sin(targetAngle)*result.normalY));
        const amount=vehiclePropDamage(normalSpeed,spec.halfLength);
        if(amount){
          const prop=result.touched;
          damageProp(prop,amount,{cause:'traffic',speed:normalSpeed},targetAngle+(speed<0?Math.PI:0),vandalism);
          if(destroyed.has(prop.id)){
            speed*=.76;impact=.7;result=moveBody(p.x,p.y,dx*.76,dy*.76,options);
          }
        }
      }
      if(result.hit){
        const normalSpeed=Math.max(0,-oldSpeed*(Math.cos(targetAngle)*result.normalX+Math.sin(targetAngle)*result.normalY));
        const struck=actors.find(e=>e.id===result.touched?.id);
        if(struck&&!struck.stunned&&Math.abs(speed)>4.8&&hurtNpc(struck,pedestrianDamage(speed),targetAngle+(speed<0?Math.PI:0),clamp(Math.abs(speed)/13,.4,1)))
          recordAction(['police','swat'].includes(struck.type)?'hitOfficer':'hitCivilian');
        if(result.touched?.id==='boundary')speed*=.78;
        else if(contactLock<=0 && normalSpeed>2.2){
          impact=clamp(normalSpeed/12,.25,1);tone(95,.10,'triangle',.04,38);
          if(normalSpeed>11.5){damage(crashDamage(normalSpeed),targetAngle,.3,'crash');if(life.down)return;}
          if(result.touched?.id&&remotes.some(e=>e.id===result.touched.id)&&normalSpeed>8){
            emit('hit',{target:result.touched.id,damage:pedestrianDamage(oldSpeed),force:clamp(Math.abs(oldSpeed)/15,.4,1),angle:targetAngle+(speed<0?Math.PI:0),cause:'traffic'});recordAction('hitPlayer');
          }
          const incidence=normalSpeed/Math.max(.1,Math.abs(oldSpeed));
          speed*=incidence>.75?-.18:Math.sqrt(Math.max(0,1-incidence*incidence));contactLock=.32;
        }
        if(Math.hypot(result.x-p.x,result.y-p.y)>.025)p.angle=targetAngle;
      }else p.angle=targetAngle;
      vx=(result.x-p.x)/dt;vy=(result.y-p.y)/dt;p.x=result.x;p.y=result.y;p.moving=Math.abs(speed)>.13;
      if(time>freeLookUntil&&Math.abs(speed)>.21)yaw=turnTo(yaw,p.angle,2.6+Math.abs(speed)*.035,dt);
      p.sprinting=false;
    }else{
      p.sprinting=!paused&&!swing&&!selfRecoil&&(sprintHeld||keys.has('shift')) && m>.25;
      const c=Math.cos(yaw),s=Math.sin(yaw);
      const attackPace=swing?(swing.kind==='kick' ? .50 : .72):1;
      const footing=selfRecoil && selfRecoil.progress<.45 ? .35 : attackPace;
      const foot=traversal.step(dt,{x:(sy*c-sx*s)*footing,y:(sy*s+sx*c)*footing,angle:p.angle,sprint:p.sprinting},{destroyed,colliders:obstacles});
      if(!paused&&traversal.grounded&&m>.12)
        roadMotion={x:(sy*c-sx*s)/Math.min(m,1),y:(sy*s+sx*c)/Math.min(m,1),speed:foot.actual,boundary:foot.boundary};
      vx=foot.vx;vy=foot.vy;p.moving=foot.actual>.11;
      if(traversal.grounded)p.walk+=foot.actual*dt*3.25;
      const firing=keys.has('f')?'key':fireHeld?heldSource:touchFireHeld?'touch':null;
      if(!swing&&firing&&weapon!=='fist'){
        const target=firing==='touch'&&aimLock;
        const bearing=target?Math.atan2(target.y-p.y,target.x-p.x):aimBearing(firing);
        p.angle=turnTo(p.angle,bearing,24,dt);
      }else if(!swing&&time>=shotFacingUntil&&(p.moving||['vault','climb'].includes(p.motion))){
        if(m>.15)meleeCameraAim=false;
        p.angle=turnTo(p.angle,foot.heading,traversal.grounded?12:8,dt);
      }
      // If moving traffic reaches a stationary pedestrian, separate them to the near side of the body.
      if(contactLock<=0){
        const traffic=cars.find(e=>e.moving&&p.lift<vehicleSpec(e.type).height-.08&&Math.abs(e.speed)>1.5&&trafficContact(e,p,.18));
        if(traffic){const dx=p.x-traffic.x,dy=p.y-traffic.y,c=Math.cos(traffic.angle),s=Math.sin(traffic.angle);
          const localX=dx*c+dy*s,localY=-dx*s+dy*c;
          const shape=vehicleSpec(traffic.type);
          if(Math.abs(localX)<shape.halfLength+.18&&Math.abs(localY)<shape.halfWidth+.18){
            const side=(Math.sign(localY)||1)*(shape.halfWidth+.58),px=traffic.x+c*localX-s*side,py=traffic.y+s*localX+c*side;
            if(!contactAt(px,py,{radius:PLAYER_RADIUS,destroyed,colliders:obstacles,ignoreId:traffic.id})){p.x=px;p.y=py;}
            impact=.8;damage(pedestrianDamage(traffic.speed),traffic.angle,clamp(Math.abs(traffic.speed)/13,.38,1),'traffic');contactLock=1.5;
          }}
      }
    }
    turn=clamp(deltaAngle(oldAngle,p.angle)/dt/3,-1,1);
    if(!paused){
      if(meleeHeld||keys.has('v')){if(!swing)startSwing(meleeHeld?'button':'key');}
      else if(keys.has('f'))fire('key');
      else if(fireHeld)fire(heldSource);
      else if(touchFireHeld)fire('touch');
    }
  }
  function playRemoteShot(event,age){
    const d=event.data,effect=weapons[d.kind]?.effect||'shot';
    if(dist(d,p)>=125)return;
    if(age<.2&&Number.isFinite(d.angle))witnessedShots.set(event.player,{angle:d.angle,at:epoch-age*1000});
    if(age<effectDuration(effect)){
      const rays=Array.isArray(d.rays)?d.rays.slice(0,13):[d];
      for(const r of rays)if([r.x,r.y,r.angle,r.length].every(Number.isFinite))
        view.effect(effect,r.x,r.y,r.angle,clamp(r.length,0,100),[],d.lift||0,age);
    }
    if(age<.55&&d.impact&&dist(d.impact,d)<100)view.effect('burst',d.impact.x,d.impact.y,0,0,[],0,age);
  }
  function frame(t){
    if(!isRunning)return;
    const dt=clamp((t-previousFrame)/1000,.001,.075);
    previousFrame=t;time+=dt;epoch=net?.serverTime?.()||Date.now();
    shotPlayback.flush(epoch,playRemoteShot);
    receivePeerSnapshots();
    popTick-=dt;if(popTick<=0){syncPeers();if(p.wanted)dispatchPursuit();popTick=.24;}
    population(dt);
    if(!drag && Math.abs(driftX)+Math.abs(driftY)>.002){
      yaw+=driftX*dt;pitch=clamp(pitch+driftY*dt,-.47,1.35);
      driftX*=Math.exp(-12*dt);driftY*=Math.exp(-12*dt);
    }
    if(keys.has('j')||keys.has('l')){yaw+=(keys.has('l')?1:-1)*1.8*dt;meleeCameraAim=true;freeLookUntil=time+2.5;}
    cooldown=Math.max(0,cooldown-dt);contactLock=Math.max(0,contactLock-dt);
    impact=Math.max(0,impact-dt*3);shootPose=Math.max(0,shootPose-dt*4.5);
    if(reloading){reloading=Math.max(0,reloading-dt);if(!reloading)ammo[weapon]=weapons[weapon].mag;}
    const wanted=pursuit.tick(time);p.wanted=wanted.level;
    const medic=!car&&p.lift<1.2&&actors.some(o=>o.type==='medic'&&!o.stunned&&dist(o,p)<2.7);
    if(life.tick(epoch,medic)){
      acceptShotsFrom=life.snapshot().protectedUntil;
      p.health=life.health;pursuit.clear(time);p.wanted=0;wantedEvent=null;resetInputs();
      if(!medic)placeAt(levelPlace||SPAWN);
      onNotice(medic?'L’ambulancier t’a remis sur pied.':'Les secours t’ont reconduit en lieu sûr.');
      sendHud(true);
    }
    p.health=life.health;
    const steps=Math.max(1,Math.ceil(dt/(1/45)));
    for(let i=0;i<steps;i++)move(dt/steps);
    stepSwing();updatePickups();
    for(const [id,s] of witnessedSwings)if(epoch-s.playAt>1600)witnessedSwings.delete(id);
    for(const [id,s] of witnessedShots)if(epoch-s.at>500)witnessedShots.delete(id);
    for(const [id,r] of witnessedRecoils)if(epoch-r.at>1000)witnessedRecoils.delete(id);
    for(const [id,b] of bubbles)if(b.until<epoch)bubbles.delete(id);
    const responder=actors.find(o=>!o.stunned&&dist(o,p)<1.6&&['police','swat'].includes(o.type));
    if(responder&&p.lift<1.25&&p.wanted&&!car&&!life.down&&contactLock<=0){
      damage(responder.type==='swat'?14:8,Math.atan2(p.y-responder.y,p.x-responder.x),responder.type==='swat' ? .48 : .22,'police');contactLock=1.75;
    }
    const self={...p,...(car||{}),melee:swing?{kind:swing.kind,phase:clamp((time-swing.begin)/meleeMoves[swing.kind].duration,0,1)}:null,
      recoil:recoilPhase(selfRecoil,epoch),id:'self',self:true,appearance,bleeding:life.bleeding,stunned:incapacitated(),down:life.down,ragdoll:ragdollPose(life.ragdoll,p.angle,epoch),moving:p.moving,move:p.moving,sprinting:p.sprinting,walk:p.walk,turn,impact,fire:shootPose,steer,
      brake:braking,emote:bubbles.get(net?.id||'self')?.symbol,bubble:bubbles.get(net?.id||'self')?.symbol,speed:car?speed:Math.hypot(vx,vy),isCar:!!car};
    view.render({p,car,speed,yaw,pitch,epoch,snap:cameraSnap,destroyed,propHealth,propDamageRevision,pickups,entities:[self,...remotes,...cars,...actors]},dt,time);cameraSnap=false;drawAimLock();
    networkTick-=dt;if(networkTick<=0){publish();networkTick=.12;}
    hudTick-=dt;if(hudTick<=0){sendHud();hudTick=.12;}
    mapTick-=dt;if(mapTick<=0){mapTick=.16;if(minimap)paintMap(minimap,p,{full:false,peers:remotes,vehicles:cars,pickups});}
    frameId=requestAnimationFrame(frame);
  }
  function selectWeapon(kind){
    if(incapacitated()||!Object.hasOwn(weapons,kind))return false;
    if(!owned.has(kind)){onNotice(weaponLabels[kind]+' · Ramasse cette arme en ville pour l’équiper.');return false;}
    return equipOwned(kind);
  }
  function equipOwned(kind){
    if(kind===weapon)return true;
    weapon=kind;reloading=0;cooldown=.13;fireHeld=touchFireHeld=false;clearAimLock();shootPose=0;shotFacingUntil=-1;unlock();tone(410,.06);sendHud(true);return true;
  }
  function emote(symbol){if(!symbol||incapacitated())return;const s=String(symbol).slice(0,16);bubbles.set(net?.id||'self',{symbol:s,until:epoch+3700});emit('emote',{symbol:s});unlock();tone(590,.12,'sine',.04,710);}
  function travel(key){if(incapacitated())return false;const place=getTravelPoint(key);if(!place)return false;if(!placeAt(place))return false;levelPlace=place;sendHud(true);onNotice(place.label||'Arrivée à destination.');return true;}
  function action(name,pressed=true){
    if(!pressed){
      if(name==='melee')meleeHeld=false;
      if(name==='jump')traversal.setPressed(false);
      if(name==='touchFire'){touchFireHeld=false;aimX=aimY=0;clearAimLock();}
      if(name==='fire'||name==='shoot')fireHeld=false;
      if(name==='sprint')sprintHeld=false;
      return;
    }
    if(paused||incapacitated())return;unlock();
    if(name==='melee'&&!car){meleeHeld=true;startSwing();}
    if(name==='jump'&&!car){traversal.setPressed(true);networkTick=0;}
    if(name==='heal')useMedkit();
    if(['vehicle','drive','interact','use','enter'].includes(name))interact();
    if(name==='fire'||name==='shoot'){fireHeld=true;heldSource='button';fire(heldSource);}
    if(name==='touchFire'){touchFireHeld=true;fire('touch');}
    if(name==='sprint')sprintHeld=true;
    if(name==='reload')readyReload();
    if(name==='recenter'){meleeCameraAim=false;yaw=p.angle;pitch=.13;freeLookUntil=0;driftX=driftY=0;}
  }
  function down(e){
    if(paused||incapacitated()||isInput(e.target)||e.altKey||e.metaKey||e.ctrlKey)return;
    const k=e.key.toLowerCase();if(!['v','e','h','c','r','j','l','f','arrowup','arrowdown','arrowright','arrowleft','z','q','s','d','w','a',' ','shift'].includes(k))return;
    if(k===' '&&e.target?.closest?.('button'))return;
    e.preventDefault();unlock();
    if(!e.repeat){if(k==='v')startSwing('key');if(k===' ')action('jump');if(k==='e')interact();if(k==='h')useMedkit();if(k==='c')action('recenter');if(k==='r')readyReload();}
    keys.add(k);
  }
  const up=e=>{const k=e.key.toLowerCase();keys.delete(k);if(k===' ')traversal.setPressed(false);};
  function pointerDown(e){
    if(paused||incapacitated())return;e.preventDefault();canvas.focus({preventScroll:true});unlock();
    if(e.button===2||e.button===1||e.pointerType==='touch'){
      aimPointer=null;drag={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now()};driftX=driftY=0;canvas.setPointerCapture?.(e.pointerId);return;}
    if(e.button===0){clearAimLock();aimPointer={x:e.clientX,y:e.clientY};fireHeld=true;heldSource='pointer';fire(heldSource);canvas.setPointerCapture?.(e.pointerId);}
  }
  function pointerMove(e){
    if(paused)return;
    if(drag?.id===e.pointerId){
      const dx=e.clientX-drag.x,dy=e.clientY-drag.y,sens=e.pointerType==='touch'?.006:.0054;
      const dYaw=clamp(-dx*sens,-.6,.6),dPitch=clamp(dy*sens*.6,-.26,.26),eventTime=performance.now();
      yaw+=dYaw;if(dYaw)meleeCameraAim=true;pitch=clamp(pitch+dPitch,-.47,1.35);
      const elapsed=clamp((eventTime-drag.t)/1000,.015,.14);
      driftX=clamp(dYaw/elapsed,-3,3)*.36;driftY=clamp(dPitch/elapsed,-2,2)*.32;
      drag.x=e.clientX;drag.y=e.clientY;drag.t=eventTime;freeLookUntil=time+2.1;
    }else if(e.pointerType!=='touch')aimPointer={x:e.clientX,y:e.clientY};
  }
  function pointerUp(e){
    if(drag?.id===e.pointerId){if(performance.now()-drag.t>120)driftX=driftY=0;drag=null;}
    if(e.pointerType!=='touch'&&(e.button===0||e.button==null||e.type==='pointercancel'))fireHeld=false;
  }
  const pointerLeave=()=>{if(!fireHeld)aimPointer=null;};
  const menu=e=>e.preventDefault();
  const visibility=()=>{if(document.hidden)resetInputs();else{previousFrame=performance.now();popTick=0;}};
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',resetInputs);document.addEventListener('visibilitychange',visibility);
  canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerUp);
  canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerleave',pointerLeave);canvas.addEventListener('contextmenu',menu);
  const detachEvent=net?.onEvent?.(e=>{
    const d=e.data||{};
    if(e.type==='melee'&&e.player!==net?.id&&Object.hasOwn(meleeMoves,d.kind)&&Math.abs(epoch-d.started)<1400&&dist(d,p)<PEER_RANGE){
      const current=witnessedSwings.get(e.player);
      if(!current||current.started<d.started){
        const playAt=Math.max(d.started,epoch-meleeMoves[d.kind].contact*700);
        witnessedSwings.set(e.player,{kind:d.kind,started:d.started,playAt,angle:d.angle});
      }
    }
    if(e.type==='hit'&&d.cause==='melee'&&e.player!==net?.id&&d.target!==net?.id&&meleeMoves[d.kind]){
      const target=remotes.find(a=>a.id===d.target);
      if(target&&Math.abs(epoch-e.at)<1100){
        witnessedRecoils.set(d.target,{at:epoch,angle:d.angle,force:d.force});
        view.effect('meleeImpact',target.x,target.y,d.angle,d.force,[],(target.lift||0)+meleeMoves[d.kind].height);
      }
    }
    if(e.type==='emote')bubbles.set(e.player,{symbol:String(d.symbol||''),until:epoch+3600});
    if(e.type==='hit'&&d.target===net?.id){
      const clock=net?.serverTime?.()??epoch,at=Number.isFinite(e.at)?e.at:clock;
      const physical=d.cause==='melee',traffic=d.cause==='traffic';
      // Only the Worker places a shot ID and firing time on a confirmed weapon hit.
      // By delivery time the shooter may already have driven away or left the world.
      const confirmed=d.cause==='weapon'&&typeof d.shotId==='string'&&d.shotId.length>0&&Number.isSafeInteger(d.firedAt)&&Object.hasOwn(weapons,d.weapon);
      const sender=confirmed?null:(net?.peers?.()||[]).find(peer=>peer.id===e.player);
      const eventId=confirmed?e.player+'/fire/'+d.shotId:e.seq==null?null:e.player+'/'+e.seq;
      const eligible=confirmed?d.firedAt>=acceptShotsFrom:
        sender&&dist(sender,p)<=(physical?4.7:traffic?17:maxShotRange+15)&&
        (!physical||(!car&&Object.hasOwn(meleeMoves,d.kind)&&Math.abs(terrainHeight(p.x,p.y)+p.lift-terrainHeight(sender.x,sender.y)-(sender.lift||0))<2));
      if(e.player!==net?.id&&eligible&&Math.abs(clock-at)<5500&&(!eventId||!receivedHits.has(eventId))){
        if(eventId){receivedHits.set(eventId,at);if(receivedHits.size>160)receivedHits.delete(receivedHits.keys().next().value);}
        const angle=Number.isFinite(d.angle)?d.angle:sender?Math.atan2(p.y-sender.y,p.x-sender.x):p.angle;
        epoch=clock;
        if(physical){
          const move=meleeMoves[d.kind];
          damage(move.damage,angle,move.force,'melee',d.kind);
          view.effect('meleeImpact',p.x,p.y,angle,move.force,[],p.lift+move.height);
        }else damage(clamp(Number(d.damage)||0,0,100),angle,clamp(Number.isFinite(d.force)?d.force:(d.damage||0)/55,0,1),traffic?'traffic':'weapon',d.weapon);
      }
    }
    if(e.type==='propDamage'){
      const own=e.player===net?.id&&pendingImpacts.get(d.impactId)?.prop.id===d.id;
      const changed=confirmProp(d);
      if(changed&&d.damage>0&&(d.health===0||!own)){
        propEffect(d.health===0?'propBreak':'propHit',d,d.angle);
      }
      if(own)settlePropImpact(d.impactId,d.health===0&&d.damage>0);
    }
    if(e.type==='propDamageDenied'&&pendingImpacts.get(d.impactId)?.prop.id===d.id)settlePropImpact(d.impactId,false);
    if(e.type==='destroy'){
      if(!destroyed.has(d.id)){
        const o=nearbyProps(p.x,p.y,125).find(o=>o.id===d.id);
        if(o){
          view.effect('burst',o.x,o.y);
          if(d.cause==='melee'&&meleeMoves[d.swingKind])view.effect('meleeImpact',o.x,o.y,0,meleeMoves[d.swingKind].force,[],meleeMoves[d.swingKind].height);
        }
      }
      destroyed.add(d.id);
    }
    if(e.type==='vehicle')carsShared.set(d.id,d);
    if(e.type==='vehicleDenied'&&d.id===car?.id){
      if(travelClaim?.previousOwners.includes(d.owner)){travelClaim.sent=false;travelClaim.retryAt=epoch+1000;}
      else{dropCar(true);onNotice('Un autre joueur a pris le volant.');}
    }
    if(e.type==='npc'){if(d.kind)incidents.set(d.id,d);else{
      if(e.player!==net?.id&&d.recoil&&meleeMoves[d.swingKind]&&d.damage>0&&Math.abs(epoch-e.at)<1100&&dist(d,p)<75){
        view.effect('meleeImpact',d.recoil.fromX,d.recoil.fromY,d.recoil.angle,d.recoil.force,[],meleeMoves[d.swingKind].height);
      }
      rememberNpc(d,true);
    }}
    if(e.type==='shot'&&e.player!==net?.id&&dist(d,p)<125)shotPlayback.push(e,net?.serverTime?.()??epoch);
  });
  ready=true;sendHud(true);
  if(view.available){receivePeerSnapshots();syncPeers();population(.016);publish();frame(previousFrame+.1);}
  return {available:view.available,destinations,travel,exportTravelState,restoreTravelState,getPursuitSnapshot:()=>pursuit.snapshot(time),getVitalitySnapshot:()=>life.snapshot(),
    setAppearance(value){appearance=value&&typeof value==='object'&&!Array.isArray(value)?{...value}:null;publish();},emote,selectWeapon,action,setPaused(v){paused=!!v;if(paused)resetInputs();},
    setMove(x,y){if(incapacitated())return;stickX=clamp(Number(x)||0,-1,1);stickY=clamp(Number(y)||0,-1,1);if(stickX||stickY)unlock();},
    setAim(x,y){
      aimX=clamp(Number(x)||0,-1,1);aimY=clamp(Number(y)||0,-1,1);
      if(Math.hypot(aimX,aimY)>.15){
        clearAimLock();
        if(swing&&!swing.resolved&&(swing.source==='touch'||swing.source==='button'))swing.bearing=aimBearing(swing.source,true);
      }
    },
    setAimAssist(enabled){aimAssist=!!enabled;if(!aimAssist)clearAimLock();},
    setSound(v){sound=!!v;if(sound)unlock();},
    getWeaponAmmo(id){return owned.has(id)?ammo[id]:undefined;},
    getPosition(){return {x:p.x,y:p.y,angle:p.angle,district:district()};},
    getRoadMotion(){return paused||incapacitated()?null:roadMotion;},
    drawFullMap(target){paintMap(target,p,{full:true,peers:net?.peers?.()||remotes,vehicles:cars,pickups:availableDrops(weaponDrops)});},
    destroy(){isRunning=false;clearAimLock();cancelAnimationFrame(frameId);detachEvent?.();view.dispose();
      window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',resetInputs);document.removeEventListener('visibilitychange',visibility);
      canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerup',pointerUp);
      canvas.removeEventListener('pointercancel',pointerUp);canvas.removeEventListener('pointerleave',pointerLeave);canvas.removeEventListener('contextmenu',menu);audio?.close().catch(()=>{});
    }
  };
}
