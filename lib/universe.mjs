export const PANEL_LIMIT=50,MIN_VOLUME_EUR=100000;
const excluded=new Set('USD EUR GBP JPY CAD AUD CHF AED USDT USDC DAI USDE USDG USDD TUSD FDUSD PYUSD EURC EURT EURQ EURCV EURR RLUSD USDQ USD1 XAUT PAXG WBTC WETH TBTC'.split(' '));
/** @param {{required?: string[], fetcher?: typeof fetch, now?: number}} options */
export async function scanMarket({required=[],fetcher=fetch,now=Date.now()}={}){
 const hour=Math.floor(now/3600000)*3600;
 async function api(path){const r=await fetcher('https://api.kraken.com/0/public/'+path,{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('Kraken indisponible ('+r.status+')');const j=await r.json();if(j.error?.length)throw Error(j.error.join(', '));return j.result;}
 const [pairs,tickers]=await Promise.all([api('AssetPairs'),api('Ticker')]);const rows=[];
 for(const [key,p] of Object.entries(pairs)){
  if(!p.wsname?.endsWith('/EUR')||p.status!=='online'||p.aclass_base!=='currency')continue;
  let asset=p.wsname.split('/')[0];if(asset==='XBT')asset='BTC';if(asset==='XDG')asset='DOGE';
  if(excluded.has(asset)||asset.endsWith('.d')||/^[A-Z]+\d+[LS]$/.test(asset))continue;
  const t=tickers[key]||tickers[p.altname],v=Number(t?.v?.[1])*Number(t?.p?.[1]);
  rows.push({asset,pair:p.altname,volume24h:Number.isFinite(v)?v:0,eligible:false,reason:'Volume inférieur à 100 000 € sur 24 h.'});
 }
 rows.sort((a,b)=>b.volume24h-a.volume24h||a.asset.localeCompare(b.asset));const seen=new Set(),unique=rows.filter(r=>!seen.has(r.asset)&&seen.add(r.asset)),core=new Set(['BTC','ETH',...required]);
 const selected=unique.filter(r=>r.volume24h>=MIN_VOLUME_EUR).slice(0,PANEL_LIMIT);
 for(const r of unique)if(core.has(r.asset)&&!selected.includes(r))selected.push(r);
 for(const r of unique)if(r.volume24h>=MIN_VOLUME_EUR&&!selected.includes(r))r.reason='Hors des 50 premiers volumes EUR de cette observation.';
 const market={};let index=0;
 async function worker(){while(index<selected.length){const r=selected[index++];try{
  const result=await api('OHLC?interval=60&since='+(hour-74*3600)+'&pair='+encodeURIComponent(r.pair)),candles=Object.entries(result).find(([k])=>k!=='last')?.[1];
  const closed=(Array.isArray(candles)?candles:[]).filter(x=>Number(x[0])<hour).slice(-73);
  if(closed.length!==73||closed.some((x,i)=>Number(x[0])!==hour-(73-i)*3600||!(Number(x[4])>0)))throw Error('Historique horaire incomplet ou périmé.');
  const current=candles.find(x=>Number(x[0])===hour);if(!(Number(current?.[4])>0))throw Error('Cours courant indisponible.');
  r.eligible=selected.indexOf(r)<PANEL_LIMIT&&r.volume24h>=MIN_VOLUME_EUR;r.reason=r.eligible?'Historique de 73 clôtures validé ; volume suffisant.':'Suivi des positions uniquement : hors panel ou volume insuffisant.';
  market[r.asset]={price:Number(current[4]),closes:closed.map(x=>Number(x[4])),asOf:now,change:(Number(closed.at(-1)[4])/Number(closed.at(-25)[4])-1)*100,eligible:r.eligible,volume24h:r.volume24h};
 }catch(e){r.reason=String(e).replace(/^Error: /,'');r.eligible=false;}}}
 await Promise.all([worker(),worker(),worker()]);
 for(const a of core)if(!market[a])throw Error('Collecte interrompue : cours fiable absent pour '+a+'. Les portefeuilles sont conservés.');
 if(!Object.values(market).some(x=>x.eligible))throw Error('Aucune crypto exploitable : aucune décision enregistrée.');
 return {market,universe:{version:2,asOf:now,limit:PANEL_LIMIT,minVolume:MIN_VOLUME_EUR,discovered:unique.length,analyzed:Object.keys(market).length,eligible:Object.values(market).filter(x=>x.eligible).length,rows:unique}};
}
