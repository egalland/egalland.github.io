import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

async function start(file) {
  const process=spawn(globalThis.process.execPath,['server.mjs'],{env:{...globalThis.process.env,BODYOS_DEMO_DB:file,PORT:'0'},stdio:['ignore','pipe','pipe']});
  let log='';
  const deadline=AbortSignal.timeout(12000);
  while(!log.includes('\n')) log+=String((await once(process.stdout,'data',{signal:deadline}))[0]);
  const url=new URL(log.match(/http:\/\/[^\s]+/)[0]);
  const headers={Origin:url.origin,'Content-Type':'application/json'};
  const exchange=await fetch(url.origin+'/session',{method:'POST',headers,body:JSON.stringify({code:decodeURIComponent(url.hash.slice(6))})});
  assert.equal(exchange.status,200);
  const cookie=exchange.headers.get('set-cookie').split(';')[0];
  return {origin:url.origin,headers:{...headers,Cookie:cookie},stop:async()=>{const exited=once(process,'exit');process.kill();await exited;}};
}

test('isolated demo starts blank, rejects foreign access, saves every domain and persists locally', {timeout:30000},async()=>{
  const directory=await mkdtemp(join(tmpdir(),'bodyos-demo-'));
  const file=join(directory,'test.sqlite');let app=await start(file);
  try {
    const get=async()=>{const r=await fetch(app.origin+'/api/bodyos',{headers:app.headers});assert.equal(r.status,200);return r.json();};
    const act=async(action,fields,expected=200)=>{const r=await fetch(app.origin+'/api/bodyos',{method:'POST',headers:app.headers,body:JSON.stringify({action,...fields})});const json=await r.json();assert.equal(r.status,expected,JSON.stringify(json));return json;};
    assert.equal((await fetch(app.origin+'/api/bodyos')).status,401);
    assert.equal((await fetch(app.origin+'/api/bodyos',{method:'POST',headers:{...app.headers,Origin:'http://localhost.invalid'},body:'{}'})).status,403);
    assert.equal((await fetch(app.origin+'/db/schema.sql',{headers:app.headers})).status,404);
    const blank=await get();assert.equal(blank.profile.name,'Alex Démo');
    for(const value of Object.values(blank)) if(Array.isArray(value))assert.equal(value.length,0);
    const sqlite=new DatabaseSync(file,{readOnly:true});
    const tables=sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    assert.equal(tables.length,18);
    for(const {name} of tables){const count=sqlite.prepare('SELECT count(*) AS n FROM "'+name+'"').get().n;assert.equal(count,['profiles','app_settings'].includes(name)?1:0,name);}
    sqlite.close();
    await act('save-log',{logDate:'2000-01-01',steps:1234});
    await act('save-log',{logDate:'2000-01-01',steps:1500});
    await act('add-measurement',{measuredAt:'2000-01-01',waistCm:70},201);
    await act('add-activity',{activityDate:'2000-01-01',activityType:'Marche test',category:'Marche',durationMinutes:10},201);
    const food=await act('add-food',{name:'Aliment test',category:'Test',kcalPer100g:25},201);
    await act('add-supplement',{name:'Article test',dose:'Une unité',timing:'Test'},201);
    const task=await act('add-task',{title:'Tâche test',domain:'Test',recurrence:'daily'},201);
    await act('set-task-status',{taskId:task.task.id,taskDate:'2000-01-01',status:'done'});
    const item=await act('add-produce',{name:'Légume test',defaultPricePerKg:2,effectiveAt:'2000-01-01'},201);
    await act('add-harvest-batch',{harvestDate:'2000-01-02',entries:[{produceId:item.produce.id,weightKg:2,priceMode:'catalog'}]},201);
    const program=await act('add-program',{name:'Programme test'},201);
    const day=await act('add-program-day',{programId:program.program.id,name:'Jour test'},201);
    await act('add-program-exercise',{dayId:day.day.id,catalogKey:'bench-barbell',name:'Développé couché barre',targetSets:2},201);
    const session=await act('start-strength-session',{programDayId:day.day.id,sessionName:'Séance test'},201);
    await act('save-strength-set',{sessionId:session.session.id,exerciseName:'Exercice test',setIndex:1,reps:6,weightKg:10});
    await act('finish-strength-session',{sessionId:session.session.id,durationSeconds:600});
    const state=await get();assert.equal(state.logs.length,1);assert.equal(state.logs[0].steps,1500);
    assert.equal(state.strengthSessions[0].totalVolumeKg,60);assert.equal(state.harvests.length,1);
    assert.equal(state.tasks.length,1);assert.equal(state.measurements.length,1);
    await act('delete-food',{id:food.food.id});assert.equal((await get()).foods.length,0);
    const oldCookie=app.headers.Cookie;await app.stop();app=await start(file);
    assert.equal((await fetch(app.origin+'/api/bodyos',{headers:{Cookie:oldCookie}})).status,401);
    assert.equal((await get()).logs[0].steps,1500);
  } finally {await app.stop();await rm(directory,{recursive:true,force:true});}
});
