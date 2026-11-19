import test from 'node:test';
import assert from 'node:assert/strict';
import { SPAWN, getTravelPoint, nearbyProps, blocked } from '../public/paris-world.js';
import { createGame } from '../public/game.js';

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
    game=createGame({canvas,net,onState:s=>observed.push(s),onNotice:s=>received.push(s),buildView:()=>view});
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
  function start(){
    return createGame({canvas:new EventTarget(),net,onState:s=>{state=s;},buildView:()=>({
      available:true,mode:'canvas',aim:()=>0,effect(){},render(){},dispose(){}
    })});
  }
  try{
    game=start();step(10);
    game.action('vehicle');step(25);game.selectWeapon('yarn');step(15);
    game.action('fire',true);game.action('fire',false);game.setMove(0,-1);step(20);
    const snapshot=JSON.parse(JSON.stringify(game.exportTravelState()));game.destroy();
    assert(snapshot.vehicle?.id);assert(snapshot.vehicle.speed>0);assert.equal(snapshot.ammo.yarn,5);
    assert(snapshot.wanted>0);assert.equal(snapshot.vehicle.owner,'first');
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
