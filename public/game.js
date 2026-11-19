import { SPAWN, destinations, districtAt, streetAt, nearbyProps, blocked, contactAt, moveBody, routeAgents, getTravelPoint, paintMap } from './paris-world.js';
import { createView } from './game-render.js';
import { nearbyWeaponDrops, weaponDrops } from './weapon-drops.js';
import { createWanted } from './wanted.js';
import { createVitality, impactEvent, npcHealthAt, pedestrianDamage, crashDamage } from './vitality.js';
import { ragdollPose } from './ragdoll.js';
import { vehicleSpec, isVehicleType, vehicleDoorways } from './vehicle-types.js';
import { weaponCatalog as weapons, starterWeapons, weaponList } from './weapon-catalog.js';
import { resolveWeaponShot } from './weapon-patterns.js';
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
const softProp=o=>o && ['bollard','bench','bin','hydrant','postbox','crate','lamp','tree'].includes(o.type);
function collisionBody(e){
  return e.isCar?{id:e.id,x:e.x,y:e.y,angle:e.angle,r:1,...dimensions(e)}:{id:e.id,x:e.x,y:e.y,r:e.stunned?.36:.37};
}

export function createGame({canvas,minimap,net,onState=()=>{},onNotice=()=>{},onAimLock=()=>{},initialPursuit=null,initialVitality=null,loadout=[],onLoadoutChange=()=>{},buildView=createView}){
  const p={...SPAWN,id:'local',type:'fox',health:100,wanted:0,walk:0,angle:SPAWN.angle||0,moving:false};
  const view=buildView(canvas,SPAWN,onNotice),keys=new Set(),destroyed=new Set(),peers=new Map(),carsShared=new Map(),npcShared=new Map(),incidents=new Map(),bubbles=new Map();
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
  let actors=[],cars=[],routeActors=[],routeCars=[],remotes=[],obstacles=[],previousFrame=performance.now(),frameId;
  let driftX=0,driftY=0,aimAngle=null,levelPlace=null,streetName=streetAt(p.x,p.y),streetTime=-1;
  let travelClaim=null,touchFireHeld=false,aimAssist=true,aimLock=null,lockPoint=null,markImpactUntil=0,nextLockCheck=0,heldSource='pointer';
  const life=createVitality(initialVitality,epoch),receivedHits=new Map();
  p.health=life.health;
  let appearance=null,impactSerial=0,trafficImpactAt=0;
  const incapacitated=()=>life.down||!!life.ragdoll;
  const emit=(type,data)=>net?.emit?.(type,data);
  function publish(){
    net?.publish?.({x:p.x,y:p.y,angle:p.angle,vx,vy,moving:p.moving,sprinting:p.sprinting,shooting:shootPose>.6,
      walk:p.walk,type:'fox',health:Math.ceil(p.health),downUntil:life.downUntil,ragdoll:life.ragdoll,appearance,wanted:p.wanted,weapon,
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
    const state={...life.state(epoch),health:Math.ceil(life.health),vehicleName:car?vehicleSpec(car.type).label:'',nearVehicleName:nearCar?vehicleSpec(nearCar.type).label:'',wanted:p.wanted,wantedPoints:wanted.points,wantedProgress:wanted.progress,wantedEvent,ownedWeapons:ownedWeapons(),nearPickup,district:district(),street:streetName,weapon,ammo:Number.isFinite(ammo[weapon])?ammo[weapon]:'∞',
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
  function destroyProp(o){
    if(!o?.id||destroyed.has(o.id))return false;
    destroyed.add(o.id);emit('destroy',{id:o.id});view.effect('burst',o.x,o.y);score+=10;return true;
  }
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
  function hurtNpc(actor,amount,angle,force){
    const old=npcShared.get(actor.id),before=npcHealthAt(old,epoch);
    if(before<=0)return false;
    const health=Math.max(0,before-amount),downUntil=health===0?epoch+6500:0;
    let fall=old?.ragdoll?.until>epoch?old.ragdoll:null;
    if(downUntil||(!fall&&force>=.36))fall=impactEvent(epoch,fallDirection(actor,angle),force,downUntil?6500:680+force*840,nextSeed());
    const update={id:actor.id,x:actor.x,y:actor.y,type:actor.type,angle:actor.angle,color:actor.color,
      damage:amount,health,healthAt:epoch,downUntil,stunnedUntil:fall?.until||0,ragdoll:fall};
    npcShared.set(actor.id,update);emit('npc',update);
    actor.health=health;actor.stunned=!!fall;return true;
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
    if(paused||car||incapacitated()){noticePickup=null;return;}
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
    const point=view.projectTarget?.(target.x,target.y,targetHeight(aimLock));
    if(!point){clearAimLock();return;}
    if(!lockPoint||Math.abs(point.x-lockPoint.x)+Math.abs(point.y-lockPoint.y)>.0008){
      lockPoint={x:point.x,y:point.y};onAimLock(lockPoint);
    }
  }
  function resetInputs(){
    keys.clear();fireHeld=touchFireHeld=sprintHeld=false;stickX=stickY=aimX=aimY=0;
    drag=null;driftX=driftY=0;aimAngle=null;clearAimLock();
  }
  function closestBoardableCar(){
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
    const geometry={radius:.42,destroyed,colliders:obstacles,ignoreId:car.id};
    const clear=exits.find(q=>!contactAt(q.x,q.y,geometry));
    if(!clear&&!denied){onNotice('Les portières sont bloquées. Avance un peu.');return false;}
    if(!denied&&(!travelClaim||travelClaim.sent)){const record={...car,x:p.x,y:p.y,angle:p.angle,moving:false,occupied:false,speed:0,owner:''};
      carsShared.set(car.id,{...record,protect:epoch+1600});emit('vehicle',record);}
    if(clear){p.x=clear.x;p.y=clear.y;}
    travelClaim=null;car=null;speed=vx=vy=steer=0;p.moving=false;popTick=0;publish();return true;
  }
  function placeAt(place){
    if(car&&!dropCar())return false;
    p.x=place.x;p.y=place.y;p.angle=place.angle??SPAWN.angle;p.moving=false;p.sprinting=false;
    yaw=p.angle;pitch=.13;vx=vy=speed=turn=0;cameraSnap=true;popTick=trafficTick=mapTick=hudTick=0;nearCar=null;
    routeClock=0;resetInputs();publish();return true;
  }
  function damage(amount,angle=p.angle,force=0,cause='weapon'){
    const direction=(!car&&force>=.18)||amount>=life.health?fallDirection(p,angle):angle;
    if(!life.hurt(amount,{at:epoch,angle:direction,force,cause,canFall:!car,seed:nextSeed()}))return;
    p.health=life.health;impact=1;tone(120,.14,'triangle',.05,60);
    if(life.down&&car){
      if(!travelClaim||travelClaim.sent){
        const parked={...car,x:p.x,y:p.y,angle:p.angle,moving:false,occupied:false,speed:0,owner:''};
        carsShared.set(car.id,{...parked,protect:epoch+1500});emit('vehicle',parked);
      }
      dropCar(true);
    }
    if(incapacitated()){resetInputs();reloading=0;vx=vy=speed=0;p.moving=p.sprinting=false;}
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
    const v=closestBoardableCar();
    if(!v){onNotice('Approche-toi d’une portière pour monter.');return;}
    car={id:v.id,type:v.type||'car',color:v.color,...(v.skin?{skin:v.skin}:{})};
    p.x=v.x;p.y=v.y;p.angle=v.angle||0;speed=0;vx=vy=0;impact=.15;freeLookUntil=0;popTick=0;
    const record={...car,x:p.x,y:p.y,angle:p.angle,moving:false,occupied:true,owner:net?.id||'local'};
    carsShared.set(car.id,{...record,protect:epoch+1500});emit('vehicle',record);publish();
    if(Object.values(services).includes(v.type))recordAction('stealService');
    else if(v.moving)recordAction('stealVehicle');
    tone(95,.19,'triangle',.04,235);onNotice(vehicleSpec(car.type).label+' · Haut pour accélérer, gauche et droite pour braquer.');
  }
  function syncPeers(){
    const roster=net?.peers?.()||[],present=new Set(roster.map(e=>e.id));
    if(!arrivalChecked&&net?.status==='online'){
      arrivalChecked=true;
      if(!car&&dist(p,SPAWN)<.75 && roster.some(r=>dist(r,p)<1.5)){
        for(let i=0;i<18;i++){const c=offset(SPAWN,SPAWN.angle+(i*2.39996),2.05+Math.floor(i/6)*1.5);
          if(!blocked(c.x,c.y,.45,destroyed)&&roster.every(r=>dist(r,c)>1.2)){p.x=c.x;p.y=c.y;cameraSnap=true;publish();break;}}
      }
    }
    for(const d of roster){
      if(!Number.isFinite(d.x)||!Number.isFinite(d.y))continue;
      const e=peers.get(d.id)||{id:d.id,x:d.x,y:d.y,angle:d.angle||0,walk:0};
      e.data=d;peers.set(d.id,e);
    }
    for(const id of peers.keys())if(!present.has(id))peers.delete(id);
    const world=net?.world?.()||{};
    settleTravelClaim(roster,world);
    for(const id of world.destroyed||[])destroyed.add(id);
    for(const [id,d] of Object.entries(world.vehicles||{})){
      const current=carsShared.get(id);
      if(!current||!(current.protect>epoch))carsShared.set(id,d);
    }
    for(const [id,d] of Object.entries(world.npcs||{})){if(d.kind){if(d.started>epoch-34000&&(!incidents.has(id)||incidents.get(id).started<d.started))incidents.set(id,d);}
      else rememberNpc(d);}
  }
  function updateRemote(dt){
    remotes=[];const k=blend(10,dt);
    for(const e of peers.values()){
      const d=e.data;
      if(dist(d,p)>PEER_RANGE){e.x=d.x;e.y=d.y;e.angle=d.angle||0;continue;}
      const large=dist(e,d)>18;
      const ahead=clamp((epoch-(d.updatedAt||epoch))/1000,0,.10);
      const tx=d.x+(d.vx||0)*ahead,ty=d.y+(d.vy||0)*ahead;e.x+=(tx-e.x)*(large?1:k);e.y+=(ty-e.y)*(large?1:k);
      e.angle=turnTo(e.angle,d.angle||0,12,dt);e.walk+=dt*(d.sprinting?14:9);
      const fallen=!d.vehicle&&ragdollPose(d.ragdoll,d.angle||0,epoch);
      const down=d.downUntil>epoch||d.health===0;
      remotes.push({...d,...(d.vehicle||{}),ragdoll:fallen,stunned:!!fallen||down,down,id:d.id,peer:true,name:d.name,type:d.vehicle?.type||'fox',x:e.x,y:e.y,angle:e.angle,isCar:!!d.vehicle,
        moving:!!d.moving,move:!!d.moving,fire:d.shooting?.75:0,walk:e.walk,bubble:bubbles.get(d.id)?.symbol});
    }
  }
  function serviceResponse(d,t){
    const age=(epoch-d.started)/1000;if(age<0||age>29||dist(d,p)>115)return;
    const role=d.kind,vehicleType=services[role];if(!vehicleType)return;
    // A responder arrives from the clearest of eight approaches and parks beside the incident.
    if(!d.approach){
      const candidates=Array.from({length:8},(_,i)=>i*Math.PI*.25);
      let best=0,bestScore=-1;
      for(const a of candidates){let n=0;for(let k=2;k<=30;k+=3){const q=offset(d,a,k);if(blocked(q.x,q.y,1,destroyed))break;n++;}if(n>bestScore){bestScore=n;best=a;}}
      d.approach={angle:best,length:Math.max(4,Math.min(29,bestScore*3))};
    }
    const a=d.approach.angle,len=d.approach.length,progress=clamp(age/4,0,1),parkDistance=clamp(len,2,6);
    const carPos=offset(d,a,len+(parkDistance-len)*progress);
    const id=d.id+'-car';if(car?.id!==id && !carsShared.has(id) && !blocked(carPos.x,carPos.y,.85,destroyed)){
      cars.push({...carPos,id,type:vehicleType,angle:a+Math.PI,isCar:true,speed:progress<1?4:0,moving:progress<1,siren:true});
    }
    if(age<3)return;
    // Every client chases the player attached to this dispatch, using the same world-space incident.
    const sourceId=d.id.slice(('unit-'+role+'-').length);
    const suspect=sourceId===(net?.id||'self')?p:peers.get(sourceId)?.data;
    const level=clamp(d.level||0,0,5),chasing=(role==='police'||role==='swat')&&suspect?.wanted;
    const target=(chasing||role==='medic')&&suspect&&dist(suspect,d)<24+level*9?suspect:d;
    const stride=(role==='swat'?2.4:1.7)+(chasing ? .25*level : 0);
    const at=offset(d,a,parkDistance),distance=dist(at,target)||1;
    const f=clamp((age-3)*stride/distance,0,1),q={x:at.x+(target.x-at.x)*f,y:at.y+(target.y-at.y)*f};
    if(blocked(q.x,q.y,.36,destroyed)){q.x=at.x;q.y=at.y;}
    actors.push({...q,id:d.id+'-foot',type:role,angle:Math.atan2(target.y-at.y,target.x-at.x),moving:f<1,move:f<1,speed:f<1?stride:0,walk:t*8});
  }
  function population(dt){
    updateRemote(dt);trafficTick-=dt;
    if(trafficTick<=0){trafficTick=.09;routeClock=epoch;const list=routeAgents(p.x,p.y,130,epoch);
      routeActors=list.actors;routeCars=list.cars;}
    const extrap=clamp((epoch-routeClock)/1000,0,.12);
    const step=e=>{const v=e.moving===false?0:e.speed||0;return {...e,x:e.x+Math.cos(e.angle||0)*v*extrap,y:e.y+Math.sin(e.angle||0)*v*extrap,moving:!!v,move:!!v,walk:time*(Math.abs(v)*3.4+2),speed:v};};
    actors=routeActors.map(step);cars=[];
    const occupied=new Set(remotes.map(r=>r.vehicle?.id).filter(Boolean));if(car)occupied.add(car.id);
    for(const raw of routeCars){if(occupied.has(raw.id)||carsShared.has(raw.id))continue;cars.push({...step(raw),isCar:true});}
    for(const d of carsShared.values())if(!occupied.has(d.id)&&dist(d,p)<135){
      if(d.occupied&&(peers.has(d.owner)||d.owner===net?.id))continue;
      cars.push({...d,angle:d.angle||0,isCar:true,moving:false,speed:0});}
    for(const [id,d] of incidents){if(epoch-d.started>30000)incidents.delete(id);else serviceResponse(d,time);}
    for(const [id,state] of npcShared){
      const health=npcHealthAt(state,epoch),until=Math.max(state.stunnedUntil||0,state.downUntil||0);
      if(health>=100&&until+800<epoch){npcShared.delete(id);continue;}
      if(dist(state,p)>135)continue;
      let actor=actors.find(e=>e.id===id);
      if(until<=epoch&&!actor)continue;
      if(!actor){actor={...state,type:state.type||'pedestrian'};actors.push(actor);}
      actor.health=health;actor.down=state.downUntil>epoch;
      if(until>epoch){
        Object.assign(actor,{x:state.x,y:state.y,angle:state.angle,moving:false,move:false,stunned:true,speed:0,
          ragdoll:ragdollPose(state.ragdoll,state.angle||0,epoch)});
      }else if(until&&epoch-until<1800&&dist(actor,state)<24){
        const t=(epoch-until)/1800,x=state.x+(actor.x-state.x)*t,y=state.y+(actor.y-state.y)*t;
        if(!blocked(x,y,.36,destroyed)){actor.x=x;actor.y=y;}
      }
    }
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
    const near=[...actors,...cars,...remotes].filter(e=>dist(e,p)<9);
    obstacles=near.filter(e=>!e.stunned).map(collisionBody);
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
  function travelSpot(x,y,angle,vehicle,sourceId){
    const nearby=routeAgents(x,y,64,epoch), shared=net?.world?.().vehicles||{};
    const occupants=net?.peers?.()||[], occupied=new Set(occupants.map(r=>r.vehicle?.id));
    const carsNear=[...nearby.cars.filter(v=>!shared[v.id]&&!occupied.has(v.id)),...Object.values(shared)];
    const entities=[...nearby.actors,...carsNear.filter(v=>v.id!==vehicle?.id).map(v=>({...v,isCar:true})),
      ...occupants.filter(r=>r.id!==sourceId&&(!vehicle||r.vehicle?.id!==vehicle.id)).map(r=>({...r,type:r.vehicle?.type||'fox',isCar:!!r.vehicle}))];
    const geometry={radius:.39,angle,destroyed,colliders:entities.filter(e=>dist(e,{x,y})<60).map(collisionBody)};
    if(vehicle)Object.assign(geometry,dimensions(vehicle));
    if(!contactAt(x,y,geometry))return {x,y};
    for(const radius of [.8,1.8,3.5,6,10,16,25,40,55]){
      const count=Math.max(12,Math.ceil(Math.PI*radius));
      for(let i=0;i<count;i++){
        const q=offset({x,y},angle+i*Math.PI*2/count,radius);
        if(!contactAt(q.x,q.y,geometry))return q;
      }
    }
    return null;
  }
  function restoreTravelState(s){
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
    const q=travelSpot(s.x,s.y,angle,ride,s.sourceId);
    if(!q || (car&&car.id!==ride?.id&&!dropCar()))return false;
    resetInputs();arrivalChecked=true;cameraSnap=true;levelPlace=null;
    p.x=q.x;p.y=q.y;p.angle=angle;
    life.restore({...s.vitality,health:finite(s.health,100,0,100)},epoch);p.health=life.health;
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
    car=ride;travelClaim=ride&&net?{previousOwners,sent:false,retryAt:0}:null;
    speed=ride?finite(s.vehicle.speed,0,-vehicleSpec(ride.type).reverse,vehicleSpec(ride.type).forward):0;
    vx=ride?Math.cos(angle)*speed:finite(s.vx,0,-6.4,6.4);vy=ride?Math.sin(angle)*speed:finite(s.vy,0,-6.4,6.4);
    p.moving=Math.hypot(vx,vy)>.1;p.sprinting=!ride&&Math.hypot(vx,vy)>4;
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
    const geometry={radius:.12,height:1.05,camera:true,destroyed,colliders:vehicles,ignoreId:null};
    const contact=(x,y,ignoreId)=>{geometry.ignoreId=ignoreId;return contactAt(x,y,geometry);};
    const trace=angle=>traceShot(p,angle,muzzle,range,targets,contact,weapon==='fist');
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
  function fire(source='manual'){
    if(paused||incapacitated()||!view.available||cooldown>0||reloading>0)return;
    const w=weapons[weapon];if(ammo[weapon]<=0){readyReload();return;}
    cooldown=w.interval;shootPose=1;ammo[weapon]--;
    const touch=source==='touch',manualDrag=(touch||source==='button')&&Math.hypot(aimX,aimY)>.15;
    const bearing=manualDrag?yaw+Math.atan2(aimX,-aimY):source==='pointer'?(aimAngle??yaw):yaw;
    const {muzzle,targets,trace,visible}=shotScene(w.range);
    let shot=trace(bearing);
    if(touch&&!manualDrag&&aimAssist&&weapon!=='fist'){
      const lock=chooseTouchShot({position:p,yaw,muzzle,range:w.range,targets,wanted:p.wanted,previousId:aimLock?.id,
        project:view.projectTarget,trace,direct:shot});
      if(lock){shot=lock.shot;aimLock=lock.target;markImpactUntil=time+.19;nextLockCheck=time+.12;drawAimLock();}else clearAimLock();
    }else clearAimLock();
    const a=shot.angle;
    if(!car)p.angle=a;
    const pattern=resolveWeaponShot(weapon,a,trace,targets,visible,shot);
    const severity=['gunshot','destroy','hitCivilian','hitPlayer','hitOfficer'];
    let worst=w.noise?0:-1;
    for(const {target,damage:amount} of pattern.hits){
      const direction=Math.atan2(target.y-p.y,target.x-p.x),force=clamp(amount/45+(weapon==='fist' ? .1 : 0),.12,1);
      if(target.hitKind==='prop'&&destroyProp(target))worst=Math.max(worst,1);
      if(target.hitKind==='npc'&&hurtNpc(target,amount,direction,force))worst=Math.max(worst,['police','swat'].includes(target.type)?4:2);
      if(target.hitKind==='peer'){emit('hit',{target:target.id,damage:amount,angle:direction,force,cause:'weapon'});worst=Math.max(worst,3);}
    }
    if(worst>=0)recordAction(severity[worst]);
    const rays=pattern.rays.map(r=>({x:r.origin.x,y:r.origin.y,angle:r.angle,length:r.length}));
    for(const r of rays)view.effect(w.effect,r.x,r.y,r.angle,r.length);
    if(pattern.impact)view.effect('burst',pattern.impact.x,pattern.impact.y);
    if(rays.length)emit('shot',{...rays[0],kind:weapon,...(rays.length>1?{rays}:{}),...(pattern.impact?{impact:pattern.impact}:{})});
    tone(w.frequency,.1,w.noise?'triangle':'sine',.055,w.frequency*.42);
    if(!ammo[weapon])readyReload();
  }
  function move(dt){
    if(incapacitated())return;
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
      const nextSpeed=speed+(throttle-dragForce)*dt;speed=clamp(!sy&&Math.sign(nextSpeed)!==Math.sign(speed)?0:nextSpeed,-spec.reverse,spec.forward);
      if(!sy&&Math.abs(speed)<.10)speed=0;
      steer+=(sx-steer)*blend(9,dt);
      const wheel=clamp(speed/6,-1,1),targetAngle=p.angle+steer*wheel*spec.steering*dt/(1+Math.abs(speed)*.029);
      const dx=Math.cos(targetAngle)*speed*dt,dy=Math.sin(targetAngle)*speed*dt;
      const options={radius:1,angle:targetAngle,...dimensions(car),destroyed,colliders:obstacles};
      let result=moveBody(p.x,p.y,dx,dy,options);
      if(result.hit&&result.touched&&Math.abs(speed)>6.3&&softProp(result.touched)){
        if(destroyProp(result.touched))recordAction('destroy');speed*=.76;impact=.7;result=moveBody(p.x,p.y,dx*.76,dy*.76,options);
      }
      if(result.hit){
        const struck=actors.find(e=>e.id===result.touched?.id);
        if(struck&&!struck.stunned&&Math.abs(speed)>4.8&&hurtNpc(struck,pedestrianDamage(speed),targetAngle+(speed<0?Math.PI:0),clamp(Math.abs(speed)/13,.4,1)))
          recordAction(['police','swat'].includes(struck.type)?'hitOfficer':'hitCivilian');
        if(contactLock<=0 && Math.abs(speed)>2.2){
          impact=clamp(Math.abs(oldSpeed)/12,.25,1);tone(95,.10,'triangle',.04,38);
          if(Math.abs(oldSpeed)>11.5){damage(crashDamage(oldSpeed),targetAngle,.3,'crash');if(life.down)return;}
          if(result.touched?.id&&remotes.some(e=>e.id===result.touched.id)&&Math.abs(oldSpeed)>8){
            emit('hit',{target:result.touched.id,damage:pedestrianDamage(oldSpeed),force:clamp(Math.abs(oldSpeed)/15,.4,1),angle:targetAngle+(speed<0?Math.PI:0),cause:'traffic'});recordAction('hitPlayer');
          }
          speed*=Math.abs(oldSpeed)>3?-.18:0;contactLock=.32;
        }
        if(Math.hypot(result.x-p.x,result.y-p.y)>.025)p.angle=targetAngle;
      }else p.angle=targetAngle;
      vx=(result.x-p.x)/dt;vy=(result.y-p.y)/dt;p.x=result.x;p.y=result.y;p.moving=Math.abs(speed)>.13;
      if(time>freeLookUntil&&Math.abs(speed)>.21)yaw=turnTo(yaw,p.angle,2.6+Math.abs(speed)*.035,dt);
      p.sprinting=false;
    }else{
      p.sprinting=!paused&&(sprintHeld||keys.has('shift')) && m>.25;
      const maximum=p.sprinting?6.4:3.45;
      const forward=Math.cos(yaw),across=Math.sin(yaw),targetX=(sy*forward-sx*across)*maximum,targetY=(sy*across+sx*forward)*maximum;
      const k=blend(m>.08?9.0:13.5,dt);vx+=(targetX-vx)*k;vy+=(targetY-vy)*k;
      if(Math.hypot(vx,vy)<.035){vx=0;vy=0;}
      const result=moveBody(p.x,p.y,vx*dt,vy*dt,{radius:.39,destroyed,colliders:obstacles});
      const actual=Math.hypot(result.x-p.x,result.y-p.y)/dt;
      if(result.hit){const inward=vx*result.normalX+vy*result.normalY;if(inward<0){vx-=inward*result.normalX;vy-=inward*result.normalY;}}
      p.x=result.x;p.y=result.y;p.moving=actual>.11;p.walk+=actual*dt*3.25;
      if(p.moving&&shootPose<.36)p.angle=turnTo(p.angle,Math.atan2(vy,vx),12,dt);
      // If moving traffic reaches a stationary pedestrian, separate them to the near side of the body.
      if(contactLock<=0){
        const traffic=cars.find(e=>e.moving&&Math.abs(e.speed)>1.5&&trafficContact(e,p,.18));
        if(traffic){const dx=p.x-traffic.x,dy=p.y-traffic.y,c=Math.cos(traffic.angle),s=Math.sin(traffic.angle);
          const localX=dx*c+dy*s,localY=-dx*s+dy*c;
          const shape=vehicleSpec(traffic.type);
          if(Math.abs(localX)<shape.halfLength+.18&&Math.abs(localY)<shape.halfWidth+.18){
            const side=(Math.sign(localY)||1)*(shape.halfWidth+.58),px=traffic.x+c*localX-s*side,py=traffic.y+s*localX+c*side;
            if(!blocked(px,py,.39,destroyed)){p.x=px;p.y=py;}
            impact=.8;damage(pedestrianDamage(traffic.speed),traffic.angle,clamp(Math.abs(traffic.speed)/13,.38,1),'traffic');contactLock=1.5;
          }}
      }
    }
    turn=clamp(deltaAngle(oldAngle,p.angle)/dt/3,-1,1);
    if(!paused){
      if(keys.has(' '))fire('manual');
      else if(fireHeld)fire(heldSource);
      else if(touchFireHeld)fire('touch');
    }
  }
  function frame(t){
    if(!isRunning)return;
    const dt=clamp((t-previousFrame)/1000,.001,.075);
    previousFrame=t;time+=dt;epoch=net?.serverTime?.()||Date.now();
    popTick-=dt;if(popTick<=0){syncPeers();if(p.wanted)dispatchPursuit();popTick=.24;}
    population(dt);
    if(!drag && Math.abs(driftX)+Math.abs(driftY)>.002){
      yaw+=driftX*dt;pitch=clamp(pitch+driftY*dt,-.47,1.35);
      driftX*=Math.exp(-12*dt);driftY*=Math.exp(-12*dt);
    }
    if(keys.has('j')||keys.has('l')){yaw+=(keys.has('l')?1:-1)*1.8*dt;freeLookUntil=time+2.5;}
    cooldown=Math.max(0,cooldown-dt);contactLock=Math.max(0,contactLock-dt);
    impact=Math.max(0,impact-dt*3);shootPose=Math.max(0,shootPose-dt*4.5);
    if(reloading){reloading=Math.max(0,reloading-dt);if(!reloading)ammo[weapon]=weapons[weapon].mag;}
    const wanted=pursuit.tick(time);p.wanted=wanted.level;
    const medic=!car&&actors.some(o=>o.type==='medic'&&!o.stunned&&dist(o,p)<2.7);
    if(life.tick(epoch,medic)){
      p.health=life.health;pursuit.clear(time);p.wanted=0;wantedEvent=null;resetInputs();
      if(!medic)placeAt(levelPlace||SPAWN);
      onNotice(medic?'L’ambulancier t’a remis sur pied.':'Les secours t’ont reconduit en lieu sûr.');
      sendHud(true);
    }
    p.health=life.health;
    const steps=Math.max(1,Math.ceil(dt/(1/45)));
    for(let i=0;i<steps;i++)move(dt/steps);
    updatePickups();
    for(const [id,b] of bubbles)if(b.until<epoch)bubbles.delete(id);
    const responder=actors.find(o=>!o.stunned&&dist(o,p)<1.6&&['police','swat'].includes(o.type));
    if(responder&&p.wanted&&!car&&!life.down&&contactLock<=0){
      damage(responder.type==='swat'?14:8,Math.atan2(p.y-responder.y,p.x-responder.x),responder.type==='swat' ? .48 : .22,'police');contactLock=1.75;
    }
    const self={...p,...(car||{}),id:'self',self:true,appearance,stunned:incapacitated(),down:life.down,ragdoll:ragdollPose(life.ragdoll,p.angle,epoch),moving:p.moving,move:p.moving,sprinting:p.sprinting,walk:p.walk,turn,impact,fire:shootPose,steer,
      brake:braking,emote:bubbles.get(net?.id||'self')?.symbol,bubble:bubbles.get(net?.id||'self')?.symbol,speed:car?speed:Math.hypot(vx,vy),isCar:!!car};
    view.render({p,car,speed,yaw,pitch,snap:cameraSnap,destroyed,pickups,entities:[self,...remotes,...cars,...actors]},dt,time);cameraSnap=false;drawAimLock();
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
    weapon=kind;reloading=0;cooldown=.13;fireHeld=touchFireHeld=false;clearAimLock();shootPose=0;unlock();tone(410,.06);sendHud(true);return true;
  }
  function emote(symbol){if(!symbol||incapacitated())return;const s=String(symbol).slice(0,16);bubbles.set(net?.id||'self',{symbol:s,until:epoch+3700});emit('emote',{symbol:s});unlock();tone(590,.12,'sine',.04,710);}
  function travel(key){if(incapacitated())return false;const place=getTravelPoint(key);if(!place)return false;if(!placeAt(place))return false;levelPlace=place;sendHud(true);onNotice(place.label||'Arrivée à destination.');return true;}
  function action(name,pressed=true){
    if(!pressed){
      if(name==='touchFire'){touchFireHeld=false;aimX=aimY=0;clearAimLock();}
      if(name==='fire'||name==='shoot'){fireHeld=false;aimAngle=null;}
      if(name==='sprint')sprintHeld=false;
      return;
    }
    if(paused||incapacitated())return;unlock();
    if(name==='heal')useMedkit();
    if(['vehicle','drive','interact','use','enter'].includes(name))interact();
    if(name==='fire'||name==='shoot'){fireHeld=true;heldSource='button';aimAngle=null;fire(heldSource);}
    if(name==='touchFire'){touchFireHeld=true;fire('touch');}
    if(name==='sprint')sprintHeld=true;
    if(name==='reload')readyReload();
    if(name==='recenter'){yaw=p.angle;pitch=.13;freeLookUntil=0;driftX=driftY=0;}
  }
  function down(e){
    if(paused||incapacitated()||isInput(e.target)||e.altKey||e.metaKey||e.ctrlKey)return;
    const k=e.key.toLowerCase();if(!['e','h','c','r','j','l','arrowup','arrowdown','arrowright','arrowleft','z','q','s','d','w','a',' ','shift'].includes(k))return;
    if(k===' '&&e.target?.closest?.('button'))return;
    e.preventDefault();unlock();
    if(!e.repeat){if(k==='e')interact();if(k==='h')useMedkit();if(k==='c')action('recenter');if(k==='r')readyReload();}
    keys.add(k);
  }
  const up=e=>keys.delete(e.key.toLowerCase());
  function pointerDown(e){
    if(paused||incapacitated())return;e.preventDefault();canvas.focus({preventScroll:true});unlock();
    if(e.button===2||e.button===1||e.pointerType==='touch'){
      drag={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now()};driftX=driftY=0;canvas.setPointerCapture?.(e.pointerId);return;}
    if(e.button===0){clearAimLock();aimAngle=view.aim(e.clientX,e.clientY,p);fireHeld=true;heldSource='pointer';fire(heldSource);canvas.setPointerCapture?.(e.pointerId);}
  }
  function pointerMove(e){
    if(paused)return;
    if(drag?.id===e.pointerId){
      const dx=e.clientX-drag.x,dy=e.clientY-drag.y,sens=e.pointerType==='touch'?.006:.0054;
      const dYaw=clamp(-dx*sens,-.6,.6),dPitch=clamp(dy*sens*.6,-.26,.26),eventTime=performance.now();
      yaw+=dYaw;pitch=clamp(pitch+dPitch,-.47,1.35);
      const elapsed=clamp((eventTime-drag.t)/1000,.015,.14);
      driftX=clamp(dYaw/elapsed,-3,3)*.36;driftY=clamp(dPitch/elapsed,-2,2)*.32;
      drag.x=e.clientX;drag.y=e.clientY;drag.t=eventTime;freeLookUntil=time+2.1;
    }else if(fireHeld&&e.pointerType!=='touch')aimAngle=view.aim(e.clientX,e.clientY,p);
  }
  function pointerUp(e){
    if(drag?.id===e.pointerId){if(performance.now()-drag.t>120)driftX=driftY=0;drag=null;}
    if(e.pointerType!=='touch'){fireHeld=false;aimAngle=null;}
  }
  const menu=e=>e.preventDefault();
  const visibility=()=>{if(document.hidden)resetInputs();else{previousFrame=performance.now();popTick=0;}};
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',resetInputs);document.addEventListener('visibilitychange',visibility);
  canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerUp);
  canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('contextmenu',menu);
  const detachEvent=net?.onEvent?.(e=>{
    const d=e.data||{};
    if(e.type==='emote')bubbles.set(e.player,{symbol:String(d.symbol||''),until:epoch+3600});
    if(e.type==='hit'&&d.target===net?.id){
      const sender=(net?.peers?.()||[]).find(peer=>peer.id===e.player),at=Number.isFinite(e.at)?e.at:epoch;
      const eventId=e.seq==null?null:e.player+'/'+e.seq,traffic=d.cause==='traffic';
      if(sender&&sender.id!==net?.id&&Math.abs(epoch-at)<5500&&dist(sender,p)<=(traffic?17:maxShotRange+15)&&(!eventId||!receivedHits.has(eventId))){
        if(eventId){receivedHits.set(eventId,at);if(receivedHits.size>160)receivedHits.delete(receivedHits.keys().next().value);}
        const angle=Number.isFinite(d.angle)?d.angle:Math.atan2(p.y-sender.y,p.x-sender.x);
        damage(clamp(Number(d.damage)||0,0,100),angle,clamp(Number.isFinite(d.force)?d.force:(d.damage||0)/55,0,1),traffic?'traffic':'weapon');
      }
    }
    if(e.type==='destroy'){if(!destroyed.has(d.id)){const o=nearbyProps(p.x,p.y,125).find(o=>o.id===d.id);if(o)view.effect('burst',o.x,o.y);}destroyed.add(d.id);}
    if(e.type==='vehicle')carsShared.set(d.id,d);
    if(e.type==='vehicleDenied'&&d.id===car?.id){
      if(travelClaim?.previousOwners.includes(d.owner)){travelClaim.sent=false;travelClaim.retryAt=epoch+1000;}
      else{dropCar(true);onNotice('Un autre joueur a pris le volant.');}
    }
    if(e.type==='npc'){if(d.kind)incidents.set(d.id,d);else rememberNpc(d,true);}
    if(e.type==='shot'&&dist(d,p)<125){
      const effect=weapons[d.kind]?.effect||'shot',rays=Array.isArray(d.rays)?d.rays.slice(0,13):[d];
      for(const r of rays)if([r.x,r.y,r.angle,r.length].every(Number.isFinite))view.effect(effect,r.x,r.y,r.angle,clamp(r.length,0,100));
      if(d.impact&&dist(d.impact,d)<100)view.effect('burst',d.impact.x,d.impact.y);
    }
  });
  ready=true;sendHud(true);
  if(view.available){syncPeers();population(.016);publish();frame(previousFrame+.1);}
  return {available:view.available,destinations,travel,exportTravelState,restoreTravelState,getPursuitSnapshot:()=>pursuit.snapshot(time),getVitalitySnapshot:()=>life.snapshot(),
    setAppearance(value){appearance=value&&typeof value==='object'&&!Array.isArray(value)?{...value}:null;publish();},emote,selectWeapon,action,setPaused(v){paused=!!v;if(paused)resetInputs();},
    setMove(x,y){if(incapacitated())return;stickX=clamp(Number(x)||0,-1,1);stickY=clamp(Number(y)||0,-1,1);if(stickX||stickY)unlock();},
    setAim(x,y){aimX=clamp(Number(x)||0,-1,1);aimY=clamp(Number(y)||0,-1,1);if(Math.hypot(aimX,aimY)>.15)clearAimLock();},
    setAimAssist(enabled){aimAssist=!!enabled;if(!aimAssist)clearAimLock();},
    setSound(v){sound=!!v;if(sound)unlock();},
    getPosition(){return {x:p.x,y:p.y,angle:p.angle,district:district()};},
    drawFullMap(target){paintMap(target,p,{full:true,peers:net?.peers?.()||remotes,vehicles:cars,pickups:availableDrops(weaponDrops)});},
    destroy(){isRunning=false;clearAimLock();cancelAnimationFrame(frameId);detachEvent?.();view.dispose();
      window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',resetInputs);document.removeEventListener('visibilitychange',visibility);
      canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerup',pointerUp);
      canvas.removeEventListener('pointercancel',pointerUp);canvas.removeEventListener('contextmenu',menu);audio?.close().catch(()=>{});
    }
  };
}
