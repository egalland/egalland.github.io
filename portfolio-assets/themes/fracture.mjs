// One deterministic boundary serves both renderers: their halves cannot drift.
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
export function noise(index,seed=0){const n=Math.sin(index*127.1+seed*311.7)*43758.5453;return n-Math.floor(n);}

export function fractureEdge(width,height,seed=1,offset=0){
 const steps=Math.max(28,Math.ceil(height/7));
 return Array.from({length:steps+1},(_,i)=>{
  const t=i/steps;
  const large=Math.sin(t*13.7+seed)*.025+Math.sin(t*32.1+seed*.6)*.016;
  const jag=(noise(i,seed)-.5)*Math.min(width*.063,28);
  const tooth=i%9===4?-Math.min(width*.045,22):0;
  return {x:width*(.76-.51*t+large+offset)+jag+tooth,y:height*t};
 });
}

export function edgeAt(edge,y){
 const p=clamp(y/Math.max(1,edge.at(-1).y))*(edge.length-1),i=Math.min(edge.length-2,Math.floor(p)),f=p-i;
 return edge[i].x+(edge[i+1].x-edge[i].x)*f;
}

// A single arrival causes one bounded fault. No periodic strobe or page shake.
export function arrival(age,reduced=false){
 if(reduced)return {reveal:1,build:1,fault:0,objects:1};
 const local=(age-.38)/.34;
 return {reveal:smooth(age/1.4),build:smooth((age-.15)/1.65),objects:smooth((age-.7)/1.3),fault:local>0&&local<1?Math.sin(local*Math.PI):0};
}

export function projectPoint(p,{cx,cy,scale,yaw=0,pitch=0}){
 const co=Math.cos(yaw),si=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
 const x=p[0]*co+p[2]*si,z=-p[0]*si+p[2]*co,y=p[1]*cp-z*sp,depth=p[1]*sp+z*cp;
 const perspective=7/(7-depth);
 return [cx+x*scale*perspective,cy-y*scale*perspective,depth];
}
