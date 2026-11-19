import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'strate-camera-'));
try {
  for (const name of ['planet', 'planet-camera', 'region-stream', 'terrain-orders']) {
    const source = await fs.readFile('lib/' + name + '.ts', 'utf8');
    const result = ts.transpileModule(source, {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
    await fs.writeFile(path.join(dir, name+'.mjs'), result.outputText.replace(/from '(\.\/[^']+)'/g, "from '$1.mjs'"));
  }
  const get = name => import(pathToFileURL(path.join(dir, name+'.mjs')));
  const {SIDE}=await get('planet');
  const [g, {RegionStream}] = await Promise.all([get('planet-camera'), get('region-stream')]);
  const view = {w: 1100, h: 717}, pointer = {x: 716, y: 259};
  const almost = (a,b) => assert(Math.abs(a-b)<1e-8, a+' does not match '+b);
  function project(point, camera) {
    const unit = Math.min(view.w / (17*1.10), view.h / (17*.89))*camera.zoom;
    const u = point.u-camera.centerU, v = point.v-camera.centerV;
    const cos = Math.cos(camera.yaw), sin = Math.sin(camera.yaw);
    return {x:view.w/2+(u*cos-v*sin)*unit, y:view.h*.48+(u*sin+v*cos)*Math.sin(camera.pitch)*unit+point.d*Math.cos(camera.pitch)*unit};
  }
  for (const yaw of [-1.4,0,.62,2.65]) {
    for (const pitch of [.33,.7,1.28]) {
      const camera = {yaw,pitch,zoom:1.1,centerU:33.3,centerV:31.9};
      const point = {u:34.3,v:32.5,d:2};
      const prev = project(point,camera), delta = {x:121.7,y:-87.2};
      const moved = g.dragGround(camera,delta,view), next = project(point,moved);
      almost(next.x-prev.x,delta.x); almost(next.y-prev.y,delta.y);
      const anchored = g.zoomGround(camera,2.05,pointer,view), movedPointer = project(point,anchored);
      const ratio = anchored.zoom/camera.zoom;
      almost(movedPointer.x-pointer.x,ratio*(prev.x-pointer.x));
      almost(movedPointer.y-pointer.y,ratio*(prev.y-pointer.y));
    }
  }
  console.log('PASS Screen drag is one-to-one on rotated terrain and across block boundaries; pointer zoom holds its anchor.');
  assert(!g.dragStarted({x:10,y:10},{x:12,y:13}));
  assert(g.dragStarted({x:10,y:10},{x:14,y:13}));
  const center = {face:'east',u:323,v:508,depth:0};
  const wins = g.visibleWindows(center,{yaw:.62,pitch:.7,zoom:1,centerU:323.1,centerV:507.9},view);
  assert(wins.length>1 && wins.length<=25);
  assert.equal(new Set(wins.map(g.windowKey)).size,wins.length);
  for (const edge of [0,SIDE-1]) {
    const result = g.visibleWindows({...center,u:edge,v:edge},{yaw:-1,pitch:.7,zoom:.7,centerU:edge,centerV:edge},view);
    assert(result.every(f=>f.u>=0&&f.u<SIDE&&f.v>=0&&f.v<SIDE));
  }
  console.log('PASS Click slop, capped window selection and face limits.');
  const {blockedOrder, nearRelay, pickCycle, tileName} = await get('terrain-orders');
  const {facePoint} = await get('planet');
  const relay = {id:'ridge',focus:{face:'east',u:460,v:229,depth:0}};
  const mine = {point:facePoint('east',460,229),territory:'home',status:'solid',ore:'cuivre'};
  const other = {...mine,territory:'foreign'}, air = {...mine,status:'air',ore:null};
  const operator = {lastMine:820,cooldownMs:320,serverTime:1000,drillReady:true,squadReady:true};
  for (const kind of ['mine','drill','hauler']) {
    assert.equal(blockedOrder(kind,mine,operator,relay,false,false),'');
    assert(blockedOrder(kind,other,operator,relay,false,false));
  }
  assert.equal(blockedOrder('hauler',air,operator,undefined,false,false),'');
  assert(blockedOrder('mine',air,operator,undefined,false,false));
  assert(blockedOrder('mine',mine,operator,relay,false,true));
  assert.equal(blockedOrder('squad',mine,operator,nearRelay(mine,[relay]),false,false),'');
  const far = {...mine,point:facePoint('east',493,229)};
  assert(blockedOrder('squad',far,operator,nearRelay(far,[relay]),false,false));
  assert.equal(blockedOrder('inspect',other,null,undefined,true,true),'');
  assert.equal(tileName({...mine,status:'unknown',ore:'prisme'}),'Roche enfouie');
  assert.equal(pickCycle(operator,null).end,1140);
  assert(pickCycle(operator,{point:mine.point,ready:3100}).pending);
  console.log('PASS Context tools allow owner extraction, eligible transport and nearby squads; inspection conceals hidden ore and the pick uses its server cooldown.');
  const make = (focus, revision, ore='cuivre') => ({
    ...focus,depth:focus.depth??0,originU:g.regionOrigin(focus.u),originV:g.regionOrigin(focus.v),size:17,revision,
    tiles:[{u:focus.u,v:focus.v,depth:0,point:{x:1,y:2,z:3},ore,status:'solid',territory:null}],
  });
  const store = new RegionStream(async()=>null,()=>{});
  store.configure(center,[]);
  store.store(make(center,11,'ferrite'));
  store.store(make(center,9,'prisme'));
  const merged = store.combine(center,[center],make(center,8,'titane'));
  assert.equal(merged.tiles[0].ore,'ferrite');
  assert.equal(store.combine({...center,face:'west'},[{...center,face:'west'}],null).tiles.length,0);
  store.reset();
  console.log('PASS Old neighbor reads cannot restore mined blocks or cross faces.');
  const jobs = [];
  const stream = new RegionStream((f,signal)=>new Promise(resolve=>jobs.push({f,signal,resolve})),()=>{});
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const waitFor=async(predicate)=>{for(let i=0;i<100;i++){if(predicate())return;await sleep(10)}throw Error('Timed out waiting for stream');};
  stream.configure(center,wins);
  await waitFor(()=>jobs.length===2);
  await sleep(140);
  assert.equal(jobs.length,2);
  const underground={...center,depth:5};
  stream.configure(underground,[underground]);
  assert(jobs.slice(0,2).every(job=>job.signal.aborted));
  jobs[0].resolve(make(jobs[0].f,30)); jobs[1].resolve(make(jobs[1].f,31));
  await waitFor(()=>jobs.length===3);
  const next=make(underground,32,'titane');jobs[2].resolve(next);
  await waitFor(()=>stream.combine(underground,[underground],null).tiles.length===1);
  assert.equal(stream.combine(underground,[underground],null).tiles[0].ore,'titane');
  stream.reset();
  console.log('PASS Two parallel windows maximum; obsolete depth requests cancelled, late results ignored.');
} finally {
  await fs.rm(dir,{force:true,recursive:true});
}
