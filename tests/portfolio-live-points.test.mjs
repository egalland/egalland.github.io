import test from 'node:test';
import assert from 'node:assert/strict';
import {createCloud,sceneCamera,projectParticle,STRIDE} from '../portfolio-assets/themes/point-cloud.mjs';
import {createPointRenderer} from '../portfolio-assets/themes/point-renderer.mjs';
import {signalEdge,edgePackets,faultPower} from '../portfolio-assets/themes/digital-signal.mjs';
import {bandPolygon,clipToRect,regionAt} from '../portfolio-assets/themes/page-rifts.mjs';
const form=Array.from({length:300},(_,i)=>{const a=i*.73,z=1-i/150,r=Math.sqrt(Math.max(0,1-z*z));return {x:Math.cos(a)*r,y:Math.sin(a)*r,z,c:[.15,.4,.6],size:1};});
const view={cx:250,cy:180,scale:110,...sceneCamera('hero',0)};
test('les volumes tournent en 3D et réagissent au pointeur, sans coordonnées écran figées',()=>{
 const cloud=createCloud(form,{limit:250});
 assert.equal(cloud.space,'world');assert.equal(cloud.data.length,250*STRIDE);
 const a=projectParticle(cloud,70,view,0),b=projectParticle(cloud,70,{...view,...sceneCamera('hero',3)},3);
 assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])>10);assert.notEqual(a[2],b[2]);
 const hovered=projectParticle(cloud,70,{...view,...sceneCamera('hero',0,{x:1,y:.5})},0);
 assert.ok(Math.hypot(a[0]-hovered[0],a[1]-hovered[1])>5);
});
test('le mouvement réduit fige aussi la circulation des points sur les segments',()=>{
 const cloud=createCloud([{x:0,y:0,z:0,c:[.2,.3,.4],size:1,phase:0,track:{a:[0,0,0],b:[1,1,1],speed:.2}}]);
 assert.deepEqual(projectParticle(cloud,0,view,0,true),projectParticle(cloud,0,view,9,true));
});
test('le secours Canvas conserve la 3D, groupe les couleurs et libère son canvas',()=>{
 let rects=0,fills=0,removed=false;
 const ctx={setTransform(){},clearRect(){},save(){},restore(){},beginPath(){},clip(){},rect(...args){assert.ok(args.every(Number.isFinite));rects++;},fill(){fills++;}};
 const canvas={dataset:{},getContext:kind=>kind==='2d'?ctx:null,addEventListener(){},remove(){removed=true;}};
 const renderer=createPointRenderer(canvas);renderer.resize(500,360);renderer.begin();renderer.draw(createCloud(form),view,2);
 assert.equal(renderer.backend,'canvas-3d');assert.equal(rects,form.length+1);assert.ok(fills<=2);renderer.dispose();assert.equal(removed,true);
});
test('les raccords numériques sont des marches de pixels et gardent le même masque',()=>{
 for(const width of [320,390,1440]){
  const top=signalEdge([[0,40],[width*.47,75],[width,110]],12),bottom=signalEdge([[0,450],[width,650]],26);
  assert.equal(top[0][0],0);assert.equal(top.at(-1)[0],width);assert.deepEqual(top,signalEdge([[0,40],[width*.47,75],[width,110]],12));
  for(let i=1;i<top.length;i++){assert.ok(top[i][0]===top[i-1][0]||top[i][1]===top[i-1][1]);assert.ok(top[i][0]>=top[i-1][0]);}
  const region=bandPolygon(top,bottom),rect={left:width*.3,right:width*.8,top:0,bottom:700},clipped=clipToRect(region,rect);
  assert.equal(regionAt([region],width*.5,200),regionAt([clipped],width*.5,200));
  assert.ok(edgePackets(top,12,65).count<=65);
 }
});
test('une perturbation est locale et brève, sans scintillement continu',()=>{
 assert.equal(faultPower(-1),0);assert.equal(faultPower(.7),0);assert.equal(faultPower(5),0);
 for(let t=0;t<.63;t+=.001){const power=faultPower(t);assert.ok(power>=0&&power<=1);}
 assert.ok(faultPower(.25)>.1);
});
