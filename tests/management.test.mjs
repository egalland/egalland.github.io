import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {createState,buyObject,advance,printers,learnSkill,skillPoints,compatiblePrinters,queueProduction,cancelOrder,importSave,exportSave,setCampaign,shipOrder,lifetimeKpis,machineKpis,featureProduct,setProductVisibility,PRODUCTS,SHOP} from '../dist/model.js';
import {STUDIO_TEMPLATES,creationRecord} from '../dist/product-lab.js';
import {goodsFor,putGoods,takeGoods} from '../dist/creations.js';
import {packPlate} from '../dist/plate-layout.js';
import {quoteParcel} from '../dist/parcels.js';
import {attributeSale} from '../dist/advertising.js';
import {merchandisingWeight} from '../dist/storefront.js';
import {workshopObstacles,pointIsFree,nearestFree,routeToObject,stepAlongPath} from '../dist/workshop-path.js';
import {buildCharacter} from '../dist/character.js';
import {skillsPanel,machineDashboard,lifetimeSummary,storefrontPage} from '../dist/management-ui.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
function setup(seed=571){const s=createState(seed);buyObject(s,'a1',1,1);s.orders=[];s.settings.useEtsy=s.settings.useLocal=s.settings.useSite=false;s.studio.products.push({...creationRecord(STUDIO_TEMPLATES.find(t=>t.id==='key-tag'),s.time),listed:true});return s;}
const foot=o=>SHOP.find(p=>p.id===o.type)?.foot||[2,1];

test('skills spend finite points, enforce prerequisites and unlock large machines',()=>{
 const s=createState(51);assert.equal(skillPoints(s).available,1);assert.equal(learnSkill(s,'large-format').ok,false);assert.equal(buyObject(s,'large',0,1).ok,false);assert.ok(learnSkill(s,'batching').ok);assert.equal(skillPoints(s).available,0);assert.equal(learnSkill(s,'cad').ok,false);s.mastery.xp=400;assert.ok(learnSkill(s,'cad').ok);assert.ok(learnSkill(s,'large-format').ok);assert.equal(skillPoints(s).available,0);const m=buyObject(s,'large',0,1).object;assert.ok(m);assert.deepEqual(compatiblePrinters(s,{dimensions:[390,280,75],minQuality:.9}).map(m=>m.id),[m.id]);
});

test('multi-part plates share setup and power while retaining the total extrusion time and material',()=>{
 const s=setup();learnSkill(s,'batching');assert.ok(queueProduction(s,'key-tag',3).ok);advance(s,14);const m=printers(s)[0];assert.equal(m.plate.length,3);assert.ok(s.orders.every(o=>o.status==='printing'));const total=m.total;assert.ok(total>3*.65*60*.94*.9);near(s.stock.pla,96);m.failRoll=1;advance(s,200);assert.equal(goodsFor(s),3);const k=machineKpis(s,m);assert.equal(k.plates,1);assert.equal(k.units,3);near(k.runMinutes,total);near(k.kWh,total*.13/60);near(k.materials,54/1000*24);near(k.revenue,0);
});

test('plate packing separates colours, respects build volume and never overlaps bounding boxes',()=>{
 const orders=Array.from({length:10},(_,i)=>({id:'p'+i,dimensions:[55,35,20]})),layout=packPlate(orders,[180,180,180],8);
 assert.ok(layout.slots.length>=4);for(const p of layout.slots){assert.ok(p.x>=0&&p.y>=0&&p.x+p.w<=180&&p.y+p.d<=180);for(const q of layout.slots)if(q!==p)assert.ok(p.x+p.w<=q.x||q.x+q.w<=p.x||p.y+p.d<=q.y||q.y+q.d<=p.y);}
 const s=setup();learnSkill(s,'batching');s.stock.pla=1150;s.inventory.push({id:'sage',material:'pla',colorId:'sage',grams:1000});queueProduction(s,'key-tag',2,'natural');queueProduction(s,'key-tag',1,'sage');advance(s,12);assert.equal(printers(s)[0].plate.length,2);assert.ok(printers(s)[0].plate.every(id=>s.orders.find(o=>o.id===id).colorId==='natural'));assert.equal(s.orders.find(o=>o.colorId==='sage').status,'queued');
});

test('cancelling a member stops its shared plate and requeues the others without returning used filament',()=>{
 const s=setup();learnSkill(s,'batching');queueProduction(s,'key-tag',3);advance(s,14);const id=printers(s)[0].plate[1];assert.ok(cancelOrder(s,id).ok);assert.equal(printers(s)[0].job,null);assert.equal(s.orders.filter(o=>o.status==='queued').length,2);assert.equal(s.orders.filter(o=>o.status==='cancelled').length,1);near(s.stock.pla,96);assert.equal(s.reviews.length,0);
});

test('parcel classes follow dimensions and weight; oversized items require pickup',()=>{
 const small=quoteParcel({dimensions:[55,35,6],grams:18,qty:1,channel:'etsy'}),large=quoteParcel({dimensions:[600,450,650],grams:2800,qty:1,channel:'site'}),oversize=quoteParcel({dimensions:[1200,900,1000],grams:25000,qty:1,channel:'site'});assert.equal(small.tier,'S');assert.equal(large.tier,'L');assert.ok(large.postage>small.postage);assert.ok(large.packaging>small.packaging);assert.equal(oversize.pickupOnly,true);assert.equal(oversize.charge,0);const pickup=quoteParcel({dimensions:[600,450,650],grams:2800,qty:1,channel:'local'});assert.equal(pickup.postage,0);
});

test('delivery uses the quoted large-parcel cost instead of a universal postage rate',()=>{
 const s=createState(812),o=s.orders[0];o.dimensions=[600,450,650];o.grams=2800;o.qty=1;o.parcel=quoteParcel(o);o.shipping=o.parcel.charge;o.status='ready';shipOrder(s,o.id);advance(s,o.arrival-s.time);near(o.settlement.shipping,12.9);near(o.settlement.gross,o.price+o.parcel.charge);
});

test('lifetime ledgers and daily averages reconcile and survive pruning of old detail',()=>{
 const s=createState(20);buyObject(s,'fdm',1,1);s.orders[0].status='ready';shipOrder(s,s.orders[0].id);advance(s,10*1440);const k=lifetimeKpis(s);near(k.revenue,s.books.filter(b=>b.kind==='revenue').reduce((n,b)=>n+b.amount,0));near(k.cost,s.books.filter(b=>b.kind!=='revenue').reduce((n,b)=>n+b.amount,0)+s.dayStats.electricity);near(k.averageRevenue,k.revenue/(s.time/1440));near(s.cash,1500+k.inflow-k.outflow);const revenue=k.revenue;s.orders=[];s.worker=null;for(const m of printers(s)){m.job=null;m.plate=[];}s.settings.useEtsy=s.settings.useLocal=s.settings.useSite=false;s.time=4000*1440-1;advance(s,1);assert.equal(s.books.some(b=>b.kind==='revenue'),false);near(lifetimeKpis(s).revenue,revenue);assert.ok(s.analytics.monthly.length>0);
});

test('finished stock retains machine attribution, including an explicit unknown origin for old inventory',()=>{
 const s=setup();putGoods(s,'key-tag','natural',1,.96,null);putGoods(s,'key-tag','natural',1,.96,printers(s)[0].id);const taken=takeGoods(s,'key-tag','natural',2);assert.equal(taken.production.reduce((n,v)=>n+v.qty,0),2);assert.equal(taken.production[0].machineId,null);assert.equal(taken.production[1].machineId,printers(s)[0].id);
});

test('visibility removes actual leads, featured positions are limited and weighting is bounded',()=>{
 const s=createState(41);s.orders=[];for(const p of PRODUCTS)setProductVisibility(s,p.id,false);advance(s,30*1440);assert.equal(s.orders.length,0);for(const id of ['crochet','support','pot'])assert.ok(featureProduct(s,id,true).ok);assert.equal(featureProduct(s,'organiseur',true).ok,false);near(merchandisingWeight(s,{id:'crochet'}),1.8);assert.ok(learnSkill(s,'merchandising').ok);assert.ok(featureProduct(s,'organiseur',true).ok);near(merchandisingWeight(s,{id:'crochet'}),2.2);
});

test('Google Ads requires a live shop; hourly charges stop at the budgeted duration and remain compact',()=>{
 const s=createState(18);assert.equal(setCampaign(s,'google').ok,false);s.website.stage='live';assert.ok(setCampaign(s,'google',{budget:6,days:1}).ok);advance(s,1440);assert.equal(s.campaign.channel,'none');near(s.marketing.spent,6);near(s.marketing.history[0].spent,6);assert.ok(s.marketing.history[0].clicks>0);assert.ok(s.cashLedger.filter(e=>e.kind==='marketing').length<=2);near(s.books.filter(e=>e.kind==='marketing').reduce((n,e)=>n+e.amount,0),6);assert.equal(setCampaign(s,'etsy',{budget:-1,days:1}).ok,false);
});

test('advertising attribution continues after the campaign has ended',()=>{
 const s=createState(18);setCampaign(s,'etsy',{budget:2,days:1});const id=s.campaign.id;advance(s,1440);attributeSale(s,{campaignId:id,settlement:{gross:100}});assert.equal(s.marketing.history[0].orders,1);near(s.marketing.history[0].revenue,100);near(s.marketing.revenue,100);
});

test('new cumulative and merchandising state survives save import without changing future simulation',()=>{
 const s=setup();learnSkill(s,'batching');queueProduction(s,'key-tag',3);advance(s,15);featureProduct(s,'key-tag',true);const restored=importSave(exportSave(s));advance(s,200);advance(restored,200);assert.deepEqual(restored,s);const raw=JSON.parse(exportSave(s));delete raw.state.analytics;delete raw.state.skills;delete raw.state.storefront;delete raw.state.marketing;const old=importSave(JSON.stringify(raw));assert.equal(old.skills.unlocked.length,0);assert.ok(Number.isFinite(lifetimeKpis(old).revenue));assert.equal(old.storefront.featured.length,0);
});

test('avatar routes avoid tables, chairs, large footprints and room boundaries at every step',()=>{
 const s=createState(82);buyObject(s,'fdm',1,2);buyObject(s,'rack',3,2);buyObject(s,'bench',3,4);const boxes=workshopObstacles(s,foot),start=nearestFree({x:-3,z:0},boxes),path=routeToObject(start,'desk-0',boxes);assert.ok(path.length>3);let position=start,left=path,count=0;while(left.length&&count++<1000){const next=stepAlongPath(position,left,.05);position=next.position;left=next.path;assert.ok(pointIsFree(position,boxes));}assert.ok(count<1000);assert.equal(pointIsFree({x:2,z:-2.5},boxes),false);
});

test('character primitives share safe geometry while mutable head surfaces remain independent',()=>{
 const material=c=>new THREE.MeshStandardMaterial({color:c}),a=buildCharacter({kind:'human'},material),b=buildCharacter({kind:'human'},material);const ga=[],gb=[];a.traverse(m=>{if(m.isMesh&&m.geometry.userData.persistent)ga.push(m.geometry);});b.traverse(m=>{if(m.isMesh&&m.geometry.userData.persistent)gb.push(m.geometry);});assert.ok(ga.length>10);assert.ok(ga.some(g=>gb.includes(g)));assert.notEqual(a.userData.rig.head.children[0].geometry,b.userData.rig.head.children[0].geometry);
});

test('management views expose cumulatives, skills, store controls and Google Ads using escaped product names',()=>{
 const s=setup();s.studio.products[0].name='<img src=x>';assert.ok(lifetimeSummary(s).includes('CA moyen / jour'));assert.ok(machineDashboard(s).includes('occupation sur 7 jours'));assert.ok(skillsPanel(s).includes('Grand format'));assert.ok(storefrontPage(s,'ads').includes('Google Ads'));assert.ok(!storefrontPage(s).includes('<img src=x>'));assert.ok(storefrontPage(s).includes('data-product-featured'));
});

test('sold stock credits the machine that printed it and does not treat unsold inventory as revenue',()=>{
 const s=setup(881);learnSkill(s,'batching');for(const p of PRODUCTS)setProductVisibility(s,p.id,false);queueProduction(s,'key-tag',3);advance(s,14);printers(s)[0].failRoll=1;advance(s,220);near(machineKpis(s,printers(s)[0]).revenue,0);s.settings.useLocal=true;s.settings.autoAccept=true;s.settings.autoShip=true;advance(s,30*1440);const machine=machineKpis(s,printers(s)[0]),all=lifetimeKpis(s);assert.ok(machine.revenue>0);near(machine.revenue,all.revenue);assert.ok(machine.saleCosts>0);assert.ok(machine.direct<machine.revenue);assert.ok(machine.utilization>=0&&machine.utilization<=100);
});

test('idle replenishment uses grouped plates after calepinage instead of loading every piece separately',()=>{
 const s=setup(572);learnSkill(s,'batching');s.studio.plans['key-tag']={enabled:true,target:6,colorId:'natural'};s.settings.autoCraft=true;advance(s,5*1440);const k=machineKpis(s,printers(s)[0]);assert.equal(goodsFor(s),6);assert.equal(k.units,6);assert.ok(k.plates<6);near(s.stock.pla,42);
});
