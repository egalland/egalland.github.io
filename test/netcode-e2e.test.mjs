import test from 'node:test';
import assert from 'node:assert/strict';
import {setImmediate as settle} from 'node:timers/promises';
import {createNet} from '../public/net.js';
import {handleApi} from '../worker/game-api.js';
import {localDatabase} from '../scripts/local-db.mjs';

// Virtual time drives both browsers, the HTTP legs and SQLite's server timestamps.
function simulatedWorld(t) {
  const start=1775000000000, DB=localDatabase(),clients=[], requests=new Set();
  t.mock.timers.enable({apis:['Date','setTimeout'],now:start});
  t.mock.method(performance,'now',()=>Date.now()-start);
  const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function step(ms=5){
    t.mock.timers.tick(ms);
    await settle();
  }
  async function until(condition,label,timeout=6500){
    const deadline=Date.now()+timeout;
    while(!condition()&&Date.now()<deadline)await step();
    assert.ok(condition(),label);
  }
  function connect(name,state,options={}){
    const events=[],attempts=[];
    const fetcher=(url,init)=>{
      const request=(async()=>{
        const packet=JSON.parse(init.body), actions=packet.events||[];
        for(const e of actions)if(e.type==='fire')attempts.push({op:e.op,id:e.data.shotId});
        if(!url.endsWith('/leave'))await delay(options.sendDelay?.(actions)??35);
        if(options.beforeCommit)await options.beforeCommit(actions,DB);
        const response=await handleApi(new Request('https://world.test'+url,init),{DB});
        if(!url.endsWith('/leave'))await delay(35);
        if(options.dropReply?.(actions))throw new Error('Simulated lost response after commit');
        return response;
      })();
      requests.add(request);request.then(()=>requests.delete(request),()=>requests.delete(request));
      return request;
    };
    const net=createNet({name,fetcher,pollMs:35});
    net.onEvent(e=>events.push(e));
    net.publish(state);clients.push(net);
    return {net,events,attempts};
  }
  t.after(async()=>{
    for(const net of clients)net.stop();
    await until(()=>requests.size===0,'The simulated network drains after the browsers leave');
    DB.close();
  });
  return {connect,step,until,DB};
}
const actor=(x,y,extra={})=>({x,y,angle:0,health:100,weapon:'smg',lift:0,...extra});
function aimedBurst(shooter,target,id,seenAt,position){
  const origin={x:10.35,y:10}, dx=position.x-origin.x,dy=position.y-origin.y;
  const angle=Math.atan2(dy,dx),firedAt=Math.round(shooter.net.serverTime());
  return shooter.net.emit('fire',{shotId:id,firedAt,kind:'smg',...origin,
    angle,length:Math.hypot(dx,dy)-.67,lift:0,
    hits:[{target:target.net.id,damage:10,angle,force:10/45,viewedAt:seenAt}]});
}

test('Two independent browsers resolve a burst once when its acknowledgment is lost after commit',async t=>{
  const {connect,until,DB}=simulatedWorld(t);
  const attemptsBeforeLoss=new Set();
  let replyDropped=false;
  const source=connect('Source',actor(10,10),{dropReply:actions=>{
    if(replyDropped||!actions.some(e=>e.type==='fire'&&e.data.shotId==='burst-2'))return false;
    for(const e of actions)attemptsBeforeLoss.add(e.op);
    replyDropped=true;return true;
  }});
  const target=connect('Cible',actor(18,10));
  void source.net.start();void target.net.start();
  await until(()=>[source,target].every(c=>c.net.status==='online'&&c.net.peers().length===1),'Both nearby browsers joined');
  const peer=()=>source.net.peers().find(p=>p.id===target.net.id);
  const firedAt=source.net.serverTime();
  assert.ok(aimedBurst(source,target,'burst-1',peer().updatedAt,peer()));
  target.net.publish(actor(18.4,10.35,{moving:true,vx:1,vy:.7}));
  await until(()=>peer().x===18.4 && source.net.serverTime()>=firedAt+155,'The second trigger uses the moving target seen by the shooter');
  assert.ok(aimedBurst(source,target,'burst-2',peer().updatedAt,peer()));
  const hits=()=>target.events.filter(e=>e.type==='hit'&&e.data.target===target.net.id);
  await until(()=>replyDropped && source.attempts.filter(e=>e.id==='burst-2').length>=2 &&
    source.net.status==='online' && hits().length===2,'A lost acknowledgment retries the fire packet and both real hits reach the victim');
  const shots=target.events.filter(e=>e.type==='shot');
  assert.deepEqual(shots.map(e=>e.data.shotId),['burst-1','burst-2']);
  assert.deepEqual(hits().map(e=>e.data.shotId),['burst-1','burst-2']);
  assert.equal(hits().reduce((total,e)=>total+e.data.damage,0),20);
  assert.equal(new Set(hits().map(e=>e.seq)).size,2);
  assert.ok(source.attempts.filter(e=>e.id==='burst-2').every(e=>attemptsBeforeLoss.has(e.op)));
  assert.equal((await DB.prepare("SELECT count(*) n FROM mc_events WHERE type IN ('shot','hit')").first()).n,4);
  target.net.stop();
  await until(()=>source.net.peers().length===0,'The disconnected browser leaves global presence');
  const restored=connect('Cible reconnectée',actor(18.4,10.35));
  void restored.net.start();
  await until(()=>restored.net.status==='online'&&source.net.peers().some(p=>p.id===restored.net.id),'A fresh browser receives the current baseline');
  assert.deepEqual(restored.events.filter(e=>e.type==='hit'||e.type==='shot'),[],'Old rounds do not replay when joining again');
});

test('A delayed round still resolves the visible crossing point after the runner has moved clear of the ray',async t=>{
  const {connect,until}=simulatedWorld(t);
  let target,positionAtCommit;
  const source=connect('Source',actor(10,10),{
    sendDelay:actions=>actions.some(e=>e.type==='fire')?310:35,
    async beforeCommit(actions,db){
      if(!actions.some(e=>e.type==='fire'))return;
      const row=await db.prepare('SELECT state FROM mc_members WHERE id=?').bind(target.net.id).first();
      positionAtCommit=JSON.parse(row.state);
    }
  });
  target=connect('Coureuse',actor(18,10));
  void source.net.start();void target.net.start();
  await until(()=>[source,target].every(c=>c.net.status==='online'&&c.net.peers().length===1),'Both players share their initial positions');
  const visible=source.net.peers()[0],trigger=Date.now();
  assert.ok(aimedBurst(source,target,'crossing',visible.updatedAt,visible));
  for(const [elapsed,offset] of [[75,.55],[150,1.1],[225,1.7]]){
    await until(()=>Date.now()>=trigger+elapsed,'Runner advances at walking/sprinting speed');
    target.net.publish(actor(18,10+offset,{moving:true,vx:0,vy:7.35}));
  }
  await until(()=>target.events.some(e=>e.type==='hit'&&e.data.shotId==='crossing'),'The delayed trigger is validated against its presentation time');
  assert.ok(positionAtCommit.y>=11.7,'The committed target position was already outside the original ray');
  assert.equal(target.events.filter(e=>e.type==='hit').length,1);
});
