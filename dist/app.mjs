import { STEP, normalizeKlines, simulate, backtest } from './engine.mjs';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const assets = {
  BTCUSDT:{name:'Bitcoin',short:'BTC',icon:'₿',color:'#e1b358',css:'btc'},
  ETHUSDT:{name:'Ethereum',short:'ETH',icon:'Ξ',color:'#c0bdea',css:'eth'},
  SOLUSDT:{name:'Solana',short:'SOL',icon:'≋',color:'#98d9c0',css:'sol'},
  BNBUSDT:{name:'BNB',short:'BNB',icon:'◇',color:'#d9c378',css:'bnb'},
};
const escape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const price = (v,compact=false) => Number.isFinite(+v) && v !== null ? new Intl.NumberFormat('fr-FR',{minimumFractionDigits:compact?0:2,maximumFractionDigits:compact?0:2}).format(+v) : '—';
const pct = (v, signed=false, digits=2) => Number.isFinite(v) ? new Intl.NumberFormat('fr-FR',{style:'percent',minimumFractionDigits:digits,maximumFractionDigits:digits,signDisplay:signed?'always':'auto'}).format(v) : '—';
const amount = v => Number.isFinite(+v) && v !== null ? new Intl.NumberFormat('fr-FR',{notation:'compact',maximumFractionDigits:2}).format(+v) : '—';
const date = (t,options={}) => new Date(t).toLocaleString('fr-FR',{timeZone:'Europe/Paris',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',...options});
const icon = id => `<svg aria-hidden="true"><use href="#i-${id}"/></svg>`;
let storageWarned = false;
function readStore(key,fallback) { try { return JSON.parse(localStorage.getItem('kline-'+key)) ?? fallback; } catch { return fallback; } }
function writeStore(key,value) { try { localStorage.setItem('kline-'+key,JSON.stringify(value)); return true; } catch { if (!storageWarned) { storageWarned=true; toast('Le navigateur ne permet pas la sauvegarde locale.'); } return false; } }
const rawPrefs = readStore('preferences',{});
const prefs = {
  symbol:assets[rawPrefs?.symbol]?rawPrefs.symbol:'BTCUSDT',
  interval:STEP[rawPrefs?.interval]?rawPrefs.interval:'1h',
  horizon:[12,24,48].includes(rawPrefs?.horizon)?rawPrefs.horizon:24,
  mode:['balanced','recent','neutral'].includes(rawPrefs?.mode)?rawPrefs.mode:'balanced',
  type:['line','candle'].includes(rawPrefs?.type)?rawPrefs.type:'candle',
  motion:rawPrefs?.motion==='none'?'none':'system',
  band:rawPrefs?.band!==false,
  view:['spatial','front','volume'].includes(rawPrefs?.view)?rawPrefs.view:'spatial',
  animate:rawPrefs?.animate!==false,
  effects:rawPrefs?.effects!==false,
  volumes:rawPrefs?.volumes!==false,
};
let history = readStore('history',[]);
if (!Array.isArray(history)) history=[];
history = history.filter(h=>assets[h?.symbol]&&STEP[h?.interval]&&Number.isFinite(h?.median)&&Number.isFinite(h?.timestamp)&&Number.isFinite(h?.delta)).slice(0,30);
let state = {data:[],forecast:null,quotes:{},quoteTime:0,quoteSource:'',origin:null,sourceTime:0,loading:false,snapshot:null,seed:7,zoom:120,hover:null,layout:null,backtest:null,animation:1};
let requestVersion=0,activeController,animationId=0,toastTimer,drawPending=false,backtestVersion=0;
const reducedMotion = () => prefs.motion==='none'||matchMedia('(prefers-reduced-motion: reduce)').matches;
const persist = () => writeStore('preferences',prefs);

function toast(message) { $('#toast').textContent=message; $('#toast').hidden=false; clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('#toast').hidden=true,3600); }
function markSigned(element,value,text) { element.textContent=text; element.classList.toggle('positive',value>=0); element.classList.toggle('negative',value<0); }

function duration() { const hours = prefs.horizon*STEP[prefs.interval]/3600000; return hours<24?`${hours.toLocaleString('fr-FR')} heures`:(hours%24===0?`${hours/24} jour${hours/24>1?'s':''}`:`${hours} heures`); }
function syncControls() {
  $('#asset-select').value=prefs.symbol; $('#model-mode').value=prefs.mode;
  $$('[data-interval]').forEach(b=>{b.classList.toggle('selected',b.dataset.interval===prefs.interval);b.setAttribute('aria-pressed',b.dataset.interval===prefs.interval);});
  $$('[data-horizon]').forEach(b=>{b.classList.toggle('selected',+b.dataset.horizon===prefs.horizon);b.setAttribute('aria-pressed',+b.dataset.horizon===prefs.horizon);});
  $$('[data-type]').forEach(b=>{b.classList.toggle('selected',b.dataset.type===prefs.type);b.setAttribute('aria-pressed',b.dataset.type===prefs.type);});
  $('#horizon-duration').textContent=duration();
  $('#horizon').value=prefs.horizon;
  $('#toggle-band').setAttribute('aria-pressed',prefs.band);
  syncSceneControls();
  $('#zoom-label').textContent=`${Math.min(state.zoom,state.data.length||state.zoom)} bougies`;
  const a=assets[prefs.symbol];
  $('#hero-name').textContent=a.name;$('#hero-symbol').textContent=a.short;
  $('#hero-icon').textContent=a.icon;$('#hero-icon').className='coin-icon '+a.css;
  renderTickers();
}

function renderTickers() {
  $('#ticker-strip').innerHTML=Object.entries(assets).map(([symbol,a])=>{
    const q=state.quotes[symbol],delta=q?+q.priceChangePercent/100:null;
    return `<button class="ticker${symbol===prefs.symbol?' selected':''}" data-symbol="${symbol}" aria-pressed="${symbol===prefs.symbol}" aria-label="Afficher ${a.name}"><span class="coin-icon ${a.css}">${a.icon}</span><span class="ticker-text"><span class="ticker-name">${a.name} <small>${a.short}</small></span><span class="ticker-price">${q?price(q.lastPrice)+' <small>USDT</small>':'—'}</span></span><span class="ticker-side"><span class="ticker-change ${delta!==null?(delta>=0?'positive':'negative'):''}">${delta===null?'—':pct(delta,true)}</span><span class="ticker-source">${q?(state.quoteSource==='live'?'24 h':'archive'):'24 h'}</span></span></button>`;
  }).join('');
  $$('[data-symbol]').forEach(b=>b.addEventListener('click',()=>selectSymbol(b.dataset.symbol)));
}

function updateMarketSummary() {
  const q=state.quotes[prefs.symbol];
  $('#main-price').textContent=q?price(q.lastPrice):state.data.length?price(state.data.at(-1).close):'—';
  $('#main-price').setAttribute('aria-label',`Prix en USDT : ${$('#main-price').textContent}`);
  if(q) markSigned($('#main-change'),+q.priceChangePercent,pct(+q.priceChangePercent/100,true)+' sur 24 h · USDT');
  else {$('#main-change').textContent=state.data.length?'Dernière clôture · USDT':'Cotations indisponibles';$('#main-change').className='';}
  $('#day-high').textContent=q?price(q.highPrice):'—'; $('#day-low').textContent=q?price(q.lowPrice):'—';$('#day-volume').textContent=q?amount(q.quoteVolume):'—';
  const recent=state.data.slice(-32);
  for (const [selector,key] of [['.metric-spark.green path','high'],['.metric-spark.purple path','low']]) {
    const values=recent.map(c=>c[key]),lo=Math.min(...values),hi=Math.max(...values),span=hi-lo||1;
    $(selector).setAttribute('d',values.map((v,i)=>`${i?'L':'M'}${i*160/(values.length-1)} ${23-(v-lo)/span*21}`).join(' '));
  }
}

async function api(path,signal) {
  const response=await fetch('https://data-api.binance.vision/api/v3/'+path,{signal,cache:'no-store',referrerPolicy:'no-referrer'});
  if (!response.ok) throw new Error(`Le fournisseur répond ${response.status}.`);
  return response.json();
}
async function loadSnapshot() {
  if(state.snapshot) return state.snapshot;
  const response=await fetch('./snapshot.json');
  if(!response.ok) throw new Error('Archive locale indisponible.');
  state.snapshot=await response.json(); return state.snapshot;
}
function validateQuotes(rows) {
  if(!Array.isArray(rows)) throw new Error('Cotations 24 h invalides.');
  const result={};
  rows.forEach(q=>{if(assets[q.symbol] && [q.lastPrice,q.priceChangePercent,q.highPrice,q.lowPrice,q.quoteVolume].every(v=>v!==null&&v!==''&&Number.isFinite(+v)) && +q.lastPrice>0) result[q.symbol]=q;});
  if(!Object.keys(result).length) throw new Error('Aucune cotation valide.');
  return result;
}

async function loadMarket() {
  const version=++requestVersion, symbol=prefs.symbol,interval=prefs.interval;
  backtestVersion++;
  activeController?.abort();activeController=new AbortController();
  const timeout=setTimeout(()=>activeController.abort(),12000),signal=activeController.signal;
  state.loading=true;state.forecast=null;state.backtest=null;state.hover=null;
  $('#chart-loading').hidden=false;$('#chart-error').hidden=true;$('#chart-tooltip').hidden=true;
  $('#run-forecast').disabled=true;$('#run-backtest').disabled=true;$('#export-csv').disabled=true;
  $('#backtest-results').hidden=true;$('#run-backtest').hidden=false;$('#run-backtest').textContent='Vérifier sur l’historique';
  $('#source-status').innerHTML='<span class="dot amber"></span> Actualisation…';
  $('#forecast-price').textContent='—';$('#forecast-delta').textContent='—';$('#forecast-low').textContent='—';$('#forecast-high').textContent='—';$('#upside').textContent='—';
  $('#forecast-end').textContent='—';$('#anchor-label').textContent='Lecture des cotations…';$('#distribution').replaceChildren();
  syncControls();
  const results=await Promise.allSettled([
    api(`klines?symbol=${symbol}&interval=${interval}&limit=500`,signal),
    api('ticker/24hr?symbols='+encodeURIComponent(JSON.stringify(Object.keys(assets))),signal)
  ]);
  clearTimeout(timeout); if(version!==requestVersion) return;
  let rows,sourceTime=Date.now(),origin='live',quoteSource='live';
  try {
    if(results[0].status!=='fulfilled') throw new Error('Les bougies ne sont pas accessibles.');
    rows=results[0].value;normalizeKlines(rows);
    writeStore(`market-${symbol}-${interval}`,{rows,time:sourceTime});
  } catch {
    origin='archive';
    let cached=readStore(`market-${symbol}-${interval}`,null),snapshot;
    try {snapshot=await loadSnapshot();}catch{}
    if(version!==requestVersion)return;
    const bundled=snapshot?.markets?.[symbol]?.[interval];
    if(cached?.rows && Number.isFinite(cached.time) && (!bundled||cached.time>snapshot.fetchedAt)) {
      rows=cached.rows;sourceTime=cached.time;
    } else if(bundled) {rows=bundled;sourceTime=snapshot.fetchedAt;}
    else rows=null;
  }
  if(version!==requestVersion) return;
  if(results[1].status==='fulfilled') {
    try {state.quotes=validateQuotes(results[1].value);state.quoteTime=Date.now();writeStore('quotes',{quotes:state.quotes,time:state.quoteTime});}
    catch {quoteSource='missing';state.quotes={};}
  } else {
    quoteSource='archive';let cached=readStore('quotes',null),snapshot=state.snapshot;
    if(!snapshot) {try {snapshot=await loadSnapshot();}catch{}}
    if(version!==requestVersion)return;
    if(cached?.quotes && Number.isFinite(cached.time)&&cached.time>(snapshot?.fetchedAt||0)) {state.quotes=cached.quotes;state.quoteTime=cached.time;}
    else {state.quotes=snapshot?.quotes||{};state.quoteTime=snapshot?.fetchedAt||0;}
  }
  state.quoteSource=quoteSource;
  try {
    if(!rows) throw new Error('Le flux de cotations et l’archive locale sont indisponibles.');
    state.data=normalizeKlines(rows);state.origin=origin;state.sourceTime=sourceTime;state.loading=false;
    $('#chart-loading').hidden=true;
    $('#run-forecast').disabled=false;$('#run-backtest').disabled=false;$('#export-csv').disabled=false;
    $('#chart-dot').classList.toggle('amber',origin!=='live');
    $('#chart-timestamp').textContent=(origin==='live'?'Cotations reçues ':'Archive du ')+date(sourceTime)+' · Paris';
    const allLive=origin==='live'&&quoteSource==='live';
    $('#source-status').innerHTML=`<span class="dot${allLive?'':' amber'}"></span> ${allLive?'Flux public · '+date(sourceTime,{day:undefined,month:undefined})+' Paris':origin==='archive'?'Archive · '+date(sourceTime):'Cotations 24 h indisponibles ou archivées'}`;
    $('#data-banner').hidden=allLive;
    if(!allLive) {
      $('#data-banner').innerHTML=`<span>${origin==='archive'?`Graphique en mode archive : cotations enregistrées le ${escape(date(sourceTime))} (Paris). Les scénarios partent de cette archive.`:'Le graphique utilise le flux public actuel.'} ${quoteSource==='archive'?`Les indicateurs sur 24 h datent du ${escape(date(state.quoteTime))}.`:quoteSource==='missing'?'Les indicateurs sur 24 h sont indisponibles.':''}</span><button id="refresh-data">Réessayer le direct</button>`;
      $('#refresh-data').addEventListener('click',loadMarket);
    }
    renderTickers();updateMarketSummary();generateForecast(false,false);
  } catch(error) {
    state.data=[];state.forecast=null;state.loading=false;
    $('#chart-loading').hidden=true;$('#chart-error').hidden=false;$('#chart-error-message').textContent=error.message;
    $('#source-status').innerHTML='<span class="dot amber"></span> Cotations indisponibles';
    $('#data-banner').hidden=true;
    $('#main-price').textContent='—';$('#main-change').textContent='Données indisponibles';
    $('#chart-timestamp').textContent='Aucune donnée disponible';
    $('#day-high').textContent='—';$('#day-low').textContent='—';$('#day-volume').textContent='—';$('#volatility').textContent='—';
    renderTickers();drawChart();
  }
}

function generateForecast(record=true,animate=true) {
  if(state.loading||!state.data.length) return;
  try {
    state.seed = record ? (Date.now()%2147483647) : 7;
    state.forecast=simulate(state.data,{...prefs,seed:state.seed});
    const f=state.forecast,end=f.bands.at(-1);
    $('#forecast-price').textContent=price(end.median);
    markSigned($('#forecast-delta'),f.delta,pct(f.delta,true));
    $('#forecast-low').textContent=price(end.p10);$('#forecast-high').textContent=price(end.p90);
    $('#forecast-end').textContent=date(end.time+STEP[prefs.interval]-1,{month:'numeric'});
    $('#upside').textContent=pct(f.upside,false,1);
    $('#volatility').textContent=pct(f.sigma);$('#volatility-period').textContent='Écart type par bougie de '+({'15m':'15 min','1h':'1 h','4h':'4 h','1d':'1 j'}[prefs.interval]);
    $('#anchor-label').textContent=`Base : ${price(f.anchor.close)} USDT · clôture du ${date(f.anchor.end)} (Paris).`;
    $('#range-marker').style.left=Math.max(0,Math.min(98,(end.median-end.p10)/(end.p90-end.p10||1)*100))+'%';
    $('#distribution').innerHTML=Array.from({length:40},(_,i)=>`<i class="${i/40<f.upside?'':'down'}" style="height:${5+7*Math.sin((i+.5)/40*Math.PI)}px"></i>`).join('');
    $('#chart').setAttribute('aria-label',`${assets[prefs.symbol].name}, ${state.origin==='archive'?'archive':'cotations publiques'}, dernière clôture ${price(f.anchor.close)} USDT. Médiane des scénarios à ${duration()} : ${price(end.median)} USDT, enveloppe ${price(end.p10)} à ${price(end.p90)} USDT. Simulation statistique, Kronos non connecté.`);
    if(record) {
      history.unshift({symbol:prefs.symbol,interval:prefs.interval,horizon:prefs.horizon,mode:prefs.mode,timestamp:Date.now(),median:end.median,delta:f.delta,anchor:f.anchor.close,baseTime:f.anchor.end,source:state.origin,sourceTime:state.sourceTime,seed:f.seed});
      history=history.slice(0,30);const saved=writeStore('history',history);$('#history-dot').hidden=false;
      toast(saved?'512 scénarios calculés · simulation enregistrée.':'512 scénarios calculés · conservés pour cette session.');
    }
    cancelAnimationFrame(animationId);
    if(animate&&!reducedMotion()&&sceneStatus!=='ready') {
      const start=performance.now();state.animation=0;
      const frame=now=>{state.animation=Math.min(1,(now-start)/500);drawChart();if(state.animation<1)animationId=requestAnimationFrame(frame);};
      animationId=requestAnimationFrame(frame);
    } else {state.animation=1;drawChart();}
    $('#forecast-result').classList.remove('fade-in');requestAnimationFrame(()=>$('#forecast-result').classList.add('fade-in'));
  } catch(e) {toast(e.message);}
}
function clearBacktest() {state.backtest=null;backtestVersion++;$('#backtest-results').hidden=true;$('#run-backtest').hidden=false;$('#run-backtest').disabled=!state.data.length||state.loading;$('#run-backtest').innerHTML='Vérifier sur l’historique '+icon('arrow');}
function selectSymbol(symbol) {if(symbol===prefs.symbol)return;prefs.symbol=symbol;persist();loadMarket();}

// Canvas renderer: idle pages do no rendering work. Hover and resize are coalesced.
const canvas=$('#chart'),ctx=canvas.getContext('2d');
let spatialScene=null,sceneStatus='pending';
function syncSceneControls() {
  $$('[data-camera]').forEach(b=>{b.classList.toggle('selected',b.dataset.camera===prefs.view);b.setAttribute('aria-pressed',b.dataset.camera===prefs.view);});
  $('#scene-pair').textContent=assets[prefs.symbol].short+' / USDT';
  for(const [id,active] of [['scene-volumes',prefs.volumes],['scene-effects',prefs.effects],['scene-animate',prefs.animate&&!reducedMotion()]])$('#'+id).setAttribute('aria-pressed',active);
  const motion=prefs.animate&&!reducedMotion();
  $('#scene-animate span').textContent=motion?'Pause':'Animer';$('#scene-animate use').setAttribute('href',motion?'#i-pause':'#i-play');
  $('#scene-animate').setAttribute('title',reducedMotion()?'Animations désactivées dans vos préférences':motion?'Mettre les animations en pause':'Animer les effets');$('#scene-animate').disabled=reducedMotion();
}
function syncScene() {if(spatialScene)spatialScene.update({data:state.data,forecast:state.forecast,prefs:{...prefs},zoom:state.zoom,origin:state.origin,description:canvas.getAttribute('aria-label')});}
function sceneFallback() {
  if(sceneStatus==='fallback')return;
  sceneStatus='fallback';try{spatialScene?.dispose();}catch{}spatialScene=null;
  $('#scene-canvas').hidden=true;$('#scene-interface').hidden=true;canvas.hidden=false;canvas.removeAttribute('aria-hidden');canvas.tabIndex=0;
  $('#chart-panel').classList.remove('spatial-ready');$('#scene-fallback').hidden=false;scheduleDraw();
}
async function initializeScene() {
  try {
    const {MarketScene}=await import('./market-scene.mjs');
    spatialScene=new MarketScene({canvas:$('#scene-canvas'),container:$('#chart-container'),labels:$('#scene-labels'),tooltip:$('#chart-tooltip'),onFailure:sceneFallback});
    sceneStatus='ready';$('#scene-canvas').hidden=false;$('#scene-interface').hidden=false;canvas.hidden=true;canvas.setAttribute('aria-hidden','true');canvas.tabIndex=-1;
    $('#chart-panel').classList.add('spatial-ready');$('#chart-hint').textContent='Survol : valeurs · Double clic : recentrer';syncScene();
  } catch {sceneFallback();}
}
const colors={grid:'#24372e',muted:'#6c8e79',up:'#83bda1',down:'#c67f87',forecast:'#a4f1c9'};
function scheduleDraw() { if(drawPending)return;drawPending=true;requestAnimationFrame(()=>{drawPending=false;drawChart();}); }
function drawChart() {
  if(sceneStatus==='ready'&&spatialScene){try{syncScene();return;}catch{sceneFallback();}}
  const rect=canvas.getBoundingClientRect(),w=rect.width,h=rect.height;
  if(!w||!h)return;
  const dpr=Math.min(devicePixelRatio||1,2);
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  if(!state.data.length)return;
  const data=state.data.slice(-Math.min(state.zoom,state.data.length)),forecast=state.forecast?.bands||[],n=data.length;
  const showBands=prefs.band&&forecast.length;
  const left=8,right=w<420?61:72,top=23,bottom=h-39,volumeHeight=Math.min(52,h*.15),priceBottom=bottom-volumeHeight-18;
  const plotW=w-left-right,plotH=priceBottom-top;
  const visibleForecast=Math.max(forecast.length,12),step=plotW/(n+visibleForecast+5);
  const x=i=>left+(i+.5)*step;
  const extrema=[...data.flatMap(c=>[c.low,c.high]),...forecast.flatMap(c=>showBands?[c.p10,c.p90]:[c.median])];
  const min=Math.min(...extrema),max=Math.max(...extrema),pad=(max-min)*.13||max*.01;
  const lo=min-pad,hi=max+pad,span=hi-lo;
  const y=v=>priceBottom-(v-lo)/span*plotH;
  const chartEnd=w-right,forecastStart=x(n-1);
  state.layout={w,h,left,right,top,bottom,priceBottom,n,data,forecast,step,x,y,lo,hi};
  ctx.font='9px "DM Sans",system-ui,sans-serif';ctx.textBaseline='middle';ctx.lineWidth=.6;
  for(let i=0;i<=5;i++) {
    const yy=top+plotH*i/5,value=hi-span*i/5;
    ctx.strokeStyle=colors.grid;ctx.setLineDash([2,5]);ctx.beginPath();ctx.moveTo(left,yy);ctx.lineTo(chartEnd,yy);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle=colors.muted;ctx.textAlign='left';ctx.fillText(price(value,true),chartEnd+10,yy);
  }
  ctx.fillStyle='#7e9b88';ctx.font='8px "DM Sans",system-ui,sans-serif';ctx.fillText('USDT',chartEnd+10,10);
  if(forecast.length) {
    const futureTint=ctx.createLinearGradient(forecastStart,0,chartEnd,0);futureTint.addColorStop(0,'#88e9af02');futureTint.addColorStop(1,'#88e9af09');ctx.fillStyle=futureTint;ctx.fillRect(forecastStart,top,chartEnd-forecastStart,bottom-top);
    ctx.strokeStyle='#4d705746';ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(forecastStart,top);ctx.lineTo(forecastStart,bottom);ctx.stroke();ctx.setLineDash([]);
    const fLabel=w<500?'SCÉNARIOS':'SCÉNARIOS STATISTIQUES';ctx.fillStyle='#7fab8f';ctx.font='7px "DM Sans",system-ui,sans-serif';ctx.textAlign='center';
    ctx.fillText(fLabel,Math.min((forecastStart+chartEnd)/2,chartEnd-30),10);
  }
  const maxVol=Math.max(...data.map(c=>c.volume))||1;
  for(let i=0;i<n;i++) {
    const c=data[i],xx=x(i),cw=Math.max(1,Math.min(8,step*.61)),up=c.close>=c.open;
    ctx.fillStyle=up?'#63917b48':'#a3667540';
    ctx.fillRect(xx-cw/2,bottom-(c.volume/maxVol)*volumeHeight,cw,Math.max(1,(c.volume/maxVol)*volumeHeight));
    if(prefs.type==='candle') {
      ctx.strokeStyle=up?colors.up:colors.down;ctx.lineWidth=.85;ctx.beginPath();ctx.moveTo(xx,y(c.high));ctx.lineTo(xx,y(c.low));ctx.stroke();
      ctx.fillStyle=up?colors.up:colors.down;ctx.fillRect(xx-cw/2,Math.min(y(c.open),y(c.close)),cw,Math.max(1,Math.abs(y(c.open)-y(c.close))));
    }
  }
  if(prefs.type==='line') {
    const gradient=ctx.createLinearGradient(0,top,0,priceBottom);gradient.addColorStop(0,'#91dbb52c');gradient.addColorStop(1,'#91dbb500');
    ctx.beginPath();data.forEach((c,i)=>i?ctx.lineTo(x(i),y(c.close)):ctx.moveTo(x(i),y(c.close)));ctx.lineTo(x(n-1),priceBottom);ctx.lineTo(x(0),priceBottom);ctx.closePath();ctx.fillStyle=gradient;ctx.fill();
    ctx.beginPath();data.forEach((c,i)=>i?ctx.lineTo(x(i),y(c.close)):ctx.moveTo(x(i),y(c.close)));ctx.strokeStyle='#8cbea4';ctx.lineWidth=1.5;ctx.stroke();
  }
  const anchor=data.at(-1),anchorY=y(anchor.close);
  ctx.strokeStyle='#7a9c7b50';ctx.lineWidth=.7;ctx.setLineDash([2,4]);ctx.beginPath();ctx.moveTo(left,anchorY);ctx.lineTo(chartEnd,anchorY);ctx.stroke();ctx.setLineDash([]);
  if(forecast.length) {
    ctx.save();ctx.beginPath();ctx.rect(forecastStart-2,top-2,(chartEnd-forecastStart+2)*state.animation,priceBottom-top+4);ctx.clip();
    const band=(low,high,fill)=>{
      ctx.beginPath();ctx.moveTo(forecastStart,anchorY);forecast.forEach((c,i)=>ctx.lineTo(x(n+i),y(c[high])));for(let i=forecast.length-1;i>=0;i--)ctx.lineTo(x(n+i),y(forecast[i][low]));ctx.closePath();ctx.fillStyle=fill;ctx.fill();
    };
    if(showBands) {band('p10','p90','#87e3a612');band('p25','p75','#87e3a619');
      for(const key of ['p10','p90']) {ctx.strokeStyle='#8acb9e2b';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(forecastStart,anchorY);forecast.forEach((c,i)=>ctx.lineTo(x(n+i),y(c[key])));ctx.stroke();}
    }
    ctx.beginPath();ctx.moveTo(forecastStart,anchorY);forecast.forEach((c,i)=>ctx.lineTo(x(n+i),y(c.median)));ctx.strokeStyle=colors.forecast;ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.stroke();ctx.setLineDash([]);
    ctx.restore();
    ctx.beginPath();ctx.arc(forecastStart,anchorY,3,0,Math.PI*2);ctx.shadowColor='#a6fac4';ctx.shadowBlur=11;ctx.fillStyle='#b1facb';ctx.fill();ctx.shadowBlur=0;
    const end=forecast.at(-1),ey=y(end.median);
    if(state.animation===1){ctx.beginPath();ctx.arc(x(n+forecast.length-1),ey,2,0,Math.PI*2);ctx.fillStyle='#b1facb';ctx.fill();}
    const yy=Math.max(top+9,Math.min(priceBottom-8,ey));
    ctx.fillStyle='#a9eec2';ctx.fillRect(chartEnd+4,yy-9,right-7,18);ctx.fillStyle='#102e1b';ctx.textAlign='center';ctx.font='600 9px "DM Sans",system-ui,sans-serif';ctx.fillText(price(end.median,true),chartEnd+4+(right-7)/2,yy);
  }
  ctx.strokeStyle='#293f32';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(left,bottom+5);ctx.lineTo(chartEnd,bottom+5);ctx.stroke();
  ctx.font='8px "DM Sans",system-ui,sans-serif';ctx.fillStyle='#6f917d';ctx.textAlign='center';
  const labels=Math.max(3,Math.floor(plotW/110)),total=n+forecast.length;
  for(let i=0;i<labels;i++) {
    const idx=Math.round(i*(total-1)/(labels-1));let time=idx<n?data[idx].time:forecast[idx-n]?.time;if(!time)continue;
    const daily=prefs.interval==='1d';const text=new Date(time).toLocaleString('fr-FR',{timeZone:'Europe/Paris',...(daily?{day:'2-digit',month:'short'}:{hour:'2-digit',minute:'2-digit',...(prefs.interval==='4h'?{day:'2-digit',month:'numeric'}:{})})});
    const half=ctx.measureText(text).width/2;
    ctx.fillText(text,Math.max(left+half,Math.min(chartEnd-half,x(idx))),bottom+21);
  }
  ctx.textAlign='left';ctx.font='7px "DM Sans",system-ui,sans-serif';ctx.fillStyle='#63816c';ctx.fillText('VOL.',left+2,bottom-volumeHeight-7);
  if(state.hover)drawHover();
}

function drawHover() {
  const l=state.layout;if(!l||!state.hover)return;
  const index=Math.max(0,Math.min(l.n+l.forecast.length-1,Math.round((state.hover.x-l.left)/l.step-.5)));
  const isForecast=index>=l.n,c=isForecast?l.forecast[index-l.n]:l.data[index];if(!c)return;
  const xx=l.x(index),value=isForecast?c.median:c.close,yy=l.y(value);
  ctx.save();ctx.strokeStyle='#aacbb086';ctx.lineWidth=.6;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(xx,l.top);ctx.lineTo(xx,l.bottom);ctx.moveTo(l.left,yy);ctx.lineTo(l.w-l.right,yy);ctx.stroke();ctx.setLineDash([]);
  ctx.beginPath();ctx.arc(xx,yy,3,0,Math.PI*2);ctx.fillStyle='#cce8c9';ctx.fill();ctx.restore();
  const tooltip=$('#chart-tooltip');
  tooltip.innerHTML=isForecast?`<small>SCÉNARIO · ${escape(date(c.time))}</small><strong>${price(c.median)} USDT</strong><span>10–90 % : ${price(c.p10)} – ${price(c.p90)}</span>`:`<small>${escape(date(c.time))} · PARIS</small><strong>${price(c.close)} USDT</strong><span>O ${price(c.open)} · H ${price(c.high)}<br>B ${price(c.low)} · C ${price(c.close)}</span>`;
  tooltip.hidden=false;tooltip.style.left=Math.max(5,Math.min(l.w-210,xx>l.w*.6?xx-205:xx+13))+'px';tooltip.style.top=Math.max(28,Math.min(l.h-115,yy-55))+'px';
  $('#ohlc').textContent=isForecast?'Projection · '+price(c.median):`O ${price(c.open)} H ${price(c.high)} B ${price(c.low)} C ${price(c.close)}`;
}
function hideHover(){state.hover=null;$('#chart-tooltip').hidden=true;$('#ohlc').textContent='Bougies clôturées';scheduleDraw();}
canvas.addEventListener('pointermove',e=>{if(state.loading)return;const r=canvas.getBoundingClientRect();state.hover={x:e.clientX-r.left,y:e.clientY-r.top};scheduleDraw();});
canvas.addEventListener('pointerleave',hideHover);
canvas.addEventListener('pointerup',e=>{if(e.pointerType==='touch')setTimeout(hideHover,2500);});
canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Escape'].includes(e.key)||!state.layout)return;e.preventDefault();if(e.key==='Escape'){hideHover();return;}const l=state.layout,old=state.hover?Math.round((state.hover.x-l.left)/l.step-.5):l.n-1,i=Math.max(0,Math.min(l.n+l.forecast.length-1,old+(e.key==='ArrowRight'?1:-1)));state.hover={x:l.x(i),y:0};scheduleDraw();});
canvas.addEventListener('wheel',e=>{if(!state.data.length||Math.abs(e.deltaY)<2)return;e.preventDefault();changeZoom(e.deltaY>0?20:-20);},{passive:false});
new ResizeObserver(scheduleDraw).observe($('#chart-container'));
function changeZoom(delta) {state.zoom=Math.max(40,Math.min(360,state.data.length,state.zoom+delta));hideHover();$('#zoom-label').textContent=state.zoom+' bougies';scheduleDraw();}

function showDialog(kind) {
  const body=$('#dialog-body');
  if(kind==='method') {
    $('#dialog-title').textContent='Ce que les courbes racontent.';
    body.innerHTML=`<div class="dialog-callout"><strong>Le moteur actif est un bootstrap statistique.</strong><br>Kronos n’est pas installé ni connecté à cette application. Les chiffres affichés ne proviennent pas de ce modèle d’IA.</div><h3>Des observations aux scénarios</h3><p>Les cours OHLCV proviennent de l’API publique de Binance, pour les paires en USDT. Le graphique et les calculs utilisent uniquement les bougies clôturées. La cotation instantanée et les indicateurs sur 24 h peuvent être plus récents que la clôture de référence.</p><p>Le moteur prélève des blocs de 4 variations logarithmiques dans les ${prefs.mode==='recent'?'64':'128'} dernières variations. Il génère 512 trajectoires. La lecture équilibrée et la lecture récente réduisent de moitié la dérive moyenne observée ; la lecture neutre impose une dérive nulle. Les calculs restent locaux à votre navigateur.</p><h3>Bien lire l’enveloppe</h3><p>La ligne est la médiane des trajectoires, la zone centrale les quantiles 25–75 %, la zone externe les quantiles 10–90 %. Ces quantiles décrivent la distribution simulée. Ils ne constituent pas un intervalle de confiance calibré sur les cours futurs. « Trajectoires en hausse » est la proportion des 512 scénarios qui terminent au-dessus de la clôture de départ.</p><h3>Une vérification sur le passé</h3><p>Le test avance chronologiquement sur ${state.backtest?.count||'jusqu’à 8'} fenêtres non superposées. Il masque chaque fenêtre avant la simulation (256 trajectoires), puis compare la médiane finale au vrai cours. L’erreur relative moyenne est comparée à une référence simple : conserver le dernier cours connu. La couverture mesure la fréquence des clôtures finales dans l’enveloppe 10–90 %. Cet échantillon reste court et ne mesure aucune rentabilité de trading.</p><h3>Sources & transparence</h3><p><a href="https://github.com/binance/binance-spot-api-docs/blob/master/faqs/market_data_only.md" target="_blank" rel="noopener noreferrer">Documentation des données publiques Binance ↗</a><br><a href="https://github.com/shiyu-coder/Kronos" target="_blank" rel="noopener noreferrer">Kronos, projet original ↗</a><br><a href="https://arxiv.org/abs/2508.02739" target="_blank" rel="noopener noreferrer">Publication scientifique Kronos ↗</a></p><p>Les USDT ne sont pas convertis en euros. Les données de repli sont signalées comme archives, avec leur date. Les variations futures peuvent sortir de toutes les trajectoires simulées.</p>${state.forecast?`<h3>Cette simulation</h3><p>Graine reproductible : <code>${state.forecast.seed}</code> · ${state.forecast.paths} trajectoires · ${state.forecast.window} variations · horizon ${prefs.horizon} bougies. Source du graphique : ${state.origin==='live'?'flux public reçu le':'archive enregistrée le'} ${escape(date(state.sourceTime))} (Paris).</p>`:''}`;
    body.insertAdjacentHTML('beforeend','<h3>Lire la scène 3D</h3><p>Le temps progresse vers la droite et les prix vers le haut, sur une échelle linéaire. La profondeur est un relief visuel : elle ne représente pas une autre donnée financière. Le tunnel touche les quantiles 10 et 90 % ; son cœur suit les quantiles 25 et 75 %. Les barres du bas représentent les volumes, avec une hauteur normalisée séparément des prix.</p><p>Glissez pour faire pivoter la scène et utilisez la molette pour vous approcher. Sur mobile, activez « Manipuler » pour la rotation tactile, puis « Terminer » pour reprendre le défilement. La vue « Face » facilite la lecture. Les flèches du clavier parcourent les bougies et les scénarios, R recentre la caméra. « Pause » fige les effets.</p>');
  } else if(kind==='history') {
    $('#dialog-title').textContent='Vos explorations.';$('#history-dot').hidden=true;
    body.innerHTML=`<p>Les 30 dernières simulations manuelles sont conservées sur ce navigateur. Elles ne se mettent pas à jour après leur calcul.</p>`+(history.length?history.map(h=>`<div class="history-item"><strong>${assets[h.symbol].name} <small>· ${h.horizon} × ${h.interval}</small></strong><span class="history-delta ${h.delta>=0?'positive':'negative'}">${pct(h.delta,true)}</span><span>Médiane : ${price(h.median)} USDT</span><small>${escape(date(h.timestamp))} · ${h.source==='archive'?'ARCHIVE':'données publiques'} · graine ${h.seed}</small></div>`).join(''):'<div class="history-empty">Une première hypothèse ?<br>Générez des scénarios pour retrouver votre simulation ici.</div>');
  } else {
    $('#dialog-title').textContent='Votre laboratoire.';
    body.innerHTML=`<div class="settings-row"><div><strong>Animations</strong><p>Le mouvement réduit fige les effets de la scène.</p></div><select id="motion-setting" aria-label="Animation des courbes"><option value="system">Selon le système</option><option value="none">Désactivées</option></select></div><div class="settings-row"><div><strong>Sauvegarde locale</strong><p>Crypto, intervalle, horizon, graphique et historique.</p></div><span>Ce navigateur</span></div><div class="settings-row"><div><strong>Actualiser les cotations</strong><p>Récupérer les dernières données publiques.</p></div><button id="refresh-setting" class="subtle-btn">Actualiser</button></div><div class="settings-actions"><button id="clear-history" class="subtle-btn">Effacer l’historique local</button><button id="default-view" class="subtle-btn">Réinitialiser la vue</button></div>`;
    $('#motion-setting').value=prefs.motion;$('#motion-setting').addEventListener('change',e=>{prefs.motion=e.target.value;syncSceneControls();drawChart();if(writeStore('preferences',prefs))toast('Préférence enregistrée.');});
    $('#refresh-setting').addEventListener('click',()=>{$('#dialog').close();loadMarket();});
    $('#clear-history').addEventListener('click',()=>{history=[];const saved=writeStore('history',history);$('#history-dot').hidden=true;toast(saved?'Historique local effacé.':'Historique effacé pour cette session.');});
    $('#default-view').addEventListener('click',()=>{prefs.type='candle';prefs.horizon=24;prefs.mode='balanced';prefs.band=true;prefs.view='spatial';prefs.volumes=true;state.zoom=120;persist();syncControls();generateForecast(false);spatialScene?.resetCamera();clearBacktest();$('#dialog').close();toast('Vue réinitialisée.');});
  }
  $('#dialog-eyebrow').textContent='KLINE / '+({method:'LA MÉTHODE',history:'HISTORIQUE',settings:'RÉGLAGES'}[kind]);
  $('#dialog').showModal();
}

$$('[data-dialog]').forEach(b=>b.addEventListener('click',()=>showDialog(b.dataset.dialog)));
$('#close-dialog').addEventListener('click',()=>$('#dialog').close());
$('#dialog').addEventListener('click',e=>{const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.currentTarget.close();});
$('#asset-select').addEventListener('change',e=>selectSymbol(e.target.value));
$$('[data-interval]').forEach(b=>b.addEventListener('click',()=>{if(prefs.interval===b.dataset.interval)return;prefs.interval=b.dataset.interval;persist();loadMarket();}));
$$('[data-type]').forEach(b=>b.addEventListener('click',()=>{prefs.type=b.dataset.type;persist();syncControls();drawChart();}));
$$('[data-horizon]').forEach(b=>b.addEventListener('click',()=>{prefs.horizon=+b.dataset.horizon;persist();syncControls();clearBacktest();generateForecast(false);}));
$('#model-mode').addEventListener('change',e=>{prefs.mode=e.target.value;persist();clearBacktest();generateForecast(false);});
$('#run-forecast').addEventListener('click',()=>{
  const version=requestVersion;
  $('#run-forecast').disabled=true;$('#run-forecast span').textContent='Calcul des trajectoires…';
  requestAnimationFrame(()=>setTimeout(()=>{if(version!==requestVersion)return;generateForecast(true);$('#run-forecast').disabled=false;$('#run-forecast span').textContent='Générer les scénarios';},0));
});
$('#toggle-band').addEventListener('click',()=>{prefs.band=!prefs.band;persist();syncControls();drawChart();});
$('#zoom-in').addEventListener('click',()=>changeZoom(-20));$('#zoom-out').addEventListener('click',()=>changeZoom(20));
$('#reset-view').addEventListener('click',()=>{state.zoom=120;syncControls();hideHover();drawChart();spatialScene?.resetCamera();});
$('#expand-chart').addEventListener('click',()=>{
  const expanded=$('#chart-panel').classList.toggle('is-expanded');
  $('#expand-chart').setAttribute('aria-label',expanded?'Réduire le graphique':'Agrandir le graphique');$('#expand-chart').setAttribute('aria-expanded',expanded);scheduleDraw();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#chart-panel').classList.contains('is-expanded')){$('#chart-panel').classList.remove('is-expanded');$('#expand-chart').setAttribute('aria-expanded','false');$('#expand-chart').setAttribute('aria-label','Agrandir le graphique');scheduleDraw();}});
$('#retry').addEventListener('click',loadMarket);
$('#run-backtest').addEventListener('click',()=>{
  if(!state.data.length||state.loading)return;const version=++backtestVersion,marketVersion=requestVersion,opts={...prefs};
  $('#run-backtest').disabled=true;$('#run-backtest').textContent='Comparaison des fenêtres…';
  requestAnimationFrame(()=>setTimeout(()=>{
    if(version!==backtestVersion||marketVersion!==requestVersion)return;
    try {state.backtest=backtest(state.data,opts);const b=state.backtest;
      $('#backtest-results').innerHTML=`<div class="backtest-stats"><div><span>Erreur médiane simulée</span><strong>${pct(b.mape)}</strong></div><div><span>Dernier cours constant</span><strong>${pct(b.naive)}</strong></div><div><span>Couverture</span><strong>${pct(b.coverage,false,0)}</strong></div></div><p>${b.count} fenêtres de ${prefs.horizon} bougies. Erreur relative sur la clôture finale ; plus faible = mieux. ${b.mape<b.naive?'Sur cet échantillon, la médiane fait mieux que le cours constant.':'Sur cet échantillon, le cours constant fait aussi bien ou mieux.'}</p>`;
      $('#backtest-results').hidden=false;$('#run-backtest').hidden=true;
    }catch(e){toast(e.message);$('#run-backtest').textContent='Vérifier sur l’historique';$('#run-backtest').disabled=false;}
  },0));
});
$('#export-csv').addEventListener('click',()=>{
  if(!state.forecast)return;
  const rows=[['type','paire','intervalle','ouverture_bougie_utc','open','high','low','close','volume','quantile_10','mediane','quantile_90','source','donnees_recues_utc','moteur','graine']];
  const common=[state.origin,new Date(state.sourceTime).toISOString(),'bootstrap_statistique',state.forecast.seed];
  state.data.forEach(c=>rows.push(['historique',prefs.symbol,prefs.interval,new Date(c.time).toISOString(),c.open,c.high,c.low,c.close,c.volume,'','','',...common]));
  state.forecast.bands.forEach(c=>rows.push(['scenario',prefs.symbol,prefs.interval,new Date(c.time).toISOString(),'','','','','',c.p10,c.median,c.p90,...common]));
  const csv='\uFEFF'+rows.map(r=>r.join(';')).join('\r\n'),url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
  const a=document.createElement('a');a.href=url;a.download=`kline-${prefs.symbol}-${prefs.interval}-${new Date().toISOString().slice(0,10)}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Export CSV préparé.');
});
$('#today').textContent=new Date().toLocaleDateString('fr-FR',{timeZone:'Europe/Paris',weekday:'long',day:'numeric',month:'long',year:'numeric'});
$('#history-dot').hidden=!history.length;
$$('[data-camera]').forEach(b=>b.addEventListener('click',()=>{prefs.view=b.dataset.camera;persist();syncSceneControls();drawChart();}));
for(const [id,key] of [['scene-volumes','volumes'],['scene-effects','effects'],['scene-animate','animate']])$('#'+id).addEventListener('click',()=>{prefs[key]=!prefs[key];persist();syncSceneControls();drawChart();});
$('#scene-reset').addEventListener('click',()=>spatialScene?.resetCamera());
$('#scene-interact').addEventListener('click',()=>{if(!spatialScene)return;const active=spatialScene.setTouchInteraction(!spatialScene.manualTouch);$('#scene-interact').setAttribute('aria-pressed',active);$('#scene-interact span').textContent=active?'Terminer':'Manipuler';});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{syncSceneControls();drawChart();});
syncControls();loadMarket();initializeScene();
