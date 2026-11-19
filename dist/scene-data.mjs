// World coordinates retain time order and a single linear price scale.
// The Z dimension is visual relief, never another financial variable.
export function createSceneData(data, forecast, zoom=120, band=true, worldWidth=30) {
  const candles=data.slice(-Math.min(Math.max(40,zoom),data.length));
  if(!candles.length) return null;
  const bands=forecast?.bands||[];
  const values=candles.flatMap(c=>[c.low,c.high]);
  bands.forEach(p=>values.push(...(band?[p.p10,p.p90]:[p.median])));
  const min=Math.min(...values),max=Math.max(...values),range=max-min||Math.max(1,min*.01);
  const low=min-range*.1,high=max+range*.1;
  const width=worldWidth,height=12,step=width/Math.max(1,candles.length+bands.length-1);
  const x=i=>-width/2+i*step;
  const y=v=>.8+(v-low)/(high-low)*height;
  const invertY=v=>low+(v-.8)/height*(high-low);
  const maxVolume=Math.max(1,...candles.map(c=>c.volume));
  const mapped=candles.map((c,i)=>({raw:c,index:i,x:x(i),open:y(c.open),close:y(c.close),high:y(c.high),low:y(c.low),up:c.close>=c.open,volumeHeight:c.volume/maxVolume*2.15}));
  const anchor=candles.at(-1);
  const future=[{time:anchor.time,p10:anchor.close,p25:anchor.close,median:anchor.close,p75:anchor.close,p90:anchor.close},...bands].map((p,i)=>({raw:p,index:candles.length-1+i,x:x(candles.length-1+i),low:y(p.p10),q25:y(p.p25),median:y(p.median),q75:y(p.p75),high:y(p.p90)}));
  const ticks=Array.from({length:6},(_,i)=>{const value=low+(high-low)*i/5;return {value,y:y(value)};});
  return {candles:mapped,future,bands,low,high,width,height,step,x,y,invertY,ticks,maxVolume,firstTime:candles[0].time,lastTime:bands.at(-1)?.time||anchor.time};
}

// Elliptical sections touch the supplied quantiles exactly on their vertical axis.
export function envelopeSections(future, inner=false) {
  return future.map(p=>{
    const lo=inner?p.q25:p.low,hi=inner?p.q75:p.high;
    return {x:p.x,center:(lo+hi)/2,radiusY:(hi-lo)/2,radiusZ:Math.min(inner?1.6:3.2,Math.max(.005,(hi-lo)*.38))};
  });
}

export function interpolateMedian(future,t) {
  if(!future.length)return null;
  const f=Math.max(0,Math.min(1,t))*(future.length-1),i=Math.floor(f),j=Math.min(future.length-1,i+1),a=f-i;
  return {x:future[i].x+(future[j].x-future[i].x)*a,y:future[i].median+(future[j].median-future[i].median)*a};
}
