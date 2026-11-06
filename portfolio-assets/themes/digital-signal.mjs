import {createCloud} from './point-cloud.mjs';
const random=(n,seed)=>{const x=Math.sin(n*127.1+seed*311.7)*43758.5453;return x-Math.floor(x);};

/** Stepped data blocks, with horizontal/vertical edges instead of paper teeth. */
export function signalEdge(guides,seed=1,grid=6){
 const points=[];
 for(let j=1;j<guides.length;j++){
  const a=guides[j-1],b=guides[j],steps=Math.max(2,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/28));
  for(let i=0;i<=steps;i++){
   const t=i/steps,x=a[0]+(b[0]-a[0])*t;
   const noise=i&&i<steps?Math.round((random(i+j*31,seed)-.5)*3)*grid:0;
   const y=Math.round((a[1]+(b[1]-a[1])*t)/grid)*grid+noise;
   if(points.length){const previous=points.at(-1);if(previous[0]!==x)points.push([x,previous[1]]);}
   if(!points.length||points.at(-1)[1]!==y)points.push([x,y]);
  }
 }
 return points;
}
export function faultPower(age){
 if(age<0||age>.62)return 0;
 return Math.sin(age/.62*Math.PI)*(.45+.55*Math.abs(Math.sin(age*34)));
}
export function edgePackets(edge,seed=1,budget=120){
 const points=[];
 for(let i=0;i<budget;i++){
  const a=edge[Math.floor(random(i,seed)*edge.length)];
  points.push({x:a[0]+(random(i,seed+4)-.5)*24,y:-a[1]+(random(i,seed+7)-.5)*10,z:0,c:i%3?[.1,.56,.64]:[.76,.24,.52],size:.6+random(i,seed+3)*2.4});
 }
 return createCloud(points,{space:'screen'});
}
