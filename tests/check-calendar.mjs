import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../inktober-2026/',import.meta.url));
let now='2026-10-08T12:00:00Z',tick,failure=false,calls=[];
const CalendarDate=class extends Date {constructor(...args){super(...(args.length?args:[now]))}static now(){return new Date(now).getTime()}};
const plain=v=>JSON.parse(JSON.stringify(v));
let remote=JSON.parse(fs.readFileSync(root+'calendar.json','utf8'));
function browser(){
 const nodes=new Map(),registry=new Map(),events=new Map();
 const ids=new Set([...fs.readFileSync(root+'index.html','utf8').matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
 const element=tag=>({tag,value:'',checked:false,attrs:{},textContent:'',innerHTML:'',hidden:false,disabled:false,open:false,dataset:{},children:[],listeners:{},previousElementSibling:{textContent:''},classList:{add(){},toggle(){}},addEventListener(type,fn){this.listeners[type]=fn},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]},append(e){this.children.push(e)},replaceChildren(){this.children=[]},querySelector(s){const n=Number(s.match(/\d+/)?.[0]);return this.children.find(e=>+e.dataset.day===n)?.children.find(e=>e.tag==='button')},showModal(){this.open=true},close(){this.open=false;this.listeners.close?.()},focus(){},select(){},click(){return this.onclick?.()??this.listeners.click?.()}});
 const get=id=>{assert(ids.has(id),'Missing HTML element '+id);if(!nodes.has(id)){const e=element(id);let value='';Object.defineProperty(e,'value',{get:()=>value,set:v=>value=String(v)});nodes.set(id,e);}return nodes.get(id)};
 const add=(t,f)=>{const entries=events.get(t)||[];entries.push(f);events.set(t,entries)};
 const win={addEventListener:add,dispatchEvent:e=>{for(const f of events.get(e.type)||[])f(e)}};
 const ctx={window:win,URL,Date:CalendarDate,Intl,TextEncoder,TextDecoder,Uint8Array,btoa,atob,Event,AbortController,setTimeout,setInterval(fn){tick=fn;},clearTimeout,addEventListener:add,matchMedia:()=>({matches:true}),navigator:{clipboard:{writeText:async()=>{}}},localStorage:{getItem(){throw Error('Unexpected storage read')},setItem(){throw Error('Unexpected storage write')}},document:{documentElement:{classList:{toggle(){}}},getElementById:get,createElement:element,addEventListener:add,modelContext:{registerTool:t=>registry.set(t.name,t)}},fetch:async(url,init={})=>{
  calls.push({url,init});assert.equal(url,'/inktober-2026/calendar.json');assert(!init.method||init.method==='GET');assert.equal(init.credentials,'omit');assert.equal(init.cache,'no-store');
  if(failure)return Response.json({}, {status:503});return Response.json(remote);
 }};
 vm.createContext(ctx);for(const f of ['inspiration.js','metrics.js','github-store.js','transport.js','app.js'])vm.runInContext(fs.readFileSync(root+f,'utf8'),ctx,{filename:f});
 return {get,registry,ctx,win,events,async ready(){for(let i=0;i<100;i++){if(registry.get('read_calendar_availability').execute().loaded)return;await new Promise(r=>setTimeout(r,1));}throw new Error('not ready')}};
}
const a=browser();await a.ready();
const availability=()=>a.registry.get('read_calendar_availability').execute();
const door=n=>a.get('calendar').children[n-1].children[0];
assert.equal(availability().availableDays,8);assert.deepEqual(plain(availability().openedDays),[1,2,3,4,5,6,7,8]);
assert(door(2).className.includes('opened'));assert(door(8).className.includes('today'));assert(!door(9).className.includes('opened'));assert(door(9).disabled);
const count=calls.length;await a.registry.get('open_inktober_day').execute({day:2});assert.equal(calls.length,count);assert.equal(a.get('prompt-name').textContent,'Relique');assert(a.get('prompt-dialog').open);
assert.match((await a.registry.get('open_inktober_day').execute({day:9})).error,/disponible/);
await a.registry.get('open_inktober_day').execute({day:1});assert.equal(a.get('project-launch').href,'https://egalland.github.io/pomme/');assert.equal(a.get('project-code').href,'https://github.com/egalland/one-more-thing');
const initial=a.registry.get('read_inktober_statistics').execute();
assert.equal(initial.doneCount,6);assert.equal(initial.vibeTime.value,641);assert.equal(initial.dev.value,13530);assert.equal(initial.vibeCost.value,37392);assert.equal(initial.devCost.value,902000);
assert.equal(initial.vibeMin.value,425);assert.equal(initial.vibeMax.value,855);assert.equal(initial.devMin.value,9720);assert.equal(initial.devMax.value,17340);
assert.equal(initial.prompt.value,null);assert.equal(initial.chatgpt.value,null);assert(a.get('project-vibe-time').textContent.includes('3 h'));assert(a.get('project-dev-time').textContent.includes('80 h'));
assert.equal(a.win.githubCalendarStore.parse({version:1,days:[]}).settings.vibeRateCents,3500);
assert.throws(()=>a.win.githubCalendarStore.parse({version:1,days:[{day:1,vibeMinutes:20,vibeMinMinutes:30,vibeMaxMinutes:60}]}),/Fourchette/);
const historical=a.win.inktoberMetrics.calculate([{day:1,done:true,promptMinutes:30,chatgptMinutes:60,devMinutes:240}],{vibeRateCents:3500,devRateCents:4000});assert.equal(historical.vibeTime.value,90);assert.equal(historical.vibeCost.value,5250);assert.equal(historical.devCost.value,16000);
const explicit=a.win.inktoberMetrics.calculate([{day:1,done:true,vibeMinutes:10,promptMinutes:30,chatgptMinutes:60,devMinutes:null},{day:2,done:true,vibeMinutes:null,promptMinutes:null,chatgptMinutes:2,devMinutes:0}],{vibeRateCents:3500,devRateCents:4000});assert.equal(explicit.vibeTime.value,10);assert.equal(explicit.vibeTime.count,1);assert.equal(explicit.vibeCost.value,583);assert.equal(explicit.devCost.value,0);
for(const name of ['save_inktober_note','save_inktober_progress','save_inktober_rates'])assert(!a.registry.has(name));
await assert.rejects(a.win.inktoberTransport.api('/api/days/2',{opened:true}),/lecture seule/);
await assert.rejects(a.win.inktoberTransport.api('/api/settings',{vibeRateCents:1}),/lecture seule/);
remote.days.push({day:9,appTitle:'Secret future',note:'Future description',done:true,appUrl:'https://egalland.github.io/future/'});
await a.get('refresh-calendar').click();assert(!door(9).innerHTML.includes('Future description'));assert(!availability().progress[9]);
for(const [date,n] of [['2026-09-30T21:59:59Z',0],['2026-09-30T22:00:00Z',1],['2026-10-08T21:59:59Z',8],['2026-10-08T22:00:00Z',9],['2026-10-24T22:00:00Z',25],['2026-10-25T22:59:59Z',25],['2026-10-25T23:00:00Z',26],['2026-10-30T23:00:00Z',31],['2026-11-01T00:00:00Z',31]]){
 now=date;tick();assert.equal(availability().availableDays,n,date);assert.equal(a.get('calendar').children.filter(e=>e.children[0].className.includes('opened')).length,n,date);
 if(n<31)assert(door(n+1).disabled,date);if(n)assert(!door(n).disabled,date);
}
now='2026-10-08T12:00:00Z';tick();
remote.days[0].appTitle='Updated <title>';await a.get('refresh-calendar').click();assert(door(1).innerHTML.includes('Updated &lt;title&gt;'));assert(!door(1).innerHTML.includes('Updated <title>'));
a.get('tab-stats').click();assert.equal(a.get('view-stats').hidden,false);assert(a.get('stats-rates-note').textContent.includes('35,00'));assert(a.get('stats-rates-note').textContent.includes('40,00'));a.get('tab-stats').listeners.keydown({key:'ArrowRight',preventDefault(){}});assert.equal(a.get('view-calendar').hidden,false);
failure=true;await a.get('refresh-calendar').click();assert.equal(a.get('retry-load').hidden,false);failure=false;await a.get('retry-load').click();assert(availability().loaded);
for(const html of ['../index.html','index.html']){const source=fs.readFileSync(root+html,'utf8');assert(!/id="(?:github-login|github-token|connect-calendar|day-form|settings-form|tab-settings|view-settings|stats-settings)"/.test(source));assert(!source.includes('repository.js'));}
console.log('PASS: automatic Paris dates and DST, midnight update, locked future days, read-only transport, no login/storage/writes, public projects, refreshed content, estimated durations/ranges, fixed hourly rates and cent rounding, unknown duration handling, KPI totals, two tabs and error retry.');
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
