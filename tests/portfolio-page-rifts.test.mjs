import test from 'node:test';
import assert from 'node:assert/strict';
import {tornEdge,bandPolygon,clipToRect,regionAt,boundedSamples} from '../portfolio-assets/themes/page-rifts.mjs';
import {createCloud,projectParticle} from '../portfolio-assets/themes/point-cloud.mjs';
import {createShape,sampleShape} from '../portfolio-assets/themes/fusion-shapes.mjs';
test('les déchirures occupent la largeur de la page et suivent des parcours différents',()=>{
 for(const width of [320,390,1440]){
  const edge=tornEdge([[0,200],[width*.45,220],[width,110]],12,width<=390?8:15);
  assert.equal(edge[0][0],0);assert.equal(edge.at(-1)[0],width);assert.deepEqual(edge,tornEdge([[0,200],[width*.45,220],[width,110]],12,width<=390?8:15));
  for(let i=1;i<edge.length;i++){assert.ok(edge[i][0]>=edge[i-1][0]);assert.ok(edge[i].every(Number.isFinite));}
  assert.notDeepEqual(edge,tornEdge([[0,200],[width*.45,220],[width,110]],71,15));
 }
});
test('un même masque découpe le fond du site et les moitiés de l’interface',()=>{
 const top=tornEdge([[0,20],[1000,100]],5),bottom=tornEdge([[0,500],[1000,700]],8),region=bandPolygon(top,bottom),rect={left:600,top:450,right:900,bottom:800};
 assert.equal(regionAt([region],750,480),'points');assert.equal(regionAt([region],750,780),'curseurs');
 const clipped=clipToRect(region,rect);assert.ok(clipped.length>4);for(const p of clipped){assert.ok(p[0]>=rect.left-1e-6&&p[0]<=rect.right+1e-6);assert.ok(p[1]>=rect.top-1e-6&&p[1]<=rect.bottom+1e-6);}
 assert.equal(regionAt([clipped],750,480),regionAt([region],750,480));
});
test('le budget borne les points tout en conservant leurs coordonnées XYZ',()=>{
 const samples=Array.from({length:6000},(_,i)=>i);assert.equal(boundedSamples(samples,800).length,800);
 for(const kind of ['hero','market','maison','atlas','timer']){
  const form=sampleShape(createShape(kind),.055).map(p=>({x:p.p[0],y:p.p[1],z:p.p[2],c:[.2,.5,.6],size:1})),cloud=createCloud(form,{limit:800});assert.ok(cloud.count<=800);
  for(let i=0;i<cloud.count;i++)assert.ok(projectParticle(cloud,i,{cx:265,cy:175,scale:100,yaw:.3,pitch:.2},4).every(Number.isFinite));
 }
});
