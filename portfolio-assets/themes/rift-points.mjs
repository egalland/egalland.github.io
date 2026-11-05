import {createShape,sampleShape} from './fusion-shapes.mjs';
import {projectPoint} from './fracture.mjs';
import {boundedSamples} from './page-rifts.mjs';

/** Project once and group by colour; frames only draw bounded, moving dots. */
export function projectCloud(kind,width,height,budget=800){
 const raw=boundedSamples(sampleShape(createShape(kind),.055),budget),colors=new Map();
 const transform={cx:width*.5,cy:height*.5,scale:Math.min(width/4.6,height/3.25),yaw:kind==='maison'?-.43:-.08,pitch:kind==='maison'?.32:.035};
 raw.forEach((p,i)=>{const q=projectPoint(p.p,transform);if(!colors.has(p.color))colors.set(p.color,[]);colors.get(p.color).push([q[0],q[1],i*.61803398875%1]);});
 return {groups:[...colors].map(([color,points])=>({color,points})),count:raw.length};
}
export function wordCloud(el,budget=800){
 const rect=el.getBoundingClientRect(),canvas=document.createElement('canvas');canvas.width=Math.ceil(rect.width);canvas.height=Math.ceil(rect.height);
 const g=canvas.getContext('2d',{willReadFrequently:true});g.fillStyle='#745595';g.textBaseline='alphabetic';g.textAlign='left';g.letterSpacing='0px';
 const chrome=el.querySelector('.window-chrome');
 // The glyph positions come from the real HTML, including spacing and font metrics.
 // This layout-only pass keeps the two halves joined at the same letters.
 for(const node of el.querySelectorAll('.window-chrome>span,.tiny-label,.word-letters,#word-clue')){
  const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);let text;
  while((text=walker.nextNode())){
   const style=getComputedStyle(text.parentElement);g.font=style.font||`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
   const range=document.createRange();let offset=0;
   for(const glyph of text.textContent){
    range.setStart(text,offset);offset+=glyph.length;range.setEnd(text,offset);if(!glyph.trim())continue;
    const r=range.getBoundingClientRect(),metrics=g.measureText(glyph),ascent=metrics.fontBoundingBoxAscent??parseFloat(style.fontSize)*.8,descent=metrics.fontBoundingBoxDescent??parseFloat(style.fontSize)*.2;
    g.fillText(glyph,r.left-rect.left,r.top-rect.top+(r.height-ascent-descent)/2+ascent);
   }
  }
 }
 g.strokeStyle='#5a7170';g.lineWidth=1;
 g.strokeRect(1,1,rect.width-2,rect.height-2);
 if(chrome){const r=chrome.getBoundingClientRect();g.beginPath();g.moveTo(0,r.bottom-rect.top);g.lineTo(rect.width,r.bottom-rect.top);g.stroke();}
 const form=el.querySelector('form');if(form){const r=form.getBoundingClientRect();g.strokeRect(r.left-rect.left,r.top-rect.top,r.width,r.height);}
 const pixels=g.getImageData(0,0,canvas.width,canvas.height).data,points=[];
 for(let y=0;y<canvas.height;y+=2)for(let x=0;x<canvas.width;x+=2)if(pixels[(y*canvas.width+x)*4+3]>90)points.push([x,y,(x*.37+y*.61)%1]);
 const selected=boundedSamples(points,budget);return {groups:[{color:'#745595',points:selected}],count:selected.length};
}
export function paintCloud(ctx,cloud,left,top,time,reduced=false){
 for(const group of cloud.groups){
  ctx.fillStyle=group.color;ctx.beginPath();
  for(const [x,y,phase] of group.points){
   const dx=reduced?0:Math.sin(time*.7+phase*15)*.52,dy=reduced?0:Math.cos(time*.63+phase*17)*.52;
   ctx.rect(left+x+dx,top+y+dy,1.65,1.65);
  }
  ctx.fill();
 }
}
