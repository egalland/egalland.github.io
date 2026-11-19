import {initial,advance,marketPrices,value} from './engine.mjs';
export const HOUR=3600000;
export const BACKTEST_ASSETS='BTC ETH SOL XRP ADA DOGE LINK AVAX DOT LTC BCH UNI AAVE NEAR ATOM FIL ICP ETC XLM ALGO VET HBAR SUI TON TRX INJ RENDER ARB OP SEI TIA FET WLD IMX GRT CRV LDO MKR COMP SNX SAND MANA AXS CHZ ENJ ZEC DASH EOS IOTA THETA'.split(' ');
// Only data strictly preceding t can contribute a signal. The current candle
// contributes its open price alone, never its high/low/close or volume.
export function marketAt(dataset,t){
 const fx=dataset.series.EUR,fxMap=new Map(fx.map(r=>[r[0],r])),f=fxMap.get(t);if(!f)throw Error('Taux EUR absent à '+new Date(t).toISOString());
 const market={};
 for(const a of dataset.assets){const rows=dataset.series[a]||[],map=new Map(rows.map(r=>[r[0],r])),current=map.get(t);if(!current)continue;
  const past=Array.from({length:73},(_,i)=>map.get(t-(73-i)*HOUR));
  const ready=past.every(r=>r&&fxMap.has(r[0]));
  const closes=ready?past.map(r=>r[2]/fxMap.get(r[0])[2]):[];
  const volume=ready?past.slice(-24).reduce((sum,r)=>sum+r[3]/fxMap.get(r[0])[2],0):0;
  market[a]={price:current[1]/f[1],closes,asOf:t,change:ready?(closes.at(-1)/closes.at(-25)-1)*100:0,eligible:ready&&volume>=100000,volume24h:volume};
 }
 return market;
}
export function startBacktest(dataset){const m=marketAt(dataset,dataset.start);if(!m.BTC)throw Error('Cours Bitcoin absent au départ.');const state=initial(dataset.start-HOUR,m);state.started=dataset.start;state.executed=dataset.start;return {state,next:dataset.start,frames:[],journal:[]};}
export function stepBacktest(dataset,run){
 if(run.next>=dataset.end)return run;
 const t=run.next,m=marketAt(dataset,t);
 for(const book of Object.values(run.state.books))for(const [a,q] of Object.entries(book.holdings))if(q>0&&!m[a])throw Error('Simulation arrêtée : cours manquant pour la position '+a+' à '+new Date(t).toISOString()+'. Aucun prix inventé.');
 const state=advance(run.state,t,m);state.executed=t;state.started=dataset.start;state.missed=0;
 const prices=marketPrices(m),totals=Object.fromEntries(Object.entries(state.books).map(([id,b])=>[id,value(b,prices)]));
 const frame={time:t,...totals};
 const entries=state.decisions.map(d=>({...d,time:t,informationCutoff:t,latestClosedCandle:t-HOUR,execution:'Ouverture de la bougie ; frais et glissement simulés'}));
 return {state,next:t+HOUR,frames:[...run.frames,frame],journal:[...run.journal,...entries]};
}
