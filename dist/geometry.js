const EPS=.001;
export const area=r=>r.w*r.l;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const overlap=(a,b)=>a.x<b.x+b.w-EPS&&a.x+a.w>b.x+EPS&&a.y<b.y+b.l-EPS&&a.y+a.l>b.y+EPS;
function merge(items){const out=[];for(const [a,b] of items.sort((a,b)=>a[0]-b[0])){if(b-a<EPS)continue;const last=out.at(-1);if(last&&a<=last[1]+EPS)last[1]=Math.max(last[1],b);else out.push([a,b]);}return out;}
export function unionCells(rects,holes=[]){
 const xs=[...new Set([...rects,...holes].flatMap(r=>[r.x,r.x+r.w]))].sort((a,b)=>a-b),out=[];
 for(let i=1;i<xs.length;i++){
  const x=xs[i-1],w=xs[i]-x;if(w<EPS)continue;
  let spans=merge(rects.filter(r=>r.x<xs[i]-EPS&&r.x+r.w>x+EPS).map(r=>[r.y,r.y+r.l]));
  const cuts=merge(holes.filter(r=>r.x<xs[i]-EPS&&r.x+r.w>x+EPS).map(r=>[r.y,r.y+r.l]));
  for(const [a,b] of cuts)spans=spans.flatMap(([c,d])=>b<=c||a>=d?[[c,d]]:[[c,Math.min(d,a)],[Math.max(c,b),d]].filter(([p,q])=>q-p>EPS));
  for(const [y,b] of spans)out.push({x,y,w,l:b-y});
 }return out;
}
export const unionArea=(rects,holes=[])=>unionCells(rects,holes).reduce((a,r)=>a+area(r),0);
export function intersect(a,b){const x=Math.max(a.x,b.x),y=Math.max(a.y,b.y),w=Math.min(a.x+a.w,b.x+b.w)-x,l=Math.min(a.y+a.l,b.y+b.l)-y;return w>EPS&&l>EPS?{x,y,w,l}:null;}
export function segmentOnRect(seg,r){
 if(Math.abs(seg.y1-seg.y2)<.01){if(Math.abs(seg.y1-r.y)>.01&&Math.abs(seg.y1-r.y-r.l)>.01)return 0;return Math.max(0,Math.min(seg.x2,r.x+r.w)-Math.max(seg.x1,r.x));}
 if(Math.abs(seg.x1-r.x)>.01&&Math.abs(seg.x1-r.x-r.w)>.01)return 0;
 return Math.max(0,Math.min(seg.y2,r.y+r.l)-Math.max(seg.y1,r.y));
}
export function boundarySegments(rects,building){
 const lines=new Map();
 for(const r of rects)for(const [axis,pos,a,b] of [['v',r.x,r.y,r.y+r.l],['v',r.x+r.w,r.y,r.y+r.l],['h',r.y,r.x,r.x+r.w],['h',r.y+r.l,r.x,r.x+r.w]]){const key=axis+pos.toFixed(5);if(!lines.has(key))lines.set(key,{axis,pos,spans:[]});lines.get(key).spans.push([a,b]);}
 const out=[];
 for(const {axis,pos,spans} of lines.values()){
  const marks=[...new Set(spans.flat())].sort((a,b)=>a-b);
  for(let i=1;i<marks.length;i++){
   const a=marks[i-1],b=marks[i],mid=(a+b)/2;if(b-a<EPS)continue;
   const at=delta=>rects.filter(r=>axis==='v'?pos+delta>r.x&&pos+delta<r.x+r.w&&mid>r.y&&mid<r.y+r.l:mid>r.x&&mid<r.x+r.w&&pos+delta>r.y&&pos+delta<r.y+r.l);
   const left=at(-.0001),right=at(.0001);if(!left.length&&!right.length)continue;
   const partition=!!left.length&&!!right.length;if(partition&&left.some(r=>right.includes(r)))continue;
   out.push({axis,pos,a,b,partition,h:Math.max(0,...[...left,...right].map(r=>r.h||0)),external:Math.abs(pos)<.01||Math.abs(pos-(axis==='v'?building.w:building.l))<.01});
  }
 }return out;
}
