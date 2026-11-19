import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,buyObject,advance,selectCreation,setIdleMode,setProjectDraft,queueProduction,setCreationListing,setProductionPlan,acceptOrder,cancelOrder,printers,exportSave,importSave,metrics} from '../dist/model.js';
import {STUDIO_TEMPLATES,creationRecord,nextStudioProduct} from '../dist/product-lab.js';
import {goodsFor,pendingProduction,putGoods,finishedCapacity,finishedOccupancy} from '../dist/creations.js';
import {normalizeLife} from '../dist/lifestyle.js';
import {creationsPanel} from '../dist/creations-ui.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function setup(seed=555){const s=createState(seed);buyObject(s,'fdm',1,1);s.orders=[];s.settings.useEtsy=s.settings.useLocal=s.settings.useSite=false;return s;}
function validated(s,id='key-tag',options={}){const p={...creationRecord(STUDIO_TEMPLATES.find(t=>t.id===id),s.time),...options};s.studio.products.push(p);return p;}
function seekStockOffer(s){for(let i=0;i<90*24;i++){advance(s,60);const o=s.orders.find(o=>o.status==='request'&&o.fromStock);if(o)return o;}assert.fail('Expected a stock enquiry during the seeded 90-day market run.');}
function stockOffer(s,id,qty=1){const p=s.studio.products[0];return {id,number:100,product:p.id,name:p.name,client:'Camille',category:'Catalogue',material:p.material,colorId:'natural',color:'#ede5d3',qty,price:p.price*qty,shipping:0,grams:p.grams*qty,hours:p.hours*qty,design:p.design,finish:p.finish,dimensions:p.dimensions,fromStock:true,channel:'local',origin:'original',status:'request',offered:s.time,expires:s.time+2880,due:s.time+1440*5,remaining:0,total:0,quality:.96};}

test('different creation times consume actual work and switching projects preserves separate drafts and progress',()=>{
 const s=setup();selectCreation(s,'key-tag');setProjectDraft(s,'Mon petit bijou',16);advance(s,20);near(s.studio.progress.design,20);selectCreation(s,'wall-organizer');near(s.studio.progress.design,0);advance(s,30);near(s.studio.progress.design,30);selectCreation(s,'key-tag');near(s.studio.progress.design,20);assert.equal(s.studio.draft.name,'Mon petit bijou');assert.equal(s.studio.draft.price,16);assert.equal(nextStudioProduct(s,'design').creationMinutes,45);assert.equal(STUDIO_TEMPLATES.find(t=>t.id==='wall-organizer').creationMinutes,720);
});

test('a 45-minute creation still needs its prototype, controls and photographs and creates no saleable free stock',()=>{
 const s=setup();selectCreation(s,'key-tag');advance(s,44);assert.equal(s.orders.length,0);advance(s,1);assert.equal(s.orders[0].isPrototype,true);setIdleMode(s,'none');advance(s,100);const p=s.studio.products[0];assert.equal(p.id,'key-tag');assert.equal(p.listed,false);assert.equal(p.sellToOrder,false);assert.equal(goodsFor(s),0);near(s.stock.pla,138);assert.equal(s.metrics.completed,0);assert.equal(s.reviews.length,0);near(metrics(s).revenue,0);
});

test('finished stock consumes real material, machine electricity and human finishing without recording revenue',()=>{
 const s=setup();validated(s);const before=s.stock.pla;assert.ok(queueProduction(s,'key-tag').ok);advance(s,10);assert.equal(s.orders[0].status,'printing');printers(s)[0].failRoll=1;advance(s,120);near(s.stock.pla,before-18);assert.equal(goodsFor(s),1);assert.equal(pendingProduction(s).length,0);assert.equal(s.studio.stats.crafted,1);near(s.studio.stats.machineMinutes,39);assert.ok(s.energy.kWh>0);near(s.books.filter(b=>b.kind==='materials').reduce((n,b)=>n+b.amount,0),18/1000*24);near(metrics(s).revenue,0);assert.equal(s.metrics.completed,0);assert.equal(s.reviews.length,0);
});

test('a batch schedules individual pieces across free machines while the owner loads one machine at a time',()=>{
 const s=setup();buyObject(s,'a1',2,1);validated(s,'coaster');assert.ok(queueProduction(s,'coaster',3).ok);assert.equal(pendingProduction(s).length,3);advance(s,9);assert.equal(s.orders.filter(o=>o.status==='printing').length,0);advance(s,11);assert.equal(s.orders.filter(o=>o.status==='printing').length,2);assert.equal(printers(s).filter(m=>m.job).length,2);assert.equal(s.orders.filter(o=>o.status==='queued').length,1);
});

test('client work is scheduled before speculative stock and client filament is protected',()=>{
 const s=setup();validated(s,'phone-dock');const customer={...stockOffer(s,'client'),product:'crochet',fromStock:false,grams:85,hours:3.4,design:.2,dimensions:[80,35,30]};s.orders.push(customer);acceptOrder(s,customer.id);assert.equal(queueProduction(s,'phone-dock',1,'natural',{automatic:true}).ok,false);assert.ok(queueProduction(s,'phone-dock').ok);advance(s,1);assert.equal(s.worker.orderId,customer.id);assert.equal(s.worker.kind,'design');advance(s,30);assert.equal(printers(s)[0].job,customer.id);assert.equal(s.orders.find(o=>o.isStock).status,'queued');
});

test('stock replenishment stops at the chosen target instead of filling the workshop indefinitely',()=>{
 const s=setup();validated(s);setProductionPlan(s,'key-tag',{enabled:true,target:2});advance(s,5*1440);assert.equal(goodsFor(s),2);assert.equal(pendingProduction(s).length,0);near(s.stock.pla,114);const hours=printers(s)[0].runHours;advance(s,3*1440);near(printers(s)[0].runHours,hours);assert.equal(s.studio.stats.crafted,2);
});

test('automatic stock manufacturing buys no speculative filament and respects cash reserves',()=>{
 const s=setup();validated(s);s.stock.pla=0;s.inventory=[];s.settings.autoRestock=true;setProductionPlan(s,'key-tag',{enabled:true,target:3});advance(s,2*1440);assert.equal(s.supplies.length,0);assert.equal(pendingProduction(s).length,0);assert.equal(goodsFor(s),0);s.cash=s.settings.reserve+1;assert.equal(queueProduction(s,'key-tag').ok,false);
});

test('finished storage includes work in progress and large products occupy more space',()=>{
 const s=setup();validated(s,'modular-tray');putGoods(s,'modular-tray','natural',12);assert.equal(finishedCapacity(s),24);assert.equal(finishedOccupancy(s),24);assert.equal(queueProduction(s,'modular-tray').ok,false);buyObject(s,'rack',2,1);assert.equal(finishedCapacity(s),32);assert.ok(queueProduction(s,'modular-tray',3).ok);assert.equal(finishedOccupancy(s),30);assert.equal(queueProduction(s,'modular-tray',3).ok,false);
});

test('listing uses 15 minutes and shares the strict telework budget',()=>{
 const s=setup();const p=validated(s);s.life=normalizeLife({configured:true,mode:'job',remoteBudget:9});s.time=2*1440+540;setCreationListing(s,p.id,true);advance(s,30);assert.equal(p.listed,false);assert.equal(p.listingWork,6);near(s.dayStats.remoteMinutes,9);advance(s,480);assert.equal(p.listed,true);assert.equal(p.listingQueued,false);near(s.dayStats.remoteMinutes,9);
});

test('a real enquiry buys exact ready inventory and delivery records revenue without reprinting the objects',()=>{
 const s=setup();const p=validated(s,'key-tag',{listed:true});putGoods(s,p.id,'sage',3);s.settings.useLocal=true;const o=seekStockOffer(s);near(o.price,o.qty*p.price);assert.equal(o.colorId,'sage');near(o.grams,o.qty*p.grams);assert.deepEqual(o.dimensions,p.dimensions);const raw=s.stock.pla;assert.ok(acceptOrder(s,o.id).ok);assert.equal(o.status,'packing');assert.equal(goodsFor(s),3-o.qty);near(s.stock.pla,raw);s.settings.autoShip=true;advance(s,10*1440);assert.equal(o.status,'paid');assert.equal(o.paidOut,true);assert.equal(s.studio.stats.sold,o.qty);assert.equal(s.metrics.completed,1);near(printers(s)[0].runHours,0);near(s.stock.pla,raw);assert.ok(metrics(s).revenue>0);assert.equal(s.books.filter(b=>b.kind==='materials').length,0);
});

test('competing enquiries cannot sell the same pieces twice and cancellation returns allocated stock only once',()=>{
 const s=setup();validated(s);putGoods(s,'key-tag','natural',3);const a=stockOffer(s,'a',2),b=stockOffer(s,'b',2);s.orders.push(a,b);assert.ok(acceptOrder(s,a.id).ok);assert.equal(goodsFor(s),1);assert.equal(acceptOrder(s,b.id).ok,false);assert.equal(goodsFor(s),1);assert.ok(cancelOrder(s,a.id).ok);assert.equal(goodsFor(s),3);assert.equal(cancelOrder(s,a.id).ok,false);assert.equal(goodsFor(s),3);
});

test('unlisted and sold-out stock-only creations produce no customer offers',()=>{
 const s=setup();validated(s,'key-tag',{listed:false});putGoods(s,'key-tag','natural',2);s.settings.useLocal=true;advance(s,60*1440);assert.ok(s.orders.every(o=>o.product!=='key-tag'));s.studio.products[0].listed=true;s.studio.stock=[];advance(s,30*1440);assert.ok(s.orders.every(o=>o.product!=='key-tag'));
});

test('stock planning during absence waits for human loading; already running prints continue during sleep',()=>{
 const s=setup();validated(s,'desk-vase');s.life=normalizeLife({configured:true,mode:'job'});s.time=600;queueProduction(s,'desk-vase');advance(s,60);near(s.stock.pla,150);assert.equal(s.worker,null);s.time=1080;advance(s,10);const m=printers(s)[0];assert.ok(m.job);const remaining=m.remaining,human=s.dayStats.humanMinutes;s.time=1390;advance(s,30);near(m.remaining,remaining-30);near(s.dayStats.humanMinutes,human);advance(s,30);near(m.remaining,remaining-60);near(s.dayStats.humanMinutes,0);near(s.daily.at(-1).human,human/60);
});

test('old unlocked designs keep their listings and on-demand sales and new inventory survives a deterministic save',()=>{
 const s=setup();const p=validated(s);putGoods(s,p.id,'natural',2);setProductionPlan(s,p.id,{enabled:true,target:3});queueProduction(s,p.id);advance(s,12);const restored=importSave(exportSave(s));assert.deepEqual(restored,s);advance(s,100);advance(restored,100);assert.deepEqual(restored,s);
 const raw=JSON.parse(exportSave(s));delete raw.state.studio.products[0].listed;delete raw.state.studio.products[0].sellToOrder;delete raw.state.studio.stock;delete raw.state.studio.plans;const legacy=importSave(JSON.stringify(raw));assert.equal(legacy.studio.products[0].listed,true);assert.equal(legacy.studio.products[0].sellToOrder,true);assert.equal(goodsFor(legacy),0);
});

test('invalid stock quantities are rejected and creation names are escaped in both game tabs',()=>{
 const s=setup();const p=validated(s);p.name='<img src=x onerror=alert(1)>';putGoods(s,p.id,'natural',2);const html=creationsPanel(s,'production');assert.ok(!html.includes('<img src=x'));assert.ok(html.includes('&lt;img'));assert.ok(html.includes('data-action="craft-stock"'));assert.ok(creationsPanel(s,'design').includes('45 min'));const raw=JSON.parse(exportSave(s));raw.state.studio.stock[0].qty=-2;assert.throws(()=>importSave(JSON.stringify(raw)),/Stock de créations invalide/);
});

test('three months with clients and idle stock reconcile every crafted piece, actual revenue and storage',()=>{
 const s=createState(2026);buyObject(s,'fdm',1,1);buyObject(s,'a1',2,1);buyObject(s,'rack',3,1);buyObject(s,'bench',1,2);buyObject(s,'packing',4,2);validated(s,'key-tag',{listed:true});setProductionPlan(s,'key-tag',{enabled:true,target:3});s.settings.autoAccept=s.settings.autoShip=s.settings.autoRestock=s.settings.autoService=true;
 for(let i=0;i<3;i++)advance(s,30*1440);
 const allocated=s.orders.filter(o=>o.fulfilledFromStock&&!o.stockReturned&&['packing','ready','shipping'].includes(o.status)).reduce((n,o)=>n+o.qty,0);
 assert.equal(s.studio.stats.crafted,goodsFor(s)+s.studio.stats.sold+allocated);assert.ok(s.studio.stats.crafted>0);assert.ok(s.studio.stats.sold>0);assert.ok(s.inventory.every(l=>l.grams>=0));assert.ok(s.daily.every(d=>d.human<=8));assert.ok(finishedOccupancy(s)<=finishedCapacity(s));near(s.cash,1500+s.cashLedger.reduce((n,e)=>n+e.amount,0));
});

test('finishing a different prototype does not discard work already invested in the next design',()=>{
 const s=setup();selectCreation(s,'phone-dock');setProjectDraft(s,'Mon dock',42);advance(s,20);selectCreation(s,'key-tag');advance(s,45);setIdleMode(s,'none');advance(s,100);assert.equal(nextStudioProduct(s,'design').id,'phone-dock');near(s.studio.progress.design,20);assert.equal(s.studio.draft.name,'Mon dock');setIdleMode(s,'design');advance(s,1);near(s.studio.progress.design,21);
});
