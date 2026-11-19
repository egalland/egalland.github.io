export const STEP = { '15m': 900000, '1h': 3600000, '4h': 14400000, '1d': 86400000 };

export function normalizeKlines(rows, now = Date.now()) {
  if (!Array.isArray(rows)) throw new Error('Format des cotations invalide.');
  const data = rows.map(r => ({ time: +r[0], open: +r[1], high: +r[2], low: +r[3], close: +r[4], volume: +r[5], end: +r[6] }))
    .filter(c => c.end < now && c.time > 0 && [c.open,c.high,c.low,c.close,c.volume,c.end].every(Number.isFinite) && c.low > 0 && c.volume >= 0 && c.high >= Math.max(c.open,c.close) && c.low <= Math.min(c.open,c.close))
    .sort((a,b) => a.time-b.time);
  const seen = new Set();
  const unique = data.filter(c => !seen.has(c.time) && seen.add(c.time));
  if (unique.length < 64) throw new Error('Pas assez de bougies clôturées (64 minimum).');
  return unique;
}

function random(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const quantile = (a,p) => { const x = (a.length-1)*p, lo = Math.floor(x); return a[lo] + (a[Math.ceil(x)]-a[lo])*(x-lo); };

// Moving-block bootstrap of historical log returns. No learned model is used.
export function simulate(data, { horizon = 24, paths = 512, seed = 7, mode = 'balanced', interval = '1h' } = {}) {
  if (!Number.isInteger(horizon) || horizon < 1 || horizon > 96 || !Number.isInteger(paths) || paths < 32 || paths > 2048 || !STEP[interval]) throw new Error('Paramètres de simulation invalides.');
  if (data.length < 64) throw new Error('Historique trop court.');
  const source = data.slice(-(mode === 'recent' ? 65 : 129));
  const returns = source.slice(1).map((c,i) => Math.log(c.close/source[i].close));
  if (!returns.every(Number.isFinite)) throw new Error('Prix invalides.');
  const mean = returns.reduce((a,b)=>a+b,0)/returns.length;
  const sigma = Math.sqrt(returns.reduce((a,b)=>a+(b-mean)**2,0)/returns.length);
  const drift = mode === 'neutral' ? 0 : mean*.5;
  const rng = random(seed);
  const anchor = data.at(-1);
  const values = Array.from({length:horizon},()=>[]);
  for (let j=0;j<paths;j++) {
    let price = anchor.close, start = 0;
    for (let i=0;i<horizon;i++) {
      if (i%4 === 0) start = Math.floor(rng()*returns.length);
      price *= Math.exp(returns[(start+i%4)%returns.length]-mean+drift);
      values[i].push(price);
    }
  }
  const bands = values.map((v,i) => { v.sort((a,b)=>a-b); return { time:anchor.time+(i+1)*STEP[interval], p10:quantile(v,.1), p25:quantile(v,.25), median:quantile(v,.5), p75:quantile(v,.75), p90:quantile(v,.9) }; });
  const final = values.at(-1);
  return { bands, anchor, horizon, paths, seed, mode, interval, mean, sigma, window:returns.length, upside:final.filter(v=>v>anchor.close).length/paths, delta:bands.at(-1).median/anchor.close-1 };
}

// Walk-forward evaluation. Every forecast uses only candles before its test window.
export function backtest(data, options = {}) {
  const horizon = options.horizon || 24;
  const count = Math.min(8, Math.floor((data.length-128)/horizon));
  if (count < 2) throw new Error('Historique insuffisant pour cet horizon.');
  const folds = [];
  for (let k=count;k>0;k--) {
    const split = data.length-k*horizon;
    const train = data.slice(0,split);
    const future = data.slice(split,split+horizon);
    const result = simulate(train,{...options,horizon,paths:256,seed:1100+k});
    const p = result.bands.at(-1), actual = future.at(-1).close, base = train.at(-1).close;
    folds.push({time:future.at(-1).time,actual,predicted:p.median,baseline:base,error:Math.abs(p.median-actual)/actual,naive:Math.abs(base-actual)/actual,covered:actual>=p.p10&&actual<=p.p90});
  }
  return {folds,mape:folds.reduce((a,b)=>a+b.error,0)/count,naive:folds.reduce((a,b)=>a+b.naive,0)/count,coverage:folds.filter(f=>f.covered).length/count,count};
}
