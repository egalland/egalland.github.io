import {makePullConstruction} from './pull-construction.js';
import {patternSampler} from './motif-sampling.js';
import {editKey} from './pull-state.js';

const cache = new WeakMap();
const wrap = x => ((x % 1) + 1) % 1;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export const countStitches = row => row.spans.reduce((sum,[l,r]) => sum + r-l+1, 0);

function structureSignature(p) {
  return JSON.stringify([p.collar, p.stitch, p.gauge.stitches, p.gauge.rows,
    ...['chest','hem','length','neck','armhole','sleeve','upperArm','cuff'].map(k => p.measures[k])]);
}

export function pullGuide(p) {
  if (p.kind !== 'pull') return null;
  const signature = structureSignature(p);
  let entry = cache.get(p);
  if (entry?.signature !== signature || entry.manual !== p.gauge.manual) {
    const construction = makePullConstruction(p);
    const pieces = construction.pieces || [];
    entry = {signature, manual:p.gauge.manual, construction, pieces, byId:new Map(pieces.map(piece => [piece.id,piece]))};
    cache.set(p,entry);
  }
  const colors = JSON.stringify([p.motif, p.grid, p.pullDesign, p.yarns.length]);
  if (entry.colorKey !== colors) {
    entry.colorKey = colors;
    entry.sheets = new Map();
    entry.coverage = null;
  }
  return entry;
}

function chartSpace(p,piece) {
  let first = piece.rows.findIndex(row => row.colors !== false);
  if (first === -1) first=0;
  const height = Math.max(1,piece.rows.length-first);
  const body = piece.id === 'front' || piece.id === 'back';
  const yarnSurface = body ? 'body' : piece.id;
  const knit = {part:body?'body':piece.id==='collar'?'rib':'sleeve',surface:yarnSurface,circular:true,
    widthCm:piece.width*(body?2:1)*10/p.gauge.stitches, heightCm:height*10/p.gauge.rows};
  const left = piece.id==='front' ? .25 : .75;
  return {
    knit,
    u:body ? x => wrap(left+x*.5) : x => x,
    v:y => clamp((y*piece.rows.length-first)/height,0,1)
  };
}

// Full-size charts, fabric textures, reading instructions and yarn consumption
// all use the same stitch matrix. The low bits hold the yarn index.
export function pullSheet(p,guide,piece) {
  if (guide.sheets.has(piece.id)) return guide.sheets.get(piece.id);
  const space = chartSpace(p,piece);
  const sampler = patternSampler(p,space.knit);
  const base = p.pullDesign?.base[piece.id] || 0;
  const edits = p.pullDesign?.edits[piece.id];
  const totals = p.yarns.map(()=>0), patterned=p.yarns.map(()=>0);
  let stitches = 0;
  const matrix = piece.rows.map((row,ri) => {
    const cells = new Uint8Array(piece.width);
    cells.fill(base);
    const v = space.v((ri+.5)/piece.rows.length);
    const hasMotif = row.colors !== false && piece.id !== 'collar';
    for (const [l,r] of row.spans) {
      for (let c=l;c<=r;c++) {
        const motif = hasMotif ? sampler.read(space.u((c+.5)/piece.width),v) : null;
        let ink = motif?.color || base;
        let isPattern = !!motif?.patterned;
        if (edits) {
          const change = edits[editKey(piece,ri,c)];
          if (change !== undefined) { ink=change; isPattern = isPattern || ink !== base; }
        }
        cells[c] = ink + (isPattern ? 128 : 0);
        totals[ink]++; stitches++;
        if (isPattern) patterned[ink]++;
      }
    }
    return cells;
  });
  const sheet = {piece,space,matrix,totals,patterned,stitches,
    color:(r,c)=> (matrix[r]?.[c] ?? base) & 127,
    texture(u,v) {
      const r=clamp(Math.floor(v*piece.rows.length),0,piece.rows.length-1);
      const c=clamp(Math.floor(u*piece.width),0,piece.width-1);
      const value=matrix[r][c];
      return {color:value&127,patterned:!!(value&128)};
    }
  };
  guide.sheets.set(piece.id,sheet);
  return sheet;
}

export function pullCoverage(p,guide) {
  if (!guide?.pieces.length || guide.construction.error) return null;
  if (guide.coverage) return guide.coverage;
  const totals=p.yarns.map(()=>0), patterned=p.yarns.map(()=>0);
  let total = 0;
  for (const piece of guide.pieces) {
    if (!piece.rows.length) continue;
    const s = pullSheet(p,guide,piece);
    total += s.stitches;
    s.totals.forEach((n,i)=>{totals[i]+=n;patterned[i]+=s.patterned[i];});
  }
  if (!total) return null;
  guide.coverage={shares:totals.map(n=>n/total),patterned:patterned.map(n=>n/total),
    cm2:total*100/(p.gauge.stitches*p.gauge.rows),total};
  return guide.coverage;
}

export function placementOnPull(p,id,uv) {
  const guide = pullGuide(p), piece=guide?.byId.get(id);
  if (!piece?.rows.length || id==='collar') return null;
  const {space}=pullSheet(p,guide,piece);
  return {u:space.u(uv.x),v:space.v(uv.y),surface:space.knit.surface};
}

export function readsFromRight(piece,r) {
  return piece.mode==='round' || (r%2===0) === (piece.firstSide!=='wrong');
}
export function colorRuns(sheet,r) {
  const piece=sheet.piece, rtl=readsFromRight(piece,r);
  const spans=piece.rows[r].spans;
  const groups=(rtl ? [...spans].reverse() : spans).map(([l,h]) => {
    const runs = [];
    for (let i=0;i<=h-l;i++) {
      const color=sheet.color(r,rtl?h-i:l+i);
      if (runs.length && runs[runs.length-1].color===color) runs[runs.length-1].n++;
      else runs.push({color,n:1});
    }
    return runs;
  });
  return {rtl, groups};
}

export function stepsCount(piece) {
  return piece.mode === 'finish' ? piece.tasks?.length || 1 : piece.rows.length+2;
}
export function doneFor(p,piece) {
  return clamp(p.pullWork?.done[piece.id] || 0,0,stepsCount(piece));
}
export function progressFor(p,guide) {
  let done=0, total=0;
  for (const piece of guide.pieces) { done+=doneFor(p,piece); total+=stepsCount(piece); }
  return {done,total,percent:total?Math.round(done*100/total):0};
}
export function stageAt(piece,index) {
  if (index>=stepsCount(piece)) return {type:'end',title:piece.mode==='finish'?'Étapes terminées':'Pièce terminée'};
  if (piece.mode==='finish') return {type:'task',title:(piece.id==='join-raglans'?'Étape ':'Finition ')+(index+1)+' sur '+stepsCount(piece),text:piece.tasks?.[index] || piece.setup};
  if (!index) return {type:'setup',title:piece.id==='collar'?'Relever les mailles':'Monter les mailles',text:piece.setup};
  if (index===piece.rows.length+1) return {type:'finish',title:'Terminer la pièce',text:piece.finish};
  const r=index-1, row=piece.rows[r];
  return {type:'row',title:(piece.mode==='round'?'Tour ':'Rang ')+index+' sur '+piece.rows.length,row,r,text:row.action};
}

