// Finished goods and work in progress are separate from filament and cash.
export const internalOrder=o=>o.isPrototype||o.isStock;
export const unfinished=o=>!['paid','cancelled','expired'].includes(o.status);
export const pendingProduction=(s,productId=null,colorId=null)=>s.orders.filter(o=>o.isStock&&unfinished(o)&&(!productId||o.product===productId)&&(!colorId||o.colorId===colorId));
export const goodsFor=(s,productId=null,colorId=null)=>s.studio.stock.filter(l=>(!productId||l.productId===productId)&&(!colorId||l.colorId===colorId)).reduce((n,l)=>n+l.qty,0);
export const productSpace=p=>Math.max(1,Math.ceil((p?.grams||100)/150));
export const finishedCapacity=s=>24+8*s.objects.filter(o=>o.type==='rack').length;
export function finishedOccupancy(s){return s.studio.stock.reduce((n,l)=>n+l.qty*productSpace(s.studio.products.find(p=>p.id===l.productId)),0)+pendingProduction(s).reduce((n,o)=>n+productSpace(o),0);}
export function offeredGoods(s,productId,colorId){return s.orders.filter(o=>o.fromStock&&o.status==='request'&&o.product===productId&&o.colorId===colorId).reduce((n,o)=>n+o.qty,0);}
export function putGoods(s,productId,colorId,qty,quality=.96,producerId=null){s.studio.stock.push({productId,colorId,qty,quality,producedAt:s.time,producerId});}
export function takeGoods(s,productId,colorId,qty){
 if(goodsFor(s,productId,colorId)<qty)return null;
 let remaining=qty,quality=0;const production=[];
 for(const row of s.studio.stock.filter(l=>l.productId===productId&&l.colorId===colorId).sort((a,b)=>a.producedAt-b.producedAt)){const count=Math.min(remaining,row.qty);row.qty-=count;quality+=count*row.quality;production.push({machineId:row.producerId||null,qty:count});remaining-=count;if(!remaining)break;}
 s.studio.stock=s.studio.stock.filter(l=>l.qty>0);return {quality:quality/qty,production};
}
export function productionPlan(s,productId){return s.studio.plans[productId]||{enabled:false,target:3,colorId:'natural'};}
export function materialReserved(s,material,colorId,exceptId=null){return s.orders.filter(o=>o.id!==exceptId&&!o.isStock&&!o.fulfilledFromStock&&['design','queued','loading'].includes(o.status)&&o.material===material&&o.colorId===colorId).reduce((n,o)=>n+o.grams,0);}
