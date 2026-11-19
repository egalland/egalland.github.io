import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,buyObject,advance,acceptOrder,setIdlePreset,setIdleMode,setProjectDraft,compatiblePrinters,setPrintMode,printModeFor,printers,specFor,PRINT_MODES,exportSave,importSave,shipOrder,launchWebsite,stockNeeds} from '../dist/model.js';
import {makeRecipe,STUDIO_TEMPLATES} from '../dist/product-lab.js';
import {normalizeLife} from '../dist/lifestyle.js';
import {IdleClock} from '../dist/idle-clock.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function setup(seed=887){const s=createState(seed);buyObject(s,'fdm',1,1);return s;}
function closeChannels(s){s.settings.useEtsy=false;s.settings.useLocal=false;s.settings.useSite=false;}
function finishPrototype(s){setIdleMode(s,'none');for(let i=0;i<5&&!s.studio.products.length;i++)advance(s,1440);assert.equal(s.studio.products.length,1);}

test('three autonomous months reconcile cash, stock, invoices, maintenance and owner hours',()=>{
 const s=setup();buyObject(s,'rack',2,1);buyObject(s,'bench',2,2);buyObject(s,'packing',4,2);setIdlePreset(s);
 for(let month=0;month<3;month++)advance(s,30*1440);
 assert.ok(s.metrics.completed>10);assert.ok(s.cash>0&&s.cash<20000);near(s.cash,1500+s.cashLedger.reduce((n,e)=>n+e.amount,0));
 assert.ok(s.inventory.every(l=>l.grams>=0));assert.ok(s.daily.every(d=>d.human<=8+1e-8));assert.ok(s.daily.filter(d=>(d.day-1)%7>=5).every(d=>d.human===0));
 assert.equal(printers(s).length,1);assert.ok(s.studio.products.length<=3);assert.ok(s.energy.bills.length>=2);assert.ok(s.cashLedger.some(e=>e.kind==='energy'&&e.amount<0));
 assert.ok(s.cashLedger.some(e=>e.kind==='stock'));assert.ok(s.books.some(e=>e.kind==='materials'&&e.amount>0));
});

test('idle supplier orders group missing colours and count incoming stock without duplicate orders',()=>{
 const s=setup();s.orders[1].colorId='sage';s.orders[2].material='petg';for(const o of s.orders)acceptOrder(s,o.id);s.settings.autoRestock=true;
 advance(s,1);assert.equal(s.supplies.length,2);assert.equal(new Set(s.supplies.map(x=>x.batchId)).size,1);assert.equal(s.cashLedger.filter(x=>x.kind==='logistics').length,1);near(s.cashLedger.find(x=>x.kind==='logistics').amount,-4.9);assert.ok(stockNeeds(s).every(n=>n.missing===0));
 const cash=s.cash;advance(s,29);near(s.cash,cash);assert.equal(s.supplies.length,2);
});

test('idle procurement preserves the configured reserve and telework administrative budget',()=>{
 const s=setup();s.cash=s.settings.reserve+5;s.orders[1].colorId='sage';acceptOrder(s,s.orders[1].id);s.settings.autoRestock=true;advance(s,1);assert.equal(s.supplies.length,0);assert.ok(s.cash>=s.settings.reserve);
 const r=setup(43);r.life=normalizeLife({configured:true,mode:'job',remoteBudget:9});r.time=2*1440+540;setIdlePreset(r);advance(r,180);assert.ok(r.dayStats.remoteMinutes<=9);assert.ok(r.dayStats.humanMinutes<=9);
});

test('orders must fit the actual build volume before the idle accepts them',()=>{
 const s=setup();const wide=s.orders[0];wide.dimensions=[200,130,65];assert.equal(compatiblePrinters(s,wide).length,0);setIdlePreset(s);advance(s,1);assert.equal(wide.status,'request');
 const a1=buyObject(s,'a1',2,1).object;assert.deepEqual(compatiblePrinters(s,wide).map(m=>m.id),[a1.id]);advance(s,30);assert.notEqual(wide.status,'request');
});

test('slicing estimates vary material, supports, purge and dimensions while conserving total grams',()=>{
 const product=STUDIO_TEMPLATES[0],variants=[];for(const value of [.01,.4,.95]){const recipe=makeRecipe(product,()=>value);near(recipe.total,recipe.part+recipe.supports+recipe.waste);assert.ok(recipe.waste>=3);assert.ok(recipe.hours>0);variants.push(recipe.total);}
 assert.equal(new Set(variants).size,3);const starter=makeRecipe(product,()=>.5,true);assert.equal(starter.total,product.grams);
});

test('print profiles change actual run time, quality and risk, and cannot change during a job',()=>{
 const runs={};for(const mode of ['draft','fine']){const s=setup(51);closeChannels(s);s.settings.autoQuality=false;const m=printers(s)[0],o=s.orders[0];o.status='queued';assert.ok(setPrintMode(s,m.id,mode).ok);advance(s,10);assert.equal(m.modeAtStart,mode);assert.equal(o.status,'printing');runs[mode]=m.total;assert.equal(setPrintMode(s,m.id,'standard').ok,false);}
 assert.ok(runs.fine>runs.draft*1.5);assert.ok(PRINT_MODES.fine.failure<PRINT_MODES.draft.failure);assert.ok(PRINT_MODES.fine.quality>PRINT_MODES.draft.quality);
 const s=setup(),m=printers(s)[0],o=s.orders[0];o.minQuality=.99;assert.equal(printModeFor(s,m,o),'fine');s.settings.autoQuality=false;assert.equal(printModeFor(s,m,o),null);
});

test('research requires owner time, a real printed prototype and finishing without invented sales',()=>{
 const s=setup(512);closeChannels(s);s.orders=[];setIdleMode(s,'research');advance(s,119);assert.equal(s.orders.length,0);assert.equal(s.studio.progress.research,119);advance(s,1);assert.equal(s.orders.length,1);const o=s.orders[0];assert.equal(o.isPrototype,true);assert.equal(s.stock.pla,150);setIdleMode(s,'none');advance(s,10);assert.equal(o.status,'printing');near(s.stock.pla,105);printers(s)[0].failRoll=1;
 finishPrototype(s);assert.equal(s.studio.products[0].origin,'licensed');assert.equal(s.metrics.completed,0);assert.equal(s.reviews.length,0);assert.equal(s.books.filter(b=>b.kind==='revenue').length,0);assert.ok(printers(s)[0].runHours>=2.2-1e-7);assert.ok(s.cash<1256);
});

test('an original project keeps its chosen name and price after actual CAD and prototype work',()=>{
 const s=setup(514);closeChannels(s);s.orders=[];setProjectDraft(s,'Mon support de jardin',47);advance(s,419);assert.equal(s.studio.products.length,0);advance(s,1);assert.ok(s.studio.pending);setIdleMode(s,'none');finishPrototype(s);const p=s.studio.products[0];assert.equal(p.origin,'original');assert.equal(p.name,'Mon support de jardin');assert.equal(p.price,47);assert.equal(importSave(exportSave(s)).studio.products[0].price,47);
});

test('client preparation interrupts downtime without losing research progress',()=>{
 const s=setup();closeChannels(s);setIdleMode(s,'research');advance(s,30);assert.equal(s.studio.progress.research,30);acceptOrder(s,s.orders[0].id);advance(s,1);assert.equal(s.worker.kind,'design');assert.equal(s.studio.progress.research,30);
});

test('disabled channels generate no leads; Etsy receives neither services nor licensed third-party models',()=>{
 const stopped=setup();stopped.orders=[];stopped.website.stage='live';closeChannels(stopped);advance(stopped,30*1440);assert.equal(stopped.orders.length,0);
 const s=setup(418);s.orders=[];s.studio.products=STUDIO_TEMPLATES.map(p=>({...p}));s.settings.useLocal=false;s.settings.useSite=false;advance(s,60*1440);assert.ok(s.orders.length>5);assert.ok(s.orders.every(o=>o.channel==='etsy'&&o.origin==='original'&&o.salesKind==='catalogue'));
});

test('direct clients collect on a weekday without a shipping fee or platform commission',()=>{
 const s=setup(15);closeChannels(s);const o=s.orders[2];assert.equal(o.channel,'local');near(o.shipping,0);o.status='ready';assert.ok(shipOrder(s,o.id).ok);assert.equal(o.arrival,o.dispatch);assert.ok(Math.floor(o.arrival/1440)%7<5);advance(s,o.arrival-s.time);assert.equal(o.status,'paid');near(o.settlement.fees,0);near(o.settlement.shipping,0);assert.equal(o.paidOut,true);
});

test('the developer website is free but needs eight hours and no extra monthly hosting cost',()=>{
 const s=setup();closeChannels(s);s.orders=[];s.metrics.completed=8;const cash=s.cash;assert.ok(launchWebsite(s).ok);near(s.cash,cash);advance(s,480-1);assert.equal(s.website.stage,'building');advance(s,2*1440);assert.equal(s.website.stage,'live');assert.ok(s.daily.reduce((n,d)=>n+d.human,0)>=8);assert.equal(s.cashLedger.filter(e=>e.kind==='website').length,0);assert.ok(s.cashLedger.filter(e=>e.kind==='overhead').every(e=>Math.abs(e.amount+80/30)<1e-7));
});

test('legacy machine purchases keep their paid value and performance through migration',()=>{
 const s=setup(),raw=JSON.parse(exportSave(s)),machine=raw.state.objects.find(o=>o.type==='fdm');delete machine.machineSpec;machine.paid=389;delete raw.state.studio;delete raw.state.settings.autoRestock;const restored=importSave(JSON.stringify(raw)),m=printers(restored)[0];near(m.paid,389);near(specFor(m).machinePrice,389);near(specFor(m).speed,1);assert.match(specFor(m).name,/ancien/);assert.equal(restored.studio.idleMode,'none');assert.equal(restored.settings.autoRestock,false);assert.deepEqual(importSave(exportSave(restored)).objects,restored.objects);
});

test('the recommended clock takes five real minutes per full-time day with night acceleration',()=>{
 const s=setup();s.orders=[];closeChannels(s);s.life=normalizeLife({configured:true,mode:'fulltime'});s.time=7*60;let speed=240;const clock=new IdleClock({getState:()=>s,advance,getSpeed:()=>speed,setSpeed:v=>speed=v,stepBudget:4000});clock.reset(0);clock.tick(240000);assert.equal(s.time,23*60);assert.equal(speed,480);clock.tick(300000);assert.equal(s.time,1440+7*60);assert.equal(speed,240);
});

test('idle repairs order a missing part, wait for delivery and spend real owner time fitting it',()=>{
 const s=setup(340);closeChannels(s);s.orders=[];setIdlePreset(s);setIdleMode(s,'none');const m=printers(s)[0];m.broken='belt';advance(s,1);const supply=s.supplies.find(x=>x.kind==='part'&&x.item==='belt');assert.ok(supply);assert.equal(m.broken,'belt');assert.equal(s.parts.belt,0);advance(s,supply.due-s.time+90);assert.equal(m.broken,null);assert.equal(s.parts.belt,0);assert.ok(s.books.some(b=>b.kind==='maintenance'&&b.amount===18));assert.ok(s.dayStats.humanMinutes>=42);
 m.condition=50;advance(s,61);assert.ok(m.condition>=55);assert.ok(s.cashLedger.some(e=>e.kind==='maintenance'&&e.amount===-6));
});

test('enabling idle dispatches already packed orders as well as newly finished ones',()=>{
 const s=setup(341);closeChannels(s);const o=s.orders[0];o.status='ready';setIdlePreset(s);advance(s,1);assert.equal(o.status,'shipping');assert.ok(o.arrival>s.time);
});
