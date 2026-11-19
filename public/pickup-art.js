// All pickup markers, including the software view, share the same embroidered patch.
const patches=new Map();
const palettes={
  smg:{accent:'#76e2cc',thread:'#338d84',cloth:'#24444c',trim:'#bff5d6'},
  shotgun:{accent:'#ffd084',thread:'#c68f55',cloth:'#58444e',trim:'#fff0c2'},
  yarn:{accent:'#ffa4cd',thread:'#be6a98',cloth:'#4e3656',trim:'#ffdbec'},
};
export const pickupRange=110;
export const pickupMarkerWidth=2.15;
export const pickupStyle=kind=>palettes[kind];
export function pickupLift(time,seed){return 1.54+.14*Math.sin(time*2.36+seed);}
export function pickupPhase(id){
  let h=2166136261;for(const c of String(id)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0)%628/100;
}
function line(c,points,color,width){
  c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>c[i?'lineTo':'moveTo'](x,y));c.stroke();
}
function shape(c,points,fill,stroke,width=2.5){
  c.fillStyle=fill;c.beginPath();points.forEach(([x,y],i)=>c[i?'lineTo':'moveTo'](x,y));c.closePath();c.fill();
  if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
}
function ellipse(c,x,y,rx,ry,fill){
  c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();
}
function embroidery(c,points,col){
  c.setLineDash([2.4,2.7]);line(c,points,col,1.3);c.setLineDash([]);
}
function softGun(c,kind){
  const outline='#302c3d',ivory='#ffe4b1';
  if(kind==='smg'){
    shape(c,[[22,51],[35,48],[40,51],[41,44],[63,44],[65,41],[76,41],[77,44],[89,44],[91,40],[97,40],[99,48],[96,52],[78,52],[75,58],[65,59],[69,70],[60,73],[54,61],[47,60],[43,68],[35,67],[39,55],[35,55],[23,59]],'#89c7b4',outline,3.2);
    shape(c,[[22,51],[33,49],[37,51],[34,55],[22,59]],'#bb956e',outline,1.6);
    shape(c,[[42,46],[62,46],[65,44],[76,44],[76,50],[71,54],[43,54]],'#c7e4c9',outline,1.4);
    for(let i=0;i<5;i++)line(c,[[47+i*4.5,47],[48+i*4.5,51]],'#589c95',1.5);
    line(c,[[78,45],[92,45]],ivory,1.8);
    embroidery(c,[[61,61],[65,69],[62,70]],ivory);
  }else{
    shape(c,[[11,64],[18,58],[37,58],[44,54],[48,49],[61,44],[68,41],[72,42],[99,28],[106,28],[109,33],[106,38],[77,51],[64,56],[60,59],[52,57],[45,58],[40,66],[17,76],[13,73]],'#bd8264',outline,3.2);
    shape(c,[[45,52],[56,46],[64,45],[97,29],[104,28],[106,33],[71,51],[59,54],[53,58],[46,57]],'#c6c2c0',outline,1.7);
    line(c,[[65,46],[101,29]],'#fff0cd',2.5);
    line(c,[[68,49],[106,32]],'#786d79',1.25);
    shape(c,[[49,55],[58,50],[66,48],[70,50],[66,54],[59,57],[52,59]],'#d7a771',outline,1.1);
    for(let i=0;i<4;i++)line(c,[[53+i*3,55-i*1.4],[55+i*3,57-i*1.4]],'#866358',1.2);
    embroidery(c,[[18,69],[25,64],[38,62]],ivory);
  }
}
function yarn(c){
  line(c,[[76,64],[83,70],[91,67],[97,69],[100,65]],'#2e2541',5);line(c,[[76,64],[83,70],[91,67],[97,69],[100,65]],'#ffa4cd',2.7);
  ellipse(c,58,52,23.4,22.5,'#30263d');ellipse(c,58,52,21.3,20.6,'#c75e94');
  c.save();c.beginPath();c.ellipse(58,52,20.6,20.1,-.2,0,Math.PI*2);c.clip();
  for(let i=-4;i<=5;i++){c.strokeStyle=i%2?'#fdb0ce':'#e88aae';c.lineWidth=3.2;c.beginPath();c.moveTo(25+i*5,29);c.quadraticCurveTo(45+i*6,44,67+i*6,81);c.stroke();}
  for(let i=0;i<4;i++){c.strokeStyle=i%2?'#fac2da':'#e79dbe';c.lineWidth=2.8;c.beginPath();c.moveTo(31,62+i*6);c.quadraticCurveTo(54,63+i*5,84,32+i*6);c.stroke();}
  c.restore();line(c,[[45,40],[50,36],[55,35]],'#ffe0e2',2.4);
}
export function pickupPatch(kind){
  if(patches.has(kind))return patches.get(kind);
  const p=pickupStyle(kind);if(!p)return null;
  const canvas=document.createElement('canvas');canvas.width=240;canvas.height=192;
  const c=canvas.getContext('2d');c.scale(2,2);c.lineJoin='round';c.lineCap='round';
  const points=[[9,42],[18,25],[54,11],[75,12],[100,24],[111,45],[104,63],[76,81],[54,86],[25,75],[11,60]];
  shape(c,points.map(([x,y])=>[x,y+2]),'#332b3d','#332b3d',3.5);
  shape(c,points,p.cloth,p.accent,3.4);
  embroidery(c,points.map(([x,y])=>[60+(x-60)*.90,49+(y-49)*.87]).concat([[14,43]]),p.trim);
  c.save();c.globalAlpha=.21;
  for(let y=29;y<70;y+=6)for(let x=25+(y%2)*3;x<97;x+=8){line(c,[[x,y],[x+1.8,y+1.3],[x+3.2,y-.5]],p.trim,.7);}
  c.restore();
  if(kind==='yarn')yarn(c);else softGun(c,kind);
  shape(c,[[90,18],[92,12],[94,17],[99,19],[94,21],[92,27],[90,22],[86,20]],'#fff5cf',p.cloth,1.6);
  patches.set(kind,canvas);return canvas;
}
