// One painted cyclorama surrounds the city in both renderers. All stitches are baked once.
import {paintKnit} from './wool-art.js';

const tau=Math.PI*2,width=2048,height=1024,horizon=height*.5;
let backdrop;
function cloud(c,x,y,w,h,far,seed){
  c.save();c.translate(x,y);c.scale(w/110,h/37);
  const outline=new Path2D();
  outline.moveTo(1,26);
  outline.bezierCurveTo(-1,19,6,13,17,14);
  outline.bezierCurveTo(18,5,28,2,36,8);
  outline.bezierCurveTo(46,-8,65,-2,70,8);
  outline.bezierCurveTo(80,5,90,11,91,18);
  outline.bezierCurveTo(104,15,111,21,109,27);
  outline.bezierCurveTo(106,33,94,33,83,31);
  outline.bezierCurveTo(71,37,56,35,48,32);
  outline.bezierCurveTo(34,36,24,33,20,31);
  outline.bezierCurveTo(10,33,3,31,1,26);outline.closePath();
  c.globalAlpha=far?.38:.87;
  c.save();c.translate(.2,1.45);c.fillStyle='#ada9a8';c.fill(outline);c.restore();
  const fill=c.createLinearGradient(0,1,0,34);
  fill.addColorStop(0,'#fff1d2');fill.addColorStop(.55,'#f4dfc6');fill.addColorStop(1,'#d7c0b7');
  c.fillStyle=fill;c.fill(outline);
  c.save();c.clip(outline);paintKnit(c,-1,-3,113,43,{step:3,opacity:far?.07:.15,seed,light:'#fff5da',dark:'#ab908f'});c.restore();
  c.beginPath();c.moveTo(5,24);c.bezierCurveTo(6,19,11,17,17,18);
  c.moveTo(40,9);c.bezierCurveTo(47,0,59,1,65,8);
  c.strokeStyle='#fff1d8';c.lineWidth=.9;c.lineCap='round';c.stroke();
  if(!far){
    c.strokeStyle='#d2b8af';c.lineWidth=.8;c.setLineDash([2.3,2.8]);
    c.beginPath();c.moveTo(13,27);c.bezierCurveTo(33,30,47,26,58,29);c.bezierCurveTo(71,32,87,26,98,27);c.stroke();
  }
  c.restore();
}
function sun(c,x,y,r){
  const glow=c.createRadialGradient(x,y,r*.7,x,y,r*4);
  glow.addColorStop(0,'rgba(255,224,159,.43)');glow.addColorStop(1,'rgba(255,224,159,0)');
  c.fillStyle=glow;c.fillRect(x-4*r,y-4*r,r*8,r*8);
  c.save();c.beginPath();c.arc(x,y,r,0,tau);c.clip();
  const dye=c.createLinearGradient(x,y-r,x,y+r);dye.addColorStop(0,'#ffebaf');dye.addColorStop(1,'#edc483');
  c.fillStyle=dye;c.fillRect(x-r,y-r,2*r,2*r);
  paintKnit(c,x-r,y-r,2*r,2*r,{step:3,opacity:.18,light:'#fff4c8',dark:'#cda971'});
  c.setLineDash([1.7,1.8]);c.strokeStyle='#ffedb7';c.lineWidth=.9;
  c.beginPath();c.arc(x,y,r-1.8,0,tau);c.stroke();c.restore();
}
export const sunBearing=.98;
export function textileSky(){
  if(backdrop)return backdrop;
  const panel=document.createElement('canvas');panel.width=width;panel.height=height;
  const c=panel.getContext('2d'),wash=c.createLinearGradient(0,0,0,height);
  for(const [at,color] of [[0,'#516d89'],[.25,'#7796a8'],[.36,'#a6bdbd'],[.443,'#d8d1be'],
    [.5,'#f0d9be'],[.57,'#ccad9e'],[1,'#aa8f86']])wash.addColorStop(at,color);
  c.fillStyle=wash;c.fillRect(0,0,width,height);
  sun(c,width*sunBearing/tau,horizon-88,15);
  // Slightly different silhouettes and spacing keep a recognisable heading as the player turns.
  const clouds=[[.008,64,83,17],[.082,132,57,17],[.174,56,97,17],[.240,95,35,12],
    [.308,72,62,20],[.421,119,103,21],[.519,77,52,16],[.604,112,69,19],
    [.687,48,59,12],[.779,92,95,26],[.861,135,48,14],[.953,59,71,19]];
  for(const [i,[u,up,w,h]] of clouds.entries()){
    cloud(c,u*width,horizon-up,w,h,false,i);
    if(i%2===0)cloud(c,(u*width+110)%width,horizon-31-i%4*3,63+i,8+i%3,true,i+4);
  }
  backdrop=panel;return panel;
}

// Sample a horizontal strip from the same equirectangular panorama as the WebGL dome.
// The horizon and focal length come from the chase camera, so the backdrop stays put when walking.
export function paintSkyView(ctx,w,h,screenHorizon,focal,yaw){
  const bottom=Math.min(h,Math.max(0,screenHorizon));
  if(bottom===0)return;
  const panel=textileSky(),scale=focal*tau/width;
  const phase=((yaw/tau)%1+1)%1,top=screenHorizon-horizon*scale;
  const firstY=Math.max(0,top),sourceY=Math.max(0,-top/scale);
  if(firstY>0){ctx.fillStyle='#516d89';ctx.fillRect(0,0,w,firstY);}
  const visibleHeight=bottom-firstY;
  if(visibleHeight<=0)return;
  // Crop to the portion above the street before scaling. A small viewport consumes
  // only a fraction of the panorama; pass that rectangle to the software rasterizer.
  let sourceX=((phase*width-w/(scale*2))%width+width)%width;
  for(let x=0;x<w;){
    const length=Math.min(w-x,(width-sourceX)*scale);
    if(length<=0)break;
    ctx.drawImage(panel,sourceX,sourceY,length/scale,visibleHeight/scale,x,firstY,length,visibleHeight);
    x+=length;sourceX=0;
  }
}
