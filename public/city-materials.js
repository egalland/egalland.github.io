import {glassCloth, windowCloth, shopCloth, shopCloths, zincCloth} from './paris-applique.js';
import {paintStreetFabric} from './street-fabric.js';
import {paintKnit} from './wool-art.js';
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
  paintKnit(c,0,0,w,h,{step:8,opacity:.55,seed:1,light:'#fff8db',dark:'#705965'});
}
function wall(c,w,h){
  c.drawImage(windowCloth(0),0,0,w/2,h);
  c.drawImage(windowCloth(3),w/2,0,w/2,h);
}
function glass(c,w,h){c.drawImage(glassCloth(),0,0,w,h);}
function roof(c,w,h){c.drawImage(zincCloth(),0,0,w,h);}
function shopTile(index){
  const art=shopCloth(index);
  return tile(art.width,art.height,(c)=>c.drawImage(art,0,0));
}
function asphalt(c,w,h){paintStreetFabric(c,w,h,'road');}
function paving(c,w,h){paintStreetFabric(c,w,h,'paving');}
export function cityMaterials(){
  const config={side:THREE.DoubleSide,vertexColors:true};
  const lambert=(map)=>new THREE.MeshLambertMaterial({...config,map});
  const material={
    plain:lambert(null),felt:lambert(tile(64,64,fabric)),facade:lambert(tile(224,112,wall)),roof:lambert(tile(80,60,roof)),
    glass:lambert(tile(64,64,glass)),road:lambert(tile(128,128,asphalt)),pave:lambert(tile(128,128,paving)),
    park:lambert(tile(128,128,(c,w,h)=>paintStreetFabric(c,w,h,'park'))),
    water:lambert(tile(128,128,(c,w,h)=>paintStreetFabric(c,w,h,'water'))),
  };
  for(let i=0;i<shopCloths.length;i++)material['shop'+i]=lambert(shopTile(i));
  return material;
}
