import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeRoster,createRosterWire} from '../public/roster-wire.js';
import {localDatabase} from '../scripts/local-db.mjs';
import {normalizeAppearance} from '../public/kikalmo-schema.js';
import {handleApi} from '../worker/game-api.js';

const size=value=>Buffer.byteLength(JSON.stringify(value));
function player(i){
  return {id:crypto.randomUUID(),name:'Bobine '+i,joinedAt:123+i,updatedAt:1700000000000,
    x:i*2,y:10,moving:false,health:100,angle:0,motion:'idle',lift:0,speed:0,vehicle:null,
    appearance:normalizeAppearance({shape:3,outfit:4,costume:160,color:'#328890',headwear:64}),
    traffic:{at:1700000000000,cars:Array.from({length:10},(_,j)=>['avenue-'+j,j,25+j,7])}};
}

test('snapshot receipts describe global membership; only changed parts return, even within one millisecond',()=>{
  const roster=Array.from({length:12},(_,i)=>player(i)),client=createRosterWire();
  const first=encodeRoster(roster);assert.deepEqual(client.apply(first),roster);
  const quiet=encodeRoster(roster,client.baseline());assert.deepEqual(quiet.rosterDelta.edits,[]);
  assert.strictEqual(client.apply(quiet),roster);
  assert.ok(size(quiet)+size(client.baseline())<size(first)*.1);
  const changed=roster.map((p,i)=>i===5?{...p,x:41,vehicle:{id:'taxi'},moving:true}:p);
  const move=encodeRoster(changed,client.baseline());
  assert.equal(move.rosterDelta.edits.length,1);assert.equal(move.rosterDelta.edits[0][2],2);
  assert.ok(!JSON.stringify(move).includes('#328890'));assert.ok(!JSON.stringify(move).includes('avenue-'));
  const applied=client.apply(move);assert.deepEqual(applied,changed);assert.strictEqual(applied[4],roster[4]);
  const movedAgain=changed.map((p,i)=>i===5?{...p,x:42}:p);
  const later=encodeRoster(movedAgain,client.baseline());assert.equal(client.apply(later)[5].x,42);
  assert.equal(client.apply(move),null);assert.equal(client.baseline(),undefined);
  assert.deepEqual(client.apply(encodeRoster(movedAgain,client.baseline())),movedAgain);
  const smaller=movedAgain.slice(1);const leave=encodeRoster(smaller,client.baseline());
  assert.ok(leave.players);assert.deepEqual(client.apply(leave),smaller);
  assert.deepEqual(client.apply({players:roster}),roster);assert.equal(client.baseline(),undefined);
});

test('many peers keep a bounded request and preserve unchanged metadata through bucket-wide replacements',()=>{
  const roster=Array.from({length:560},(_,i)=>player(i)),client=createRosterWire();client.apply(encodeRoster(roster));
  assert.ok(client.baseline().length<1600);
  const next=roster.map((p,i)=>i===259?{...p,x:958,moving:true}:p);
  const packet=encodeRoster(next,client.baseline());assert.equal(packet.rosterDelta.edits.length,1);
  assert.ok(size(packet)<size(roster)/80);assert.deepEqual(client.apply(packet),next);
  const changed=next.map((p,i)=>i===258?{...p,appearance:undefined,traffic:undefined}:p);
  const delta=encodeRoster(changed,client.baseline());assert.equal(delta.rosterDelta.edits[0][2],5);
  assert.deepEqual(client.apply(delta),JSON.parse(JSON.stringify(changed)));
});

const session=(name,x)=>({id:crypto.randomUUID(),token:crypto.randomUUID(),name,state:{x,y:0,angle:0}});
async function call(DB,endpoint,client,extra={}){
  const response=await handleApi(new Request('https://game.test/api/world/'+endpoint,{method:'POST',body:JSON.stringify({...client,...extra})}),{DB});
  assert.equal(response.status,200);return response.json();
}

test('v2 clients entering and leaving traffic radius change only the related state and keep the global directory',async()=>{
  const DB=localDatabase(),follower=session('Piéton',350),driver=session('Taxi',0),wire=createRosterWire();
  driver.state.traffic={at:Date.now(),cars:[['n2',1,14,5]]};
  try{
    await call(DB,'join',driver);
    const first=await call(DB,'join',follower,{protocol:2});
    assert.equal(wire.apply(first).length,2);
    const get=x=>call(DB,'sync',follower,{state:{x,y:0},protocol:2,rosterBase:wire.baseline()});
    const within=await get(140);assert.ok(within.rosterDelta);
    assert.deepEqual(wire.apply(within).find(p=>p.id===driver.id).traffic,driver.state.traffic);
    const far=await get(340);assert.equal(wire.apply(far).find(p=>p.id===driver.id).traffic,undefined);
    await call(DB,'leave',driver);assert.deepEqual(wire.apply(await get(340)).map(p=>p.id),[follower.id]);
  }finally{DB.close();}
});

test('a page filled with out-of-range shot effects advances the cursor to later hits and global chat',async()=>{
  const DB=localDatabase(),remote=session('Lointain',2000),viewer=session('Témoin',0);
  try{
    await call(DB,'join',remote);await call(DB,'join',viewer);
    const insert=(type,data,i)=>DB.prepare('INSERT INTO mc_events(room,player,op,name,type,data,at) VALUES(?,?,?,?,?,?,?)')
      .bind('paris:public',remote.id,'cosmetic-'+i,remote.name,type,JSON.stringify(data),Date.now());
    await DB.batch([...Array.from({length:160},(_,i)=>insert(i%2?'shot':'melee',{x:2000,y:0},i)),
      insert('hit',{target:viewer.id,damage:5},161),insert('chat',{text:'Bonjour'},162),insert('shot',{x:6,y:1},163)]);
    const filtered=await call(DB,'sync',viewer,{protocol:2,cursor:0});assert.deepEqual(filtered.events,[]);
    assert.ok(filtered.more);assert.ok(filtered.cursor>=160);
    const next=await call(DB,'sync',viewer,{protocol:2,cursor:filtered.cursor});
    assert.deepEqual(next.events.map(e=>e.type),['hit','chat','shot']);
    const old=await call(DB,'sync',viewer,{cursor:0});assert.equal(old.events.length,160);assert.ok(old.players);
  }finally{DB.close();}
});
