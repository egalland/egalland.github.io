// A window bay, a shop and a piece of zinc are painted once and used by both city renderers.
import {paintKnit,yarnPalette} from './wool-art.js';
const ink=yarnPalette.ink, butter='#ffe6b6', straw='#d8ae7d';
export const feltStone=['#ecd0a9','#e9c39e','#dcc0a7','#ead7b9','#dab79d','#e6c6af','#efe0bc','#d9bfab'];
export const feltSlate=['#556d77','#586877','#4f6571','#626d79','#506673'];
export const shopCloths=['#9c5458','#427975','#5b687d','#8a5566','#577567','#a46853','#456c79','#7c626e'];
const signs=['BOULANGERIE','CAFÉ','PRESSE','LIBRAIRIE','FLEURS','MERCERIE','BRASSERIE','ATELIER'];
const samples=new Map();
function sample(key,w,h,draw){
  if(!samples.has(key)){
    const c=document.createElement('canvas');c.width=w;c.height=h;
    const g=c.getContext('2d');g.lineJoin=g.lineCap='round';draw(g,w,h);samples.set(key,c);
  }
  return samples.get(key);
}
function box(g,x,y,w,h,r,fill){
  g.fillStyle=fill;g.beginPath();g.roundRect(x,y,w,h,r);g.fill();
}
function line(g,x1,y1,x2,y2,color,width){
  g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();
}
function cord(g,path,under,thread,rim,width,stitch=true){
  g.strokeStyle=under;g.lineWidth=width+2.2;g.stroke(path);
  g.strokeStyle=thread;g.lineWidth=width;g.stroke(path);
  if(stitch){g.setLineDash([width*.64,width*.99]);g.strokeStyle=rim;g.lineWidth=width*.42;g.stroke(path);g.setLineDash([]);}
}
function arch(x,y,w,h,archRise){
  const p=new Path2D();p.moveTo(x,y+h);p.lineTo(x,y+archRise);
  p.bezierCurveTo(x,y-archRise*.32,x+w,y-archRise*.32,x+w,y+archRise);
  p.lineTo(x+w,y+h);p.closePath();return p;
}
function band(g,y,w,height){
  box(g,-2,y+2,w+4,height,1,'#a08379');box(g,-2,y,w+4,height,1,'#ecd1aa');
  line(g,0,y+1,w,y+1,'#fbe4bc',1.6);
}
export function windowCloth(variant=0){
  const v=variant%8;
  return sample('bay'+v,112,112,(g,w,h)=>{
    g.fillStyle=feltStone[v];g.fillRect(0,0,w,h);
    for(let j=0;j<4;j++){
      const y=9+j*27;
      line(g,0,y,w,y,'rgba(120,83,71,.18)',1.1);
      line(g,0,y+1.3,w,y+1.3,'rgba(255,236,196,.44)',.95);
      const x=j%2?15:97;line(g,x,y,x,y+26,'rgba(120,83,71,.18)',1);
    }
    embroiderGround(g,w,h);
    const x=24,y=15,ww=64,hh=77,rise=v%3===1?4:14;
    const rim=arch(x,y,ww,hh,rise),pane=arch(x+4,y+4,ww-8,hh-8,rise*.85);
    g.save();g.translate(1.5,3.5);g.fillStyle='#aa897c';g.fill(rim);g.restore();
    g.fillStyle='#ead5b0';g.fill(rim);
    cord(g,rim,'#a98879','#e6c598','#fff1c8',6.4);
    g.save();g.clip(pane);
    const lit=(v===3||v===6),gradient=g.createLinearGradient(0,y,0,y+hh);
    gradient.addColorStop(0,lit?'#ba8762':'#435a67');gradient.addColorStop(1,lit?'#f1c285':'#78949a');
    g.fillStyle=gradient;g.fillRect(x,y,ww,hh);
    const veil=v%4===2?'#97a499':lit?'#b17460':'#cfa18a';
    for(const side of [-1,1]){
      g.save();g.translate(side<0?x:x+ww,y);g.scale(side<0?1:-1,1);
      g.fillStyle=veil;g.beginPath();g.moveTo(0,0);g.lineTo(21,0);g.quadraticCurveTo(19,22,8,39);g.quadraticCurveTo(6,48,9,69);g.lineTo(0,70);g.closePath();g.fill();
      line(g,13,5,7,31,'rgba(255,229,182,.50)',1.8);line(g,2,40,8,39,butter,1.8);g.restore();
    }
    for(let k=0;k<2;k++)line(g,x+32+k*12,y+17,x+22+k*12,y+31,'rgba(239,242,219,.31)',2);
    line(g,56,y+1,56,y+hh,'#514e52',3.8);line(g,54.5,y+3,54.5,y+hh-1,'#dbc49e',1.8);
    line(g,x,y+34,x+ww,y+34,'#484a51',3.3);line(g,x,y+33,x+ww,y+33,'#c7b99d',1.5);
    g.restore();band(g,92,w,3);
    if(v%4!==1){
      const metal='#4f515a';
      for(let i=0;i<5;i++){
        const a=x-2+i*15;
        const curl=new Path2D();curl.moveTo(a,91);curl.bezierCurveTo(a+10,86,a+11,79,a+6,78);curl.bezierCurveTo(a+1,78,a+2,84,a+6,82);
        g.lineWidth=2;g.strokeStyle=metal;g.stroke(curl);
      }
      line(g,x-7,76,x+ww+7,76,ink,3.7);line(g,x-7,75,x+ww+7,75,'#9f8c79',1.6);
    }
    band(g,103,w,5);
  });
}
function embroiderGround(g,w,h){
  paintKnit(g,0,0,w,h,{step:6,opacity:.27,seed:17});
}
export function glassCloth(){
  return sample('glass',64,64,(g,w,h)=>{
    const grad=g.createLinearGradient(0,0,w,h);grad.addColorStop(0,'#73949c');grad.addColorStop(.65,'#567382');grad.addColorStop(1,'#8ea5a4');
    g.fillStyle=grad;g.fillRect(0,0,w,h);embroiderGround(g,w,h);
    g.save();g.globalAlpha=.38;line(g,26,2,5,34,'#cbd7c6',2.5);line(g,34,2,24,18,'#d8dec9',1.4);g.restore();
    const seam=new Path2D();seam.moveTo(1.5,63);seam.lineTo(1.5,2);seam.lineTo(64,2);
    cord(g,seam,'#496271','#8ba5a8','#d1d8c5',2.3);
  });
}
export function zincCloth(){
  return sample('zinc',80,60,(g,w,h)=>{
    g.fillStyle='#d4dedb';g.fillRect(0,0,w,h);
    for(let y=-12;y<h+12;y+=12)for(let x=-20;x<w+18;x+=20){
      const xx=x+(Math.abs(y/12)%2)*10;
      const p=new Path2D();p.moveTo(xx,y);p.lineTo(xx,y+5);p.quadraticCurveTo(xx+10,y+17,xx+20,y+5);p.lineTo(xx+20,y);
      cord(g,p,'#92a4af','#b8c7ca','#e8e6d4',1.3);
    }
  });
}
function displayItem(g,x,y,type,accent,index){
  g.save();g.translate(x,y);
  if(type===0||type===6){
    g.rotate(-.22+.18*index);g.fillStyle='#dca873';g.beginPath();g.ellipse(0,-3,8,5,0,0,7);g.fill();
    for(let j=-4;j<=4;j+=4)line(g,j+1,-5,j-1,-2,butter,1.3);
  }else if(type===4){
    line(g,0,2,-1,-10,'#7d9f82',1.7);box(g,-4,-2,8,5,1,accent);
    g.fillStyle=index%2?butter:'#e1a494';
    for(let k=0;k<5;k++){g.beginPath();g.ellipse(-1+Math.cos(k*1.257)*2.4,-11+Math.sin(k*1.257)*2.4,2,2,0,0,7);g.fill();}
  }else if(type===5||type===7){
    g.fillStyle=accent;g.beginPath();g.ellipse(0,-3,6,6,0,0,7);g.fill();
    for(let k=-3;k<=3;k+=3)line(g,-3+k*.12,-4+k,3+k*.12,-7+k,butter,1);
  }else{
    g.rotate(index%2?.04:-.12);box(g,-3,-11,7,14,1,accent);
    line(g,-2,-7,2,-7,butter,1);line(g,-2,-5,1,-5,butter,.7);
  }
  g.restore();
}
export function shopCloth(index=0){
  const id=index%8,cloth=shopCloths[id];
  return sample('shop'+id,216,110,(g,w,h)=>{
    g.fillStyle='#c6ad95';g.fillRect(0,0,w,h);box(g,4,2,w-8,h,4,ink);box(g,7,3,w-14,h-4,3,cloth);
    box(g,10,24,196,80,2,'#ead1ac');box(g,13,27,190,74,2,'#42424e');
    for(const [x,width] of [[15,72],[130,70]]){
      const grad=g.createLinearGradient(x,37,x,94);grad.addColorStop(0,'#536b71');grad.addColorStop(1,'#96a09a');
      box(g,x,35,width,55,2,grad);
      for(let n=0;n<4;n++)displayItem(g,x+9+n*16,82-(n%2)*2,id,[straw,'#b77e7d','#8da89b','#cba77f'][n],n);
      line(g,x+1,85,x+width-1,85,'#c59f7e',3);
      line(g,x+width-12,43,x+width-22,55,'rgba(238,240,212,.46)',2.3);
    }
    box(g,95,31,28,76,3,cloth);box(g,98,36,22,47,4,'#667e7e');box(g,98,87,22,13,2,'#4a515a');
    line(g,119,73,119,78,butter,2);
    for(let k=0;k<16;k++){
      const x=4+k*13;
      box(g,x,29,13.5,13,[0,0,5,5],k%2===0?cloth:'#e7c799');
      line(g,x+1.6,31,x+1.6,37,k%2===0?'rgba(255,231,184,.35)':'#f4e1b8',1);
    }
    const plaque=new Path2D();plaque.roundRect(7,4,202,21,6);g.fillStyle=cloth;g.fill(plaque);
    cord(g,plaque,ink,cloth,straw,2.5);
    g.fillStyle='#fff3d7';g.font='bold 14px Georgia, serif';g.textAlign='center';g.textBaseline='middle';g.fillText(signs[id],108,15.4,154);
    for(const x of [19,197]){g.fillStyle='#edcc8e';g.beginPath();g.arc(x,15,1.9,0,7);g.fill();}
    box(g,3,104,210,4,1,'#b69a85');
  });
}

export function marbleCloth(columns,rows){
  return sample('marble'+columns+'/'+rows,columns*26,rows*20,(g,w,h)=>{
    // The broad pale panels of the Grande Arche read as padded felt squares.
    // This layer is transparent, so the block's original lighting remains underneath.
    paintKnit(g,0,0,w,h,{step:4,opacity:.34,light:'#ffefd2',dark:'#687481',seed:12});
    for(let y=0;y<h;y+=20)for(let x=0;x<w;x+=26){
      line(g,x+.6,y+.5,x+25.6,y+.5,'rgba(72,93,105,.46)',.9);
      line(g,x+.5,y+1.8,x+25.6,y+1.8,'rgba(255,247,220,.65)',1);
      line(g,x+.6,y+2,x+.6,y+19,'rgba(72,93,105,.36)',.9);
    }
  });
}
