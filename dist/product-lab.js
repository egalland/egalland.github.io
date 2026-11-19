// Times, recipes and prices below are balancing assumptions for the game.
export const STUDIO_TEMPLATES=[
 {id:'phone-dock',origin:'original',name:'Support de téléphone signé',price:38,grams:105,hours:3.8,creationMinutes:360,dimensions:[105,85,95],material:'pla',color:'#8ca995',design:.12,finish:.2,category:'Catalogue',days:5},
 {id:'modular-tray',origin:'original',name:'Vide-poches modulaire',price:49,grams:175,hours:6.1,creationMinutes:480,dimensions:[180,130,45],material:'pla',color:'#dfb86f',design:.15,finish:.25,category:'Catalogue',days:6},
 {id:'plant-labels',origin:'original',name:'Étiquettes de potager',price:25,grams:60,hours:2.3,creationMinutes:120,dimensions:[120,40,10],material:'petg',color:'#8caba8',design:.2,finish:.15,category:'Catalogue',days:5},
 {id:'key-tag',origin:'original',name:'Porte-clés géométrique',price:12,grams:18,hours:.65,creationMinutes:45,prototypeGrams:12,prototypeHours:.5,prototypeFinish:.2,dimensions:[55,35,6],material:'pla',color:'#d67855',design:.08,finish:.1,category:'Catalogue',days:4},
 {id:'coaster',origin:'original',name:'Sous-verre tissé',price:18,grams:38,hours:1.35,creationMinutes:90,prototypeGrams:25,prototypeHours:.8,prototypeFinish:.25,dimensions:[95,95,8],material:'pla',color:'#dfb86f',design:.1,finish:.12,category:'Catalogue',days:4},
 {id:'desk-vase',origin:'original',name:'Vase sculptural',price:46,grams:135,hours:4.8,creationMinutes:240,prototypeGrams:40,prototypeHours:1.8,prototypeFinish:.4,dimensions:[105,105,165],material:'pla',color:'#b399b6',design:.15,finish:.25,category:'Catalogue',days:6},
 {id:'wall-organizer',origin:'original',name:'Rangement mural modulaire',price:69,grams:280,hours:9.5,creationMinutes:720,prototypeGrams:65,prototypeHours:3,prototypeFinish:.7,dimensions:[220,160,85],material:'petg',color:'#8ca995',design:.25,finish:.5,category:'Catalogue',days:7},
 {id:'cable-kit',origin:'licensed',name:'Kit de rangement de câbles',price:24,grams:65,hours:2.5,creationMinutes:120,dimensions:[75,40,25],material:'pla',color:'#b399b6',design:.1,finish:.2,category:'Catalogue',days:5},
 {id:'workshop-bins',origin:'licensed',name:'Petits bacs d’atelier',price:39,grams:155,hours:5.5,creationMinutes:180,dimensions:[160,110,65],material:'pla',color:'#b98970',design:.12,finish:.2,category:'Catalogue',days:6},
 {id:'tool-guide',origin:'licensed',name:'Guide d’outillage',price:57,grams:115,hours:4.6,creationMinutes:240,dimensions:[130,80,35],material:'petg',color:'#d1ab67',design:.3,finish:.35,category:'Professionnel',days:6}
];
export const BASE_DIMENSIONS={stl:[120,90,70],crochet:[80,35,30],support:[140,140,175],piece:[65,45,30],pot:[135,135,125],serie:[90,80,120],boutons:[45,45,32],gabarit:[190,100,40],organiseur:[200,130,65]};
const bounded=(n,a,b,fallback=0)=>Number.isFinite(Number(n))?Math.max(a,Math.min(b,Number(n))):fallback;
export function studioGoal(mode,product=null){return product?.creationMinutes||(mode==='research'?120:360);}
export function newStudio(){return {idleMode:'none',progress:{research:0,design:0},selected:{research:null,design:null},workById:{},drafts:{},pending:null,products:[],draft:{name:'',price:null},lastAuto:-1,lastLogId:null,stock:[],plans:{},stats:{crafted:0,sold:0,stockRevenue:0,machineMinutes:0}};}
export function creationRecord(template,at,{legacy=false,...custom}={}){return {...template,...custom,publishedAt:at,listed:legacy,listingQueued:false,listingWork:15,sellToOrder:legacy};}
export function nextStudioProduct(s,mode=s.studio.idleMode){const origin=mode==='design'?'original':'licensed',available=STUDIO_TEMPLATES.filter(p=>p.origin===origin&&!s.studio.products.some(x=>x.id===p.id));return available.find(p=>p.id===s.studio.selected?.[mode])||available[0]||null;}
export function normalizeStudio(input){
 const s=input&&typeof input==='object'?input:{},out=newStudio(),seen=new Set();
 out.idleMode=['research','design'].includes(s.idleMode)?s.idleMode:'none';
 out.pending=typeof s.pending==='string'?s.pending:null;
 out.products=Array.isArray(s.products)?s.products.filter(p=>p&&STUDIO_TEMPLATES.some(t=>t.id===p.id)&&!seen.has(p.id)&&seen.add(p.id)).slice(0,STUDIO_TEMPLATES.length).map(p=>{
  const t=STUDIO_TEMPLATES.find(t=>t.id===p.id);return {...t,name:typeof p.name==='string'?p.name.slice(0,48):t.name,price:bounded(p.price,10,120,t.price),publishedAt:bounded(p.publishedAt,0,1e10),listed:p.listed!==false,listingQueued:p.listingQueued===true,listingWork:bounded(p.listingWork,0,15,15),sellToOrder:p.sellToOrder!==false};
 }):[];
 for(const mode of ['research','design']){
  const t=STUDIO_TEMPLATES.find(t=>t.id===s.selected?.[mode]&&t.origin===(mode==='design'?'original':'licensed')&&!seen.has(t.id));out.selected[mode]=t?.id||null;
  const current=nextStudioProduct({studio:out},mode);out.progress[mode]=bounded(s.progress?.[mode],0,studioGoal(mode,current));
 }
 for(const t of STUDIO_TEMPLATES){if(Number.isFinite(s.workById?.[t.id]))out.workById[t.id]=bounded(s.workById[t.id],0,t.creationMinutes);if(s.drafts?.[t.id])out.drafts[t.id]=normalizeDraft(s.drafts[t.id]);}
 out.draft=normalizeDraft(s.draft);out.lastAuto=Number.isFinite(s.lastAuto)?s.lastAuto:-1;out.lastLogId=Number.isFinite(s.lastLogId)?s.lastLogId:null;
 // Exact colour lots. The prototype is never free saleable inventory.
 if(s.stock!==undefined&&(!Array.isArray(s.stock)||s.stock.length>1000))throw Error('Stock de créations invalide.');
 if(Array.isArray(s.stock))for(const row of s.stock){
  if(!row||!seen.has(row.productId)||!['natural','black','terracotta','sage','lilac','honey','clay','celadon','ochre','plum'].includes(row.colorId)||!Number.isInteger(row.qty)||row.qty<1||row.qty>999)throw Error('Stock de créations invalide.');
  out.stock.push({productId:row.productId,colorId:row.colorId,qty:row.qty,quality:bounded(row.quality,.65,1.02,.96),producedAt:bounded(row.producedAt,0,1e10),producerId:typeof row.producerId==='string'?row.producerId:null});
 }
 for(const p of out.products){const plan=s.plans?.[p.id];if(plan)out.plans[p.id]={enabled:plan.enabled===true,target:Math.round(bounded(plan.target,1,6,3)),colorId:['natural','black','terracotta','sage','lilac','honey','clay','celadon','ochre','plum'].includes(plan.colorId)?plan.colorId:'natural'};}
 for(const k of Object.keys(out.stats))out.stats[k]=bounded(s.stats?.[k],0,1e10);
 return out;
}
function normalizeDraft(d){return {name:typeof d?.name==='string'?d.name.slice(0,48):'',price:Number.isFinite(d?.price)?bounded(d.price,10,120):null};}
export function makeRecipe(product,random,initial=false){
 const scale=initial?1:[.85,1,1,1.15][Math.floor(random()*4)],infill=initial?20:[15,20,20,30][Math.floor(random()*4)],detailed=!initial&&random()<.18,supportRate=initial?.05:random()<.35?.12:.04;
 let part=Math.max(5,Math.round(product.grams*Math.pow(scale,2.5)*(.55+.45*infill/20)*.91)),supports=Math.round(part*supportRate),waste=Math.max(3,Math.round((part+supports)*.035));
 if(initial){waste=Math.max(3,Math.round(product.grams*.035));supports=Math.round(product.grams*.05);part=product.grams-supports-waste;}
 const dims=(product.dimensions||BASE_DIMENSIONS[product.id]||[120,90,70]).map(n=>Math.round(n*scale));return {part,supports,waste,total:part+supports+waste,infill,layer:detailed?.16:.20,brief:detailed?'Finition détaillée':infill>=30?'Renforcé':'Usage courant',hours:product.hours*Math.pow(scale,2.5)*(infill/20*.35+.65)*(detailed?1.3:1),dimensions:dims,minQuality:detailed?.99:.88};
}
export function estimateElectricity(s){const days=Math.max(1,s.time/1440),rate=s.settings.electricity;return {kWh:s.energy.unbilledKWh,cost:s.energy.unbilledCost,averageKWh:s.energy.kWh/days,monthEstimate:s.energy.kWh/days*30*rate};}
