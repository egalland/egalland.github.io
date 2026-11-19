import test from 'node:test';
import assert from 'node:assert/strict';
import { SPAWN, getTravelPoint, nearbyProps, blocked } from '../public/paris-world.js';
import { createGame } from '../public/game.js';
import { nearbyWeaponDrops } from '../public/weapon-drops.js';

test('Chase-camera controls, car possession, shared effects and travel share the real Paris world',()=>{
  const saved={};for(const k of ['document','window','requestAnimationFrame','cancelAnimationFrame'])saved[k]=globalThis[k];
  const surface=()=>Object.assign(new EventTarget(),{focus(){},setPointerCapture(){}});
  const canvas=surface();let frame,stamp=performance.now(),epoch=1782250000000;
  globalThis.document=Object.assign(surface(),{hidden:false});globalThis.window=surface();
  globalThis.requestAnimationFrame=callback=>{frame=callback;return 1;};globalThis.cancelAnimationFrame=()=>{};
  const shots=[],emitted=[],received=[],observed=[];let eventCallback,viewState;
  let pose, aim=SPAWN.angle;
  const testPeers=[];
  const net={id:'test',status:'online',peers:()=>testPeers,serverTime:()=>epoch,world:()=>({}),publish:v=>pose=v,
    onEvent:fn=>{eventCallback=fn;},emit:(a,b)=>emitted.push([a,b])};
  const view={available:true,mode:'webgl',aim:()=>aim,effect:(...v)=>shots.push(v),render:s=>viewState=s,dispose(){}};
  const step=(n=1)=>{for(let i=0;i<n;i++){stamp+=1000/60;epoch+=1000/60;frame(stamp);}};
  let game;
  try {
    game=createGame({canvas,net,loadout:['yarn'],onState:s=>observed.push(s),onNotice:s=>received.push(s),buildView:()=>view});
    step(4);
    assert.equal(observed.at(-1).district,'Charles-de-Gaulle – Étoile');
    assert.equal(observed.at(-1).nearVehicle,true);
    assert.equal(game.getPosition().x,SPAWN.x);
    assert(viewState.entities.some(v=>v.id==='car-etoile' && v.isCar));
    game.action('vehicle');step(10);
    assert(pose.vehicle);
    const start=game.getPosition();game.setMove(0,-1);step(70);game.setMove(0,0);step(8);
    assert(Math.hypot(game.getPosition().x-start.x,game.getPosition().y-start.y)>.6);
    assert(observed.some(s=>s.inVehicle&&s.speed>3));
    game.action('vehicle');step(15);assert.equal(pose.vehicle,null);
    game.emote('👋');assert(emitted.some(([k])=>k==='emote'));
    const key=game.destinations.find(d=>d.key!==SPAWN.key).key;
    assert(game.travel(key));step(4);assert(Math.hypot(game.getPosition().x-getTravelPoint(key).x,game.getPosition().y-getTravelPoint(key).y)<.1);
    const afterTravel=game.getPosition();game.setPaused(true);game.setMove(0,-1);step(30);
    assert(Math.hypot(game.getPosition().x-afterTravel.x,game.getPosition().y-afterTravel.y)<.05);
    game.setPaused(false);game.setMove(0,-1);step(45);game.setMove(0,0);
    assert(Math.hypot(game.getPosition().x-afterTravel.x,game.getPosition().y-afterTravel.y)>.3);
    game.selectWeapon('yarn');step(15);game.action('fire',true);game.action('fire',false);step(10);
    assert(shots.some(([kind])=>kind==='yarn'));assert(emitted.some(([kind,e])=>kind==='shot'&&e.kind==='yarn'));
    const prop=nearbyProps(pose.x,pose.y,45)[0];
    assert(prop);eventCallback({type:'destroy',data:{id:prop.id},player:'other'});step();
    assert(viewState.destroyed.has(prop.id));
    assert(game.travel(SPAWN.key));step(4);assert(viewState.destroyed.has(prop.id));assert.equal(pose.x,SPAWN.x);
    const target=nearbyProps(SPAWN.x,SPAWN.y,20).sort((a,b)=>Math.hypot(a.x-SPAWN.x,a.y-SPAWN.y)-Math.hypot(b.x-SPAWN.x,b.y-SPAWN.y))[0];
    assert(target);aim=Math.atan2(target.y-SPAWN.y,target.x-SPAWN.x);
    game.selectWeapon('pistol');step(16);
    canvas.dispatchEvent(Object.assign(new Event('pointerdown'),{button:0,pointerType:'mouse',clientX:300,clientY:200,pointerId:1}));
    canvas.dispatchEvent(Object.assign(new Event('pointerup'),{button:0,pointerType:'mouse',pointerId:1}));
    step(2);assert(!viewState.destroyed.has(target.id),'the parked car stops the first shot to this tree');
    const closer={...game.exportTravelState(),x:target.x+1.8,y:target.y+1.4};
    assert(game.restoreTravelState(closer));step(18);
    const pos=game.getPosition();aim=Math.atan2(target.y-pos.y,target.x-pos.x);
    canvas.dispatchEvent(Object.assign(new Event('pointerdown'),{button:0,pointerType:'mouse',clientX:300,clientY:200,pointerId:1}));
    canvas.dispatchEvent(Object.assign(new Event('pointerup'),{button:0,pointerType:'mouse',pointerId:1}));
    step(2);assert(emitted.some(([kind,data])=>kind==='destroy'&&data.id===target.id));
    assert(viewState.destroyed.has(target.id));
    const here=game.getPosition();
    const otherSpot=Array.from({length:12},(_,i)=>({x:here.x+3*Math.cos(i*Math.PI/6),y:here.y+3*Math.sin(i*Math.PI/6)}))
      .find(q=>!blocked(q.x,q.y,.45));
    assert(otherSpot);
    for(let i=0;i<32;i++)testPeers.push({id:'distant-'+i,x:here.x+4000+i,y:here.y});
    testPeers.push({...otherSpot,id:'nearby-fox',wanted:1});
    step(18);
    const visiblePeers=viewState.entities.filter(e=>e.peer);
    assert.deepEqual(visiblePeers.map(e=>e.id),['nearby-fox']);
    eventCallback({type:'npc',player:'nearby-fox',data:{id:'unit-police-nearby-fox',kind:'police',...here,started:epoch-13000,level:1}});
    step();
    const officer=viewState.entities.find(e=>e.id==='unit-police-nearby-fox-foot');
    assert(officer);assert.ok(Math.hypot(officer.x-otherSpot.x,officer.y-otherSpot.y)<.1);
    const health=viewState.p.health;
    eventCallback({type:'hit',player:'distant-0',data:{target:'test',damage:10}});
    assert.equal(viewState.p.health,health);
    eventCallback({type:'hit',player:'nearby-fox',data:{target:'test',damage:10}});
    assert.equal(viewState.p.health,health-10);
  } finally{
    game?.destroy();for(const [k,v] of Object.entries(saved)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}
  }
});

test('A sector crossing preserves equipment and reacquires the same car after the outgoing driver leaves',()=>{
  const saved=new Map(['window','document','requestAnimationFrame','cancelAnimationFrame'].map(k=>[k,globalThis[k]]));
  globalThis.document=new EventTarget();globalThis.window=new EventTarget();
  let queued,stamp=performance.now(),epoch=1782250000000,game,state,pose;
  globalThis.requestAnimationFrame=cb=>(queued=cb,1);globalThis.cancelAnimationFrame=()=>{};
  const step=n=>{for(let i=0;i<n;i++){stamp+=1000/60;epoch+=1000/60;queued(stamp);}};
  const shared={vehicles:{}},peers=[],claims=[];
  const net={id:'first',status:'online',world:()=>shared,peers:()=>peers,serverTime:()=>epoch,
    publish:s=>{pose=s;},emit:(k,d)=>{if(k==='vehicle')claims.push(d);return true;}};
  function start(loadout=[]){
    return createGame({canvas:new EventTarget(),net,loadout,onState:s=>{state=s;},buildView:()=>({
      available:true,mode:'canvas',aim:()=>0,effect(){},render(){},dispose(){}
    })});
  }
  try{
    game=start(['yarn']);step(10);
    game.action('vehicle');step(25);game.selectWeapon('yarn');step(15);
    game.action('fire',true);game.action('fire',false);game.setMove(0,-1);step(20);
    const snapshot=JSON.parse(JSON.stringify(game.exportTravelState()));game.destroy();
    assert(snapshot.vehicle?.id);assert(snapshot.vehicle.speed>0);assert.equal(snapshot.ammo.yarn,5);
    assert.equal(snapshot.pursuit.points,state.wantedPoints);assert.deepEqual(snapshot.ownedWeapons,['fist','pistol','yarn']);assert.equal(snapshot.vehicle.owner,'first');
    const originalCarId=snapshot.vehicle.id;
    shared.vehicles[originalCarId]={...snapshot.vehicle,owner:'first',occupied:true,x:snapshot.x,y:snapshot.y};
    peers.push({id:'first',x:snapshot.x,y:snapshot.y,vehicle:{id:originalCarId}});
    net.id='next';net.status='connecting';claims.length=0;
    game=start();
    assert(game.restoreTravelState(snapshot));assert.equal(state.inVehicle,true);
    assert.equal(state.ammo,5);assert.equal(state.wanted,snapshot.wanted);assert.equal(state.health,Math.ceil(snapshot.health));
    assert.equal(pose.vehicle,null);assert.equal(game.exportTravelState().vehicle.color,snapshot.vehicle.color);
    net.status='online';step(22);assert.equal(claims.length,0);
    peers.length=0;step(22);
    assert.equal(claims.length,1);assert.equal(claims[0].id,originalCarId);
    shared.vehicles[originalCarId]={...claims[0],owner:'next'};step(24);
    assert.equal(pose.vehicle.id,originalCarId);
    assert.equal(game.exportTravelState().vehicle.owner,'next');
    assert.equal(game.restoreTravelState({...snapshot,x:NaN}),false);
    const blockedItem=nearbyProps(snapshot.x,snapshot.y,50)[0];
    assert(blockedItem);
    const foot={...snapshot,x:blockedItem.x,y:blockedItem.y,vehicle:null,health:72};
    assert(game.restoreTravelState(foot));assert.equal(state.inVehicle,false);assert.equal(state.health,72);
    assert(Math.hypot(game.getPosition().x-blockedItem.x,game.getPosition().y-blockedItem.y)>.3);
  }finally{
    game?.destroy();for(const [k,v] of saved)if(v===undefined)delete globalThis[k];else globalThis[k]=v;
  }
});

function startGame(t,options={}){
  const globals=['window','document','requestAnimationFrame','cancelAnimationFrame'];
  const saved=new Map(globals.map(k=>[k,globalThis[k]]));
  const hooks={notices:[],actions:[],loadouts:[],players:[],world:{pickups:{}}};
  const canvas=Object.assign(new EventTarget(),{focus(){},setPointerCapture(){}});
  const net={id:'self-id',status:'online',world:()=>hooks.world,peers:()=>hooks.players,
    publish:pose=>{hooks.published=pose;},emit:(name,data)=>{hooks.actions.push({name,data});return true;},
    serverTime:()=>hooks.epoch};
  let frame,stamp=performance.now();
  hooks.epoch=1782250000000;
  globalThis.window=new EventTarget();globalThis.document=new EventTarget();
  globalThis.requestAnimationFrame=cb=>(frame=cb,1);globalThis.cancelAnimationFrame=()=>{};
  hooks.step=(n=1)=>{for(let i=0;i<n;i++){stamp+=1000/60;hooks.epoch+=1000/60;frame(stamp);}};
  hooks.fireAt=point=>{
    hooks.aim=Math.atan2(point.y-hooks.published.y,point.x-hooks.published.x);
    canvas.dispatchEvent(Object.assign(new Event('pointerdown'),{button:0,pointerType:'mouse',pointerId:1}));
    canvas.dispatchEvent(Object.assign(new Event('pointerup'),{button:0,pointerType:'mouse',pointerId:1}));
  };
  hooks.game=createGame({canvas,net,onState:s=>{hooks.state=s;},onNotice:s=>hooks.notices.push(s),onLoadoutChange:l=>hooks.loadouts.push(l),
    buildView:()=>({available:true,mode:'canvas',aim:()=>hooks.aim??SPAWN.angle,projectTarget:options.projectTarget,effect(){},render:s=>{hooks.scene=s;},dispose(){}}),...options});
  hooks.net=net;hooks.canvas=canvas;
  t.after(()=>{
    hooks.game.destroy();
    for(const [k,v] of saved){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}
  });
  return hooks;
}

test('Walking onto a pickup waits for the global claim, recovers on reconnect and only refills a useful duplicate',async t=>{
  const h=startGame(t),{game,net}=h;
  const drops=nearbyWeaponDrops(SPAWN.x,SPAWN.y,21);
  const first=drops.find(d=>d.weapon==='yarn');
  assert(first);assert(h.scene.pickups.some(d=>d.id===first.id));
  assert.equal(h.state.weapon,'pistol');assert.equal(h.state.ammo,12);
  assert.deepEqual(h.state.ownedWeapons,['fist','pistol']);
  for(const key of ['yarn','smg','shotgun','__proto__'])assert.equal(game.selectWeapon(key),false);
  assert.equal(h.state.weapon,'pistol');
  let reply,requests=[];
  net.claimPickup=(id,weapon)=>new Promise(resolve=>{requests.push({id,weapon,...h.published});reply=resolve;});
  net.status='offline';
  const bearing=Math.atan2(first.y-SPAWN.y,first.x-SPAWN.x)-SPAWN.angle;
  game.setMove(Math.sin(bearing),-Math.cos(bearing));
  for(let i=0;i<450&&Math.hypot(game.getPosition().x-first.x,game.getPosition().y-first.y)>1.45;i++)h.step();
  game.setMove(0,0);h.step(100);
  assert.equal(h.state.nearPickup?.id,first.id);
  assert.equal(h.state.nearPickup.online,false);
  assert.equal(h.notices.filter(s=>s.includes('reconnexion')).length,1);
  assert.equal(requests.length,0);assert.equal(game.selectWeapon('yarn'),false);
  net.status='online';h.step(25);
  assert.equal(requests.length,1);assert.equal(requests[0].id,first.id);
  assert.equal(requests[0].vehicle,null);assert(Math.hypot(requests[0].x-first.x,requests[0].y-first.y)<=1.9);
  assert.equal(game.selectWeapon('yarn'),false);
  // A contending player wins. The same visible pickup returns only after the server's expiry.
  reply({ok:false,availableAt:h.epoch+1200});await Promise.resolve();
  h.step(30);assert(!h.scene.pickups.some(d=>d.id===first.id));assert.equal(requests.length,1);
  h.step(80);assert.equal(requests.length,2);assert.equal(h.state.weapon,'pistol');
  reply({ok:true,availableAt:h.epoch+600});await Promise.resolve();
  assert.equal(h.state.weapon,'yarn');assert.equal(h.state.ammo,6);assert.equal(h.state.nearPickup,null);
  assert.deepEqual(h.loadouts,[['fist','pistol','yarn']]);
  h.step(80);assert.equal(requests.length,2);assert(h.scene.pickups.some(d=>d.id===first.id));
  game.action('fire');game.action('fire',false);game.selectWeapon('pistol');h.step(10);
  assert.equal(requests.length,3);
  reply({ok:true,availableAt:h.epoch+600});await Promise.resolve();h.step(12);
  assert.equal(h.state.weapon,'pistol');assert.equal(game.selectWeapon('yarn'),true);assert.equal(h.state.ammo,6);
  assert.equal(h.loadouts.length,1);
});

test('A sector validates claimed equipment, hides consumed drops, and leaves legacy unearned weapons locked',t=>{
  const h=startGame(t,{loadout:['smg','smg','toString',false]}),{game}=h;
  const drop=nearbyWeaponDrops(SPAWN.x,SPAWN.y,21)[0];
  let claims=0;
  h.net.claimPickup=()=>{claims++;return new Promise(()=>{});};
  assert.deepEqual(h.state.ownedWeapons,['fist','pistol','smg']);
  const s=game.exportTravelState();
  assert(game.restoreTravelState({...s,version:1,x:drop.x,y:drop.y,weapon:'yarn',ammo:{yarn:5,pistol:7,smg:6,shotgun:4},
    ownedWeapons:['fist','pistol','smg','yarn','shotgun'],heat:2.3,wanted:3}));
  assert.equal(h.state.weapon,'pistol');assert.equal(h.state.ammo,7);assert.equal(h.state.wanted,3);
  assert.deepEqual(h.state.ownedWeapons,['fist','pistol','smg']);
  h.world.pickups[drop.id]=h.epoch+800;h.step(16);
  assert(!h.scene.pickups.some(d=>d.id===drop.id));assert.equal(claims,0);
  game.setPaused(true);h.step(75);assert(h.scene.pickups.some(d=>d.id===drop.id));assert.equal(claims,0);
  const vehicle={id:'car-test',type:'car',speed:0};
  assert(game.restoreTravelState({...s,x:drop.x,y:drop.y,vehicle,ownedWeapons:['smg','shotgun','constructor']}));
  game.setPaused(false);h.step(50);assert.equal(claims,0);assert.equal(h.state.nearPickup,null);
  assert.deepEqual(h.state.ownedWeapons,['fist','pistol','smg','shotgun']);
  assert.deepEqual(h.loadouts,[['fist','pistol','smg','shotgun']]);
});

test('One action gives exactly one wanted event, preserves the action weight on crossing and dispatches police and SWAT by level',t=>{
  const h=startGame(t),{game}=h;
  const prop=nearbyProps(SPAWN.x,SPAWN.y,23).sort((a,b)=>Math.hypot(a.x-SPAWN.x,a.y-SPAWN.y)-Math.hypot(b.x-SPAWN.x,b.y-SPAWN.y))[0];
  h.fireAt(prop);h.step(12);
  assert(h.scene.destroyed.has(prop.id));assert.equal(h.state.wantedPoints,10);
  assert.deepEqual(h.state.wantedEvent,{id:1,action:'destroy',points:10});assert.equal(h.state.wanted,0);
  assert(h.actions.some(e=>e.name==='npc'&&e.data.kind==='firefighter'));
  assert(!h.actions.some(e=>e.name==='npc'&&e.data.kind==='police'));
  const player={id:'test-player',x:SPAWN.x+(prop.x-SPAWN.x)*.55,y:SPAWN.y+(prop.y-SPAWN.y)*.55};
  h.players.push(player);h.step(25);
  h.fireAt(player);h.step(12);
  assert.equal(h.state.wantedPoints,38);assert.equal(h.state.wanted,1);
  assert.deepEqual(h.state.wantedEvent,{id:2,action:'hitPlayer',points:28});
  assert.equal(h.state.wantedProgress,(38-18)/(55-18));assert(h.actions.some(e=>e.name==='npc'&&e.data.kind==='police'));
  h.step(8);h.fireAt(player);h.step(12);
  assert.equal(h.state.wanted,2);assert.equal(h.state.wantedEvent.points,33.6);
  const saved=game.exportTravelState();assert.deepEqual(saved.pursuit,game.getPursuitSnapshot());
  assert(game.restoreTravelState(saved));assert.equal(h.state.wantedPoints,71.6);
  assert(game.restoreTravelState({...saved,pursuit:{points:290,sinceCrime:0}}));h.step(26);
  assert.equal(h.state.wanted,5);assert.equal(h.state.wantedProgress,1);
  assert(h.actions.some(e=>e.name==='npc'&&e.data.kind==='swat'&&e.data.level===5));
});

test('Only the touch fire button uses assistance. Mouse, space, a dragged thumb, fists and a disabled setting remain manual',t=>{
  const locks=[],prop=nearbyProps(SPAWN.x,SPAWN.y,23).sort((a,b)=>Math.hypot(a.x-SPAWN.x,a.y-SPAWN.y)-Math.hypot(b.x-SPAWN.x,b.y-SPAWN.y))[0];
  const peer={id:'tactile-target',x:SPAWN.x+(prop.x-SPAWN.x)*.65,y:SPAWN.y+(prop.y-SPAWN.y)*.65};
  const point={x:.58,y:.48},projectTarget=(x,y)=>Math.hypot(x-peer.x,y-peer.y)<.01?point:null;
  const h=startGame(t,{onAimLock:mark=>locks.push(mark),projectTarget}),{game}=h;
  const location=game.getPosition(),bearing=Math.atan2(peer.y-location.y,peer.x-location.x),manual=bearing-.16;
  h.players.push(peer);
  assert(game.restoreTravelState({...game.exportTravelState(),yaw:manual}));
  h.step(30);
  const totalHits=()=>h.actions.filter(e=>e.name==='hit'&&e.data.target===peer.id).length;
  const mousePoint={x:location.x+Math.cos(manual)*22,y:location.y+Math.sin(manual)*22};
  h.fireAt(mousePoint);h.step(20);assert.equal(totalHits(),0);
  globalThis.window.dispatchEvent(Object.assign(new Event('keydown',{cancelable:true}),{key:' '}));h.step(2);
  globalThis.window.dispatchEvent(Object.assign(new Event('keyup'),{key:' '}));h.step(20);
  assert.equal(totalHits(),0);assert.deepEqual(locks,[]);
  game.action('touchFire');assert.equal(totalHits(),1);assert.deepEqual(locks.at(-1),point);
  // Keep the fire button held while a second finger finishes orbiting the camera.
  h.canvas.dispatchEvent(Object.assign(new Event('pointerup'),{pointerType:'touch',pointerId:20}));
  h.step(20);assert.equal(totalHits(),2);assert.equal(locks.length,1);
  game.setAim(-1,0);assert.equal(locks.at(-1),null);h.step(20);assert.equal(totalHits(),2);
  game.action('touchFire',false);h.step(20);
  game.setAimAssist(false);game.action('touchFire');game.action('touchFire',false);h.step(20);
  assert.equal(totalHits(),2);
  game.setAimAssist(true);assert(game.selectWeapon('fist'));h.step(20);
  const count=locks.length;game.action('touchFire');h.step(8);game.action('touchFire',false);
  assert.equal(locks.length,count);assert.equal(totalHits(),2);
});

test('An assisted impact on scenery stays visible briefly and disappears when touch is released',t=>{
  const prop=nearbyProps(SPAWN.x,SPAWN.y,23).sort((a,b)=>Math.hypot(a.x-SPAWN.x,a.y-SPAWN.y)-Math.hypot(b.x-SPAWN.x,b.y-SPAWN.y))[0];
  const marks=[];
  const h=startGame(t,{onAimLock:point=>marks.push(point),projectTarget:(x,y)=>x===prop.x&&y===prop.y?{x:.55,y:.43}:null});
  const yaw=Math.atan2(prop.y-SPAWN.y,prop.x-SPAWN.x)-.1;
  assert(h.game.restoreTravelState({...h.game.exportTravelState(),yaw}));h.step(20);
  h.game.action('touchFire');h.step(6);assert(h.scene.destroyed.has(prop.id));
  assert.deepEqual(marks,[{x:.55,y:.43}]);
  h.step(7);assert.equal(marks.at(-1),null);assert.equal(marks.length,2);
  h.game.action('touchFire',false);assert.equal(marks.length,2);
});
