import {BACKTEST_ASSETS,HOUR} from '../../../lib/backtest.mjs';
export async function GET(request:Request){
 try{const q=new URL(request.url).searchParams,asset=q.get('asset')||'',start=Number(q.get('start')),end=Number(q.get('end'));
 if(![...BACKTEST_ASSETS,'EUR'].includes(asset)||!Number.isFinite(start)||!Number.isFinite(end)||start%HOUR||end%HOUR||end<=start||end-start>35*24*HOUR||end>Math.floor(Date.now()/HOUR)*HOUR)return Response.json({error:'Période historique invalide (35 jours maximum, heures UTC complètes).'}, {status:400});
 async function candlesFor(product:string){const collected=new Map<number,number[]>();
 for(let from=start;from<end;from+=299*HOUR){const to=Math.min(end,from+299*HOUR),url='https://api.exchange.coinbase.com/products/'+encodeURIComponent(product)+'/candles?'+new URLSearchParams({granularity:'3600',start:new Date(from).toISOString(),end:new Date(to).toISOString()});
  const r=await fetch(url,{signal:AbortSignal.timeout(20000),headers:{Accept:'application/json'}});if(!r.ok)throw Error('Coinbase '+product+' indisponible ('+r.status+').');const rows:any=await r.json();if(!Array.isArray(rows))throw Error('Réponse Coinbase invalide.');
  for(const row of rows){const time=Number(row[0])*1000;if(time>=start&&time<end&&time+HOUR<=Date.now()){const candle=[time,Number(row[3]),Number(row[4]),Number(row[5])*Number(row[4])];if(candle.some(n=>!Number.isFinite(n))||candle[1]<=0||candle[2]<=0)throw Error('Cours historique invalide.');collected.set(time,candle)}}
 }return [...collected.values()].sort((a,b)=>a[0]-b[0]);}
 let candles:number[][];
 if(asset==='EUR'){const [usd,eur]=await Promise.all([candlesFor('BTC-USD'),candlesFor('BTC-EUR')]);const euros=new Map(eur.map(r=>[r[0],r]));candles=usd.filter(r=>euros.has(r[0])).map(r=>[r[0],r[1]/euros.get(r[0])![1],r[2]/euros.get(r[0])![2],0]);}
 else candles=await candlesFor(asset+'-USD');
 return Response.json({asset,candles,source:'Coinbase Exchange public · USD / EUR par taux croisé BTC',quote:'USD',interval:'1h'},{headers:{'Cache-Control':'private, max-age=3600'}});
 }catch(e){return Response.json({error:String(e)},{status:503})}
}
