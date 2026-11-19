import {paintKnit,yarnPalette as dye} from './wool-art.js';
// The same felt inventory label is used by the hardware and software renderers.
import {weaponCatalog} from './weapon-catalog.js';
import {drawToyWeapon} from './weapon-artwork.js';

const patches=new Map();
export const pickupRange=110;
export const pickupMarkerWidth=1.54;
export const pickupStyle=kind=>weaponCatalog[kind]?.palette;
export function pickupLift(time,seed){return 1.46+.025*Math.sin(time*1.7+seed);}
export function pickupPhase(id){
  let h=2166136261;for(const c of String(id)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0)%628/100;
}

// A pennant on a bobbin has a recognisable profile even when its embroidery is distant.
function pennant(c,dx=0,dy=0){
  c.beginPath();c.moveTo(13+dx,10+dy);c.quadraticCurveTo(11+dx,6+dy,18+dx,6+dy);
  c.lineTo(102+dx,6+dy);c.quadraticCurveTo(107+dx,6+dy,108+dx,11+dy);
  c.lineTo(105+dx,64+dy);c.quadraticCurveTo(105+dx,69+dy,100+dx,72+dy);
  c.lineTo(61+dx,90+dy);c.quadraticCurveTo(58+dx,92+dy,54+dx,89+dy);
  c.lineTo(19+dx,73+dy);c.quadraticCurveTo(14+dx,71+dy,14+dx,66+dy);c.closePath();
}
export function pickupPatch(kind){
  if(patches.has(kind))return patches.get(kind);
  const palette=pickupStyle(kind);if(!palette)return null;
  const canvas=document.createElement('canvas');canvas.width=240;canvas.height=192;
  const c=canvas.getContext('2d');c.scale(2,2);c.lineJoin='round';c.lineCap='round';
  pennant(c,0,1);c.fillStyle='#96775b';c.fill();c.lineWidth=4;c.strokeStyle='#2e3940';c.stroke();
  pennant(c);c.fillStyle=dye.cream;c.fill();
  c.save();c.translate(60,46);c.scale(.92,.89);c.translate(-60,-46);
  pennant(c);c.fillStyle=dye.petrol;c.fill();c.clip();
  paintKnit(c,11,6,98,84,{step:5,opacity:.32,light:'#bed1b3',dark:'#213e42'});
  c.restore();
  c.save();c.translate(60,46);c.scale(.84,.78);c.translate(-60,-46);
  pennant(c);c.strokeStyle='#e0c59a';c.lineWidth=1.45;c.setLineDash([3,3.4]);c.stroke();c.restore();
  drawToyWeapon(c,kind,16,16,88,52);
  c.fillStyle='#e6bf7e';c.beginPath();c.ellipse(60,76,2.1,2.1,0,0,Math.PI*2);c.fill();
  patches.set(kind,canvas);return canvas;
}
