import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../public/game.js';
import {sampleLocomotion} from '../public/locomotion-pose.js';
import {SPAWN,nearbyProps,parkedCars,blocked} from '../public/paris-world.js';
import {vehicleSpec,vehicleDoorways} from '../public/vehicle-types.js';

// Capture the same scene object that both renderers consume. Independent game instances
// receive the latest published peer snapshot every 300 ms, as in a populated world.
function openCity(t,players=1){
  const saved=new Map(['window','document','requestAnimationFrame','cancelAnimationFrame'].map(k=>[k,globalThis[k]]));
  const clients=[],frames=new Map(),visible=new Map();
  let serial=0,clock=1782250000000,stamp=performance.now(),nextPacket=clock;
  globalThis.window=new EventTarget();
  globalThis.document=Object.assign(new EventTarget(),{hidden:false});
  globalThis.requestAnimationFrame=callback=>{frames.set(++serial,callback);return serial;};
  globalThis.cancelAnimationFrame=id=>frames.delete(id);
  for(let n=0;n<players;n++){
    const client={id:'city-mover-'+n,events:[]};
    clients.push(client);
    const net={id:client.id,status:'online',serverTime:()=>clock,world:()=>({}),peers:()=>[...visible.values()].filter(p=>p.id!==client.id),
      publish:data=>{client.published=data;},emit:(type,data)=>{client.events.push({type,data});},onEvent:()=>()=>{}};
    const canvas=Object.assign(new EventTarget(),{focus(){},setPointerCapture(){}});
    client.game=createGame({canvas,net,onState:state=>{client.hud=state;},buildView:()=>({
      available:true,mode:'webgl',render:scene=>{client.scene=scene;},aim:()=>0,effect(){},dispose(){}
    })});
  }
  t.after(()=>{
    for(const c of clients)c.game.destroy();
    for(const [key,value] of saved)if(value===undefined)delete globalThis[key];else globalThis[key]=value;
  });
  function advance(fps,seconds,each=()=>{}){
    for(let i=0;i<Math.round(fps*seconds);i++){
      stamp+=1000/fps;clock+=1000/fps;
      if(clock>=nextPacket){
        for(const c of clients)if(c.published)visible.set(c.id,{...c.published,id:c.id,name:c.id,joinedAt:1,updatedAt:clock});
        nextPacket=clock+300;
      }
      const callbacks=[...frames.values()];frames.clear();
      for(const callback of callbacks)callback(stamp);
      each();
    }
  }
  return {clients,advance};
}
const avatar=client=>client.scene.entities.find(e=>e.self);
function place(client,x,y,angle){
  const before=client.game.exportTravelState();
  assert.ok(client.game.restoreTravelState({...before,x,y,angle,yaw:angle,vehicle:null,vx:0,vy:0}));
}
function walkTo(client,advance,target,seconds=4){
  for(let frame=0;frame<30*seconds;frame++){
    const current=avatar(client),range=dist(target,current);
    if(range<.17)break;
    const dx=(target.x-current.x)/range,dy=(target.y-current.y)/range;
    const yaw=client.scene.yaw,c=Math.cos(yaw),s=Math.sin(yaw),speed=Math.min(1,range);
    client.game.setMove((-s*dx+c*dy)*speed,-(c*dx+s*dy)*speed);
    advance(30,1/30);
  }
  client.game.setMove(0,0);advance(30,.35);
}
function pressSpace(keydown){
  const key=Object.assign(new Event(keydown?'keydown':'keyup',{cancelable:true}),{key:' ',code:'Space',repeat:false});
  window.dispatchEvent(key);
}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

for(const [fps,input] of [[60,'keyboard'],[15,'touch']]){
  test(`An Étoile jump reaches its apex and lands cleanly at ${fps} FPS using ${input} controls`,t=>{
    const {clients:[player],advance}=openCity(t);
    advance(fps,.5);
    const start=avatar(player),states=new Set();
    if(input==='keyboard')pressSpace(true);else player.game.action('jump',true);
    let peak=0,biggest=0,previous=0;
    const sample=()=>{
      const e=avatar(player);
      assert.ok(Number.isFinite(e.lift)&&Number.isFinite(e.motionPhase));
      assert.ok(e.lift>=-.01);
      states.add(e.motion);
      peak=Math.max(peak,e.lift);biggest=Math.max(biggest,Math.abs(e.lift-previous));previous=e.lift;
    };
    advance(fps,.25,sample);
    if(input==='keyboard')pressSpace(false);else player.game.action('jump',false);
    advance(fps,1.5,sample);
    assert.ok(peak>.6&&peak<2.4,`peak ${peak}`);
    assert.ok(states.has('jump')&&states.has('fall'));
    assert.ok(biggest<9/fps,`maximum step ${biggest}m at ${fps} FPS`);
    assert.ok(avatar(player).lift<.03);assert.ok(dist(avatar(player),start)<.13);
    assert.equal(player.events.some(e=>e.type==='fire'),false);
    t.diagnostic(`Peak ${peak.toFixed(2)} m, maximum change ${biggest.toFixed(3)} m per frame`);
  });
}

test('a second client observes an actual jump and return to ground through world snapshots',t=>{
  const {clients:[jumper,witness],advance}=openCity(t,2);
  place(witness,SPAWN.x+6,SPAWN.y+5,SPAWN.angle);
  advance(60,.75);
  jumper.game.action('jump',true);
  let localPeak=0,remotePeak=0,peer;
  advance(60,2.5,()=>{
    peer=witness.scene.entities.find(e=>e.peer&&e.id===jumper.id);
    assert.ok(peer);
    localPeak=Math.max(localPeak,avatar(jumper).lift);
    remotePeak=Math.max(remotePeak,peer.lift||0);
  });
  jumper.game.action('jump',false);
  assert.ok(localPeak>.6&&remotePeak>localPeak*.45,`jump peaks local ${localPeak}, observer ${remotePeak}`);
  assert.ok(peer.lift<.04);
  assert.ok(Math.abs(peer.x-avatar(jumper).x)<.15&&Math.abs(peer.y-avatar(jumper).y)<.15);
  t.diagnostic(`Observer saw ${remotePeak.toFixed(2)} m at a 300 ms network cadence`);
});

test('the contextual action vaults the first bench by the Étoile and finishes on its far side',t=>{
  const {clients:[player],advance}=openCity(t);
  const bench=nearbyProps(SPAWN.x,SPAWN.y,30).filter(o=>o.type==='bench')
    .sort((a,b)=>dist(a,SPAWN)-dist(b,SPAWN))[0];
  assert.ok(bench&&dist(bench,SPAWN)<20);
  const angle=bench.angle+Math.PI/2,dx=Math.cos(angle),dy=Math.sin(angle);
  const start={x:bench.x-dx*1.9,y:bench.y-dy*1.9};
  place(player,start.x,start.y,angle);
  advance(30,.25);
  assert.ok(dist(start,avatar(player))<.4,'approach remains on the near side of the bench');
  const poses=new Set();let peak=0;
  player.game.action('jump',true);
  const sample=()=>{const a=avatar(player);poses.add(a.motion);peak=Math.max(peak,a.lift);};
  advance(30,.17,sample);player.game.action('jump',false);advance(30,1.6,sample);
  const land=avatar(player),exit=(land.x-bench.x)*dx+(land.y-bench.y)*dy;
  assert.ok(poses.has('vault'),JSON.stringify([...poses]));
  assert.ok(exit>bench.r+.3,`finishes beyond the bench: ${exit}m`);
  assert.ok(peak>=.7&&land.lift<.03);
  assert.equal(blocked(land.x,land.y,.59),false);
  t.diagnostic(`Bench ${dist(bench,SPAWN).toFixed(1)} m from spawn, peak ${peak.toFixed(2)} m, exit ${exit.toFixed(2)} m past centre`);
});

test('a player can mantle the parked car, stand on its roof, and walk off to the pavement',t=>{
  const {clients:[player],advance}=openCity(t);
  const car=parkedCars.find(c=>c.id==='car-'+SPAWN.key),spec=vehicleSpec(car.type),angle=car.angle+Math.PI/2;
  const dx=Math.cos(angle),dy=Math.sin(angle),reach=spec.halfWidth+.99;
  place(player,car.x-dx*reach,car.y-dy*reach,angle);
  advance(30,.25);player.game.action('jump',true);
  const poses=new Set();
  const sample=()=>{poses.add(avatar(player).motion);};
  advance(30,.17,sample);player.game.action('jump',false);advance(30,1.8,sample);
  let onTop=avatar(player);
  assert.ok(poses.has('climb'),`climb state, got ${[...poses]}`);
  assert.ok(onTop.lift>1&&onTop.lift<spec.height+.2,`stable roof at ${onTop.lift}`);
  const height=onTop.lift,support={x:onTop.x,y:onTop.y};
  advance(30,.7);
  assert.ok(Math.abs(avatar(player).lift-height)<.03&&dist(avatar(player),support)<.08);
  player.game.setMove(0,-1);advance(30,1.7,sample);
  player.game.setMove(0,0);advance(30,.65,sample);
  const land=avatar(player);
  assert.ok(poses.has('fall')&&land.lift<.03,`walks off the roof: ${[...poses]}, z=${land.lift}`);
  assert.equal(player.hud.inVehicle,false);
  assert.ok((land.x-car.x)*dx+(land.y-car.y)*dy>spec.halfWidth+.35);
  t.diagnostic(`Player supported at ${height.toFixed(2)} m on ${car.type}, returns to the pavement`);
});

test('input blends from walking to running and brakes smoothly on the sloping Étoile pavement',t=>{
  const {clients:[player],advance}=openCity(t);
  advance(60,.4);player.game.setMove(0,-1);
  const start=avatar(player),samples=[];
  advance(60,.5,()=>samples.push(avatar(player)));
  const walk=samples.at(-1);
  assert.ok(samples[0].speed>0&&samples[0].speed<walk.speed*.45);
  assert.ok(walk.speed>2.4&&walk.speed<3.9&&walk.motion==='walk');
  assert.ok(Math.abs(walk.slope)>.004&&walk.stride>0&&walk.walk>start.walk);
  player.game.action('sprint',true);advance(60,.6);
  const run=avatar(player);
  assert.ok(run.speed>walk.speed*1.4&&run.motion==='run'&&run.stride>walk.stride);
  player.game.setMove(0,0);player.game.action('sprint',false);advance(60,1/60);
  assert.ok(avatar(player).speed<run.speed&&avatar(player).speed>run.speed*.55);
  advance(60,.7);
  assert.ok(avatar(player).speed<.08&&avatar(player).motion==='idle');
  t.diagnostic(`Walk ${walk.speed.toFixed(2)} m/s, run ${run.speed.toFixed(2)} m/s, local grade ${(walk.slope*100).toFixed(1)}%`);
});

for(const [key,type] of [['maillot','scooter'],['sablons','cargo'],['neuilly','pickup']]){
  test(`the ${type} at ${key} can be boarded, driven and left through normal controls`,t=>{
    const {clients:[player],advance}=openCity(t);
    assert.ok(player.game.travel(key));advance(30,.4);
    const car=player.scene.entities.find(e=>e.id==='car-'+key);
    assert.equal(car?.type,type);assert.ok(player.hud.nearVehicle);
    const doors=vehicleDoorways(car,.85).filter(d=>!blocked(d.x,d.y,.6));
    doors.sort((a,b)=>dist(a,avatar(player))-dist(b,avatar(player)));
    assert.ok(doors.length);walkTo(player,advance,doors[0]);
    assert.ok(dist(doors[0],avatar(player))<1.1);
    player.game.action('vehicle');advance(30,.35);
    assert.equal(player.hud.vehicleName,vehicleSpec(type).label);assert.equal(avatar(player).type,type);
    const start=avatar(player);
    player.game.setDrive(0,1);advance(30,.8);
    player.game.setDrive(0,0);advance(30,.16);
    const driven=avatar(player);
    assert.ok(driven.speed>0&&dist(start,driven)>.3,`${type} moved ${dist(start,driven)} m`);
    assert.equal(player.published.vehicle.type,type);
    player.game.action('vehicle');advance(30,.36);
    assert.equal(player.hud.inVehicle,false);assert.equal(player.published.vehicle,null);
    assert.equal(blocked(avatar(player).x,avatar(player).y,.5),false);
    t.diagnostic(`${type} moved ${dist(start,driven).toFixed(2)} m under throttle`);
  });
}

test('the Porte Maillot terrace supports a two-stage climb and a controlled drop onto the pavement',t=>{
  const {clients:[player],advance}=openCity(t);
  assert.ok(player.game.travel('maillot'));advance(30,.35);
  const local=nearbyProps(avatar(player).x,avatar(player).y,18);
  const low=local.find(o=>o.type==='terraceStep'),high=local.find(o=>o.type==='terraceTop');
  assert.ok(low&&high);
  const norm=dist(low,high),dx=(high.x-low.x)/norm,dy=(high.y-low.y)/norm;
  const angle=Math.atan2(dy,dx);
  // Face the outside edge from clear pavement, then use the same action twice.
  place(player,low.x-dx*(low.halfWidth+1.18),low.y-dy*(low.halfWidth+1.18),angle);
  advance(30,.3);
  function climb(){
    const motions=new Set();
    player.game.action('jump',true);advance(30,.1,()=>motions.add(avatar(player).motion));
    player.game.action('jump',false);advance(30,1.4,()=>motions.add(avatar(player).motion));
    assert.ok(motions.has('climb'),`expected climb at ${avatar(player).lift}, observed ${[...motions]}`);
  }
  climb();
  assert.ok(Math.abs(avatar(player).lift-low.h)<.08,`low footing ${avatar(player).lift}`);
  player.game.setMove(0,-1);advance(30,.35);player.game.setMove(0,0);advance(30,.2);
  climb();
  assert.ok(Math.abs(avatar(player).lift-high.h)<.08,`high footing ${avatar(player).lift}`);
  const path=[];player.game.setMove(0,-1);
  advance(30,1.8,()=>path.push(avatar(player)));player.game.setMove(0,0);advance(30,.4);
  assert.ok(path.some(e=>e.motion==='fall')&&path.some(e=>e.motion==='land'));
  assert.ok(avatar(player).lift<.03);
  assert.equal(blocked(avatar(player).x,avatar(player).y,.59),false);
  t.diagnostic(`Two stable levels ${low.h.toFixed(2)} / ${high.h.toFixed(2)} m above the path`);
});


test('a remote player’s animated stride grows and decays between the 300 ms world snapshots',t=>{
  const {clients:[walker,witness],advance}=openCity(t,2);
  place(witness,SPAWN.x+6,SPAWN.y+5,SPAWN.angle);advance(60,.8);
  const phases=new Set();let peak=0,previous=0,worst=0,frame=0;
  const sample=()=>{
    const peer=witness.scene.entities.find(e=>e.peer&&e.id===walker.id);
    const pose=sampleLocomotion(peer,frame++/60,1);
    phases.add(peer.motion);
    peak=Math.max(peak,pose.pace);worst=Math.max(worst,Math.abs(previous-pose.pace));previous=pose.pace;
  };
  walker.game.setMove(0,-1);advance(60,1.5,sample);
  walker.game.action('sprint',true);advance(60,.7,sample);
  walker.game.setMove(0,0);walker.game.action('sprint',false);advance(60,1.6,sample);
  assert.ok(phases.has('walk')&&phases.has('run')&&phases.has('idle'));
  assert.ok(peak>.9&&previous<.02);
  assert.ok(worst<.22,`biggest stride change in a single animation frame: ${worst}`);
  t.diagnostic(`Largest frame-to-frame change in rendered pace ${worst.toFixed(3)}`);
});
