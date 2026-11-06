import {boundedSamples} from './page-rifts.mjs';
import {createCloud} from './point-cloud.mjs?v=kinetic1';

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
 const selected=boundedSamples(points,budget);
 return createCloud(selected.map(p=>({x:p[0]-rect.width/2,y:rect.height/2-p[1],z:0,c:[.455,.333,.584],size:.85})),{space:'screen'});
}
