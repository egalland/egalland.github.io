import * as THREE from './vendor/three.module.js';

// A raglan is five flat pieces. The geometry is draped, but the UVs stay in the
// coordinate system of the original knitting chart, including its inactive cells.
const PI = Math.PI, TAU = 2 * PI;
const ids = ['front', 'back', 'sleeve-left', 'sleeve-right', 'collar'];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const mix = (a, b, t) => a + (b - a) * t;
const ease = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const positive = (x, fallback) => Number(x) > 0 && Number.isFinite(Number(x)) ? Number(x) : fallback;
const radius = (perimeter, ratio) => perimeter / (PI * (3 * (1 + ratio) - Math.sqrt((3 + ratio) * (1 + 3 * ratio))));
const within = (values, x) => values[clamp(Math.floor(x), 0, values.length - 1)];

function readPiece(raw) {
  const W = raw.width, N = raw.rows.length;
  const rows = raw.rows.map((row, i) => {
    const spans = row.spans.filter(([a, b]) => b >= a).map(([a, b]) => [a, b + 1]);
    const a = spans.length ? spans[0][0] : 0, b = spans.length ? spans[spans.length - 1][1] : W;
    const phase = row.phase || (i < (raw.shaping?.ribRows || 0) ? 'rib' : 'body');
    const rib = phase === 'rib' || phase === 'collar' || raw.id === 'collar';
    return {spans, a, b, count:b-a, split:spans.length > 1, rib,
      style:rib || row.stitch==='rib' ? 'rib' : /garter|mousse/i.test(row.stitch || '') ? 'garter' : 'stockinette',
      gapL:spans.length > 1 ? (spans[0][1] - a) / (b - a) : .5,
      gapR:spans.length > 1 ? (spans[spans.length - 1][0] - a) / (b - a) : .5};
  });
  const firstUnderarm = raw.shaping?.underarmRow ? raw.shaping.underarmRow - 1 : raw.rows.findIndex(r => r.phase === 'underarm' || r.phase === 'raglan');
  return {id:raw.id, W, N, rows, under:clamp(firstUnderarm >= 1 ? firstUnderarm : Math.round(.63*N), 1, Math.max(1, N-1)),
    firstSplit:rows.findIndex(r => r.split), ribRows:raw.shaping?.ribRows || rows.findIndex(r => !r.rib)};
}

// Smooth just the draped *position* of a chart edge over a few physical rows.
// UV boundaries still follow every bind-off, so no unworked stitch is selectable.
function smoothSample(rows, y, fn, lo = 0, hi = rows.length-1) {
  const sample = n => {
    n = clamp(n, lo, hi);
    return (fn(rows[clamp(n-1,lo,hi)]) + 2*fn(rows[n]) + fn(rows[clamp(n+1,lo,hi)])) * .25;
  };
  const s = clamp(y-.5, lo, hi), i = Math.floor(s);
  return mix(sample(i), sample(Math.min(i+1,hi)), s-i);
}
function gapAt(piece, y, right) {
  const key=right?'gapR':'gapL', first=piece.firstSplit;
  return mix(piece.rows[first][key],smoothSample(piece.rows,y,r=>r[key],first,piece.N-1),ease((y-first)/2));
}
function fabricFraction(piece, row, col, y, spanNo) {
  let q = clamp((col - row.a) / row.count, 0, 1);
  if (row.split) {
    if (spanNo === 0) q = q * gapAt(piece, y, false) / Math.max(.00001, row.gapL);
    else if (spanNo === row.spans.length-1) q = 1-(1-q)*(1-gapAt(piece, y, true))/Math.max(.00001,1-row.gapR);
  }
  return q;
}
function firstSplitEdge(piece, right) {
  return gapAt(piece, piece.firstSplit, right);
}

function fitArc(liveLength, fn, lo, hi) {
  for(let i=0;i<21;i++) {
    const mid=.5*(lo+hi); let dist=0, prev=fn(mid,0);
    for(let j=1;j<=28;j++) {const next=fn(mid,j/28);dist+=next.distanceTo(prev);prev=next;}
    if(dist<liveLength) lo=mid; else hi=mid;
  }
  return .5*(lo+hi);
}
function shapeOf(project, parts) {
  const g = project.gauge || {};
  const stitch = 10 / positive(g.stitches, 20), rowCm = 10 / positive(g.rows, 28);
  const front = parts.front, back = parts.back, arm = parts['sleeve-right'];
  const lowChestCount = .5 * (front.rows[front.under-1].count + back.rows[back.under-1].count);
  const chestRatio = .57, armRatio = .90;
  const rx = radius(2*(lowChestCount-2)*stitch, chestRatio), rz = rx*chestRatio;
  const underY = .5*(front.under+back.under)*rowCm;
  const rise = Math.max(rowCm, .5*(front.N+back.N)*rowCm - underY);
  const armR = radius((arm.rows[arm.under-1].count-2)*stitch, armRatio);
  // Two selvedges disappear into each seam. Fit the curved back and cap
  // edges to the remaining stitches. A deep V really has a narrower back
  // neckline than a standing collar knitted to the same total neck size.
  const backW=(back.rows[back.N-1].count-2)*stitch;
  const topW = (arm.rows[arm.N-1].count-2)*stitch;
  const backDrop=Math.min(1.6,rise*.07,backW*.09), capLift=Math.min(.24,topW*.07), capWidth=topW*.14;
  const endX=fitArc(backW,(x,q)=>{
    const a=(2*q-1)*1.03;return v3(x*Math.sin(a)/Math.sin(1.03),-backDrop*Math.sin(PI*q)**2,
      x*.48*(Math.cos(a)-Math.cos(1.03))/(1-Math.cos(1.03)));
  },.01,backW*.5);
  const endZ=fitArc(topW,(z,q)=>v3(capWidth*Math.sin(PI*q),capLift*Math.sin(PI*q),z*(1-2*q)),.005,topW*.5);
  const neckR=endX+capWidth, neckDepth=endZ+endX*.48;
  const tilt = clamp(.385 + .04*(rx-18)/8, .34, .46), up = Math.sqrt(1-tilt*tilt);
  const armDepth = armR*armRatio;
  function seam(h) {
    // Both sides of each sewn seam use the identical 12 linear spans. Extra
    // edge vertices for a decrease on just one piece remain on that seam.
    const s=h*12, i=Math.floor(s), arc=mix(Math.sin(PI*i/12),Math.sin(PI*(i+1)/12),s-i);
    return {x:mix(rx,endX,h)+.016*rx*arc, y:underY+rise*h,z:endZ*h+rz*.51*arc};
  }
  function panel(piece, face) {
    const hemR=radius(2*(piece.rows[0].count-2)*stitch,chestRatio);
    return (q, r) => {
      q=clamp(q,0,1); r=clamp(r,0,piece.N);
      const above = r>piece.under, h = above?(r-piece.under)/(piece.N-piece.under):0;
      const l = clamp(r/piece.under,0,1), at=(q-.5)*2, arch=Math.max(0,Math.sin(PI*q));
      const phi=mix(PI*.5,1.03,h), c=Math.cos(phi), angle=at*phi;
      const growth=clamp((r-piece.ribRows)/Math.max(1,piece.under-piece.ribRows),0,1);
      const cx=above ? seam(h).x : mix(hemR,rx,mix(growth,ease(growth),.20));
      const ex=above?seam(h).z:0;
      // A slight blousing above the rib and shallow folds below the bust.
      const bow = above ? 0 : rx*.014*Math.sin(PI*l) + rx*.012*Math.exp(-Math.pow((l-.18)/.12,2))*Math.sin(PI*l);
      const cz=above?mix(rz,neckDepth,h):cx*chestRatio + bow;
      const puff=arch*(1-h)*Math.sin(PI*l*.92)*rz*.023*Math.cos(q*TAU*4.2+(face===1?.1:1.9));
      const ribLine = Math.max(1,piece.ribRows);
      const hemAge=clamp(r/ribLine,0,1), hemWave=(1-l)*Math.exp(-r/Math.max(1,piece.under*.45));
      const fold=hemWave*arch*rz*.045*Math.cos(q*TAU*3.2+.4*hemAge);
      const fall=hemWave*(.36*Math.cos(TAU*(q-.5)) - .24 + .19*Math.sin(TAU*2.5*q)*arch);
      let y=above?seam(h).y:underY*l;
      if (face<0) y-=backDrop*ease((h-.53)/.47)*arch*arch;
      y+=fall;
      const x=face*(cx + (above?0:bow*.46))*Math.sin(angle)/Math.sin(phi);
      const z=face*(ex +(cz-ex)*(Math.cos(angle)-c)/(1-c)+puff+fold);
      return v3(x,y,z);
    };
  }
  function sleeve(piece, side) {
    const preLength=piece.under*rowCm, wrist=radius((piece.rows[0].count-2)*stitch,armRatio);
    return (q,r) => {
      q=clamp(q,0,1); r=clamp(r,0,piece.N);
      const angle=TAU*q;
      if(r<=piece.under) {
        const t=r/piece.under, lower=1-t;
        const gain=clamp((r-piece.ribRows)/Math.max(1,piece.under-piece.ribRows),0,1);
        const ar=mix(wrist,armR,mix(gain,ease(gain),.20));
        const swing=Math.sin(PI*t), bends=Math.sin(PI*t)*Math.sin(PI*t);
        const cx=rx+armR*up+preLength*tilt*lower+.07*armR*bends;
        const cy=underY+armR*tilt-preLength*up*lower;
        const cz=preLength*(.052*lower + .010*bends);
        const cloth=1+(.021*Math.cos(3*angle+.7*t)+.012*Math.sin(5*angle-1.2*t))*swing;
        return v3(side*(cx-ar*up*Math.cos(angle)*cloth),cy-ar*tilt*Math.cos(angle)*cloth,
          cz+side*ar*armRatio*Math.sin(angle)*cloth);
      }
      const h=(r-piece.under)/(piece.N-piece.under), s=seam(h), sw=Math.max(0,Math.sin(PI*h));
      const oval=mix(.5-.5*Math.cos(angle), Math.sin(PI*q), h), outer=2*armR;
      const bulgeX=mix(outer*up,neckR-endX,h)+rx*(.30*sw+.048*sw*sw);
      const bulgeY=mix(outer*tilt,capLift,h)+rise*.16*sw;
      const forward = side*(s.z*(1-2*q) + armDepth*Math.pow(1-h,1.25)*Math.sin(angle));
      return v3(side*(s.x+bulgeX*oval),s.y+bulgeY*oval,forward);
    };
  }
  return {stitch,rowCm,rx,rz,neckR,rise, surfaces:{front:panel(front,1), back:panel(back,-1),
    'sleeve-left':sleeve(parts['sleeve-left'],1), 'sleeve-right':sleeve(arm,-1)}};
}

function polyline(points) {
  const p = [], dist = []; let length=0;
  for (const a of points) {
    const delta = p.length ? a.distanceTo(p[p.length-1]) : 0;
    if (p.length && delta<1e-7) continue;
    length+=delta; p.push(a); dist.push(length);
  }
  return {length, at(u) {
    if (p.length<2) return p[0].clone();
    const d=clamp(u,0,1)*length; let lo=0,hi=p.length-1;
    while (hi-lo>1) { const i=(lo+hi)>>1; if (dist[i]<=d) lo=i; else hi=i; }
    return p[lo].clone().lerp(p[hi],(d-dist[lo])/(dist[hi]-dist[lo]));
  }};
}
function line(n, fn) {return Array.from({length:n+1},(_,i)=>fn(i/n));}
function neckSections(parts,S) {
  const f=parts.front, b=parts.back, n=f.N, fs=f.firstSplit;
  const fullTop=(piece,fn,n)=>line(n,u=>fn(u,piece.N));
  const back=fullTop(b,S.back,48);
  // The curve names describe the front view. Sleeve IDs name the wearer's sides.
  const left=fullTop(parts['sleeve-right'],S['sleeve-right'],20);
  const right=fullTop(parts['sleeve-left'],S['sleeve-left'],20);
  if (fs<0) return {back,left,right,frontLeft:line(20,u=>S.front(u*.5,n)),
    center:[S.front(.5,n)],frontRight:line(20,u=>S.front(.5+u*.5,n))};
  // Follow the actual inner edges of both front shoulders all the way down
  // to the central bind-off. A V starts with two contiguous spans instead.
  const lowerL=firstSplitEdge(f,false), lowerR=firstSplitEdge(f,true);
  const upperL=gapAt(f,n,false), upperR=gapAt(f,n,true);
  const midN=clamp(n-fs,8,96);
  let frontLeft=line(5,u=>S.front(upperL*u,n));
  frontLeft=frontLeft.concat(line(midN,u=>{const r=mix(n,fs,u);return S.front(gapAt(f,r,false),r);}));
  const center=line(20,u=>S.front(mix(lowerL,lowerR,u),fs));
  let frontRight=line(midN,u=>{const r=mix(fs,n,u);return S.front(gapAt(f,r,true),r);});
  frontRight=frontRight.concat(line(5,u=>S.front(mix(upperR,1,u),n)));
  return {back,left,right,frontLeft,center,frontRight};
}
function makeCollar(project,parts,raw,sh) {
  const p=parts.collar, sect=neckSections(parts,sh.surfaces), k=raw.pickupSections || {};
  const isV=project.collar==='v', tall=project.collar==='high';
  // Index each pickup section by its stitch count. A stitch in the middle
  // of the back section must land at the back, independently of 3D arc length.
  const runs = (isV ? [ ['frontRight','frontRight'],['right','sleeveLeft'],['back','back'],['left','sleeveRight'],['frontLeft','frontLeft'] ] :
    [ ['back','back'],['left','sleeveRight'],['frontLeft','frontLeft'],['center','frontCenter'],['frontRight','frontRight'],['right','sleeveLeft'] ])
    .map(([curve,key])=>({curve:polyline(sect[curve]),len:k[key]}));
  let sum=0;
  for (const run of runs) {run.start=sum; run.len=Number.isFinite(run.len)?run.len:run.curve.length; sum+=run.len;}
  const usable=runs.filter(s=>s.len>0);
  const height=p.N*sh.rowCm;
  const atBase=q=>{
    const s0=clamp(q,0,1)*sum, run=usable.find(s=>s0<s.start+s.len) || usable[usable.length-1];
    return run.curve.at((s0-run.start)/run.len);
  };
  const fn=(q,r)=>{
    const t=clamp(r/p.N,0,1), base=atBase(q);
    const contraction=(tall?.077:.18)*Math.sin(t*PI*.5);
    // A soft, slightly rounded bind-off and a mild roll on the standing collar.
    const roll=(tall?.017:.012)*Math.sin(PI*t) + .015*Math.exp(-Math.pow((t-.92)/.13,2));
    base.x*=1-contraction+roll; base.z*=1-contraction*(tall?.88:1.17)+roll;
    base.y+=height*t*(tall?.989:.72);
    if (isV) {
      const tail=Math.min(q,1-q)*sum*sh.stitch;
      const reach=Math.exp(-tail/Math.max(1,height*.83));
      base.x+=(q<.5?-1:1)*height*.62*Math.sin(PI*.5*t)*reach;
      base.z+=(q<.5?-.08:.11)*t*reach;
    }
    return base;
  };
  return {fn, knots:runs.flatMap(s=>[s.start/sum,(s.start+s.len)/sum]), isV};
}
function normalAt(fn,q,y,N) {
  const du=.00028, dv=Math.min(.09,N*.01);
  const u=fn(Math.min(1,q+du),y).sub(fn(Math.max(0,q-du),y));
  const v=fn(q,Math.min(N,y+dv)).sub(fn(q,Math.max(0,y-dv)));
  return u.cross(v).normalize();
}
function buffer() { return {p:[],n:[],uv:[],ix:[]}; }
function vertex(buf,p,n,u,v) {const i=buf.p.length/3;buf.p.push(p.x,p.y,p.z);buf.n.push(n.x,n.y,n.z);buf.uv.push(u,v);return i;}
function meshFor(group,buf,material,meta,name) {
  if (!buf.ix.length) return;
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(buf.p,3));
  geo.setAttribute('normal',new THREE.Float32BufferAttribute(buf.n,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(buf.uv,2));
  geo.setIndex(buf.ix);geo.computeBoundingSphere();
  const m=new THREE.Mesh(geo,material); m.name=name; m.userData.knit=meta;
  m.castShadow=true; m.receiveShadow=true; group.add(m); return m;
}
const labels={front:'Devant',back:'Dos','sleeve-left':'Manche gauche','sleeve-right':'Manche droite',collar:'Col'};
function tessellate(group,piece,fn,material,sh,low,options={}) {
  const {id,W,N,rows}=piece, collar=id==='collar', sleeve=id.startsWith('sleeve');
  // The collar curve starts at the first pickup; that is chart stitch 1 at the right edge.
  const chartU=x=>collar?1-x/W:x/W;
  const xSeg=collar?(low?52:96):sleeve?(low?18:34):(low?16:32);
  const cuts=new Set([0,N]), qs=new Set([0,1,...(options.knots || [])]);
  for(let j=1;j<xSeg;j++) qs.add(j/xSeg);
  let prev='';
  for(let i=0;i<N;i++) {
    const row=rows[i], mark=`${row.rib}|${row.style}|${row.spans.map(p=>p.join(',')).join(';')}`;
    if(mark!==prev) cuts.add(i); prev=mark;
  }
  if(collar) {for(let j=1;j<(low?5:12);j++) cuts.add(N*j/(low?5:12));}
  else {
    cuts.add(piece.under);
    const n0=low?10:17;
    for(let j=1;j<n0;j++)cuts.add(piece.under*j/n0);
    for(let j=1;j<12;j++)cuts.add(piece.under+(N-piece.under)*j/12);
    if (piece.ribRows>1) {cuts.add(piece.ribRows*.38); cuts.add(piece.ribRows*.8);}
  }
  const cs=Array.from(cuts).sort((a,b)=>a-b), baseQ=Array.from(qs).sort((a,b)=>a-b);
  const configs=new Map();
  const groupFor=(row,inside=false)=>{
    const part=row.rib?'rib':sleeve?'sleeve':'body';
    const key=[part,row.style,inside].join('/');
    if(!configs.has(key)) configs.set(key,{buf:buffer(),meta:{pullPiece:id,part,surface:collar?'collar':sleeve?id:'body',
      style:row.style,widthCm:Math.max(.01,W*sh.stitch),heightCm:Math.max(.01,N*sh.rowCm),...(collar&&!options.isV?{circular:true}:{}),...(inside?{inside:true}:{})}});
    return configs.get(key).buf;
  };
  for(let k=0;k<cs.length-1;k++) {
    const y0=cs[k],y1=cs[k+1]; if(y1-y0<1e-6)continue;
    const row=within(rows,(y0+y1)*.5);
    for(let j=0;j<row.spans.length;j++) {
      const [a,b]=row.spans[j];
      if(b<=a)continue;
      const stop=new Set([a,b]);
      const addStation=q=>{const x=row.a+q*row.count;if(x>a+1e-6 && x<b-1e-6)stop.add(x);};
      for (const q of baseQ) addStation(q);
      if(!row.split && piece.firstSplit>=0 && Math.abs(y1-piece.firstSplit)<1e-6) {
        addStation(firstSplitEdge(piece,false));addStation(firstSplitEdge(piece,true));
      }
      const xs=Array.from(stop).sort((a,b)=>a-b).filter((x,k,a)=>k===0||x-a[k-1]>1e-6);
      const buf=groupFor(row), nX=xs.length, start=buf.p.length/3;
      // Real thickness is visible through the open collar, hem and wrists.
      // The inset carries exactly the same chart coords and isn't a second piece.
      const lining = collar || (row.rib && y0<piece.ribRows) || (id==='back' && y0>N-(N-piece.under)*.72);
      const inner = lining ? groupFor(row,true) : null, innerStart=inner?inner.p.length/3:0;
      for (const y of [y0,y1]) for (const x of xs) {
        const q=fabricFraction(piece,row,x,y,j), pos=fn(q,y), n=normalAt(fn,q,y,N);
        vertex(buf,pos,n,chartU(x),y/N);
        if(inner)vertex(inner,pos.clone().addScaledVector(n,-(collar?.20:.23)),n.clone().negate(),chartU(x),y/N);
      }
      const edge=inner && (collar ? Math.abs(y1-N)<1e-6 : Math.abs(y0)<1e-6);
      for(let i=0;i<nX-1;i++) {
        const a0=start+i,b0=a0+1,a1=a0+nX,b1=a1+1;
        buf.ix.push(a0,b0,b1,a0,b1,a1);
        if(inner) {
          const i0=innerStart+i,i1=i0+nX;
          inner.ix.push(i0,i1+1,i0+1,i0,i1,i1+1);
        }
        if(edge) {
          const y=collar?y1:y0, xA=xs[i],xB=xs[i+1], aQ=fabricFraction(piece,row,xA,y,j),bQ=fabricFraction(piece,row,xB,y,j);
          const p0=fn(aQ,y),p1=fn(bQ,y), n0=normalAt(fn,aQ,y,N), n1=normalAt(fn,bQ,y,N);
          const v=p1.clone().sub(p0).cross(n0).normalize().multiplyScalar(collar?-1:1);
          const e=buf.p.length/3, t=collar?.20:.23;
          vertex(buf,p0,v,chartU(xA),y/N);vertex(buf,p1,v,chartU(xB),y/N);
          vertex(buf,p1.addScaledVector(n1,-t),v,chartU(xB),y/N);vertex(buf,p0.addScaledVector(n0,-t),v,chartU(xA),y/N);
          if(collar)buf.ix.push(e,e+1,e+2,e,e+2,e+3);else buf.ix.push(e+2,e+1,e,e+3,e+2,e);
        }
      }
    }
  }
  for(const {buf,meta} of configs.values()) meshFor(group,buf,material,meta,`${labels[id]} · ${meta.inside?'intérieur':meta.part==='rib'?'côtes':'endroit'}`);
}

/** Assemble the five sewn pieces without unwrapping the chart a second time. */
export function buildRaglanPull(p, construction, lowDetail=false) {
  const group=new THREE.Group(); group.name='Pull raglan en cinq pièces';
  const src=construction?.pieces, raw=Object.fromEntries((Array.isArray(src)?src:Object.values(src||{})).map(a=>[a.id,a]));
  if(!ids.every(id=>raw[id]?.width>0 && raw[id].rows?.length)) return group;
  const parts=Object.fromEntries(ids.map(id=>[id,readPiece(raw[id])]));
  const sh=shapeOf(p,parts), mat=new THREE.MeshStandardMaterial({color:0xe0d7c4,roughness:.97,side:THREE.DoubleSide});
  for(const id of ids.slice(0,4)) tessellate(group,parts[id],sh.surfaces[id],mat,sh,lowDetail);
  const collar=makeCollar(p,parts,raw.collar,sh);
  tessellate(group,parts.collar,collar.fn,mat,sh,lowDetail,collar);
  return group;
}
