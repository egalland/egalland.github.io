export const assets=['BTC','ETH','SOL','ADA','XRP'];
export const marketPrices=m=>Object.fromEntries(Object.entries(m).map(([a,x])=>[a,x.price]));
const tradable=m=>Object.keys(m).filter(a=>m[a].eligible!==false);
export const profiles=[{id:'council',name:'Le Conseil',role:'Arbitrage collectif',color:'#c8f27b',description:'Le juge retient les actifs soutenus par au moins deux conseillers. Il moyenne leurs allocations, avec un plafond de 70 % investi.'},{id:'prudent',name:'Le Gardien',role:'Prudence',color:'#96b9ff',description:'BTC ou ETH uniquement. Tendance positive sur 24 et 72 heures ; 40 % investi au maximum.'},{id:'trend',name:'La Vigie',role:'Suivi de tendance',color:'#b5a0f4',description:'Choisit la tendance la plus forte : moyenne 12 h au-dessus de la moyenne 48 h et progression sur 24 h. Allocation de 80 %.'},{id:'rebound',name:'L’Alchimiste',role:'Retour à la moyenne',color:'#efb375',description:'Cherche un repli de 2 à 12 % sous la moyenne 24 h, avec un rebond sur la dernière heure. Allocation de 50 %.'},{id:'breakout',name:'L’Éclaireur',role:'Cassure de prix',color:'#82d4cb',description:'Entre si la dernière clôture dépasse les 23 clôtures précédentes. Conserve tant que le prix reste au-dessus de la moyenne 12 h. Allocation de 90 %.'}];
const avg=a=>a.reduce((s,x)=>s+x,0)/a.length;
export function signals(m){
 const ranked=tradable(m).map(a=>{const c=m[a].closes;return {a,p:c.at(-1),m12:avg(c.slice(-12)),m24:avg(c.slice(-24)),m48:avg(c.slice(-48)),r24:c.at(-1)/c.at(-25)-1,r72:c.at(-1)/c.at(-73)-1,r1:c.at(-1)/c.at(-2)-1,high:Math.max(...c.slice(-24,-1))}});
 const pick=(arr,alloc,reason)=>arr.length?{weights:{[arr[0].a]:alloc},reason:reason+' · '+arr[0].a}:{weights:{},reason:'Conditions non réunies : réserve en euros.'};
 const prudent=pick(ranked.filter(x=>['BTC','ETH'].includes(x.a)&&x.r24>0&&x.r72>0&&x.p>x.m48).sort((a,b)=>b.r72-a.r72),.4,'Tendance confirmée sur 24 et 72 heures');
 const trend=pick(ranked.filter(x=>x.m12>x.m48&&x.r24>0).sort((a,b)=>b.r24-a.r24),.8,'Moyennes 12 h / 48 h et momentum positifs');
 const rebound=pick(ranked.filter(x=>x.p<x.m24*.98&&x.p>x.m24*.88&&x.r1>0).sort((a,b)=>a.p/a.m24-b.p/b.m24),.5,'Repli sous la moyenne 24 h avec début de rebond');
 const breakout=pick(ranked.filter(x=>x.p>x.high).sort((a,b)=>b.r24-a.r24),.9,'Nouveau sommet des clôtures sur 24 heures');
 return {prudent,trend,rebound,breakout};
}
export function value(b,prices){return b.cash+Object.entries(b.holdings).reduce((s,[a,q])=>{if(!q)return s;if(!(prices[a]>0))throw Error('Cours manquant : '+a);return s+q*prices[a]},0)}
export function rebalance(book,weights,prices){
 const b=structuredClone(book),v=value(b,prices),trades=[]; const fee=.001,slip=.0005; const symbols=[...new Set([...Object.keys(b.holdings),...Object.keys(weights)])];
 for(const a of symbols){const current=(b.holdings[a]||0)*prices[a],target=v*(weights[a]||0);if(current-target>=2){const qty=(current-target)/prices[a],gross=qty*prices[a]*(1-slip),f=gross*fee;b.cash+=gross-f;b.holdings[a]=Math.max(0,(b.holdings[a]||0)-qty);b.fees+=f;b.slippage+=qty*prices[a]*slip;trades.push({side:'Vente',asset:a,amount:gross,qty,price:prices[a]*(1-slip),fee:f});}}
 for(const a of symbols){const current=(b.holdings[a]||0)*prices[a],target=v*(weights[a]||0),gap=target-current;if(gap>=2){const spend=Math.min(gap,b.cash);if(spend<2)continue;const f=spend*fee,qty=(spend-f)/(prices[a]*(1+slip));b.cash-=spend;b.holdings[a]=(b.holdings[a]||0)+qty;b.fees+=f;b.slippage+=qty*prices[a]*slip;trades.push({side:'Achat',asset:a,amount:spend,qty,price:prices[a]*(1+slip),fee:f});}}
 b.trades+=trades.length;return {book:b,trades};
}
export function initial(hour,m){const prices=marketPrices(m);const books={};for(const id of [...profiles.map(p=>p.id),'cash','bitcoin'])books[id]={cash:100,holdings:{},fees:0,slippage:0,trades:0,peak:100,maxDrawdown:0};books.bitcoin=rebalance(books.bitcoin,{BTC:1},prices).book;return {hour,started:Date.now(),market:m,books,decisions:[],missed:0,version:2};}
export function advance(previous,hour,m){const s=structuredClone(previous),prices=marketPrices(m),votes=signals(m); // only completed candles enter signals
 for(const a of tradable(m)){const held=(s.books.breakout.holdings[a]||0)>0,c=m[a].closes;if(held&&c.at(-1)>avg(c.slice(-12))&&!Object.keys(votes.breakout.weights).length)votes.breakout={weights:{[a]:.9},reason:'Maintien au-dessus de la moyenne 12 h · '+a};}
 const weights={};for(const a of tradable(m)){const support=Object.values(votes).filter(v=>v.weights[a]>0);if(support.length>=2)weights[a]=Math.min(.7,support.reduce((n,v)=>n+v.weights[a],0)/4);}
 const sum=Object.values(weights).reduce((a,b)=>a+b,0);if(sum>.7)for(const a of Object.keys(weights))weights[a]*=.7/sum;
 votes.council={weights,reason:Object.keys(weights).length?'Le juge retient les accords de deux conseillers ou plus.':'Le juge constate l’absence de consensus : réserve en euros.'};
 s.decisions=profiles.map(p=>{const out=rebalance(s.books[p.id],votes[p.id].weights,prices);s.books[p.id]=out.book;return {id:p.id,...votes[p.id],trades:out.trades,action:out.trades.length?'Rééquilibrage':'Conserver'};});
 for(const b of Object.values(s.books)){const v=value(b,prices);b.peak=Math.max(b.peak,v);b.maxDrawdown=Math.max(b.maxDrawdown,(b.peak-v)/b.peak);}
 s.missed+=(hour-previous.hour)/3600000-1;s.hour=hour;s.executed=Date.now();s.market=m;s.version=2;return s;
}

export function assessment(m){return Object.fromEntries(Object.entries(m).map(([a,x])=>{const c=x.closes;if(!c||c.length<73||x.eligible===false)return [a,{prudent:'Actif non éligible',trend:'Actif non éligible',rebound:'Actif non éligible',breakout:'Actif non éligible'}];const p=c.at(-1),m12=avg(c.slice(-12)),m24=avg(c.slice(-24)),m48=avg(c.slice(-48)),r24=p/c.at(-25)-1,r72=p/c.at(-73)-1,r1=p/c.at(-2)-1;return [a,{prudent:!['BTC','ETH'].includes(a)?'Hors du périmètre prudent BTC / ETH':r24>0&&r72>0&&p>m48?'Signal valide':'Tendance 24 h / 72 h non confirmée',trend:m12>m48&&r24>0?'Signal valide':'Moyennes ou momentum insuffisants',rebound:p<m24*.98&&p>m24*.88&&r1>0?'Signal valide':'Repli de 2–12 % avec rebond absent',breakout:p>Math.max(...c.slice(-24,-1))?'Signal valide':'Aucun nouveau sommet sur 24 h'}]}))}
