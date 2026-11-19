import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import ts from 'typescript';

const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'strate-haul-'));
try {
  const seen = new Set();
  async function compile(name) {
    if (seen.has(name)) return;
    seen.add(name);
    const code = ts.transpileModule(await fs.readFile('lib/'+name+'.ts', 'utf8'), {
      compilerOptions:{module:ts.ModuleKind.ESNext, target:ts.ScriptTarget.ES2022},
    }).outputText;
    const deps=[...code.matchAll(/from ['"]\.\/([^'"]+)['"]/g)].map(m=>m[1]);
    await Promise.all(deps.map(compile));
    await fs.writeFile(path.join(dir,name+'.mjs'),code.replace(/from ['"]\.\/([^'"]+)['"]/g,"from './$1.mjs'"));
  }
  await compile('world');
  const [g,l,t] = await Promise.all(['world','logistics','planet'].map(name => import(pathToFileURL(path.join(dir,name+'.mjs')))));
  const NOW=2_000_000_000_000;
  function setup(){
    const world=g.makeWorld(NOW);world.nextWave=Number.MAX_SAFE_INTEGER;
    const p=g.join(world,'Ada','secret','aurore',NOW);
    return {world,p,base:t.homePoint(world.planet,p.id)};
  }
  const oreTotal = p => Object.values(p.inventory).reduce((n,q)=>n+q,0);
  function ferrite(world,p) {
    for(let u=1024;u<1124;u++)for(let v=1024;v<1124;v++) {
      const pt=t.facePoint('top',u,v);
      if(t.oreAt(world.planet,pt)==='ferrite' && t.canExcavate(world.planet,p.id,pt))return pt;
    }
    throw Error('No ferrite');
  }
  function test(label,action){action();console.log('PASS '+label);}
  test('Manual mining places real ore on the ground, visible to the owner, with one round trip and one credit after reconnect',()=>{
    const {world,p}=setup(),spot=ferrite(world,p),stock=p.inventory.ferrite;
    g.act(world,p,{type:'mine',block:spot,requestId:'rock'},NOW);
    assert.equal(p.inventory.ferrite,stock);assert.equal(p.mined,1);
    const initial=l.logisticsView(p),out=initial.convoys[0];
    assert.equal(out.phase,'outbound');assert.equal(initial.waiting,1);
    const focus=t.pointOnFace('top',spot);
    assert(g.localRegion(world,focus,p,0,NOW).machines.some(m=>m.kind==='crate'));
    assert(!g.localRegion(world,focus,undefined,0,NOW).machines.some(m=>m.kind==='crate'));
    g.advance(world,out.due);assert.equal(l.logisticsView(p).inTransit,1);assert.equal(p.inventory.ferrite,stock);
    const reloaded=JSON.parse(JSON.stringify(world)),again=reloaded.players[0],arrival=again.logistics.convoys[0].due;
    g.advance(reloaded,arrival);g.advance(reloaded,arrival);g.act(reloaded,again,{type:'mine',block:spot,requestId:'rock'},arrival+1);
    assert.equal(again.inventory.ferrite,stock+1);assert.equal(again.logistics.delivered,1);
  });
  test('Partial unloading waits at a full depot, and a blocked cart empties exactly once after stock is spent',()=>{
    const {world,p,base}=setup(),s=l.logisticsState(p),point={...base};
    for(let i=0;i<6;i++)assert(l.stage(p,point,'titane',NOW));
    l.advanceHaul(p,base,NOW,0);const c=s.convoys[0];l.advanceHaul(p,base,c.due,0);
    assert.equal(c.cargo.titane,6);p.inventory.ferrite+=l.logisticsView(p).capacity-oreTotal(p)-2;
    const arrival=c.due;l.advanceHaul(p,base,arrival,0);
    assert.equal(c.phase,'unloading');assert.equal(c.cargo.titane,4);assert.equal(s.delivered,2);
    l.advanceHaul(p,base,arrival+12_000,0);assert.equal(s.delivered,2);
    g.act(world,p,{type:'goodsSell',good:'ferrite',quantity:4},arrival+12_000);
    assert.equal(s.delivered,6);assert.equal(c.phase,'idle');assert.equal(oreTotal(p),l.logisticsView(p).capacity);
  });
  test('Escrow reserves refundable space, refuses an oversized exchange before payment, and cancellations restore stock',()=>{
    const {world,p}=setup(),b=g.join(world,'Bob','secret-b','forge',NOW),cap=l.logisticsView(b).capacity;
    b.inventory.ferrite+=cap-oreTotal(b);
    g.act(world,b,{type:'offerPost',give:'ferrite',quantity:10,want:'credits',price:30},NOW);
    g.act(world,p,{type:'offerPost',give:'cuivre',quantity:1,want:'credits',price:15},NOW);
    const sell=world.offers.find(o=>o.owner===p.id),own=world.offers.find(o=>o.owner===b.id),coins=b.coins;
    assert.equal(l.logisticsView(b,world.offers).reserved,10);assert.throws(()=>g.act(world,b,{type:'offerTake',id:sell.id},NOW),/dépôt/);
    assert.equal(b.coins,coins);assert.equal(world.offers.length,2);
    g.act(world,b,{type:'offerCancel',id:own.id},NOW);assert.equal(oreTotal(b),cap);
    g.act(world,b,{type:'goodsSell',good:'ferrite',quantity:1},NOW);
    g.act(world,b,{type:'offerTake',id:sell.id},NOW);assert.equal(oreTotal(b),cap);
  });
  test('Priority, pause, distance, hold skills, and fleet / depot upgrades use the authoritative base and balances',()=>{
    const {world,p,base}=setup(),s=l.logisticsState(p),second=t.facePoint('top',256,256);
    g.act(world,p,{type:'logistics',kind:'pause'},NOW);
    l.stage(p,base,'cuivre',NOW);l.stage(p,second,'cuivre',NOW);
    l.advanceHaul(p,base,NOW,0);assert(s.paused);assert.equal(s.convoys[0].phase,'idle');
    g.act(world,p,{type:'logistics',kind:'dispatch',block:second},NOW);
    assert.deepEqual(s.convoys[0].point,second);
    const old=s.convoys[0].due;
    g.act(world,p,{type:'logistics',kind:'fleet',requestId:'fleet'},NOW);
    g.act(world,p,{type:'logistics',kind:'fleet',requestId:'fleet'},NOW);
    assert.equal(s.convoys.length,2);assert.deepEqual(s.convoys[1].point,base);assert(s.convoys[1].due<old);
    g.act(world,p,{type:'logistics',kind:'depot'},NOW);assert.equal(l.logisticsView(p).capacity,520);
    p.research=['soutes','turbines'];assert.equal(l.logisticsView(p).payload,14);
    assert.deepEqual(l.convoyPoint(s.convoys[0],base,NOW),base);
    assert.deepEqual(l.convoyPoint(s.convoys[0],base,old),second);
  });
  test('Full field stores stop tools before excavating; old wealthy inventories survive migration; capped offline convoys resume',()=>{
    const {world,p,base}=setup(),point=ferrite(world,p),s=l.logisticsState(p);
    p.inventory.ferrite=5000;s.paused=true;
    for(let i=0;i<64;i++)assert(l.stage(p,point,'ferrite',NOW));
    assert(!l.canStage(p,point));
    assert.equal(g.act(world,p,{type:'mine',block:point},NOW).mined,0);assert(!t.isRemoved(world.planet,point));
    g.act(world,p,{type:'deploy',unit:'drill',face:'top',block:point},NOW);
    g.advance(world,NOW+10_000);assert(!t.isRemoved(world.planet,point));assert.equal(p.drill.health,100);
    const migrated=g.migrateWorld(JSON.parse(JSON.stringify(world)));assert.equal(migrated.players[0].inventory.ferrite,5000);
    s.sites=[];p.inventory.ferrite=0;s.paused=false;
    const expiry=NOW+g.OFFLINE_CAP;
    l.stage(p,base,'prisme',expiry-50);l.advanceHaul(p,base,expiry-50,0);
    l.advanceHaul(p,base,expiry,0);const remaining=s.convoys[0].due-expiry;
    g.wakeFleet(p,expiry+50_000);assert.equal(s.convoys[0].due,expiry+50_000+remaining);
    l.advanceHaul(p,base,expiry+50_000,0);assert.equal(s.convoys[0].phase,'outbound');assert.equal(s.delivered,0);
  });
  test('An occupied relay delays a nearby departure once; defended, distant, and home sites have an ordinary ETA',()=>{
    const {world,p,base}=setup(),r=world.relays[0];g.join(world,'Garde','secret-garde','aurore',NOW);
    // Use the same base and destination for every comparison so distance is exactly identical.
    r.point=t.facePoint('top',1024,1024);
    const spot={...r.point};const plain=structuredClone(world);
    world.enemies.push({id:'incursion',x:r.x,y:r.y,target:r.id,hp:999,maxHp:999,damage:1});
    function launch(w,point=spot) {
      const a=w.players[0];l.stage(a,point,'prisme',NOW);
      g.advance(w,NOW);
      return a.logistics.convoys[0];
    }
    const regular=launch(plain),expected=regular.due;
    const ally=structuredClone(world),guard=ally.players[1];
    Object.assign(guard,{target:r.id,x:r.x,y:r.y});
    assert.equal(launch(ally).due,expected);
    const truce=structuredClone(world),helper=truce.players[1];
    Object.assign(helper,{target:r.id,x:r.x,y:r.y,faction:'forge'});
    truce.relays[0].allianceUntil=NOW+90_000;truce.relays[0].contributors=[helper.id];
    assert.equal(launch(truce).due,expected);
    const far=structuredClone(world),quiet=structuredClone(world),distant={...spot,x:spot.x+65};
    quiet.enemies=[];assert.equal(launch(far,distant).due,launch(quiet,distant).due);
    const homeSafe=structuredClone(world);homeSafe.relays[0].point=base;
    assert.equal(launch(homeSafe,base).detour,undefined);
    const s=l.logisticsState(p);s.paused=true;l.stage(p,spot,'prisme',NOW);
    g.advance(world,NOW);assert.equal(s.convoys[0].phase,'idle');
    g.act(world,p,{type:'logistics',kind:'pause'},NOW);
    assert.deepEqual(s.convoys[0].detour,{relay:r.name,delayMs:12_000});
    const due=s.convoys[0].due;assert.equal(due,expected+12_000);
    const reload=JSON.parse(JSON.stringify(world)),copy=reload.players[0],c=copy.logistics.convoys[0];
    g.act(reload,copy,{type:'logistics',kind:'pause'},NOW+500);
    reload.enemies=[];g.advance(reload,NOW+1500);g.advance(reload,NOW+2500);
    assert.equal(c.due,due);assert.equal(c.detour.delayMs,12_000);
    g.advance(reload,due);assert.equal(c.phase,'returning');assert.equal(c.cargo.prisme,1);assert.equal(c.detour,undefined);
    assert.equal(c.due-due,expected-NOW);
    g.advance(reload,c.due);assert.equal(copy.inventory.prisme,1);assert.equal(copy.logistics.delivered,1);
  });
  test('Drill production is independent of polling cadence and reaches the depot once after catch-up',()=>{
    const {world,p}=setup(),f=t.parcelFocus(world.planet.bases[p.id].home),point=t.facePoint(f.face,f.u+3,f.v);
    g.act(world,p,{type:'deploy',unit:'drill',face:f.face,block:point},NOW);
    const incremental=structuredClone(world),single=structuredClone(world);
    for(let ms=1_000;ms<=360_000;ms+=1_000)g.advance(incremental,NOW+ms);
    g.advance(single,NOW+360_000);
    for(const w of [incremental,single]) {
      const a=w.players[0],log=l.logisticsView(a);
      assert(w.extracted>5);assert.equal(log.delivered+log.waiting+log.inTransit,w.extracted);
    }
    assert.equal(incremental.extracted,single.extracted);
    assert.deepEqual(incremental.players[0].inventory,single.players[0].inventory);
    assert.deepEqual(incremental.players[0].logistics,single.players[0].logistics);
  });
} finally { await fs.rm(dir,{recursive:true,force:true}); }
