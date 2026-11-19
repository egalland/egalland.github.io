import test from 'node:test';
import assert from 'node:assert/strict';
import {handleApi} from '../worker/game-api.js';
import {localDatabase} from '../scripts/local-db.mjs';
import {weaponShotShape} from '../public/weapon-patterns.js';
import {weaponCatalog} from '../public/weapon-catalog.js';

function world(t){
  const DB=localDatabase();
  let clock=1_800_000_000_000;
  t.mock.method(Date,'now',()=>clock);
  t.after(()=>DB.close());
  const api=async(route,who,body={})=>{
    const res=await handleApi(new Request('https://test.local/api/world/'+route,{method:'POST',body:JSON.stringify({...who,...body})}),{DB});
    assert.equal(res.status,200);
    return res.json();
  };
  const state=(x,y,extra)=>({x,y,health:100,angle:0,...extra});
  const player=async(x,y,extra)=>{
    const who={id:crypto.randomUUID(),token:crypto.randomUUID()};
    await api('join',who,{state:state(x,y,extra)});return who;
  };
  const fire=(who,data)=>api('sync',who,{cursor:0,events:[{op:crypto.randomUUID(),type:'fire',data}]});
  const packet=(hits=[],extra={})=>({shotId:crypto.randomUUID(),kind:'pistol',firedAt:clock,x:.35,y:0,angle:0,length:8.98,lift:0,hits,...extra});
  const hit=(p,extra)=>({target:p.id,damage:17,angle:0,force:.38,...extra});
  return {DB,api,player,fire,packet,hit,state,get now(){return clock;},advance:ms=>{clock+=ms;}};
}

test('one pull writes its trace and bounded hit together, even after concurrent mutated retries',async t=>{
  const w=world(t),a=await w.player(0,0),b=await w.player(10,0),c=await w.player(10,.3);
  w.advance(100);
  const packet=w.packet([w.hit(b,{damage:999,force:999}),w.hit(b),w.hit(c)]);
  const response=await w.fire(a,packet);
  assert.deepEqual(response.events.map(e=>e.type),['shot','hit']);
  const hit=response.events[1].data;
  assert.deepEqual([hit.target,hit.damage,hit.shotId,hit.firedAt,hit.weapon],[b.id,17,packet.shotId,packet.firedAt,'pistol']);
  assert.equal(hit.force,17/45);
  await Promise.all([w.fire(a,{...packet,hits:[w.hit(c)]}),w.fire(a,packet)]);
  let after=await w.api('sync',b);
  assert.deepEqual(after.events.map(e=>e.seq),response.events.map(e=>e.seq));
  w.advance(300);
  await Promise.all([w.fire(a,w.packet([w.hit(b)])),w.fire(a,w.packet([w.hit(b)]))]);
  after=await w.api('sync',b);
  assert.equal(after.events.filter(e=>e.type==='shot').length,2);
  assert.equal(after.events.filter(e=>e.type==='hit').length,2);
});

test('a moving target is checked at its displayed position with a bounded rewind; a district transfer clears history',async t=>{
  const w=world(t),a=await w.player(0,0),b=await w.player(10,0,{vy:7});
  w.advance(300);
  await w.api('sync',b,{state:w.state(10,2.1,{vy:7})});
  w.advance(200);
  await w.api('sync',b,{state:w.state(10,3.5,{vy:7})});
  const seen=w.now-420,fireAt=w.now-200;
  const report=await w.fire(a,w.packet([w.hit(b,{viewedAt:seen})],{firedAt:fireAt,y:.56}));
  assert.ok(report.events.some(e=>e.type==='hit'&&e.data.target===b.id));
  w.advance(520);
  await w.api('sync',b,{state:w.state(3000,2000)});
  const later=await w.fire(a,w.packet([w.hit(b,{viewedAt:seen})]));
  assert.equal(later.events.filter(e=>e.type==='hit').length,1);
  for(let i=0;i<30;i++){
    w.advance(52);
    await w.api('sync',b,{state:w.state(3000+i*.2,2000)});
  }
  assert.ok((await w.DB.prepare('SELECT count(*) AS n FROM mc_fire_poses WHERE player=?').bind(b.id).first()).n<=16);
});

test('bad origins, expired shots and impossible fan rays are discarded; off-axis, distant and downed contacts receive no damage',async t=>{
  const w=world(t),a=await w.player(0,0),side=await w.player(10,5),far=await w.player(100,0),down=await w.player(10,0,{health:0});
  w.advance(2400);
  for(const overrides of [{kind:'nope'},{kind:'fist'},{x:99},{firedAt:w.now-2201},{firedAt:w.now+251},
    {length:Infinity},{length:300},{kind:'shotgun',rays:[{x:.35,y:0,angle:0,length:9}]},{}]){
    await w.fire(a,w.packet([w.hit(side),w.hit(far),w.hit(down)],overrides));
  }
  const seen=await w.api('sync',a);
  assert.deepEqual(seen.events.map(e=>e.type),['shot']);
  const forged={op:'legacy',type:'hit',data:{target:far.id,damage:1,cause:'weapon',shotId:'invented',firedAt:w.now}};
  const old=await w.api('sync',a,{events:[forged]});
  assert.equal(old.events.at(-1).type,'hit');
  assert.equal(old.events.at(-1).data.shotId,undefined);
  assert.equal(old.events.at(-1).data.firedAt,undefined);
});

test('fan, arc, radius and chained contacts survive the canonical protocol with weapon-specific caps',async t=>{
  const w=world(t),a=await w.player(0,0);
  const direct=await w.player(10,0),side=await w.player(10,3),behind=await w.player(10,7);
  const polar=(angle,d)=>({x:Math.cos(angle)*d,y:Math.sin(angle)*d});
  const fan=(angle,length)=>({...polar(angle,.35),angle,length});
  const gun='shotgun',spread=weaponShotShape(gun).spreads,foePos=polar(spread[1],20);
  const fanTarget=await w.player(foePos.x,foePos.y);
  w.advance(300);
  const rays=spread.map((angle,i)=>fan(angle,i===0?8.98:i===1?18.98:22));
  let report=await w.fire(a,w.packet([w.hit(direct),w.hit(fanTarget)],{...rays[0],rays,kind:gun}));
  assert.deepEqual(report.events.filter(e=>e.type==='hit').map(e=>e.data.target),[direct.id,fanTarget.id]);
  w.advance(1200);
  const chain=[fan(0,9.05),{x:9.4,y:0,angle:Math.atan2(3,.6),length:Math.hypot(3,.6)}];
  report=await w.fire(a,w.packet([w.hit(direct,{damage:99}),w.hit(side,{damage:99})],{...chain[0],rays:chain,kind:'boomerang'}));
  assert.deepEqual(report.events.slice(-2).map(e=>e.data.damage),[19,15]);
  w.advance(1200);
  report=await w.fire(a,w.packet([w.hit(direct,{damage:21}),w.hit(side,{damage:21}),w.hit(behind)],{kind:'pompom',length:9.4}));
  assert.deepEqual(report.events.slice(-3).map(e=>e.type),['shot','hit','hit']);
  assert.equal(report.events.at(-1).data.target,side.id);
  assert.ok(report.events.at(-1).data.damage<weaponCatalog.pompom.damage);
  const chimePos=polar(1.09,6),listen=await w.player(chimePos.x,chimePos.y);
  w.advance(1100);
  report=await w.fire(a,w.packet([w.hit(listen)],{kind:'chime',length:10}));
  assert.equal(report.events.at(-1).data.target,listen.id);
});

test('steady misses and targeted fan uploads use only two storage round trips on a warm world',async t=>{
  const w=world(t),a=await w.player(0,0),b=await w.player(10,0);
  const prepare=w.DB.prepare.bind(w.DB),batch=w.DB.batch.bind(w.DB),queries=[];
  w.DB.prepare=sql=>{
    const statement=prepare(sql),first=statement.first;
    statement.first=()=>{queries.push('first');return first();};
    return statement;
  };
  w.DB.batch=stmts=>{queries.push('batch:'+stmts.length);return batch(stmts);};
  const request=(who,data)=>w.api('sync',who,{state:w.state(0,0),events:[{op:crypto.randomUUID(),type:'fire',data}]});
  await request(a,w.packet());
  assert.equal(queries.length,2);
  assert.equal(queries[0],'first');
  w.advance(1000);queries.length=0;
  const outcome=await request(a,w.packet([w.hit(b)]));
  assert.equal(outcome.events.at(-1).type,'hit');
  assert.equal(queries.length,2);
  assert.equal(queries[0],'batch:3');
  queries.length=0;
  const refused=await handleApi(new Request('https://test.local/api/world/sync',{method:'POST',body:JSON.stringify({
    id:a.id,token:crypto.randomUUID(),events:[{op:'x',type:'fire',data:w.packet([w.hit(b)])}]})}),{DB:w.DB});
  assert.equal(refused.status,401);
  assert.equal(queries.length,1);
});
