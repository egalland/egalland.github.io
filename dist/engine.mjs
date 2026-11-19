export const ROUND_MS = 25000;
export const HINT_MS = 10000;
export const MATCH_LENGTH = 10;
export const normalize = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/œ/g,'oe').replace(/æ/g,'ae').replace(/[^a-z0-9]/g,'');
export function pointsFor(elapsed) {
  if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed >= ROUND_MS) return 0;
  return Math.max(100, Math.round(1000 - 900 * elapsed / ROUND_MS));
}
export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
function distance(a,b) {
  const d = Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));
  for(let i=0;i<=a.length;i++) d[i][0]=i;
  for(let j=0;j<=b.length;j++) d[0][j]=j;
  for(let i=1;i<=a.length;i++) for(let j=1;j<=b.length;j++) {
    d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+Number(a[i-1]!==b[j-1]));
    if(i>1 && j>1 && a[i-1]===b[j-2] && a[i-2]===b[j-1]) d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);
  }
  return d[a.length][b.length];
}
export function textMatches(input,q) {
  const n=normalize(input); if(!n) return false;
  return [q.answer,...q.aliases||[]].some(a=>{
    const v=normalize(a);
    return n===v || (q.typos!==false && v.length>=8 && Math.abs(v.length-n.length)<=1 && distance(n,v)<=1);
  });
}
export function isCorrect(q,value) {
  if(q.type==='order') return Array.isArray(value) && value.length===q.items.length && value.every((v,i)=>v===q.items[i]);
  if(q.type==='match') return Array.isArray(value) && value.length===q.pairs.length && value.every((v,i)=>v===q.pairs[i][1]);
  if(q.type==='estimate') { const n=Number(String(value).replace(',','.')); return String(value).trim()!=='' && Number.isFinite(n) && Math.abs(n-q.number)<=q.tolerance; }
  if(['qcm','intruder','tf'].includes(q.type)) return value===q.answer;
  return textMatches(value,q);
}
export function prepareQuestion(q) {
  const r=structuredClone(q);
  if(r.options) r.options=shuffle(r.options);
  if(r.items) { r.order=shuffle(r.items); if(r.order.every((v,i)=>v===r.items[i])) r.order.push(r.order.shift()); }
  if(r.pairs) r.right=shuffle(r.pairs.map(p=>p[1]));
  return r;
}
export function buildDeck(bank,room) {
  let pool=bank.filter(q=>room.category==='general'||q.category===room.category);
  if(room.format==='qcm') pool=pool.filter(q=>q.type==='qcm');
  if(room.format==='rebus') pool=pool.filter(q=>q.type==='rebus');
  if(pool.length<MATCH_LENGTH) throw new Error('Ce salon ne contient pas encore dix questions.');
  if(room.format!=='mixed') return shuffle(pool).slice(0,MATCH_LENGTH).map(prepareQuestion);
  const mixed=shuffle(pool),chosen=[];
  const unused=q=>!chosen.some(c=>c.family===q.family);
  const types=room.category==='general'
    ? ['rebus','qcm','emoji','audio','write','intruder','order','match',...shuffle(['estimate','tf','clue','image']).slice(0,2)]
    : shuffle([...new Set(mixed.map(q=>q.type))]);
  for(const type of types) { const q=mixed.find(q=>q.type===type&&unused(q)); if(q) chosen.push(q); }
  for(const q of mixed) { if(chosen.length>=MATCH_LENGTH) break; if(unused(q)) chosen.push(q); }
  return (room.category==='general'?chosen:shuffle(chosen)).slice(0,MATCH_LENGTH).map(prepareQuestion);
}
