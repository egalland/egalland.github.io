import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../inktober-2026/',import.meta.url));
const CalendarDate=class extends Date {constructor(...args){super(...(args.length?args:['2026-10-05T12:00:00Z']))}static now(){return new Date('2026-10-05T12:00:00Z').getTime()}};
const plain=v=>JSON.parse(JSON.stringify(v));
let remote={version:1,days:[],settings:{vibeRateCents:null,devRateCents:null},updatedAt:null},sha=1,userId=31864638,failure=false,puts=0,apiCalls=[],storage=new Map();
const enc=v=>Buffer.from(JSON.stringify(v)).toString('base64');
const token='github_pat_'+('x'.repeat(30));
function browser(){
 const nodes=new Map(),registry=new Map(),events=new Map();
 const element=tag=>({tag,value:'',checked:false,attrs:{},textContent:'',innerHTML:'',hidden:false,disabled:false,open:false,dataset:{},children:[],listeners:{},previousElementSibling:{textContent:''},classList:{add(){},toggle(){}},addEventListener(type,fn){this.listeners[type]=fn},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]},append(e){this.children.push(e)},replaceChildren(){this.children=[]},querySelector(s){const n=Number(s.match(/\d+/)?.[0]);return this.children.find(e=>+e.dataset.day===n)?.children.find(e=>e.tag==='button')},showModal(){this.open=true},close(){this.open=false;this.listeners.close?.()},focus(){},select(){},click(){return this.onclick?.()??this.listeners.click?.()}});
 const get=id=>{if(!nodes.has(id)){const e=element(id);let value='';Object.defineProperty(e,'value',{get:()=>value,set:v=>value=String(v)});nodes.set(id,e);}return nodes.get(id)};
 const add=(t,f)=>{const entries=events.get(t)||[];entries.push(f);events.set(t,entries)};
 const win={addEventListener:add,dispatchEvent:e=>{for(const f of events.get(e.type)||[])f(e)}};
 const ctx={window:win,URL,Date:CalendarDate,Intl,TextEncoder,TextDecoder,Uint8Array,btoa,atob,Event,AbortController,setTimeout,setInterval(){},clearTimeout,addEventListener:add,matchMedia:()=>({matches:true}),navigator:{clipboard:{writeText:async()=>{}}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},document:{documentElement:{classList:{toggle(){}}},getElementById:get,createElement:element,addEventListener:add,modelContext:{registerTool:t=>registry.set(t.name,t)}},fetch:async(url,init={})=>{
  if(url==='/inktober-2026/calendar.json')return Response.json(remote);
  assert(String(url).startsWith('https://api.github.com/'),'No Sites/external request');assert.equal(init.credentials,'omit');apiCalls.push({url,method:init.method});
  const path=new URL(url).pathname;
  if(path==='/user')return Response.json({id:userId,login:userId===31864638?'egalland':'someone'});
  if(path==='/repos/egalland/egalland.github.io')return Response.json({permissions:{push:true}});
  if(path.endsWith('/contents/inktober-2026/calendar.json')){
   if(init.method==='PUT'){
    if(failure)return Response.json({}, {status:503});const body=JSON.parse(init.body);assert.equal(body.sha,String(sha));assert.equal(body.branch,'master');remote=JSON.parse(Buffer.from(body.content,'base64').toString('utf8'));puts++;sha++;return Response.json({commit:{html_url:'https://github.com/egalland/egalland.github.io/commit/test'}});
   }
   return Response.json({sha:String(sha),content:enc(remote)});
  }
  throw new Error('Unexpected request '+path);
 }};
 vm.createContext(ctx);for(const f of ['inspiration.js','metrics.js','github-store.js','transport.js','app.js'])vm.runInContext(fs.readFileSync(root+f,'utf8'),ctx,{filename:f});
 return {get,registry,ctx,win,async ready(){for(let i=0;i<100;i++){if(registry.get('read_calendar_availability').execute().loaded)return;await new Promise(r=>setTimeout(r,1));}throw new Error('not ready')},async login(){get('connect-calendar').click();get('github-token').value=token;await get('github-login-form').listeners.submit({preventDefault(){}});await this.ready()}};
}
const a=browser();await a.ready();assert(!a.win.inktoberTransport.connected);
await a.registry.get('open_inktober_day').execute({day:2});assert.equal(puts,0);assert(storage.has('inktober-2026-opened-v1'));
await assert.rejects(a.win.inktoberTransport.api('/api/days/2',{note:'no permission'}),/Connectez GitHub/);
userId=3;await a.login();assert(!a.win.inktoberTransport.connected);assert.match(a.get('github-login-status').textContent,/réservée/);assert.equal(a.get('github-token').value,'');
userId=31864638;await a.login();assert(a.win.inktoberTransport.connected);
await a.registry.get('save_inktober_progress').execute({day:2,appTitle:'Reliques épiques 🎃',note:'<b>Texte & note</b>',appUrl:'https://github.com/egalland/cactocalypse',done:true,promptMinutes:30,chatgptMinutes:60,devMinutes:240});
assert.equal(remote.days[0].appTitle,'Reliques épiques 🎃');assert.equal(remote.days[0].appUrl,'https://egalland.github.io/cactocalypse/');assert(!a.get('calendar').children[1].children[0].innerHTML.includes('<b>Texte'));assert(a.get('calendar').children[1].children[0].innerHTML.includes('&lt;b&gt;'));
await a.registry.get('save_inktober_rates').execute({vibeRateCents:3500,devRateCents:4000});assert.equal(a.registry.get('read_inktober_statistics').execute().vibeCost.value,5250);
const b=browser();await b.ready();assert.equal(b.registry.get('read_calendar_availability').execute().progress[2].appTitle,'Reliques épiques 🎃');assert(!b.win.inktoberTransport.connected);assert.equal(b.get('vibe-rate').disabled,true);
await b.login();remote.days.push({day:1,note:'Other device'});sha++;await b.registry.get('save_inktober_progress').execute({day:2,appTitle:'Merged title'});assert.equal(remote.days.find(r=>r.day===1).note,'Other device');
await assert.rejects(a.registry.get('save_inktober_progress').execute({day:2,appTitle:'Stale title'}),/changé ailleurs/);assert.equal(remote.days.find(r=>r.day===2).appTitle,'Merged title');
await b.registry.get('open_inktober_day').execute({day:2});b.get('day-note').value='Unsaved draft';b.get('day-note').listeners.input();failure=true;await assert.rejects(b.registry.get('save_inktober_note').execute({day:2,note:'Unsaved draft'}));assert.equal(b.get('day-note').value,'Unsaved draft');failure=false;
await assert.rejects(b.registry.get('save_inktober_progress').execute({day:2,appUrl:'javascript:alert(1)'}));
await assert.rejects(b.registry.get('save_inktober_progress').execute({day:2,devMinutes:-1}));
b.get('disconnect-github').click();assert(!b.win.inktoberTransport.connected);await assert.rejects(b.win.inktoberTransport.api('/api/settings',{vibeRateCents:1}));
assert([...storage.values()].every(v=>!v.includes(token)));assert(!JSON.stringify(remote).includes(token));
await assert.rejects(a.win.inktoberTransport.github('/repos/attacker/repo'),/non autorisée/);
console.log('PASS: public load, local opening, owner restriction, session-only credentials, Unicode commit/reload, repository links, KPI totals, concurrent merge/conflict, preserved failure draft, disconnect and write rejection.');
// Parallax: verify distinct scroll depth, smoothing stop, and immediate reduced-motion reset.
const vars=new Map(),handlers=new Map(),frames=new Map();let next=0,reduced=false;
const motion={get matches(){return reduced},addEventListener(t,f){handlers.set('motion',f)}};
const pointer={matches:true,addEventListener(){}};
const scene={classList:{add(){}}};const win={scrollY:0};
const add=(t,f)=>handlers.set(t,f);
const context={window:win,document:{hidden:false,documentElement:{style:{setProperty:(k,v)=>vars.set(k,v)}},querySelector:()=>scene,addEventListener:add},innerWidth:1200,innerHeight:800,matchMedia:q=>q.includes('reduced')?motion:pointer,addEventListener:add,requestAnimationFrame:f=>{frames.set(++next,f);return next},cancelAnimationFrame:id=>frames.delete(id),Image:class{decode(){return Promise.resolve()}}};
vm.runInNewContext(fs.readFileSync(root+'parallax.js','utf8'),context);
let time=0;const drain=()=>{for(let i=0;i<300&&frames.size;i++){const callbacks=[...frames.values()];frames.clear();time+=16;callbacks.forEach(f=>f(time))}assert.equal(frames.size,0)};
drain();win.scrollY=400;handlers.get('scroll')();drain();const far=parseFloat(vars.get('--far-scroll')),mid=parseFloat(vars.get('--mid-scroll')),near=parseFloat(vars.get('--near-scroll'));assert(far>40&&mid>far*1.5&&near>mid);handlers.get('pointermove')({clientX:1200,clientY:0,pointerType:'mouse'});drain();assert(parseFloat(vars.get('--parallax-x'))>.99);reduced=true;handlers.get('motion')();assert.equal(vars.get('--far-scroll'),'0px');assert.equal(vars.get('--parallax-x'),'0');handlers.get('scroll')();assert.equal(frames.size,0);
console.log('PASS: three distinct parallax depths, mouse movement, stable frame stop and reduced-motion reset.');
// App publication pipeline: actual client code against the GitHub API contract.
let installed='',pagesEnabled=false,appWrites=0,custom=false,reuse=false,dispatches=0;
a.ctx.fetch=async(url,init={})=>{
 if(url==='/inktober-2026/app-pages.yml')return new Response(fs.readFileSync(root+'app-pages.yml','utf8'));
 const path=new URL(url).pathname;
 if(path==='/repos/egalland/cactocalypse')return Response.json({owner:{id:31864638},default_branch:'main',archived:false});
 if(path.endsWith('/commits/main'))return Response.json({sha:'source-head',commit:{tree:{sha:'source-tree'}}});
 if(path.endsWith('/git/trees/source-tree'))return Response.json({tree:[{path:'index.html',type:'blob'}],truncated:false});
 if(path.endsWith('/contents/.github/workflows/inktober-pages.yml')){
  if(init.method==='PUT'){const body=JSON.parse(init.body);installed=Buffer.from(body.content,'base64').toString();assert(installed.includes('branches: ["main"]'));assert(installed.includes('persist-credentials: false'));appWrites++;return Response.json({commit:{sha:'workflow-head'}});}
  if(custom)return Response.json({content:Buffer.from('different workflow').toString('base64')});
  if(reuse)return Response.json({content:Buffer.from(installed).toString('base64')});return Response.json({}, {status:404});
 }
 if(path.endsWith('/pages')){
  if(init.method==='POST'){pagesEnabled=true;appWrites++;assert.equal(JSON.parse(init.body).build_type,'workflow');return Response.json({});}
  if(pagesEnabled)return Response.json({html_url:'https://egalland.github.io/cactocalypse/',build_type:'workflow'});return Response.json({}, {status:404});
 }
 if(path.endsWith('/dispatches')){dispatches++;return new Response(null,{status:204});}
 if(path.endsWith('/runs'))return Response.json({workflow_runs:reuse&&new URL(url).searchParams.get('per_page')==='1'?[{id:1}]:[{id:reuse?2:1,head_branch:'main',head_sha:'workflow-head',status:'completed',conclusion:'success',html_url:'https://github.com/egalland/cactocalypse/actions/runs/1'}]});
 throw new Error('Unexpected publisher path '+path);
};
vm.runInContext(fs.readFileSync(root+'repository.js','utf8'),a.ctx);
a.get('day-url').value='https://github.com/egalland/cactocalypse';await a.get('check-repository').click();assert.equal(a.get('publish-repository').hidden,false);
await a.get('publish-repository').click();for(let i=0;i<20&&a.get('repository-preview').hidden;i++)await new Promise(r=>setTimeout(r,1));assert.equal(a.get('repository-preview').href,'https://egalland.github.io/cactocalypse/');assert.equal(appWrites,2);
reuse=true;await a.get('check-repository').click();await a.get('publish-repository').click();for(let i=0;i<20&&a.get('repository-preview').hidden;i++)await new Promise(r=>setTimeout(r,1));assert.equal(dispatches,1);assert.equal(a.get('repository-preview').hidden,false);
custom=true;const priorWrites=appWrites;await a.get('check-repository').click();await a.get('publish-repository').click();assert.match(a.get('repository-status').textContent,/différent/);assert.equal(appWrites,priorWrites);
a.get('day-url').value='https://github.com/attacker/repository';await a.get('check-repository').click();assert.equal(a.get('publish-repository').hidden,true);
console.log('PASS: own-repository validation, Pages creation, workflow installation, completed publication preview, 204 dispatch/reuse and custom-workflow preservation.');
