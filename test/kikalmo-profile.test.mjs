import test from 'node:test';
import assert from 'node:assert/strict';
import {installKikalmoRaster} from './fixtures/kikalmo-raster.mjs';
import {getKikalmoLook} from '../public/kikalmo-avatar.js';
import {drawKikalmoPuppet} from '../public/kikalmo-canvas.js';

test('a linked HD costume keeps its hood, face and textile silhouette through a sideways turn',async()=>{
  const native=installKikalmoRaster(),appearance={shape:4,costume:120};
  const art=await getKikalmoLook(appearance).promise;
  assert.ok(art&&art.front.width>100);
  function portrait(angle,melee){
    const w=208,h=216,canvas=native.createCanvas(w,h),g=canvas.getContext('2d');
    assert.ok(drawKikalmoPuppet(g,{id:'hero',appearance,motion:'idle',melee},w/2,h-8,190,0,angle));
    const data=g.getImageData(0,0,w,h).data;
    let left=w,right=0,area=0,noseCount=0,noseX=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const i=4*(y*w+x);
      if(data[i+3]<145)continue;
      left=Math.min(left,x);right=Math.max(right,x);area++;
      if(y>54&&y<88&&data[i]>125&&data[i+1]<.65*data[i]&&data[i+2]<.61*data[i+1]){
        noseCount++;noseX+=x;
      }
    }
    return {width:right-left,area,noseCount,noseX:noseX/noseCount};
  }
  const front=portrait(Math.PI),back=portrait(0),left=portrait(-Math.PI/2),right=portrait(Math.PI/2);
  const strike=portrait(Math.PI/2,{kind:'jab',phase:.36});
  for(const side of [left,right,strike]){
    assert.ok(side.width>=.66*front.width&&side.area>=.62*front.area,'side keeps the width and opaque surface of its outfit');
    assert.ok(side.noseCount>front.noseCount*.45,'the painted face and nose remain visible at the side');
  }
  assert.ok(left.noseX+11<front.noseX&&right.noseX-11>front.noseX,'the face follows the side the player is aiming at');
  assert.ok(back.noseCount<front.noseCount*.16,'the back shows the hood instead of the face');
});
