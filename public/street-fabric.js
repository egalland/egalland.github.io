// The metre period is identical on a projected Canvas row and a WebGL ground face.
import {paintKnit,yarnPalette} from './wool-art.js';

export const streetFabric={
  paving:{meters:2.9,color:'#b49a89'},
  road:{meters:2.5,color:'#626171'},
  park:{meters:2.0,color:'#8b9d7d'},
  water:{meters:4.2,color:'#648f96'}
};

export function paintStreetFabric(ctx,w,h,type,withBase=true){
  const info=streetFabric[type];
  if(withBase){ctx.fillStyle=info.color;ctx.fillRect(0,0,w,h);}
  ctx.save();ctx.scale(w/128,h/128);ctx.lineCap='round';ctx.lineJoin='round';
  if(type==='paving'){
    // A half-drop repeat: felt pavers, twin cord in the joint and couching stitches.
    paintKnit(ctx,0,0,128,128,{step:8,opacity:.27,seed:3});
    for(let j=-1;j<4;j++){
      const y=j*32,x=(j&1)*32;
      ctx.fillStyle='rgba(83,58,67,.27)';ctx.fillRect(0,y,128,1.8);
      ctx.fillStyle='rgba(249,217,177,.44)';ctx.fillRect(0,y+2,128,1.1);
      for(let i=x-64;i<128;i+=64){
        ctx.fillStyle='rgba(84,64,73,.29)';ctx.fillRect(i,y+2,1.7,29);
        ctx.fillStyle='rgba(250,218,178,.30)';ctx.fillRect(i+2,y+3,.95,28);
        for(let k=7;k<32;k+=10){
          ctx.strokeStyle='rgba(245,217,178,.50)';ctx.lineWidth=1.4;
          ctx.beginPath();ctx.moveTo(i-1,y+k+1.3);ctx.lineTo(i+2.7,y+k-.4);ctx.stroke();
        }
      }
    }
  }else if(type==='road'){
    // Alternating twill with a long diagonal float. Low contrast keeps lane marks distinct.
    ctx.strokeStyle='rgba(45,40,56,.27)';ctx.lineWidth=1.35;ctx.beginPath();
    for(let y=-4;y<132;y+=4)for(let x=(y&4)?-4:0;x<132;x+=8){
      ctx.moveTo(x,y+.8);ctx.lineTo(x+3.6,y-1.1);
    }
    ctx.stroke();ctx.strokeStyle='rgba(232,212,199,.25)';ctx.lineWidth=1.05;ctx.beginPath();
    for(let y=-4;y<132;y+=4)for(let x=(y&4)?-4:0;x<132;x+=8){
      ctx.moveTo(x+.6,y+1.7);ctx.lineTo(x+4.2,y-.2);
    }
    ctx.stroke();
  }else if(type==='park'){
    paintKnit(ctx,0,0,128,128,{step:13,opacity:.41,seed:2,light:'#d2d6a6',dark:yarnPalette.petrol});
    // Little lazy-daisy stitches among the lawn loops.
    for(let i=0;i<11;i++){
      const x=(11+47*i)%124,y=(18+31*i)%120;
      ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x-5,y-7,x-1,y-5);
      ctx.quadraticCurveTo(x+1,y-4,x,y);ctx.quadraticCurveTo(x+6,y-6,x+6,y-2);
      ctx.quadraticCurveTo(x+3,y,x,y);ctx.strokeStyle='rgba(229,220,166,.56)';ctx.lineWidth=1.2;ctx.stroke();
    }
  }else{
    for(let j=0;j<16;j++){
      const y=j*8,offset=(j*36)%128;
      for(const x of [offset-128,offset]){
        ctx.beginPath();ctx.moveTo(x,y+2);ctx.bezierCurveTo(x+9,y-1,x+14,y-1,x+24,y+1);
        ctx.strokeStyle=j%3?'rgba(209,223,193,.32)':'rgba(56,86,101,.38)';ctx.lineWidth=1.8;ctx.stroke();
      }
    }
  }
  ctx.restore();
}
