import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const origin='https://egalland.github.io';
const calendar=JSON.parse(fs.readFileSync(root+'inktober-2026/calendar.json'));
const registry=JSON.parse(fs.readFileSync(root+'inktober-2026/projects.json')).projects;
const estimates=JSON.parse(fs.readFileSync(root+'inktober-2026/metrics-sources.json')).projects;
function page(route){return fs.readFileSync(path.join(root,route,'index.html'),'utf8')}
function checkRedirect(route,target){
 const source=page(route);
 assert(source.includes('rel="canonical"'),route+' canonical');
 const script=source.match(/<script>(.*?)<\/script>/s)?.[1];assert(script,route+' redirect script');
 let actual;
 const location={origin,search:'?room=salon%20test&x=1',hash:'#exemple',replace(value){actual=value}};
 vm.runInNewContext(script,{URL,location});
 const wanted=new URL(target,origin);wanted.search=location.search;wanted.hash=location.hash;
 assert.equal(actual,wanted.href,route+' query and hash');
 assert(fs.existsSync(path.join(root,target,'index.html')),route+' target exists');
}
const aliases={pomme:'one-more-thing',miniature:'micro-habitudes',cactus:'cactocalypse',claque:'ghost-slap',ogre:'le-garde-du-pont',compost:'carnet-du-compost',belier:'astre-brut',mystique:'archives-du-voile'};
for(const [old,current] of Object.entries(aliases))checkRedirect(old,'/'+current+'/');
assert.equal(registry.length,calendar.days.length);
for(const row of calendar.days){
 const project=registry.find(p=>p.day===row.day);assert(project,row.appTitle+' registry');
 if(row.appUrl.startsWith(origin+'/')){
  const route=new URL(row.appUrl).pathname;
  assert.equal(route,'/'+project.path+'/');
  assert(fs.existsSync(path.join(root,route,'index.html')),row.appTitle+' page exists');
  checkRedirect(String(row.day).padStart(2,'0'),route);
  if(project.hosting==='github-pages')assert(!/http-equiv="refresh"/i.test(page(route)),row.appTitle+' is autonomous');
 }else{assert.equal(project.hosting,'server');assert(project.hostingReason,row.appTitle+' hosting reason');}
}
for(const slug of ['atelier-heros','priorites-fragiles']){
 const source=page(slug);
 for(const match of source.matchAll(/(?:src|href)="([^"#]+)"/g)){
  const value=match[1];if(/^(?:https?:|data:)/.test(value))continue;
  const url=new URL(value,origin+'/'+slug+'/');
  assert(fs.existsSync(path.join(root,url.pathname)),slug+' dependency '+value);
 }
 const js=fs.readFileSync(root+slug+'/app.js','utf8');assert(js.includes('localStorage'));
 assert(!/fetch\(['"]\/api\//.test(js),slug+' no server API');
}
const catalog=JSON.parse(fs.readFileSync(root+'atelier-heros/assets/body-catalog.json'));
for(const body of catalog)assert(fs.existsSync(root+'atelier-heros/assets/'+body.file),body.file);
for(const item of estimates){
 const row=calendar.days.find(r=>r.day===item.day);
 assert.equal(row.vibeBasis,'estimated');assert.equal(row.vibeObservedSeconds,null);
 assert.equal(row.vibeMinutes,item.vibeMinutes);assert.equal(row.devMinutes,item.developerHours*60);
 assert(item.evidence&&item.scope);
}
console.log(`PASS: ${calendar.days.length} registry entries, named routes, historical redirects with query/hash, autonomous apps, sprite dependencies and estimate provenance.`);
