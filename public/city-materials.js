import * as THREE from './three.js';

function tile(width,height,paint) {
  const canvas=document.createElement('canvas');
  canvas.width=width; canvas.height=height;
  const c=canvas.getContext('2d');
  paint(c,width,height);
  const t=new THREE.CanvasTexture(canvas);
  t.colorSpace=THREE.SRGBColorSpace;
  t.wrapS=t.wrapT=THREE.RepeatWrapping;
  t.anisotropy=4;
  return t;
}
function rngFactory(seed=19) {
  return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
}
function stroke(c,x,y,u,v,color,width=1) {
  c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.stroke();
}
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
function fibers(c,w,h,amount,opacity=.15) {
  const random=rngFactory(85);
  c.lineCap='round';
  for(let i=0;i<amount;i++){
    const x=random()*w,y=random()*h, l=1+random()*3.5;
    stroke(c,x,y,x+l,y+l*.37,i%2?'rgba(255,246,220,'+opacity+')':'rgba(54,37,64,'+opacity+')',.55);
  }
}
function fabric(c,w,h){
  rect(c,0,0,w,h,'#f4eddf');
  for(let y=-4;y<h+4;y+=8)for(let x=-5;x<w+5;x+=8){
    const xx=x+(y%16===0?3:0);
    stroke(c,xx+1,y,xx+3.7,y+4.4,'#c1aea9',1.25);
    stroke(c,xx+3.7,y+4.4,xx+7,y+.3,'#fffdf3',1.3);
  }
  fibers(c,w,h,420,.08);
}
function wall(c,w,h){
  rect(c,0,0,w,h,'#eddec9');
  for(let y=4;y<h;y+=20){
    stroke(c,0,y,w,y,'#c2a898',1.1);
    const shift=y%40===4?27:0;
    for(let x=shift;x<w;x+=49)stroke(c,x,y,x,y+20,'#d1b9a7',1);
  }
  fibers(c,w,h,950,.18);
  for(let y=4;y<h;y+=8)for(let x=(y%16===4?4:0);x<w;x+=8){stroke(c,x,y,x+2,y+1.7,'#c9b7ab',.6);stroke(c,x+2,y+1.7,x+4,y+.3,'#ffedda',.6);}
  rect(c,24,16,80,96,'#c0a899');
  rect(c,25,15,73,91,'#fcf0d3');
  rect(c,30,21,63,82,'#6c646d');
  rect(c,33,24,57,75,'#534e5c');
  for(let panel=0;panel<2;panel++){
    const x=35+panel*28;
    const g=c.createLinearGradient(0,24,0,98);g.addColorStop(0,'#565567');g.addColorStop(.5,'#8c8a8c');g.addColorStop(1,'#c9a684');
    c.fillStyle=g;c.fillRect(x,26,24,70);
    c.fillStyle=panel?'#d2af9a':'#ccad88';
    c.beginPath();c.moveTo(x,26);c.lineTo(x+9,26);c.lineTo(x+4,66);c.lineTo(x+1,81);c.fill();
    rect(c,x,58,24,2,'#c1afa0');
    stroke(c,x+11,27,x+2,48,'rgba(255,244,222,.25)',1.8);
  }
  rect(c,26,100,71,4,'#fff2d5');rect(c,22,105,79,4,'#9e877d');
  rect(c,22,108,79,3,'#f9e5c9');
  stroke(c,20,82,101,82,'#504a58',3);stroke(c,20,80,101,80,'#e0b699',1.4);
  for(let x=24;x<101;x+=9){
    stroke(c,x,83,x,102,'#615462',1.9);
    c.strokeStyle='#735e66';c.lineWidth=1;c.beginPath();c.arc(x+3.8,90,3.5,0,Math.PI*2);c.stroke();
  }
  rect(c,0,119,w,3,'#ae968b');rect(c,0,122,w,4,'#fff1d4');
}
function glass(c,w,h){
  const g=c.createLinearGradient(0,0,w,h);
  g.addColorStop(0,'#9cb2b4');g.addColorStop(.43,'#647b8d');g.addColorStop(1,'#92929e');c.fillStyle=g;c.fillRect(0,0,w,h);
  rect(c,2,3,w-4,3,'#aec4cb');rect(c,0,0,3,h,'#475a72');rect(c,w-2,0,2,h,'#98a8ba');
  rect(c,0,h-5,w,5,'#546777');stroke(c,25,0,8,h,'#a3b5bf',1);fibers(c,w,h,250,.14);
}
function roof(c,w,h){
  rect(c,0,0,w,h,'#e5e3e6');
  for(let y=-8;y<h+12;y+=10)for(let x=-12;x<w+20;x+=20){
    const xx=x+(y%20===2?10:0);
    c.strokeStyle='#b7b4c1';c.lineWidth=1.3;c.beginPath();
    c.moveTo(xx,y);c.lineTo(xx,y+7);c.quadraticCurveTo(xx+9,y+13,xx+19,y+7);c.lineTo(xx+19,y);c.stroke();
  }
  fibers(c,w,h,100,.22);
}
const names=['BOULANGERIE','CAFÉ','PRESSE','LIBRAIRIE','FLEURS','MERCERIE','BRASSERIE','ATELIER'];
const shops=['#6c9390','#a65560','#647b92','#78566f','#6e8b69','#ac7862','#577d80','#8f6267'];
function shopTile(index){
  return tile(256,160,(c,w,h)=>{
    rect(c,0,0,w,h,'#efddc3');rect(c,5,5,246,142,'#554957');
    rect(c,9,9,238,135,shops[index]);rect(c,12,37,232,99,'#394857');
    rect(c,16,41,100,87,'#687f82');rect(c,120,40,52,91,'#425361');rect(c,176,41,64,87,'#697e80');
    const random=rngFactory(index*797+59);
    for(const [left,span] of [[19,94],[179,56]]){
      rect(c,left,46,span,68,'#6e7277');
      for(let k=0;k<8;k++){const x=left+random()*(span-8),y=70+random()*32;
        rect(c,x,y,4+random()*6,105-y,['#e0bc87','#d78f77','#8eb2a0','#9c899b'][k%4]);}
      rect(c,left,103,span,4,'#b58c72');
      c.fillStyle='rgba(224,240,224,.18)';c.beginPath();c.moveTo(left+5,45);c.lineTo(left+25,45);c.lineTo(left+7,104);c.lineTo(left,104);c.fill();
    }
    rect(c,124,45,43,60,'#8c9290');rect(c,129,110,33,16,shops[index]);rect(c,160,82,2,12,'#efca9c');
    rect(c,9,9,238,23,shops[index]);rect(c,9,32,238,2,'#ebcdac');
    c.fillStyle='#fff0ce';c.textAlign='center';c.textBaseline='middle';c.font='bold 17px Georgia, serif';c.fillText(names[index],128,22,215);
    rect(c,4,145,248,5,'#b59b89');fibers(c,w,h,680,.16);
  });
}
function asphalt(c,w,h){
  rect(c,0,0,w,h,'#6a6179');fibers(c,w,h,1500,.14);
  const r=rngFactory(331);
  for(let k=0;k<310;k++){const x=r()*w,y=r()*h;c.fillStyle=k%2?'#71667d':'#605b71';c.beginPath();c.ellipse(x,y,r()*1.3+.3,r()*.6+.3,r()*3,0,7);c.fill();}
}
function paving(c,w,h){
  rect(c,0,0,w,h,'#bfa6a5');
  for(let y=0;y<h;y+=16)for(let x=-24;x<w;x+=38){
    const xx=x+((y/16)%2)*19;
    stroke(c,xx,y,xx+37,y,'#988791',1.2);stroke(c,xx,y+1.6,xx+37,y+1.6,'#d0b8ac',1);
    stroke(c,xx,y,xx,y+15,'#ac949c',1);
  }fibers(c,w,h,780,.14);
}
export function cityMaterials(){
  const config={side:THREE.DoubleSide,vertexColors:true};
  const lambert=(map)=>new THREE.MeshLambertMaterial({...config,map});
  const material={
    plain:lambert(null),felt:lambert(tile(64,64,fabric)),facade:lambert(tile(128,128,wall)),roof:lambert(tile(64,64,roof)),
    glass:lambert(tile(64,64,glass)),road:lambert(tile(128,128,asphalt)),pave:lambert(tile(128,128,paving)),
    water:lambert(null),
  };
  for(let i=0;i<shops.length;i++)material['shop'+i]=lambert(shopTile(i));
  return material;
}
