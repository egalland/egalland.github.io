const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};
export function scatteredPose(_index,width,random=Math.random){
 const mobile=width<=700,range=(a,b)=>a+(b-a)*random();
 // Frames start upright. Tilt comes from momentum during the transfer.
 return {x:range(-1,1)*(mobile?20:68),y:range(-18,26),angle:0,bend:range(-1,1),duration:range(.8,1.3),draw:random(),obstacle:0,kind:'normal',flip:0};
}
export function placementPose(source,progress){
 const p=clamp(progress),kind=source.kind||'normal';
 if(p===0)return {x:source.x,y:source.y,angle:0,flip:source.flip||0};
 if(p===1)return {x:0,y:0,angle:0,flip:0};
 const spring=(1-smooth(p))*(Math.cos(p*9)+.32*Math.sin(p*9));
 const travel=Math.sin(p*Math.PI),impact=Math.sin(p*Math.PI*3)*Math.exp(-p*3);
 let x=source.x*spring,y=source.y*spring,angle=source.x*.085*impact;
 const obstacle=source.obstacle||0;
 x+=obstacle*travel*10;y-=Math.abs(obstacle)*travel*14;angle+=obstacle*impact*3;
 if(kind==='drop'){
  // The line slips from one edge, then the builder catches and straightens it.
  const fall=p<.38?(p/.38)**2:Math.exp(-(p-.38)*8)*Math.cos((p-.38)*11);
  y+=Math.max(-8,fall*48)*(1-smooth(p));angle+=fall*12*(source.bend>=0?1:-1)*(1-smooth(p));
 }
 return {x,y,angle,flip:kind==='flip'?180*(1-smooth(p)):0};
}
