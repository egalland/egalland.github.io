// Page-space geometry is computed on layout changes, never in the animation loop.
const noise=(i,seed)=>{const n=Math.sin(i*127.1+seed*311.7)*43758.5453;return n-Math.floor(n);};
export function tornEdge(guides,seed=1,amplitude=13){
 const points=[];
 for(let segment=1;segment<guides.length;segment++){
  const a=guides[segment-1],b=guides[segment],length=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.max(2,Math.ceil(length/22));
  for(let i=segment===1?0:1;i<=steps;i++){
   const t=i/steps,envelope=Math.sin(t*Math.PI),n=points.length;
   const tooth=(noise(n,seed)-.5)*amplitude*1.7+(n%11===5?-amplitude:0);
   points.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t+envelope*(tooth+Math.sin(n*.63+seed)*amplitude*.35)]);
  }
 }
 return points;
}
export const bandPolygon=(top,bottom)=>[...top,...bottom.slice().reverse()];
export const svgPath=points=>points.map((p,i)=>(i?'L':'M')+p.map(v=>v.toFixed(1)).join(',')).join(' ')+'Z';
export function clipToRect(points,rect){
 let out=points.map(p=>p.slice());
 for(const [axis,boundary,sign] of [[0,rect.left,1],[0,rect.right,-1],[1,rect.top,1],[1,rect.bottom,-1]]){
  const input=out;out=[];if(!input.length)break;
  const inside=p=>(p[axis]-boundary)*sign>=-1e-7;
  for(let i=0;i<input.length;i++){
   const a=input[(i+input.length-1)%input.length],b=input[i],ia=inside(a),ib=inside(b);
   if(ia!==ib){const t=(boundary-a[axis])/(b[axis]-a[axis]);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}
   if(ib)out.push(b);
  }
 }
 return out;
}
export function regionAt(regions,x,y){
 for(const polygon of regions){let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[i],b=polygon[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }if(inside)return 'points';}return 'curseurs';
}
export function boundedSamples(samples,budget){
 const n=Math.min(samples.length,budget);return Array.from({length:n},(_,i)=>samples[Math.floor((i+.5)*samples.length/n)]);
}
