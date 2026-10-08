export function distanceToSegment(p,a,b){const dx=b.x-a.x,dy=b.y-a.y;const k=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-k*dx,p.y-a.y-k*dy)}
export function videoPoint(p,vw,vh,w,h){const s=Math.max(w/vw,h/vh);return {x:w-(p.x*vw*s-(vw*s-w)/2),y:p.y*vh*s-(vh*s-h)/2}}
export function slapValid(a,b,dt,width,sensitivity=2){const distance=Math.hypot(b.x-a.x,b.y-a.y);return dt>0&&dt<260&&distance>width*.025&&distance/dt>width*[0,.00105,.0007,.00042][sensitivity]&&distance<width*.55}
export function multiplier(streak){return Math.min(5,1+Math.floor(streak/4))}
