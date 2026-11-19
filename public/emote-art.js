// Six hand-sewn patches. The network keeps its ordinary emoji codes.
import {yarnPalette as dye} from './wool-art.js';
import {drawToyWeapon} from './weapon-artwork.js';

const patches=new Map();
const names=new Set(['👋','❤️','😂','👀','😎','🧶']);
export function emotePatch(symbol){
  if(!names.has(symbol))return null;
  if(patches.has(symbol))return patches.get(symbol);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=96;
  const c=canvas.getContext('2d');c.scale(1.5,1.5);
  c.lineCap='round';c.lineJoin='round';
  function path(points,fill,edge=dye.ink,width=2){
    c.beginPath();c.moveTo(...points[0]);
    for(const p of points.slice(1)){if(p.length===2)c.lineTo(...p);else c.quadraticCurveTo(...p);}
    if(fill){c.closePath();c.fillStyle=fill;c.fill();}
    if(edge){c.strokeStyle=edge;c.lineWidth=width;c.stroke();}
  }
  function oval(x,y,w,h,fill,edge){
    c.beginPath();c.ellipse(x,y,w,h,0,0,Math.PI*2);c.fillStyle=fill;c.fill();
    if(edge){c.strokeStyle=edge;c.lineWidth=2;c.stroke();}
  }
  function stitched(points){
    c.setLineDash([2.3,2.8]);path(points,null,'#ffe1b5',1.65);c.setLineDash([]);
  }
  if(symbol==='🧶'){
    drawToyWeapon(c,'yarn',-3,3,68,57);
  }else if(symbol==='❤️'){
    path([[31,55],[21,48,9,36],[0,23,9,15],[21,6,31,21],[44,4,54,16],[64,27,52,39],[42,48,31,55]],'#bd6864');
    stitched([[31,49],[16,39,12,31],[7,20,15,18],[21,15,29,24]]);
    path([[41,16],[48,13,51,20]],null,'#efa88b',2.5);
  }else if(symbol==='👋'){
    path([[23,51],[10,39,9,30],[9,25,13,26],[17,27,20,33],[14,14,18,12],[21,10,23,14],[29,28],[23,10,27,9],[30,7,32,12],[37,26],[33,11,37,11],[40,10,42,17],[46,30],[45,20,48,20],[51,19,52,25],[56,43,45,48],[40,54],[29,55]],'#e6be80');
    path([[22,35],[30,32,36,37]],null,'#b38764',2.2);
    path([[25,51],[42,46],[46,51],[43,55],[30,60],[26,58]],dye.coral);
    stitched([[30,55],[40,52]]);
    path([[6,23],[4,19,6,15]],null,dye.teal,2.4);path([[53,12],[58,16,58,21]],null,dye.teal,2.4);
  }else if(symbol==='👀'){
    oval(21,32,14,17,'#efdab1',dye.ink);oval(43,30,13,17,'#efdab1',dye.ink);
    oval(25,34,5,8,dye.ink);oval(47,32,5,8,dye.ink);
    oval(25,31,1.7,2.3,'#fff0d5');oval(47,29,1.7,2.3,'#fff0d5');
    stitched([[11,35],[13,41,18,44]]);stitched([[36,39],[39,43,43,44]]);
  }else{
    oval(32,32,23,22,'#d5a359',dye.ink);
    stitched([[14,29],[16,18,26,15]]);stitched([[39,48],[45,46,49,39]]);
    if(symbol==='😎'){
      path([[9,25],[21,22],[31,24],[35,24],[47,21],[55,23],[52,34],[45,39],[37,35],[34,28],[30,28],[27,36],[19,39],[12,35]],'#334b50');
      path([[15,30],[19,26]],null,'#a8c8b8',2);path([[40,29],[44,25]],null,'#a8c8b8',2);
      path([[28,42],[34,46,40,39]],null,dye.ink,2.6);
    }else{
      path([[17,27],[22,19,28,27]],null,dye.ink,2.8);path([[36,26],[42,18,47,25]],null,dye.ink,2.8);
      path([[17,32],[31,37,46,30],[43,47,33,48],[23,48,17,32]],dye.ink);
      path([[24,42],[32,36,39,42],[34,49,28,45]],dye.coral,null);
      path([[10,32],[12,36,9,41],[5,44,4,40],[4,37,10,32]],dye.teal);
      path([[53,28],[59,31,59,35],[57,39,54,36],[52,34,53,28]],dye.teal);
    }
  }
  patches.set(symbol,canvas);return canvas;
}
export function makeEmoteIcon(symbol){
  const source=emotePatch(symbol);if(!source)return null;
  const c=document.createElement('canvas');c.width=c.height=source.width;c.className='mc-stitched-emote';
  c.setAttribute('aria-hidden','true');c.getContext('2d').drawImage(source,0,0);return c;
}
