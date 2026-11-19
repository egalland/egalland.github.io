import {realismFor} from './realism.js';
const C=1440;
export function ensureAnalytics(s){
 if(s.analytics)return s.analytics;
 const costs={},monthly=[];let revenue=0,inflow=0,outflow=0;
 for(const b of s.books||[]){if(b.kind==='revenue')revenue+=b.amount;else costs[b.kind]=(costs[b.kind]||0)+b.amount;}
 for(const e of s.cashLedger||[]){if(e.amount>0)inflow+=e.amount;else outflow-=e.amount;}
 for(const d of s.daily||[]){const month=Math.floor((d.day-1)/30);let m=monthly.find(v=>v.month===month);if(!m){m={month,day:(month+1)*30,revenue:0,cost:0,profit:0,cash:d.cash};monthly.push(m);}m.revenue+=d.revenue;m.cost+=d.cost;m.profit+=d.profit;m.cash=d.cash;}
 const partial=s.time>3660*C;return s.analytics={revenue,costs,inflow,outflow,humanMinutes:(s.daily||[]).reduce((n,d)=>n+d.human*60,0)+(s.dayStats?.humanMinutes||0),monthly,machines:{},coverageFrom:partial?Math.max(0,s.time-3660*C):0,attributionFrom:s.time};
}
export function machineStats(s,m){const a=ensureAnalytics(s);if(!a.machines[m.id])a.machines[m.id]={id:m.id,name:m.machineSpec?.name||m.type,purchased:m.purchased,paid:m.paid,retiredAt:null,runMinutes:m.runHours*60,kWh:0,grams:0,materials:0,maintenance:0,energy:0,units:0,failures:0,plates:0,revenue:0,saleCosts:0,days:{}};return a.machines[m.id];}
export function recordBook(s,amount,kind){const a=ensureAnalytics(s);if(kind==='revenue')a.revenue+=amount;else a.costs[kind]=(a.costs[kind]||0)+amount;}
export function recordCash(s,amount){const a=ensureAnalytics(s);if(amount>=0)a.inflow+=amount;else a.outflow-=amount;}
export function recordMachineMinute(s,m,kWh,cost){const a=machineStats(s,m);a.runMinutes++;a.kWh+=kWh;a.energy+=cost;const day=Math.floor(s.time/C);a.days[day]=(a.days[day]||0)+1;if(a.lastDay!==day){for(const k of Object.keys(a.days))if(+k<day-30)delete a.days[k];a.lastDay=day;}}
export function recordMachineMaterial(s,m,grams,price){const a=machineStats(s,m);a.grams+=grams;a.materials+=price;}
export function recordMachineSale(s,o){const allocations=o.production||[],units=allocations.reduce((n,a)=>n+a.qty,0);if(!units)return;for(const p of allocations){const a=ensureAnalytics(s).machines[p.machineId];if(!a)continue;const share=p.qty/units;a.revenue+=o.settlement.gross*share;a.saleCosts+=(o.settlement.fees+o.settlement.tax+o.settlement.shipping+(o.packagingPaid||0))*share;}}
export function closeAnalyticsDay(s,row){const a=ensureAnalytics(s),month=Math.floor((row.day-1)/30);let m=a.monthly.find(v=>v.month===month);if(!m){m={month,day:(month+1)*30,revenue:0,cost:0,profit:0,cash:row.cash};a.monthly.push(m);}m.revenue+=row.revenue;m.cost+=row.cost;m.profit+=row.profit;m.cash=row.cash;}
export function lifetimeKpis(s){const a=ensureAnalytics(s),days=Math.max(1,(s.time-a.coverageFrom)/C),cost=Object.values(a.costs).reduce((n,c)=>n+c,0)+(s.dayStats?.electricity||0),profit=a.revenue-cost;return {...a,days,cost,profit,averageRevenue:a.revenue/days,averageProfit:profit/days,economicProfit:profit-a.humanMinutes/60*realismFor(s).hourValue,human:a.humanMinutes/60};}
export function machineKpis(s,m){const a=machineStats(s,m),days=Math.max(1,(s.time-m.purchased)/C),hours=a.runMinutes/60,window=Math.max(1,Math.min(7,(s.time-m.purchased)/C)),used=Object.entries(a.days).filter(([d])=>+d>=Math.floor(s.time/C)-6).reduce((n,[,v])=>n+v,0),direct=a.revenue-a.saleCosts-a.materials-a.energy-a.maintenance;return {...a,hours,days,direct,averageRevenue:a.revenue/days,averageContribution:direct/days,revenuePerHour:hours?a.revenue/hours:0,filamentPerHour:hours?a.grams/hours:0,utilization:Math.min(100,used/(window*1440)*100),paybackDays:direct>0?Math.max(0,m.paid-direct)/(direct/days):null};}
export function normalizeAnalytics(s){
 if(!s.analytics){ensureAnalytics(s);return;}const a=s.analytics,values=[a.revenue,a.inflow,a.outflow,a.humanMinutes,a.coverageFrom,a.attributionFrom,...Object.values(a.costs||{})];if(values.some(v=>!Number.isFinite(v))||!Array.isArray(a.monthly)||!a.machines||typeof a.machines!=='object')throw Error('Statistiques cumulées invalides.');
 for(const m of Object.values(a.machines))if(!m||!m.days||[m.runMinutes,m.kWh,m.grams,m.materials,m.maintenance,m.energy,m.units,m.failures,m.plates,m.revenue,m.saleCosts].some(v=>!Number.isFinite(v)||v<0))throw Error('Rendements de machine invalides.');
}
