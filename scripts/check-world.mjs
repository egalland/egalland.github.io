import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import assert from 'node:assert/strict';
import ts from 'typescript';

const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'strate-world-'));
try{
  const compiled=new Set();
  async function compile(name) {
    if(compiled.has(name))return;
    compiled.add(name);
    const source=await fs.readFile('lib/'+name+'.ts','utf8');
    const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
    const dependencies=[];
    const resolved=js.replace(/from (['"])\.\/([^'"]+)\1/g,(_match,_quote,dependency)=>{
      dependencies.push(dependency);
      return "from './"+dependency+".mjs'";
    });
    await fs.writeFile(path.join(tmp,name+'.mjs'),resolved);
    for(const dependency of dependencies)await compile(dependency);
  }
  for(const name of ['world','planet','world-store'])await compile(name);
  const [g,terrain,storage]=await Promise.all(['world','planet','world-store'].map(name=>import(pathToFileURL(path.join(tmp,name+'.mjs')))));
  const NOW=2_000_000_000_000, create=()=>{const w=g.makeWorld(NOW);w.nextWave=Number.MAX_SAFE_INTEGER;return w;};
  const player=(w,name='Ada',f='aurore')=>g.join(w,name,'secret-'+name,f,NOW);
  function sample(w,p,resource='ferrite'){
    for(let x=200;x<400;x++)for(let z=180;z<230;z++){
      const point=terrain.facePoint('top',x,z);
      if(terrain.canExcavate(w.planet,p.id,point)&&terrain.oreAt(w.planet,point)===resource)return point;
    }
    throw Error('Sample missing: '+resource);
  }
  const test=async(label,fn)=>{await fn();console.log('PASS '+label);};
  await test('Six independently excavatable faces, hard ore settles once, sparse storage, persistent underground excavation',()=>{
    const w=create(),p=player(w),p1=sample(w,p),c=sample(w,p,'cuivre');
    g.act(w,p,{type:'mine',block:p1,requestId:'manual'},NOW);
    g.act(w,p,{type:'mine',block:p1,requestId:'manual'},NOW);
    assert.equal(w.extracted,1);
    g.act(w,p,{type:'mine',block:c},NOW+500);
    assert.equal(w.extracted,1);assert(p.mining);
    g.advance(w,NOW+4000);g.advance(w,NOW+4100);
    assert.equal(p.mining,null);assert.equal(w.extracted,2);
    const underneath={...p1,y:p1.y-1};
    assert(terrain.isExposed(w.planet,underneath));
    const deep=structuredClone(w),pp=deep.players[0];
    assert.equal(terrain.isRemoved(deep.planet,p1),true);
    assert.throws(()=>g.act(deep,pp,{type:'mine',block:{x:5000,y:5000,z:5000}},NOW+5000));
    g.act(deep,pp,{type:'mine',block:underneath},NOW+5000);
    g.advance(deep,NOW+30000);assert(terrain.isRemoved(deep.planet,underneath));
  });
  await test('Version-one migration preserves account, token, balances, war and ledger while assigning separate protected homes',()=>{
    const original=create(),a=player(original),b=player(original,'Max','forge');
    a.account='account-A';a.coins=12345;a.pick=4;b.mined=502;original.extracted=90001;
    delete original.format;delete original.planet;for(const p of original.players)delete p.drill;
    const w=g.migrateWorld(original);
    assert.equal(w.players[0].account,'account-A');assert.equal(a.coins,12345);assert.equal(a.token,'secret-Ada');
    assert.equal(w.extracted,90001);assert.equal(b.mined,502);assert.equal(a.pick,4);
    assert.notDeepEqual(w.planet.bases[a.id],w.planet.bases[b.id]);
    assert.throws(()=>g.act(w,b,{type:'mine',block:terrain.homePoint(w.planet,a.id)},NOW));
  });
  await test('Drill mining is physical, offline-capped, wears, can stop and repair; idle workshop remains independent',()=>{
    const w=create(),p=player(w),spot=sample(w,p);
    g.advance(w,NOW+60000);assert.equal(p.mined,0);
    g.act(w,p,{type:'deploy',unit:'drill',face:'top',block:spot},NOW+60000);
    g.act(w,p,{type:'workshopStart',recipe:'acier',batches:1},NOW+60000);
    p.drill.health=2;
    g.advance(w,NOW+61000);assert.equal(p.mined,0);
    g.advance(w,NOW+82000);assert.equal(p.mined,2);assert.equal(p.drill.status,'damaged');
    assert(terrain.isRemoved(w.planet,spot));assert(terrain.isRemoved(w.planet,{...spot,y:spot.y-1}));
    g.advance(w,NOW+120000);assert.equal(p.mined,2);assert.equal(p.economy.refined.acier,1);
    g.act(w,p,{type:'repair',unit:'drill'},NOW+120001);assert.equal(p.drill.status,'ready');assert.equal(p.drill.health,100);
    const q=player(w,'Beta');assert.throws(()=>g.act(w,q,{type:'deploy',unit:'drill',face:'top',block:terrain.homePoint(w.planet,p.id)},NOW));
  });
  await test('Sector buy rejects disconnected and diagonal claims, escalating face-adjacent purchases debit exactly once',()=>{
    const w=create(),p=player(w),base=w.planet.bases[p.id],h=base.home,delta={x:h.x>250?-1:1,y:h.y>250?-1:1,z:h.z>250?-1:1};
    p.coins=10000;
    assert.throws(()=>g.act(w,p,{type:'expand',parcel:{x:h.x+delta.x,y:h.y+delta.y,z:h.z}},NOW));
    const one={...h,x:h.x+delta.x},two={...h,x:h.x+2*delta.x};
    const cost=terrain.extendPrice(base);
    g.act(w,p,{type:'expand',parcel:one,requestId:'buy'},NOW);g.act(w,p,{type:'expand',parcel:one,requestId:'buy'},NOW);
    assert.equal(p.coins,10000-cost);assert(terrain.extendPrice(base)>cost);
    g.act(w,p,{type:'expand',parcel:two},NOW);assert.equal(base.parcels.length,3);
  });
  await test('Cross-faction co-defense, equal credit shares, no phantom extraction; squad orders require a relay',()=>{
    const w=create(),p=player(w),q=player(w,'Beta','forge'),r=w.relays[0],c=p.coins;
    assert.throws(()=>g.act(w,p,{type:'deploy',unit:'squad',block:{x:1,y:1,z:1}},NOW));
    g.act(w,q,{type:'deploy',unit:'squad',block:r.point},NOW);
    for(const a of [p,q]){a.x=r.x;a.y=r.y;a.target=r.id;}
    q.units=9;q.hp=270;w.enemies.push({id:'raid',x:r.x,y:r.y,target:r.id,hp:12,maxHp:12,damage:1});
    g.advance(w,NOW+10000);assert.equal(w.enemies.length,0);assert(r.allianceUntil>NOW);
    assert.equal(g.relayRate(w,p),18);assert.equal(p.coins-c,3);assert.equal(p.coins,q.coins);assert.equal(w.extracted,0);
    r.allianceUntil=0;g.advance(w,NOW+20000);assert(p.hp<90);
  });
  await test('Shared relay bonus gives actual adjacent ore to active drills and cannot accumulate after recall',()=>{
    const w=create(),p=player(w),q=player(w,'Beta','forge'),r=w.relays[0];
    const one=sample(w,p),two={...one,z:one.z+1};
    for(const [miner,point] of [[p,one],[q,two]]){
      miner.x=r.x;miner.y=r.y;miner.target=r.id;
      g.act(w,miner,{type:'deploy',unit:'drill',face:'top',block:point},NOW);
    }
    r.allianceUntil=NOW+180000;r.contributors=[p.id,q.id];
    g.advance(w,NOW+10000);assert.equal(p.mined,1);assert.equal(q.mined,1);
    g.advance(w,NOW+20000);assert.equal(p.mined,3);assert.equal(q.mined,3);assert.equal(w.extracted,6);
    for(const point of [one,two])assert(terrain.isRemoved(w.planet,{...point,y:point.y-2}));
    const v=g.publicWorld(w,p,NOW+20000);assert.equal(v.me.harvestBonus,3);assert.equal(v.me.bonus,18);assert.equal(v.me.rate,9);
    g.advance(w,NOW+30000);g.act(w,q,{type:'recall',unit:'drill'},NOW+30000);assert.equal(q.drill.bonusCarry,0);
    g.advance(w,NOW+50000);assert.equal(q.mined,4);assert.equal(g.publicWorld(w,q,NOW+50000).me.harvestBonus,0);
  });
  await test('Local-only discoveries and private tokens, bases, orders, equipment disappear from orbital view',()=>{
    const w=create(),p=player(w),q=player(w,'Beta');
    p.lastActionIds=['private-action'];p.account='private-account';
    const region=terrain.homeFocus(w.planet,p.id),v=g.publicWorld(w,p,NOW,region),global=g.publicWorld(w,q,NOW);
    assert.equal(v.region.tiles.length,289);assert.equal(global.region,null);assert.equal(global.me.id,q.id);
    const s=JSON.stringify(global);assert(!s.includes('private-action'));assert(!s.includes('secret-'));assert(!s.includes('private-account'));
    assert(!Object.hasOwn(global.players[0],'drill'));assert(!Object.hasOwn(global.players[0],'base'));
  });
  class Statement{
    constructor(db,sql,args=[]){this.db=db;this.sql=sql;this.args=args;}
    bind(...args){return new Statement(this.db,this.sql,args);}
    first(){return this.db.prepare(this.sql).get(...this.args);}
    all(){return {results:this.db.prepare(this.sql).all(...this.args)};}
    run(){return {meta:this.db.prepare(this.sql).run(...this.args)};}
  }
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec(await fs.readFile('drizzle/0001_majestic_quasar.sql','utf8'));
  const db={
    prepare:sql=>new Statement(sqlite,sql),
    batch(list){
      sqlite.exec('BEGIN');
      try{const results=list.map(s=>s.run());sqlite.exec('COMMIT');return results;}
      catch(error){sqlite.exec('ROLLBACK');throw error;}
    },
  };
  await test('SQLite/D1 storage CAS: competing miners cannot duplicate voxel payout or overwrite chunk; state reload shows winner',async()=>{
    assert.equal(await storage.readWorld(db),null);
    const base=await storage.readWorld(db),p=player(base.world),other=player(base.world,'Beta');
    assert(await storage.saveWorld(db,base));
    const [a,b]=await Promise.all([storage.readWorld(db),storage.readWorld(db)]);
    const first=sample(a.world,p),neighbor=sample(a.world,other,'cuivre');
    g.act(a.world,a.world.players[0],{type:'mine',block:first},NOW);
    g.act(b.world,b.world.players[1],{type:'mine',block:first},NOW);
    g.act(b.world,b.world.players[1],{type:'mine',block:neighbor},NOW+1000);g.advance(b.world,NOW+5000);
    assert(await storage.saveWorld(db,a));
    assert.equal(await storage.saveWorld(db,b),false);
    const reload=await storage.readWorld(db),keys=g.neededChunks(reload.world,null,{type:'mine',block:first},NOW);
    await storage.readChunks(db,reload.world,keys);
    assert(terrain.isRemoved(reload.world.planet,first));assert(!terrain.isRemoved(reload.world.planet,neighbor));
    assert.equal(reload.world.players[0].mined,1);assert.equal(reload.world.players[1].mined,0);
    assert.throws(()=>g.act(reload.world,reload.world.players[1],{type:'mine',block:first},NOW));
  });
  async function routeClient() {
    globalThis.__strateFixtureDB=db;
    const routeSource=await fs.readFile('scripts/fixtures/voxel-command-route.ts','utf8');
    const routeJS=ts.transpileModule(routeSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
      .replace(/import \{ env \} from 'cloudflare:workers';/,"const env={get DB(){return globalThis.__strateFixtureDB}};")
      .replace(/from '@\/lib\/([^']+)'/g,"from './$1.mjs'");
    await fs.writeFile(path.join(tmp,'route.mjs'),routeJS);
    const {POST}=await import(pathToFileURL(path.join(tmp,'route.mjs')));
    return async function call(account,request){
      const http=await POST(new Request('https://example.invalid/api/game',{method:'POST',headers:{
        'Content-Type':'application/json',...(account?{'oai-authenticated-user-id':account}:{}),
      },body:JSON.stringify(request)}));
      return {status:http.status,...await http.json()};
    };
  }
  async function pairedSessions(run) {
    sqlite.exec('DELETE FROM voxel_worlds');
    const realNow=Date.now, clock={now:NOW};
    Date.now=()=>clock.now;
    try {
      const call=await routeClient();
      const accounts=['claim-owner','claim-visitor'];
      const joined=[
        await call(accounts[0],{op:'join',name:'Silex',faction:'aurore'}),
        await call(accounts[1],{op:'join',name:'Rive',faction:'veille'}),
      ];
      for(const entry of joined)assert.equal(entry.status,200,entry.error);
      assert.notEqual(joined[0].world.me.id,joined[1].world.me.id);
      await run({accounts,call,clock,joined,order:(account,action)=>call(account,{op:'action',action})});
    } finally {
      Date.now=realNow;
      delete globalThis.__strateFixtureDB;
    }
  }
  await test('Two accounts mine the same planet; only the owner can dig in the protected core and a purchased extension',async()=>{
    await pairedSessions(async({accounts:[owner,visitor],call,clock,joined,order})=>{
      const base=joined[0].world.me,home=terrain.parcelFocus(base.base.home);
      const faces=terrain.FACE_ORDER.map((_,i)=>terrain.relayFocus(i));
      const reserved=faces.map(f=>terrain.chunkKey(terrain.chunkAt(terrain.facePoint(f.face,f.u,f.v))));
      const {world:w}=await storage.readWorld(db);
      const extension=[[32,0],[-32,0],[0,32],[0,-32]].map(([du,dv])=>({...home,u:home.u+du,v:home.v+dv}))
        .filter(f=>terrain.normalizeFocus(f)).find(f=>{
          const chunk=terrain.chunkAt(terrain.facePoint(f.face,f.u,f.v));
          return !terrain.territoryOwner(w.planet,chunk)&&!reserved.includes(terrain.chunkKey(chunk));
        });
      assert(extension,'a tangential parcel adjacent to the home should be available');
      const extraPoint=terrain.facePoint(extension.face,extension.u,extension.v);
      const parcel=terrain.chunkAt(extraPoint),buy={type:'expand',parcel,requestId:'first-extension'};
      const [first,retry]=await Promise.all([order(owner,buy),order(owner,buy)]);
      assert.equal(first.status,200,first.error);assert.equal(retry.status,200,retry.error);
      assert.equal(retry.world.me.base.parcels.length,2);
      assert.equal(first.world.me.coins,base.coins-base.extensionPrice);
      for(const [place,point] of [[home,base.homePoint],[extension,extraPoint]]){
        const rivalOrder=await order(visitor,{type:'deploy',unit:'drill',face:place.face,block:point});
        assert.equal(rivalOrder.status,400);
        const [rival,dig]=await Promise.all([order(visitor,{type:'mine',block:point}),order(owner,{type:'mine',block:point})]);
        assert.equal(rival.status,400);
        assert.equal(dig.status,200,dig.error);
        clock.now=Math.max(clock.now+1000,(dig.world.me.mining?.ready??clock.now)+1000);
        const local=await call(visitor,{op:'poll',focus:place});
        assert.equal(local.status,200,local.error);
        const tile=local.world.region.tiles.find(t=>t.u===place.u&&t.v===place.v);
        assert.equal(tile.depth,1);assert.equal(tile.territory,'foreign');
      }
      const view=await call(owner,{op:'view'});
      assert.equal(view.world.me.mined,2);
      assert.equal(view.world.extracted,2);
      assert.deepEqual(view.world.me.base.home,base.base.home);
      assert.deepEqual(view.world.me.homePoint,base.homePoint);
      assert.equal((await order(owner,{type:'research',skill:'trepan'})).status,400);
      const research={type:'research',skill:'cadence',requestId:'research-once'};
      const purchases=await Promise.all([order(owner,research),order(owner,research)]);
      for(const result of purchases)assert.equal(result.status,200,result.error);
      const upgraded=await call(owner,{op:'view'}),rival=await call(visitor,{op:'view',token:joined[0].token});
      assert.deepEqual(upgraded.world.me.research,['cadence']);
      assert(upgraded.world.me.pickCooldownMs<base.pickCooldownMs);
      const {RESEARCH_TREE}=await import(pathToFileURL(path.join(tmp,'research.mjs')));
      assert.equal(upgraded.world.me.coins,view.world.me.coins-RESEARCH_TREE.find(node=>node.id==='cadence').credits);
      assert.equal(rival.world.me.id,joined[1].world.me.id);
      assert.deepEqual(rival.world.me.research,[]);
    });
  });
  await test('Contested copper seam is delivered once; the market cannot spend a waiting or travelling load',async()=>{
    await pairedSessions(async({accounts,call,clock,joined,order})=>{
      const prepared=await storage.readWorld(db);
      for(const p of prepared.world.players)p.inventory.cuivre=0;
      assert(await storage.saveWorld(db,prepared));
      const point=sample(prepared.world,prepared.world.players[0],'cuivre');
      const focus=terrain.pointOnFace('top',point);
      const before=await call(accounts[1],{op:'region',focus});
      const crop=region=>region.tiles.find(tile=>tile.u===focus.u&&tile.v===focus.v);
      assert.equal(crop(before.region).ore,'cuivre');
      // Register order and completion order are intentionally opposite. Both mining
      // deadlines pass between polls, as can happen for two disconnected players.
      const first=await order(accounts[1],{type:'mine',block:point,requestId:'contested-copper'});
      clock.now+=400;
      const second=await order(accounts[0],{type:'mine',block:point,requestId:'contested-copper'});
      const digs=[first,second];
      for(const dig of digs)assert.equal(dig.status,200,dig.error);
      clock.now=Math.max(...digs.map(d=>d.world.me.mining?.ready??clock.now))+1;
      const snapshot=()=>Promise.all(accounts.map(account=>call(account,{op:'poll',focus})));
      const settled=await snapshot();
      for(const reply of settled){
        assert.equal(reply.status,200,reply.error);
        assert.equal(reply.world.extracted,1);
        assert.equal(crop(reply.world.region).depth,1);
      }
      const winner=settled.findIndex(entry=>entry.world.me.mined===1),loser=1-winner;
      assert.equal(winner,1,'the first completed extraction must win, independently of join order');
      assert.equal(settled[loser].world.me.mined,0);
      const account=accounts[winner],initial=settled[winner].world.me.logistics;
      assert.equal(initial.waiting+initial.inTransit,1);
      assert.equal(settled[winner].world.me.inventory.cuivre,0);
      const earlySale=()=>order(account,{type:'goodsSell',good:'cuivre',quantity:1});
      assert.equal((await earlySale()).status,400);
      const dispatch={type:'logistics',kind:'dispatch',block:point,requestId:'route-order'};
      const sent=await Promise.all([order(account,dispatch),order(account,dispatch)]);
      for(const reply of sent)assert.equal(reply.status,200,reply.error);
      let loaded=false,delivered=false;
      for(let i=0;i<8&&!delivered;i++){
        const reads=await snapshot(), winnerView=reads[winner].world.me,visitorView=reads[loser].world;
        const flow=winnerView.logistics;
        assert.equal(flow.waiting+flow.inTransit+winnerView.inventory.cuivre,1);
        assert.equal(visitorView.me.inventory.cuivre,0);
        assert.equal(visitorView.me.logistics.waiting+visitorView.me.logistics.inTransit,0);
        const outsider=visitorView.players.find(p=>p.id===winnerView.id);
        for(const key of ['token','account','base','logistics','inventory','research','drill'])
          assert(!Object.hasOwn(outsider,key),'private player data exposed: '+key);
        if(flow.inTransit){loaded=true;assert.equal((await earlySale()).status,400);}
        if(winnerView.inventory.cuivre===1){delivered=true;assert.equal(flow.delivered,1);break;}
        const due=flow.convoys.filter(c=>c.phase!=='idle').map(c=>c.due);
        clock.now=Math.max(clock.now+1000,due.length?Math.min(...due)+1:clock.now+g.TICK);
      }
      assert(loaded,'the copper should pass through the transporter cargo');
      assert(delivered,'the transporter should unload at its player’s depot');
      const sale={type:'goodsSell',good:'cuivre',quantity:1,requestId:'one-sale'};
      for(const result of await Promise.all([order(account,sale),order(account,sale)]))
        assert.equal(result.status,200,result.error);
      const reconnect=await call(account,{op:'view'});
      assert.equal(reconnect.world.me.inventory.cuivre,0);
      assert.equal(reconnect.world.me.logistics.delivered,1);
      assert.equal(reconnect.world.me.coins,joined[winner].world.me.coins+g.RESOURCES.cuivre.value);
    });
  });
  await test('Two authenticated HTTP sessions persist mining and reject a rival dig; simultaneous market buyers settle once',async()=>{
    sqlite.exec('DELETE FROM voxel_worlds');
    const call=await routeClient();
    const [a,b]=await Promise.all([
      call('alpha-account',{op:'join',name:'Alpha',faction:'aurore'}),
      call('beta-account',{op:'join',name:'Beta',faction:'forge'}),
    ]);
    assert.equal(a.status,200);assert.equal(b.status,200);assert.notEqual(a.token,b.token);
    const c=await call('gamma-account',{op:'join',name:'Gamma',faction:'veille'});
    const point=sample((await storage.readWorld(db)).world,{id:a.world.me.id}),focus=terrain.pointOnFace('top',point);
    const [one,two]=await Promise.all(['alpha-account','beta-account'].map(account=>call(account,{
      op:'action',action:{type:'mine',block:point,requestId:account+'-mine'},focus,
    })));
    assert.deepEqual([one.status,two.status].sort(),[200,400]);
    const v=await call('beta-account',{op:'poll',focus});
    assert.equal(v.world.extracted,1);
    assert.equal(v.world.region.tiles.find(t=>t.u===focus.u&&t.v===focus.v).depth,1);
    const denied=await call(null,{op:'action',token:a.token,action:{type:'mine',block:point}});
    assert.equal(denied.status,401);
    const offer=await call('alpha-account',{op:'action',action:{type:'offerPost',give:'ferrite',quantity:4,want:'credits',price:20,requestId:'offer'}});
    const id=offer.world.economy.offers[0].id;
    const claim=account=>call(account,{op:'action',action:{type:'offerTake',id,requestId:account+'-buy'}});
    const settled=await Promise.all([claim('beta-account'),claim('gamma-account')]);
    assert.deepEqual(settled.map(result=>result.status).sort(),[200,400]);
    const final=await call('alpha-account',{op:'view'});
    assert.equal(final.world.economy.offers.length,0);assert.equal(final.world.me.coins,820);
    const buyerStocks=await Promise.all(['beta-account','gamma-account'].map(account=>call(account,{op:'view'})));
    assert.deepEqual(buyerStocks.map(v=>v.world.me.coins).sort(),[780,800]);
    assert.equal(c.world.me.id,buyerStocks[1].world.me.id);
    delete globalThis.__strateFixtureDB;
  });
  await test('Panning windows read one local snapshot and reveal only visible terrain and neighboring claims',async()=>{
    sqlite.exec('DELETE FROM voxel_worlds');
    const call=await routeClient();
    const alpha=await call('account-A',{op:'join',name:'Ada',faction:'aurore'});
    await call('account-B',{op:'join',name:'Ben',faction:'forge'});
    const initial=await storage.readWorld(db);
    const target=sample(initial.world,alpha.world.me);
    const focus=terrain.pointOnFace('top',target);
    const before=await call('account-A',{op:'region',focus});
    assert.equal(before.status,200);
    assert.equal(before.region.revision,initial.version);
    assert.equal(before.region.tiles.length,terrain.REGION_SIZE**2);
    const atTarget=region=>region.tiles.find(t=>t.u===focus.u&&t.v===focus.v);
    assert.equal(atTarget(before.region).depth,0);
    const mined=await call('account-A',{op:'action',focus,action:{type:'mine',block:target,requestId:'region-mine'}});
    assert.equal(mined.status,200);
    assert.equal(atTarget(mined.world.region).depth,1);
    const farKey=terrain.chunkKey(terrain.chunkAt(terrain.facePoint('top',terrain.SIDE-1000,terrain.SIDE-1000)));
    sqlite.prepare('INSERT INTO voxel_worlds (id,state,version) VALUES (?,?,0)').run('voxel:'+farKey,'{}');
    const home={...terrain.parcelFocus(alpha.world.me.base.home),depth:0};
    sqlite.exec('PRAGMA query_only=ON');
    try {
      const localSnapshot=await storage.readRegionSnapshot(db,focus);
      assert.equal(localSnapshot.version,mined.version);
      assert.equal(terrain.isRemoved(localSnapshot.world.planet,target),true);
      assert(!Object.hasOwn(localSnapshot.world.planet.chunks,farKey));
      const [next,owner,rival,buried,invalid]=await Promise.all([
        call('account-A',{op:'region',focus}),
        call('account-A',{op:'region',focus:home}),
        call('account-B',{op:'region',focus:home}),
        call('account-B',{op:'region',focus:{...home,depth:2}}),
        call('account-B',{op:'region',focus:{...home,u:terrain.SIDE}}),
      ]);
      for(const reply of [next,owner,rival,buried]){
        assert.equal(reply.status,200);
        assert.equal(reply.region.revision,mined.version);
        assert(!Object.hasOwn(reply,'world'));
        assert(!Object.hasOwn(reply,'token'));
      }
      assert.deepEqual(next.region,mined.world.region);
      assert(owner.region.tiles.every(tile=>tile.territory==='home'));
      assert(rival.region.tiles.every(tile=>tile.territory==='foreign'));
      assert(buried.region.tiles.every(tile=>tile.status==='unknown'&&tile.ore===null&&tile.territory===null));
      assert.equal(invalid.status,400);
      assert.equal((await storage.readWorld(db)).version,mined.version);
    } finally {
      sqlite.exec('PRAGMA query_only=OFF');
      delete globalThis.__strateFixtureDB;
    }
  });
  sqlite.close();
}finally{await fs.rm(tmp,{recursive:true,force:true});}
