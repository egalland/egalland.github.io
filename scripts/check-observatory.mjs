import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';

const dir=await fs.mkdtemp(path.join(os.tmpdir(),'strate-observatory-'));
const sql=new DatabaseSync(':memory:');
const realNow=Date.now;
let now=2_000_000_000_000;
Date.now=()=>now;
try {
  const seen=new Set();
  async function compile(file,name){
    if(seen.has(name))return;
    seen.add(name);
    const source=await fs.readFile(file,'utf8');
    const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
    const deps=[];
    const code=js.replace(/import \{ env \} from 'cloudflare:workers';/,"const env=globalThis.observerTestEnv;")
      .replaceAll('import.meta.env.DEV','false')
      .replace(/from ['"](?:\.\/|@\/lib\/)([^'"]+)['"]/g,(_,id)=>{deps.push(id);return "from './"+id+".mjs'";});
    await fs.writeFile(path.join(dir,name+'.mjs'),code);
    await Promise.all(deps.map(id=>compile('lib/'+id+'.ts',id)));
  }
  await Promise.all([compile('app/api/frontier/route.ts','observe'),compile('app/api/game/route.ts','retired')]);
  for(const file of (await fs.readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort())sql.exec(await fs.readFile('drizzle/'+file,'utf8'));
  class Statement {
    constructor(sqlText,args=[]){this.sqlText=sqlText;this.args=args;}
    bind(...args){return new Statement(this.sqlText,args);}
    first(){return sql.prepare(this.sqlText).get(...this.args);}
    all(){return {results:sql.prepare(this.sqlText).all(...this.args)};}
    run(){return {meta:sql.prepare(this.sqlText).run(...this.args)};}
  }
  const db={prepare:s=>new Statement(s),batch(items){sql.exec('BEGIN');try{const r=items.map(s=>s.run());sql.exec('COMMIT');return r;}catch(e){sql.exec('ROLLBACK');throw e;}}};
  const owner='owner@example.invalid',digest=createHash('sha256').update(owner).digest('hex');
  globalThis.observerTestEnv={DB:db,STRATE_OWNER_EMAIL_SHA256:digest};
  const get=n=>import(pathToFileURL(path.join(dir,n+'.mjs')));
  const [route,retired,access,store,audit]=await Promise.all(['observe','retired','observer-access','world-store','activity-journal'].map(get));
  const count=table=>sql.prepare('SELECT COUNT(*) n FROM '+table).get().n;
  async function call(body,email=owner,options={}){
    const request=new Request((options.origin??'https://test.invalid')+'/api/frontier',{method:'POST',
      headers:{'Content-Type':'application/json',...(email?{'oai-authenticated-user-email':email}:{}),...options.headers},body:JSON.stringify(body)});
    const res=await route.POST(request);
    return {status:res.status,body:await res.json()};
  }
  for(const op of ['observe','journal','join','action','view']){
    assert.equal((await call({op},'')).status,403);
    assert.equal((await call({op},'visitor@example.invalid')).status,403);
  }
  assert.equal((await call({op:'observe'},'',{origin:'http://127.0.0.1'})).status,403);
  assert.equal(await access.canObserve(new Request('http://127.0.0.1'),undefined,true),true);
  assert.equal(await access.canObserve(new Request('https://example.invalid'),undefined,true),false);
  assert.equal(await access.canObserve(new Request('https://example.invalid',{headers:{'oai-authenticated-user-email':owner}}),undefined),false);
  assert.equal((await call({op:'observe'},owner,{headers:{'Sec-Fetch-Site':'cross-site'}})).status,403);
  assert.equal((await call({op:'observe',speed:99})).status,400);
  for(const op of ['join','view','action','region','poll']) {
    assert.equal((await call({op})).status,403);
    assert.equal((await retired.POST(new Request('https://test.invalid/api/game',{method:'POST',body:JSON.stringify({op})}))).status,410);
  }
  assert.equal(count('voxel_worlds'),0);
  assert.equal((await call({op:'journal'})).body.entries.length,0);
  assert.equal(count('voxel_worlds'),0);
  const requests=await Promise.all([call({op:'observe'}),call({op:'observe'},owner.toUpperCase())]);
  for(const result of requests){assert.equal(result.status,200);assert.equal(result.body.view.agents.length,8);}
  const first=requests[0].body,view=first.view;
  assert.equal(view.speed,4);assert.equal(view.latest.length,8);assert.equal(count('game_activity'),8);
  assert(view.latest.every(e=>e.kind==='ai'&&!('context' in e)));
  assert.equal(view.factions.reduce((n,f)=>n+f.members,0),8);
  const baseline=await store.readWorld(db);
  assert(baseline.world.players.every(p=>p.ai));
  for(const p of baseline.world.players)assert(!JSON.stringify(view).includes(p.token));
  const impostor=await call({op:'journal',token:baseline.world.players[0].token},'',{headers:{'oai-authenticated-user-id':baseline.world.players[0].id}});
  assert.equal(impostor.status,403);
  const selected=await call({op:'observe',watchAI:view.agents[7].id});
  assert.equal(selected.body.view.focus.me.id,view.agents[7].id);
  assert.equal(selected.body.version,first.version);
  const speed=await call({op:'observe',speed:12});
  assert.equal(speed.body.view.speed,12);
  assert.equal((await store.readWorld(db)).version,first.version+1);
  now+=5000;
  let advanced=(await call({op:'observe'})).body.view;
  assert(advanced.time>view.time && advanced.time<=view.time+60000);
  while(advanced.simulationBehind>=5000) advanced=(await call({op:'observe'})).body.view;
  const snap=await store.readWorld(db),actor=snap.world.players[0],enemies=snap.world.players[1];
  actor.coins=1234;
  actor.expedition.army.hull=0;actor.expedition.turrets=2;
  actor.expedition.stores['fixture-shop']={ferrite:3,cuivre:2,titane:0,prisme:0};
  actor.economy.refined.acier=7;
  for(let i=0;i<75;i++)audit.appendActivity(snap.world,actor,'progress','fixture/lookup','Mesure '+i,{index:i},advanced.time,'tied-'+i);
  audit.appendActivity(snap.world,enemies,'progress','fixture/archive','Ancienne partie',{},view.time,'old');
  snap.world.auditPending.at(-1).generation='archived-fixture';
  audit.appendActivity(snap.world,actor,'command','fixture/human','Human fixture',{},view.time,'human');
  snap.world.auditPending.at(-1).kind='human';
  assert(await store.saveWorld(db,snap));
  const ranked=(await call({op:'observe'})).body.view;
  const a=ranked.agents.find(a=>a.id===actor.id);
  assert.equal(a.power,36);
  assert.equal(a.wealth,1234+actor.inventory.ferrite+actor.inventory.cuivre*4+3+2*4+7*7);
  for(const f of ranked.factions)for(const key of ['credits','wealth','power','territories','research']) {
    assert.equal(f[key],ranked.agents.filter(a=>a.faction===f.id).reduce((n,a)=>n+a[key],0));
  }
  const query={actor:actor.id,category:'progress',search:'fixture/lookup'};
  const page=(await call({op:'journal',query})).body;
  const next=(await call({op:'journal',query:{...query,cursor:page.next}})).body;
  assert.equal(page.entries.length,60);assert.equal(next.entries.length,15);assert.equal(next.next,null);
  assert.equal(new Set([...page.entries,...next.entries].map(e=>e.id)).size,75);
  assert(page.entries.every(e=>e.context.index>=0));
  assert(page.generations.includes('archived-fixture'));
  const archive=(await call({op:'journal',query:{generation:'archived-fixture'}})).body;
  assert.equal(archive.entries.length,1);assert.equal(archive.entries[0].actor,enemies.id);
  const human=(await call({op:'journal',query:{kind:'human',search:'fixture/human',generation:'archive'}})).body;
  assert.equal(human.entries.length,0);
  assert.equal((await call({op:'journal',query:{search:'é'.repeat(79)}})).status,200);
  now+=6*3600000;
  const resumed=(await call({op:'observe'})).body.view;
  assert(resumed.activity.skippedMs>0);
  assert(resumed.activity.simulatedMs-ranked.activity.simulatedMs<=48*5000);
  assert.equal(resumed.activity.lastSkip.to-resumed.activity.lastSkip.from,resumed.activity.skippedMs);
  const following=(await call({op:'observe'})).body.view;
  assert.equal(following.activity.skippedMs,resumed.activity.skippedMs);
  console.log('PASS Owner-only observation, fail-closed identity, retired command routes, AI-token isolation and journal-only reads.');
  console.log('PASS Eight autonomous camps after concurrent starts, stable selection, persisted speed, bounded simulation clock and authentic faction holdings.');
  console.log('PASS Owner-only chronological ledger, exact generation/actor/action filters and exclusive pagination through 75 tied events.');
} finally {
  Date.now=realNow;
  delete globalThis.observerTestEnv;
  sql.close();
  await fs.rm(dir,{recursive:true,force:true});
}
