import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';

const dir=await fs.mkdtemp(path.join(os.tmpdir(),'strate-colonies-'));
try{
  const seen=new Set();
  async function compile(name){
    if(seen.has(name))return;
    seen.add(name);
    const source=await fs.readFile('lib/'+name+'.ts','utf8');
    const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
    const deps=[];
    const code=js.replace(/from ['"]\.\/([^'"]+)['"]/g,(_,id)=>{deps.push(id);return "from './"+id+".mjs'";});
    await fs.writeFile(path.join(dir,name+'.mjs'),code);
    await Promise.all(deps.map(compile));
  }
  await compile('playtester');
  const get=n=>import(pathToFileURL(path.join(dir,n+'.mjs')));
  const [bot,core,game,col,geo]=await Promise.all(['playtester','world','frontier','colonies','frontier-geography'].map(get));
  let seq=0;crypto.randomUUID=()=>{const x=createHash('sha256').update('strate-colonies-v1/'+seq++).digest('hex');return x.slice(0,8)+'-'+x.slice(8,12)+'-4'+x.slice(13,16)+'-a'+x.slice(17,20)+'-'+x.slice(20,32);};
  const start=2_000_000_000_000;
  const w=core.makeWorld(start);
  bot.ensurePlaytester(w,start);
  const log=[],outcomes=new Set();
  // A poisoned historical record catches any attempt to read the diagnostic
  // journal while deciding. The simulation may append fresh events as usual.
  const unreadable=new Proxy({},{get(){throw Error('A strategy read the diagnostic journal');}});
  for(let sec=5;sec<=1200;sec+=5){
    w.auditPending=[unreadable];
    game.advanceFrontier(w,start+sec*1000,bot.tickPlaytester);
    for(const entry of w.auditPending.slice(1)){
      outcomes.add(entry.action);
      if(entry.action.startsWith('guild')||entry.action.startsWith('colony'))log.push(entry);
      if(entry.action==='logistique/manutention')assert(entry.context.transferts.every(t=>t.quantite>0&&t.ouvrier&&t.position.face));
    }
    w.auditPending=[];
  }
  assert.equal(w.players.length,8);
  for(const action of ['logistique/manutention','exploration/filons','recherche/terminee','bilan-minute'])assert(outcomes.has(action),'Résultat absent du journal : '+action);
  const atlas=new Map(geo.planetGeology().map(d=>[d.id,d]));
  assert.equal(new Set([...atlas.values()].map(d=>d.point.face)).size,6);
  for(const depot of Object.values(w.frontier.deposits)){
    if(!atlas.has(depot.id)){assert(depot.safe);continue;}
    assert.deepEqual(atlas.get(depot.id).point,depot.point);
    assert.equal(atlas.get(depot.id).ore,depot.ore);
  }
  assert.equal(new Set(bot.testAgents(w).map(a=>a.doctrine)).size,8);
  assert(w.players.every(p=>p.ai));
  assert(bot.testAgents(w).every(a=>a.errors===0));
  const view=col.colonizationView(w);
  assert.equal(view.guilds.length,2);
  assert(view.guilds.every(g=>g.members.includes(g.founder)));
  assert(Object.keys(view.memberships).length>2);
  for(const name of ['Cendre','Grès']){
    const solo=w.players.find(p=>p.name.endsWith(name));
    assert(!view.memberships[solo.id]);
  }
  for(const action of ['guildCreate/','guildAccept/','guildDecline/','colony/found','colony/founded'])
    assert(log.some(e=>e.action===action),'Missing event '+action);
  assert(view.outposts.length>=2);
  assert.deepEqual(col.colonizationView(JSON.parse(JSON.stringify(w))),view);
  for(const a of view.outposts){
    assert(w.players.find(p=>p.id===a.owner).expedition.deposits.includes(a.depositId));
    for(const b of view.outposts)if(a!==b)assert(geo.range(a.point,b.point)>=360);
  }
  const actor=w.players.find(p=>!view.memberships[p.id]);
  const saved=JSON.stringify(col.colonizationView(w));
  assert.throws(()=>game.actFrontier(w,actor,{type:'colony',op:'found',deposit:'not-seen',requestId:crypto.randomUUID()},start+1200000),/Reconnaissez/);
  assert.equal(JSON.stringify(col.colonizationView(w)),saved);
  const orders=log.filter(e=>e.action==='colony/found');
  for(const order of orders){
    const {before,after}=order.context;
    assert(before.credits-after.credits>=38&&before.iron-after.iron>=7&&before.copper-after.copper>=2);
    assert(order.context.order.reason.length>0);
  }
  const member=w.players.find(p=>p.expedition.guild&&!view.guilds.some(g=>g.founder===p.id));
  const copy=structuredClone(w),stranded=copy.players.find(p=>p.id===member.id);
  // Lost links are tested explicitly; the normal run's map is not rewritten.
  const otherFace=stranded.expedition.home.face==='top'?'bottom':'top';
  stranded.expedition.home={face:otherFace,u:0,v:0,depth:0};stranded.expedition.towns=[];
  const decision=col.guildDecision(copy,stranded,col.COLONISTS[bot.testAgents(copy).find(s=>s.player===member.id).slot],start+1200000);
  assert.equal(decision?.action.type,'guildLeave');
  game.actFrontier(copy,stranded,{...decision.action,requestId:crypto.randomUUID()},start+1200000);
  assert(!col.colonizationView(copy).memberships[member.id]);
  const trial=core.makeWorld(start),builder=core.join(trial,'Atelier témoin','test','veille',start);
  game.ensureFrontier(trial,start);
  const home=builder.expedition.home;
  const point={...home,u:home.u>2048?home.u-800:home.u+800};
  const depositId='charter-test';
  trial.frontier.deposits[depositId]={id:depositId,point,ore:'ferrite',total:1000,remaining:1000,guards:0,maxGuards:0,respawn:0};
  builder.expedition.deposits.push(depositId);
  const getId=()=>crypto.randomUUID();
  const build={type:'factory',op:'place',kind:'belt',cells:[{face:point.face,x:Math.floor(point.u/8),y:Math.floor(point.v/8),dir:1}]};
  assert.throws(()=>game.actFrontier(trial,builder,{...build,requestId:getId()},start),/avant-poste/);
  const shipment={type:'colony',op:'found',deposit:depositId,requestId:getId()};
  game.actFrontier(trial,builder,shipment,start);
  const credits=builder.coins;
  game.actFrontier(trial,builder,shipment,start);
  assert.equal(builder.coins,credits);
  assert.equal(col.colonizationView(trial).expeditions.length,1);
  const due=col.colonizationView(trial).expeditions[0].trip.due;
  assert(due>start+60000);
  game.advanceFrontier(trial,due-5000);
  assert.equal(col.colonizationView(trial).outposts.length,0);
  game.advanceFrontier(trial,due+5000);
  assert.equal(col.colonizationView(trial).outposts.length,1);
  assert.equal(col.colonizationView(trial).expeditions.length,0);
  game.actFrontier(trial,builder,{...build,requestId:getId()},due+5000);
  assert.equal(builder.expedition.factory.pieces.at(-1).kind,'belt');
  assert.throws(()=>game.actFrontier(trial,builder,{...shipment,requestId:getId()},due+5000),/occupé/);
  console.log('Simulation locale, 20 minutes : '+w.players.length+' IA, '+view.outposts.length+' avant-postes implantés, '+view.guilds.length+' guildes, '+Object.keys(view.memberships).length+' affiliés. Départs payés, délai physique, refus, indépendance, départ volontaire et relecture vérifiés.');
}finally{await fs.rm(dir,{recursive:true,force:true});}
