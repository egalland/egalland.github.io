import test from 'node:test';
import assert from 'node:assert/strict';
import {createNet} from '../public/net.js';

const epoch=1_800_000_000_000;
const turn=()=>new Promise(resolve=>setImmediate(resolve));
function harness(t){
  t.mock.timers.enable({apis:['setTimeout','Date'],now:epoch});
  const requests=[],events=[],statuses=[];
  const fetcher=(url,init)=>{
    if(url.endsWith('/leave'))return Promise.resolve(new Response('{}'));
    const body=JSON.parse(init.body);
    return new Promise((resolve,reject)=>{
      requests.push({body,url,at:Date.now(),fail:reject,
        answer(packet={},status=200){
          resolve(new Response(JSON.stringify({now:Date.now(),players:[{id:body.id,x:0,y:0},{id:'friend',x:8,y:0}],cursor:body.cursor,...packet}),{status}));
        }});
    });
  };
  const net=createNet({fetcher,onStatus:s=>statuses.push(s)});
  net.publish({x:0,y:0,health:100});
  net.onEvent(e=>events.push(e));
  async function advance(n){t.mock.timers.tick(n);await turn();}
  async function start(travel=0,clockOffset=0){
    const start=net.start(),join=requests.at(-1);
    await advance(travel);join.answer({now:join.at+travel/2+clockOffset});
    assert.equal(await start,true);
  }
  t.after(()=>{net.stop();});
  return {net,requests,events,statuses,advance,start};
}
const fire=()=>({shotId:crypto.randomUUID(),firedAt:Date.now(),x:0,y:0,angle:0,length:30,kind:'pistol'});
const event=(seq,type,data)=>({seq,type,data,player:'friend',at:Date.now()});

test('a trigger queued behind a slow poll flushes on its reply with no overlap or extra interval',async t=>{
  const {net,requests,advance,start}=harness(t);
  await start();
  await advance(175);
  assert.equal(requests.length,2);
  const reading=requests[1],shot=fire();
  assert(net.emit('fire',shot));
  await advance(134);
  assert.equal(requests.length,2);
  reading.answer();await turn();await advance(0);
  assert.equal(requests.length,3);
  assert.deepEqual(requests[2].body.events.map(e=>e.data.shotId),[shot.shotId]);
  assert.equal(requests[2].at,reading.at+134);
  requests[2].answer();await turn();
  await advance(77);assert.equal(requests.length,3);
  await advance(1);assert.equal(requests.length,4);
});

test('a lost burst acknowledgement retries its original operations once and advances across gaps and duplicates',async t=>{
  const {net,requests,events,advance,start}=harness(t);
  await start();
  const shot=fire();
  net.emit('fire',shot);await advance(0);
  const upload=requests.at(-1),op=upload.body.events[0].op;
  upload.fail(new Error('lost reply after commit'));await turn();
  await advance(160);
  const retry=requests.at(-1);
  assert.notEqual(retry,upload);assert.equal(retry.body.events[0].op,op);
  const stale=event(1,'shot',{x:0,y:0,firedAt:Date.now()-1800});
  const localHit=event(3,'hit',{target:net.id,cause:'weapon',damage:12});
  const tracer=event(5,'shot',{x:2,y:0,kind:'pistol',firedAt:Date.now()});
  retry.answer({events:[stale,localHit,localHit,tracer],cursor:9,more:true});
  await turn();await advance(0);
  const next=requests.at(-1);
  assert.equal(next.body.cursor,9);
  next.answer({events:[localHit,tracer,event(10,'emote',{symbol:'ok'})],cursor:10});
  await turn();
  assert.deepEqual(events.map(e=>e.seq),[3,5,10]);
});

test('clock midpoint rejects a one-sided delay spike and targeted impacts use the freshly received roster',async t=>{
  const {net,requests,advance,start}=harness(t);
  await start(70,450);
  assert.equal(net.serverTime()-Date.now(),450);
  const beforeRevision=net.rosterRevision;
  let senderX;
  net.onEvent(e=>{if(e.type==='hit')senderX=net.peers().find(p=>p.id===e.player)?.x;});
  net.sendChat('test');await advance(16);
  const poll=requests.at(-1),serverReceived=poll.at+35+450;
  await advance(490);
  poll.answer({now:serverReceived,players:[{id:net.id,x:0,y:0},{id:'friend',x:16,y:0}],cursor:2,
    events:[event(2,'hit',{target:net.id,damage:8})]});
  await turn();
  assert.equal(net.serverTime()-Date.now(),450);
  assert.equal(senderX,16);assert.equal(net.rosterRevision,beforeRevision+1);
});

test('a chat backlog cannot starve ordered gameplay and every chat still drains',async t=>{
  const {net,requests,advance,start}=harness(t);
  await start();
  for(let i=0;i<45;i++)assert(net.sendChat(String(i)));
  const actions=['melee','hit','fire','vehicle'];
  for(const type of actions)net.emit(type,type==='fire'?fire():{});
  await advance(0);
  const batches=[];
  for(let i=0;i<3;i++){
    const req=requests.at(-1);
    batches.push(req.body.events);
    assert(req.body.events.length<=20);
    req.answer();await turn();if(i<2)await advance(0);
  }
  assert.deepEqual(batches[0].filter(e=>e.type!=='chat').map(e=>e.type),actions);
  assert(batches[0].some(e=>e.type==='chat'));
  assert.deepEqual(batches.flat().filter(e=>e.type==='chat').map(e=>e.data.text),Array.from({length:45},(_,i)=>String(i)));
});

test('an expired session drops old combat and explicitly rolls back object predictions while restoring the world',async t=>{
  const {net,requests,events,advance,start}=harness(t);
  await start();
  net.emit('fire',fire());
  net.emit('propDamage',{id:'bin',impactId:'hit-1',damage:17});
  await advance(0);
  requests.at(-1).answer({},401);await turn();await advance(0);
  const join=requests.at(-1);
  assert(join.url.endsWith('/join'));assert.deepEqual(join.body.events,[]);
  assert.equal(net.emit('fire',fire()),false);
  assert.equal(events.find(e=>e.type==='propDamageDenied')?.data.impactId,'hit-1');
  join.answer({world:{destroyed:['bench']}});await turn();
  assert.deepEqual(net.world().destroyed,['bench']);
  await advance(175);
  assert.deepEqual(requests.at(-1).body.events,[]);
});

test('a large burst is split to fit the wire size limit without losing FIFO impacts',async t=>{
  const {net,requests,advance,start}=harness(t);
  await start();
  const shots=Array.from({length:20},()=>({...fire(),rays:Array.from({length:13},()=>({
    x:12345.23456789,y:98765.28259873,angle:1.234567890123,length:33.4234898920})),
    hits:Array.from({length:10},()=>({id:crypto.randomUUID(),x:14765.9372918,y:37465.9123468}))}));
  for(const s of shots)net.emit('fire',s);
  await advance(0);
  const ids=[];
  while(ids.length<shots.length){
    const poll=requests.at(-1);
    assert(JSON.stringify(poll.body).length<=32000);
    assert(poll.body.events.length>0&&poll.body.events.length<shots.length);
    ids.push(...poll.body.events.map(e=>e.data.shotId));poll.answer();await turn();
    if(ids.length<shots.length)await advance(0);
  }
  assert.deepEqual(ids,shots.map(s=>s.shotId));
});

test('short dropouts retain the next trigger but a prolonged outage cannot replay an expired burst',async t=>{
  const {net,requests,advance,start}=harness(t);
  await start();
  const first=fire(),second=fire();
  assert(net.emit('fire',first));await advance(0);
  requests.at(-1).fail(new Error('temporary drop'));await turn();
  assert(net.emit('fire',second));await advance(80);
  assert.deepEqual(requests.at(-1).body.events.map(e=>e.data.shotId),[first.shotId,second.shotId]);
  const stuck=requests.at(-1);
  await advance(2300);stuck.fail(new Error('prolonged outage'));await turn();
  assert.equal(net.emit('fire',fire()),false);
  await advance(1400);
  assert.deepEqual(requests.at(-1).body.events,[]);
});

test('a full social queue leaves room for a trigger and a distant shot does not accelerate idle polling',async t=>{
  const {net,requests,advance,start}=harness(t);
  await start();
  await advance(175);
  const idle=requests.at(-1);
  idle.answer({events:[event(1,'shot',{x:900,y:0,kind:'pistol'})],cursor:1});await turn();
  await advance(150);
  assert.equal(requests.at(-1),idle);
  assert(Array.from({length:120},(_,i)=>net.sendChat(String(i))).some(ok=>!ok));
  const shot=fire();assert(net.emit('fire',shot));
  await advance(0);assert(requests.at(-1).body.events.some(e=>e.data.shotId===shot.shotId));
});
