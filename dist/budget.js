import {fabricArea} from './catalog.js';
export function estimate(p,coverage){
  const textile=fabricArea(p);
  const shares=p.yarns.map((_,i)=>coverage?.shares?.[i]??(i===0?1:0));
  const patterned=p.yarns.map((_,i)=>coverage?.patterned?.[i]||0);
  const base=p.yarns[0],companion=p.yarns.find(y=>y.id===base.heldWith);
  const massPerMeter=base.grams/base.meters+(companion?companion.grams/companion.meters:0);
  const measured=p.sample.enabled&&p.sample.grams>0;
  const pointFactor=({stockinette:1,garter:1.22,rib:1.14,seed:1.10})[p.stitch]||1;
  const metersPerCm2=measured?p.sample.grams/(p.sample.width*p.sample.height*massPerMeter):
    Math.sqrt(20*p.gauge.stitches*p.gauge.rows)/1000*pointFactor;
  const area=coverage?.cm2 || textile.cm2;
  const path=area*metersPerCm2;
  const meters=p.yarns.map(()=>0);
  p.yarns.forEach((y,i)=>{
    const length=path*(shares[i]+patterned[i]*p.floatAllowance/100)*(1+p.margin/100);
    meters[i]+=length;
    const extra=p.yarns.findIndex(item=>item.id===y.heldWith);
    if(extra>=0)meters[extra]+=length;
  });
  const low=measured?.90:.80,high=measured?1.12:1.30;
  const entries=p.yarns.map((y,i)=>{
    const amount=meters[i],count=factor=>amount>0?Math.ceil(amount*factor/y.meters-1e-10):0;
    return {yarn:y,index:i,meters:amount,grams:amount*y.grams/y.meters,balls:count(1),low:count(low),high:count(high),toBuy:Math.max(0,count(1)-y.stock)};
  });
  return {entries,area,fromChart:!!coverage?.cm2,pair:textile.pair,measured,low:entries.reduce((n,e)=>n+e.low,0),
    high:entries.reduce((n,e)=>n+e.high,0),balls:entries.reduce((n,e)=>n+e.balls,0),path,pointFactor,
    meters:meters.reduce((a,b)=>a+b,0),toBuy:entries.reduce((n,e)=>n+e.toBuy,0)};
}
