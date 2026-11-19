import {yarnPalette as dye} from './wool-art.js';
import {weaponCatalog} from './weapon-catalog.js';

// Felt cut-outs for the wheel, the embroidered map patch and the three-dimensional drops.
const ink=dye.ink,cream=dye.cream,wood='#b78360';
function stroke(c,path,color,width){
  c.beginPath();c.moveTo(path[0][0],path[0][1]);
  for(const p of path.slice(1)){if(p.length===4)c.quadraticCurveTo(...p);else if(p.length===6)c.bezierCurveTo(...p);else c.lineTo(...p);}
  c.strokeStyle=color;c.lineWidth=width;c.stroke();
}
function filled(c,path,color,edge=ink,width=3.1){
  c.beginPath();c.moveTo(path[0][0],path[0][1]);
  for(const p of path.slice(1)){if(p.length===4)c.quadraticCurveTo(...p);else if(p.length===6)c.bezierCurveTo(...p);else c.lineTo(...p);}
  c.closePath();c.fillStyle=color;c.fill();if(edge){c.strokeStyle=edge;c.lineWidth=width;c.stroke();}
}
function oval(c,x,y,rx,ry,color,edge=ink,width=2.8,angle=0){
  c.beginPath();c.ellipse(x,y,rx,ry,angle,0,Math.PI*2);c.fillStyle=color;c.fill();
  if(edge){c.strokeStyle=edge;c.lineWidth=width;c.stroke();}
}
function bars(c,x,y,n,dx,dy,col){
  for(let i=0;i<n;i++)stroke(c,[[x+i*dx,y+i*dy],[x+i*dx+3,y+i*dy+4]],col,1.75);
}
function star(c,x,y,r,col){
  const points=[];for(let i=0;i<10;i++){const a=-Math.PI*.5+i*Math.PI/5,d=i%2?r*.52:r;points.push([x+d*Math.cos(a),y+d*Math.sin(a)]);}
  filled(c,points,col,ink,2.3);
}
function pom(c,x,y,r,p){
  const shape=[];for(let i=0;i<30;i++){const a=i*Math.PI/15,k=r*(i%2?.79:1);shape.push([x+Math.cos(a)*k,y+Math.sin(a)*k]);}
  filled(c,shape,p.accent,ink,2.6);for(let i=0;i<6;i++){const a=i*1.1;stroke(c,[[x+Math.cos(a)*r*.3,y+Math.sin(a)*r*.3],[x+Math.cos(a+.2)*r*.63,y+Math.sin(a+.2)*r*.63]],i%2?p.thread:p.trim,1.6);}
}
const pictures={
  fist(c){
    filled(c,[[24,40],[19,28,26,24],[31,22,35,28],[32,14,39,13],[46,11,49,21],
      [48,11,55,12],[62,11,65,23],[66,16,72,19],[80,23,79,33],[83,44,73,52],
      [65,58],[62,67],[37,70],[32,58],[21,51,19,46],[17,39,24,40]],'#ecd6ad',ink,3.4);
    stroke(c,[[25,40],[31,35,37,39],[42,44,48,43]],'#9e785f',2.7);
    for(const [x,y] of [[36,24],[49,20],[64,23]])stroke(c,[[x,y],[x+2,y+6,x+1,y+11]],'#b59677',2.5);
    filled(c,[[33,59],[64,55],[68,65],[64,70],[39,75],[34,73]],'#b16a58',ink,2.9);
    bars(c,40,63,5,4,-.7,cream);
  },
  pistol(c,p){
    filled(c,[[21,35],[32,29],[64,18],[66,14],[72,13],[74,17],[86,14],
      [89,27],[59,36],[56,47,44,48],[40,47],[37,61],[32,68],[19,68],[15,64],[22,45]],'#b2836b');
    filled(c,[[22,33],[82,15],[89,18],[90,26],[29,45],[22,42]],'#9eafb0',ink,2.8);
    stroke(c,[[29,35],[82,20]],'#f6e6bc',3.4);
    stroke(c,[[44,42],[49,44,54,39]],p.trim,2.5);
    filled(c,[[25,47],[36,44],[31,62],[21,64]],'#966656',ink,1.7);
    bars(c,25,52,3,-1.1,3.4,'#f1c896');bars(c,33,33,3,3,-1,'#58676c');
  },
  smg(c,p){
    filled(c,[[10,40],[23,35],[32,38],[35,30],[55,30],[59,25],[68,25],[71,29],
      [85,29],[88,25],[94,26],[94,36],[76,39],[73,45],[62,46],[67,59],
      [56,64],[48,49],[39,48],[34,59],[25,58],[30,42],[15,50],[9,48]],'#789a8e');
    filled(c,[[10,40],[23,35],[33,38],[28,42],[11,49]],wood,ink,2);
    filled(c,[[35,32],[56,32],[60,27],[67,27],[68,35],[60,40],[33,40]],'#bcd4b7',ink,1.7);
    bars(c,42,33,4,4,0,'#507d77');stroke(c,[[74,33],[88,32]],p.trim,2.2);
    bars(c,54,50,3,1.5,3.3,cream);
  },
  shotgun(c,p){
    filled(c,[[7,58],[11,49],[27,48],[38,43],[45,35],[57,29],[63,29],[87,15],
      [93,16],[95,23],[67,40],[56,46],[48,47],[42,46],[37,49],[33,57],[12,66],[8,64]],wood);
    filled(c,[[39,43],[50,35],[58,31],[86,15],[93,16],[94,22],[63,40],[52,45],[44,46]],'#9da9a7',ink,2.1);
    stroke(c,[[60,33],[89,17]],'#f8e9cd',2.6);stroke(c,[[61,37],[90,22]],'#657771',1.8);
    filled(c,[[45,42],[56,34],[64,31],[66,36],[56,43],[49,46]],'#c99866',ink,1.6);
    bars(c,49,42,4,3,-1.9,'#866050');stroke(c,[[13,56],[29,52]],p.trim,2.1);
  },
  yarn(c){
    const red='#b95760',light='#f0ac91',edge='#77454c';
    stroke(c,[[61,47],[72,61,80,56],[87,51,92,56]],ink,5.2);
    stroke(c,[[61,47],[72,61,80,56],[87,51,92,56]],red,3);
    oval(c,44,40,23,22,edge,ink,3.4);
    c.save();c.beginPath();c.ellipse(44,40,22,21,-.15,0,Math.PI*2);c.clip();
    for(let i=0;i<8;i++)stroke(c,[[13+i*5,14],[28+i*4,38,49+i*5,67]],i%2?red:light,3.7);
    for(let i=0;i<5;i++)stroke(c,[[19,53+i*4],[46,51+i*4,68,25+i*3]],i%2?red:light,3.6);
    c.restore();stroke(c,[[29,29],[33,24,39,23]],cream,2);
  },
  ribbonbow(c,p){
    stroke(c,[[24,65],[13,37,32,20],[45,7,71,11]],ink,10);
    stroke(c,[[24,65],[13,37,32,20],[45,7,71,11]],wood,6.5);
    stroke(c,[[23,64],[66,17],[71,11]],p.trim,2.4);
    stroke(c,[[26,19],[69,52]],ink,5);stroke(c,[[26,19],[69,52]],p.accent,2.7);
    filled(c,[[61,51],[78,59],[72,42],[68,48]],p.accent);
    filled(c,[[26,18],[15,12],[19,22],[15,24],[29,25]],p.thread,ink,2);
    filled(c,[[42,17],[39,30],[29,30],[35,35],[31,44],[44,38],[47,23]],p.accent,ink,2);
    bars(c,21,36,3,0,5,cream);
  },
  pompom(c,p){
    filled(c,[[19,40],[56,23],[72,43],[35,62],[27,60],[21,52]],p.thread);
    filled(c,[[28,52],[41,52],[41,58],[32,71],[22,68]],wood);
    filled(c,[[19,39],[27,35],[39,54],[33,60]],p.accent);
    oval(c,62,33,9,15,p.trim,ink,2.8,-.55);
    oval(c,63,32,5,10,p.cloth,p.thread,1.8,-.55);
    pom(c,77,19,12,p);bars(c,38,35,4,4,-1.8,p.trim);
  },
  confetti(c,p){
    filled(c,[[17,52],[29,41],[50,35],[70,14],[87,43],[57,44],[32,53],[23,59]],p.accent);
    filled(c,[[20,51],[34,48],[38,54],[30,57],[26,69],[16,65]],wood);
    filled(c,[[62,22],[69,13],[88,42],[77,43]],p.trim);
    filled(c,[[37,39],[43,37],[53,46],[47,48]],'#aeead1',null);bars(c,49,34,2,5,-4,p.cloth);
    filled(c,[[76,5],[81,3],[84,9],[79,11]],'#ffc76b',ink,1.2);
    filled(c,[[91,19],[96,18],[95,24]],'#96e8de',ink,1.2);
    stroke(c,[[85,9],[91,5]],'#f7b3ea',2.6);
  },
  boomerang(c,p){
    filled(c,[[10,52],[21,38,41,14],[45,9,53,11],[60,12,62,20],[76,49,90,52],[94,55,88,60],[80,66,70,60],[54,49,48,37],[41,42,25,55],[16,61,10,57]],p.accent);
    filled(c,[[39,17],[46,11,53,13],[58,15,61,23],[55,32],[44,30],[36,23]],wood,ink,2);
    for(let i=0;i<4;i++)stroke(c,[[42+i*3,17],[47+i*3,25]],i%2?cream:p.thread,2);
    stroke(c,[[18,51],[28,45,34,36]],p.thread,2.5);stroke(c,[[62,39],[69,51,80,54]],p.thread,2.5);
  },
  bubbles(c,p){
    filled(c,[[17,55],[23,48,27,47],[27,37],[43,37],[43,47],[51,51,51,62],[51,70,44,71],[20,71],[15,68,17,55]],p.accent);
    filled(c,[[25,38],[45,38],[46,44],[24,44]],p.thread);
    oval(c,34,59,9,6,p.trim,p.thread,1.6);
    stroke(c,[[46,54],[63,26]],ink,5.5);stroke(c,[[46,54],[63,26]],p.trim,2.8);
    oval(c,65,23,8,10,p.cloth,p.accent,3.5,.35);
    for(const [x,y,r] of [[82,12,7],[83,34,4.6],[56,9,3.8]]){oval(c,x,y,r,r,p.thread,p.trim,1.8);stroke(c,[[x-r*.5,y-r*.16],[x-r*.35,y-r*.65,x+r*.1,y-r*.65]],'#fff4eb',1.6);}
  },
  spool(c,p){
    stroke(c,[[60,56],[67,68,75,58],[82,49,91,59]],ink,5);stroke(c,[[60,56],[67,68,75,58],[82,49,91,59]],p.accent,2.8);
    filled(c,[[26,24],[60,16],[72,49],[33,60]],p.thread);
    for(let i=0;i<6;i++)stroke(c,[[29+i*.8,29+i*4],[42,28+i*4,64+i*.9,20+i*4]],i%2?p.trim:p.accent,3.6);
    oval(c,44,21,25,7,wood,ink,2.9,-.24);oval(c,45,20,6,2.4,p.cloth,ink,1.3,-.24);
    filled(c,[[28,56],[70,44],[77,49],[75,55],[45,65],[32,63]],wood);
    filled(c,[[44,63],[61,58],[51,72]],p.trim,ink,2);
  },
  star(c,p){
    filled(c,[[40,69],[49,70],[54,48],[69,31],[72,18],[66,17],[61,28],[47,38],[35,30],[31,21],[23,23],[26,35],[42,49]],wood);
    stroke(c,[[26,24],[42,23],[68,18]],ink,5);stroke(c,[[26,24],[42,23],[68,18]],p.accent,2.5);
    stroke(c,[[42,51],[49,53]],p.thread,3);stroke(c,[[41,56],[48,58]],p.accent,3);stroke(c,[[40,61],[47,63]],p.thread,3);
    star(c,75,13,12,p.accent);stroke(c,[[58,12],[64,11]],p.trim,2.2);stroke(c,[[63,7],[68,7]],p.trim,1.8);
  },
  chime(c,p){
    stroke(c,[[44,27],[38,19,44,14],[49,10,54,17],[57,21,53,27]],ink,6);
    stroke(c,[[44,27],[38,19,44,14],[49,10,54,17],[57,21,53,27]],p.thread,3.5);
    filled(c,[[25,54],[32,48,32,39],[34,29,44,27],[56,24,62,36],[63,48,69,52],[73,57],[69,61],[26,62],[22,59]],p.accent);
    oval(c,47,59,23,4,p.thread,ink,2.2);
    oval(c,48,64,5,5,p.accent,ink,2);
    stroke(c,[[39,44],[40,35,47,33]],p.trim,3);bars(c,29,52,6,5,0,p.trim);
    stroke(c,[[72,34],[78,36,81,44]],p.thread,3);stroke(c,[[76,27],[87,31,90,42]],p.trim,2.4);
  }
};
export function drawToyWeapon(c,kind,x,y,w,h=w){
  const picture=pictures[kind],spec=weaponCatalog[kind];if(!picture||!spec)return false;
  const scale=Math.min(w/100,h/78);
  c.save();c.translate(x+(w-100*scale)*.5,y+(h-78*scale)*.5);c.scale(scale,scale);
  c.lineCap='round';c.lineJoin='round';picture(c,spec.palette);c.restore();return true;
}
