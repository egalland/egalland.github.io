import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,canPlace,buyObject,moveObject,sellObject,advance,printers,acceptOrder,purchaseSupply,serviceMachine,shipOrder,setCampaign,launchWebsite,addBusinessDays,metrics,exportSave,importSave,isWorkTime,dayOf} from '../dist/model.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);

test('purchase, collision, rotation, movement and resale conserve funds',()=>{
 const s=createState(12);assert.equal(s.cash,1500);assert.equal(canPlace(s,'fdm',5,0),false);
 const r=buyObject(s,'fdm',1,1);assert.ok(r.ok);near(s.cash,1256);
 assert.equal(buyObject(s,'fdm',1,1).ok,false);near(s.cash,1256);
 assert.equal(canPlace(s,'bench',7,2,0),false);assert.equal(canPlace(s,'bench',7,2,1),true);
 assert.ok(moveObject(s,r.object.id,3,2,1).ok);assert.ok(canPlace(s,'fdm',1,1));
 assert.ok(sellObject(s,r.object.id).ok);near(s.cash,1500-244+244*.5);
 near(s.cash,1500+s.cashLedger.reduce((a,r)=>a+r.amount,0));
});

test('stock has delivery lead time, capacity and cost separate from consumption',()=>{
 const s=createState(7);assert.ok(purchaseSupply(s,'filament','pla').ok);near(s.cash,1471.1);assert.equal(s.stock.pla,150);
 const due=s.supplies[0].due;advance(s,due-s.time-1);assert.equal(s.stock.pla,150);advance(s,1);assert.equal(s.stock.pla,1150);
 assert.equal(s.books.filter(x=>x.kind==='materials').length,0);assert.equal(purchaseSupply(s,'filament','pla',5).ok,false);
});

test('one owner never performs more than eight hours per weekday or works weekends',()=>{
 const s=createState(55);buyObject(s,'fdm',1,1);s.settings.autoAccept=true;s.settings.autoShip=true;purchaseSupply(s,'filament','pla');purchaseSupply(s,'filament','petg');advance(s,1440*25);
 for(const d of s.daily){assert.ok(d.human<=8+1e-8);if((d.day-1)%7>=5)assert.equal(d.human,0);}
 assert.equal(isWorkTime(6*1440+600),false);assert.equal(isWorkTime(750),false);
});

test('printing can progress outside human hours while human tasks wait',()=>{
 const s=createState(13);const m=buyObject(s,'fdm',1,1).object,o=s.orders[1];s.stock.pla=1000;acceptOrder(s,o.id);s.time=1040;
 advance(s,9);assert.ok(s.worker);const human=s.dayStats.humanMinutes;advance(s,60);assert.equal(s.dayStats.humanMinutes,human);
 // A running print is independent from the operator's presence.
 s.worker=null;o.status='printing';m.job=o.id;m.total=500;m.remaining=500;m.failRoll=1;const time=s.time;advance(s,30);assert.equal(m.remaining,470);assert.equal(s.dayStats.humanMinutes,human);
 s.settings.nightPrinting=false;advance(s,30);assert.equal(m.remaining,470);assert.ok(s.time>time);
});

test('full order cycle, reputation, fees and delayed payout reconcile',()=>{
 const s=createState(1001);buyObject(s,'fdm',1,1);const o=s.orders[0];acceptOrder(s,o.id);advance(s,1440*2);
 assert.equal(o.status,'ready');shipOrder(s,o.id);advance(s,o.arrival-s.time);
 assert.equal(o.status,'paid');assert.equal(s.metrics.completed,1);assert.equal(s.reviews.length,1);
 const gross=o.price+o.shipping;near(o.settlement.fees,gross*.1164+.5);near(o.settlement.tax,gross*.22);
 assert.ok(!o.paidOut);near(metrics(s).pendingPayout,o.settlement.net);advance(s,o.payout-s.time);assert.ok(o.paidOut);near(metrics(s).pendingPayout,0);
 near(s.cash,1500+s.cashLedger.reduce((a,r)=>a+r.amount,0));
 assert.ok(s.books.some(b=>b.kind==='materials'&&b.amount>0));
});

test('calendar age does not kill a five-year-old machine and repairs consume real parts',()=>{
 const s=createState(1),m=buyObject(s,'fdm',1,1).object;s.time+=5*365*1440;advance(s,1);assert.equal(m.broken,null);assert.equal(printers(s).length,1);
 m.broken='nozzle';s.parts.nozzle=1;assert.ok(serviceMachine(s,m.id,'nozzle').ok);assert.equal(s.parts.nozzle,0);s.time=510+Math.floor(s.time/1440)*1440;while(dayOf(s.time)%7>=5)s.time+=1440;advance(s,40);assert.equal(m.broken,null);assert.equal(m.partHours.nozzle,0);
});

test('daily financial chart includes costs in their closing day',()=>{
 const s=createState(6);buyObject(s,'fdm',1,1);advance(s,1440-s.time);assert.equal(s.daily.length,1);assert.ok(s.daily[0].cost>80/30);
 const exp=s.books.filter(b=>b.at<1440&&b.kind!=='revenue').reduce((a,b)=>a+b.amount,0);near(s.daily[0].cost,exp);
});

test('save round trip preserves seeded future outcomes and rejects invalid saves',()=>{
 const s=createState(88);buyObject(s,'fdm',1,1);acceptOrder(s,s.orders[0].id);advance(s,321);const c=importSave(exportSave(s));advance(s,1000);advance(c,1000);assert.deepEqual(s,c);
 assert.throws(()=>importSave('{}'));const x=JSON.parse(exportSave(s));delete x.state.metrics;assert.throws(()=>importSave(JSON.stringify(x)));
});

test('publicity is capped, costs money and stops when reserves are threatened',()=>{
 const s=createState(42);s.cash=125;assert.equal(setCampaign(s,'etsy').ok,false);s.cash=135;assert.ok(setCampaign(s,'etsy').ok);advance(s,3*1440);assert.equal(s.campaign.channel,'none');assert.ok(s.cash<135);assert.ok(s.orders.filter(o=>o.status==='request').length<=8);
});

test('transport respects business days and a website requires real owner time',()=>{
 assert.equal(dayOf(addBusinessDays(4*1440+15*60,2)),8);
 const s=createState(109);assert.equal(launchWebsite(s).ok,false);s.metrics.completed=8;assert.ok(launchWebsite(s).ok);near(s.cash,1500);
 advance(s,8*60-1);assert.equal(s.website.stage,'building');advance(s,2*1440);assert.equal(s.website.stage,'live');
 assert.ok(s.daily.every(d=>d.human<=8));
});
