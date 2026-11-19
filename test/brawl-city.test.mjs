import {broadcastEvents} from './fixtures/fire-events.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../public/game.js';
import {monuments,contactAt} from '../public/paris-world.js';

// Drive two full simulations with a shared clock. Presence arrives periodically,
// while action events reach the other game on its next frame.
function arena(t,count=1){
  const globals=['document','window','requestAnimationFrame','cancelAnimationFrame'];
  const saved=globals.map(k=>globalThis[k]);
  globalThis.document=Object.assign(new EventTarget(),{hidden:false});globalThis.window=new EventTarget();
  const frames=new Map(),clients=[],roster=new Map(),queued=[];
  let serial=0,seq=0,clock=1782250000000,stamp=performance.now(),nextPacket=0;
  globalThis.requestAnimationFrame=fn=>(frames.set(++serial,fn),serial);
  globalThis.cancelAnimationFrame=id=>frames.delete(id);
  t.after(()=>{
    for(const c of clients)c.game.destroy();
    globals.forEach((key,i)=>{if(saved[i]===undefined)delete globalThis[key];else globalThis[key]=saved[i];});
  });
  for(let i=0;i<count;i++){
    const c={id:'brawler-'+i,events:[],effects:[]};
    clients.push(c);
    const net={id:c.id,status:'online',world:()=>({}),serverTime:()=>clock,
      peers:()=>[...roster.values()].filter(other=>other.id!==c.id),
      publish:pose=>{c.published=pose;},onEvent:fn=>{c.receive=fn;return ()=>{};},
      emit:(type,data)=>{
        const e={type,data:structuredClone(data),seq:++seq,at:clock,player:c.id};
        c.events.push(e);queued.push(...broadcastEvents(e,()=>++seq));return true;
      }};
    c.canvas=Object.assign(new EventTarget(),{focus(){},setPointerCapture(){}});
    c.game=createGame({canvas:c.canvas,net,onState:h=>{c.hud=h;},buildView:()=>({
      available:true,mode:'canvas',aim:(x,y,p)=>c.aim?c.aim(x,y,p):c.game.getPosition().angle,
      render:s=>{c.scene=s;},effect:(...args)=>c.effects.push(args),dispose(){}
    })});
  }
  function tick(n=1,observe=()=>{}){
    for(let i=0;i<n;i++){
      stamp+=1000/60;clock+=1000/60;
      if(clock>=nextPacket){
        for(const c of clients)if(c.published)roster.set(c.id,{...c.published,id:c.id,updatedAt:clock,joinedAt:1});
        nextPacket=clock+120;
      }
      for(const e of queued.splice(0))for(const c of clients)if(c.id!==e.player)c.receive(e);
      const active=[...frames.values()];frames.clear();for(const fn of active)fn(stamp);
      observe();
    }
  }
  function other(pose){
    roster.set('dummy',{id:'dummy',health:100,angle:0,joinedAt:1,updatedAt:clock,...pose});
  }
  const place=(c,pose,angle=0)=>assert.ok(c.game.restoreTravelState({...c.game.exportTravelState(),x:pose.x,y:pose.y,angle,yaw:angle,vx:0,vy:0,vehicle:null}));
  return {clients,tick,place,other,now:()=>Math.floor(clock)};
}
const arc=monuments.arc;
const arcPoint=(x,z)=>({x:arc.x+x*Math.cos(arc.yaw)+z*Math.sin(arc.yaw),y:arc.y-x*Math.sin(arc.yaw)+z*Math.cos(arc.yaw)});
const self=c=>c.scene.entities.find(p=>p.self);
const attacks=c=>c.events.filter(e=>e.type==='melee');
const hits=c=>c.events.filter(e=>e.type==='hit');
const tap=(c,action)=>{c.game.action(action,true);c.game.action(action,false);};

test('a confirmed shot survives the shooter leaving, while a retry or a hit before fast travel costs no further health',t=>{
  const {clients:[target],tick,place,now}=arena(t);
  place(target,arc);tick(8);
  const firedAt=now(),data={target:target.id,cause:'weapon',weapon:'pistol',damage:17,force:.15,
    angle:0,shotId:'lost-ack',firedAt};
  const hit={type:'hit',player:'departed-shooter',at:firedAt,seq:110,data};
  target.receive(hit);tick();
  assert.equal(target.hud.health,83);
  target.receive({...hit,seq:111});tick();
  assert.equal(target.hud.health,83);
  place(target,{x:arc.x+5,y:arc.y});tick(2);
  target.receive({...hit,seq:112,data:{...data,shotId:'before-travel'}});tick();
  assert.equal(target.hud.health,83);
});

test('quick melee with a pistol and primary attack with fists swing through air without shots or ammunition loss',t=>{
  const {clients:[a],tick,place}=arena(t);
  place(a,arc);tick(22);
  const ammo=a.game.exportTravelState().ammo.pistol;
  const down=new Event('keydown',{cancelable:true});Object.assign(down,{key:'v',repeat:false});
  window.dispatchEvent(down);
  const up=new Event('keyup');Object.assign(up,{key:'v'});window.dispatchEvent(up);
  let hasPose=false;
  tick(65,()=>{if(self(a).melee?.kind==='jab')hasPose=true;});
  assert.equal(attacks(a).length,1);assert.ok(hasPose);
  assert.equal(a.hud.weapon,'pistol');assert.equal(a.hud.ammo,ammo);
  assert.ok(a.game.selectWeapon('fist'));tick(10);
  tap(a,'fire');tick(65);
  assert.equal(attacks(a).length,2);assert.equal(hits(a).length,0);
  assert.equal(a.events.filter(e=>['fire','destroy'].includes(e.type)||e.data.damage).length,0);
  assert.equal(a.game.exportTravelState().ammo.pistol,ammo);
  assert.equal(a.hud.wantedPoints,0);
});

test('holding the attack cycles through the two hands and kick, then release stops the sequence',t=>{
  const {clients:[a],tick,place}=arena(t);
  place(a,arc);tick(20);
  const kinds=new Set();a.game.action('melee',true);
  for(let i=0;i<150&&attacks(a).length<3;i++)tick(1,()=>{if(self(a).melee)kinds.add(self(a).melee.kind);});
  a.game.action('melee',false);tick(90,()=>{if(self(a).melee)kinds.add(self(a).melee.kind);});
  assert.deepEqual(attacks(a).map(e=>e.data.kind),['jab','hook','kick']);
  assert.deepEqual([...kinds],['jab','hook','kick']);
  assert.equal(hits(a).length,0);assert.equal(a.hud.ammo,12);
});

test('a close strike lands once at contact on a second game, pushes its capsule and is visible remotely',t=>{
  const {clients:[a,b],tick,place}=arena(t,2);
  place(a,arc);place(b,{x:arc.x+1.3,y:arc.y},Math.PI);tick(40);
  assert.ok(Math.hypot(self(a).x-self(b).x,self(a).y-self(b).y)<1.5);
  const before={...b.game.getPosition()},hp=b.hud.health,hpAtStart=a.hud.health;
  const observed={swing:false,recoil:false};
  tap(a,'melee');tick(4);
  assert.equal(hits(a).length,0);assert.equal(b.hud.health,hp);
  tick(60,()=>{
    if(b.scene.entities.some(e=>e.peer&&e.id===a.id&&e.melee?.kind==='jab'))observed.swing=true;
    if(self(b).recoil)observed.recoil=true;
  });
  const contact=hits(a);
  assert.equal(contact.length,1);
  assert.equal(contact[0].data.target,b.id);assert.equal(contact[0].data.cause,'melee');
  assert.equal(b.hud.health,hp-contact[0].data.damage);assert.equal(a.hud.health,hpAtStart);
  assert.ok(b.game.getPosition().x-before.x>.12,'hit moves the victim away from the attacking avatar');
  assert.ok(observed.swing&&observed.recoil,JSON.stringify(observed));
  assert.equal(a.events.some(e=>e.type==='fire'),false);
  assert.ok(a.hud.wantedPoints>0);
  b.receive(contact[0]);tick(10);
  assert.equal(b.hud.health,hp-contact[0].data.damage,'network redelivery cannot damage the avatar twice');
});

test('a close target behind the player, a distant target and a target above the contact are all missed',t=>{
  const {clients:[a],tick,place,other}=arena(t);
  place(a,arc);
  for(const p of [{x:arc.x-1.4,y:arc.y},{x:arc.x+4,y:arc.y},{x:arc.x+1.4,y:arc.y,lift:3}]){
    other(p);tick(60);tap(a,'melee');tick(65);
  }
  assert.equal(attacks(a).length,3);assert.equal(hits(a).length,0);assert.equal(a.hud.wantedPoints,0);
});

test('a solid Arc de Triomphe pier blocks a strike even when the replicated target is within arm’s reach',t=>{
  const {clients:[a],tick,place,other}=arena(t);
  const start=arcPoint(arc.innerSide-.77,7),target=arcPoint(arc.innerSide+.65,7);
  assert.equal(contactAt(start.x,start.y,{radius:.59}),null);
  assert.equal(contactAt(target.x,target.y,{radius:.04}).type,'building');
  place(a,start,-arc.yaw);other(target);tick(40);
  assert.ok(Math.hypot(target.x-self(a).x,target.y-self(a).y)<1.5);
  tap(a,'melee');tick(55);
  assert.equal(attacks(a).length,1);assert.equal(hits(a).length,0);
});

test('a pavement pedestrian in front takes one contact, moves to a clear position, and raises wanted points',t=>{
  const {clients:[a],tick}=arena(t);
  tick(32);
  const candidates=a.scene.entities.filter(e=>e.type==='pedestrian')
    .sort((l,r)=>Math.hypot(l.x-self(a).x,l.y-self(a).y)-Math.hypot(r.x-self(a).x,r.y-self(a).y));
  let target,closest=Infinity;
  for(const candidate of candidates.slice(0,6)){
    for(let i=0;i<300;i++){
      const ped=a.scene.entities.find(e=>e.id===candidate.id);
      if(!ped||ped.down||ped.ragdoll)break;
      const p=self(a),dx=ped.x-p.x,dy=ped.y-p.y,d=Math.hypot(dx,dy);
      const c=Math.cos(a.scene.yaw),s=Math.sin(a.scene.yaw);
      a.game.setMove((-s*dx+c*dy)/d,-(c*dx+s*dy)/d);
      const error=Math.atan2(Math.sin(Math.atan2(dy,dx)-p.angle),Math.cos(Math.atan2(dy,dx)-p.angle));
      closest=Math.min(closest,d);
      if(d<=1.77&&Math.abs(error)<.14){target=ped;break;}
      tick();
    }
    if(target)break;
  }
  assert.ok(target,`walked into range of a passerby (closest ${closest.toFixed(2)} m)`);
  const before={x:target.x,y:target.y};
  let atContact;
  tap(a,'melee');tick(12,()=>{
    if(!atContact&&a.events.some(e=>e.type==='npc'&&e.data.id===target.id&&e.data.damage>0))atContact={...self(a)};
  });
  a.game.setMove(0,0);tick(38);
  const impacts=a.events.filter(e=>e.type==='npc'&&e.data.id===target.id&&e.data.damage>0);
  assert.equal(impacts.length,1);
  const {health,damage,x,y,recoil}=impacts[0].data;
  assert.equal(health,100-damage);
  assert.ok(recoil&&Math.hypot(x-recoil.fromX,y-recoil.fromY)>.09,'NPC has a displaced endpoint');
  assert.ok(Math.hypot(recoil.fromX-before.x,recoil.fromY-before.y)>.03,'pedestrian walked during wind-up');
  const finalBearing=Math.atan2(recoil.fromY-atContact.y,recoil.fromX-atContact.x);
  assert.ok(angularError(atContact.angle,finalBearing)<.002,'body faces the pedestrian at contact, after both moved');
  assert.ok(angularError(recoil.angle,finalBearing)<.002);
  assert.equal(contactAt(x,y,{radius:.30}),null);
  assert.ok(a.hud.wantedPoints>0);
  assert.equal(a.events.some(e=>e.type==='fire'),false);
});


test('a knockout near a stone pier enters ragdoll without pushing the victim through the wall',t=>{
  const {clients:[a,b],tick,place}=arena(t,2);
  place(a,arcPoint(arc.innerSide-2.03,7),-arc.yaw);
  const back=arcPoint(arc.innerSide-.69,7),saved=b.game.exportTravelState();
  assert.ok(b.game.restoreTravelState({...saved,...back,angle:Math.PI-arc.yaw,yaw:Math.PI-arc.yaw,
    health:8,vitality:{...saved.vitality,health:8,hitAt:1782250000000}}));
  tick(38);
  assert.ok(b.hud.health<=10);
  tap(a,'melee');tick(36);
  assert.equal(hits(a).length,1);assert.equal(b.hud.health,0);
  assert.ok(self(b).ragdoll&&self(b).down);
  assert.ok(a.scene.entities.some(e=>e.id===b.id&&e.peer&&e.ragdoll));
  const point=b.game.getPosition();
  assert.equal(contactAt(point.x,point.y,{radius:.57}),null,'victim capsule remains on the open side');
  tap(b,'melee');tick(25);assert.equal(attacks(b).length,0);
});

const angularError=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
const mouse=(client,type,x=200,y=160)=>client.canvas.dispatchEvent(Object.assign(new Event(type),{pointerId:3,pointerType:'mouse',button:0,clientX:x,clientY:y}));
const key=(type,value)=>window.dispatchEvent(Object.assign(new Event(type,{cancelable:true}),{key:value}));

test('quick melee follows the hovered opponent across the angle wrap, without turning the camera',t=>{
  const {clients:[a,b],tick,place}=arena(t,2);
  const heading=Math.PI-.32,aim=-Math.PI+.33,range=1.44;
  place(a,arc,heading);place(b,{x:arc.x+range*Math.cos(aim),y:arc.y+range*Math.sin(aim)},0);tick(45);
  a.aim=()=>aim;mouse(a,'pointermove');key('keydown','v');key('keyup','v');
  assert.ok(angularError(attacks(a)[0].data.angle,aim)<.02);
  tick(3);
  assert.ok(angularError(self(a).angle,heading)>.01&&angularError(self(a).angle,heading)<.35,'body turns along the short arc during the wind-up');
  let actual;
  tick(19,()=>{
    if(!actual&&hits(a).length)actual=self(a).angle;
  });
  assert.equal(hits(a).length,1);
  assert.ok(angularError(actual,hits(a)[0].data.angle)<.002);
  assert.ok(angularError(a.scene.yaw,heading)<.001);
  const remote=b.scene.entities.find(e=>e.id===a.id);
  assert.ok(remote&&angularError(remote.angle,actual)<.07);
});

test('dragging the melee button during the first wind-up can redirect the strike after lifting the thumb',t=>{
  const {clients:[a],tick,place,other}=arena(t);
  place(a,arc,0);other({x:arc.x,y:arc.y+1.37});tick(40);
  a.game.action('melee');a.game.setAim(1,0);a.game.action('melee',false);a.game.setAim(0,0);
  tick(18);
  assert.equal(hits(a).length,1);assert.equal(hits(a)[0].data.target,'dummy');
  assert.ok(angularError(self(a).angle,Math.PI/2)<.02);
});

test('a held stationary cursor updates its world bearing during a strafe and observes a shot before the next presence',t=>{
  const {clients:[a,b],tick,place}=arena(t,2);
  place(a,arc);place(b,{x:arc.x+4,y:arc.y+2});tick(40);
  let aim=-.36;
  a.aim=(x,y)=>{assert.equal(x,200);assert.equal(y,160);return aim;};
  mouse(a,'pointerdown');a.game.setMove(1,0);tick(2);
  const remote=b.scene.entities.find(e=>e.id===a.id);
  assert.ok(remote.fire>0&&angularError(remote.angle,aim)<.001);
  const atShot=a.game.getPosition();aim=-.83;
  tick(11);
  assert.ok(angularError(self(a).angle,aim)<.025,'the legs can move sideways while the body keeps aiming during weapon cooldown');
  tick(8);
  const shot=a.events.filter(e=>e.type==='fire').at(-1);
  assert.ok(angularError(shot.data.angle,aim)<.0001);
  assert.ok(angularError(self(a).angle,aim)<.002);
  assert.ok(Math.hypot(self(a).x-atShot.x,self(a).y-atShot.y)>.17);
  mouse(a,'pointerup');tick(44);
  assert.ok(angularError(self(a).angle,Math.PI/2)<.09,'after releasing fire locomotion regains control of the heading');
});

test('shooting sideways while driving leaves the chassis heading unchanged',t=>{
  const {clients:[a],tick}=arena(t);
  tick(12);a.game.action('vehicle');tick(12);
  assert.ok(self(a).isCar);
  const heading=a.game.getPosition().angle;
  a.aim=()=>heading+Math.PI/2;
  mouse(a,'pointerdown');mouse(a,'pointerup');tick(8);
  const shot=a.events.find(e=>e.type==='fire');
  assert.ok(shot&&angularError(shot.data.angle,heading+Math.PI/2)<.0001);
  assert.ok(angularError(a.game.getPosition().angle,heading)<.001);
});

test('a trigger spends one round and sends one timestamped fire packet carrying its player contact',t=>{
  const {clients:[a,b],tick,place}=arena(t,2);
  place(a,arc);place(b,{x:arc.x,y:arc.y+4});tick(40);
  const target=b.game.getPosition(),origin=a.game.getPosition();
  a.aim=()=>Math.atan2(target.y-origin.y,target.x-origin.x);
  const before=a.game.getWeaponAmmo('pistol');
  mouse(a,'pointerdown');mouse(a,'pointerup');
  const [packet]=a.events.filter(e=>e.type==='fire');
  assert.ok(packet);
  assert.equal(a.events.filter(e=>e.type==='fire').length,1);
  assert.equal(a.events.filter(e=>e.type==='hit'||e.type==='shot').length,0);
  assert.equal(a.game.getWeaponAmmo('pistol'),before-1);
  assert.match(packet.data.shotId,/^[a-f0-9-]{36}$/);
  assert.ok(Math.abs(packet.data.firedAt-packet.at)<=1);
  assert.equal(packet.data.firedAt-packet.data.viewAt,65);
  assert.deepEqual(packet.data.hits.map(h=>[h.target,h.damage]),[[b.id,17]]);
  assert.equal(a.effects.filter(([type])=>type==='shot').length,1,'the shooter sees the trace before an exchange');
  tick(3);
  assert.equal(b.hud.health,83);
  assert.equal(b.effects.filter(([type])=>type==='shot').length,1);
});

test('late gunfire uses its remaining tracer life, ignores duplicates and never replays an expired shot',t=>{
  const {clients:[a],tick,place}=arena(t);
  place(a,arc);tick(3);
  const stamp=a.scene.epoch;
  const shot=(firedAt,seq)=>({player:'witness',seq,at:stamp,type:'shot',
    data:{kind:'pistol',shotId:'trace-'+seq,firedAt,x:arc.x,y:arc.y,angle:.2,length:5}});
  a.receive(shot(stamp-240,1));a.receive(shot(stamp-100,2));a.receive(shot(stamp-100,2));
  tick();
  const traces=a.effects.filter(([type])=>type==='shot');
  assert.equal(traces.length,1,'distinct, old SMG-style burst pulses are not all replayed on receipt');
  assert.ok(traces[0][7]>.025&&traces[0][7]<.11,'renderer receives partial tracer age in seconds');
  a.receive(shot(stamp-100,2));a.receive(shot(stamp-900,3));tick(3);
  assert.equal(a.effects.filter(([type])=>type==='shot').length,1);
});
