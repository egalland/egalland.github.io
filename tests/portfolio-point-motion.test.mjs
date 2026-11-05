import test from 'node:test';
import assert from 'node:assert/strict';
import {resamplePoints,particlePosition} from '../points/point-motion.mjs';
const rng=()=>{let s=1841;return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);};
const track={a:[0,0,.2],b:[2,0,.4],step:.01,speed:.065};
const line=Array.from({length:100},(_,i)=>({x:(i+.5)*.02+.1,y:.15,z:.3,c:[.2,.3,.4],size:1,track,phase:(i+.5)/100,jx:.1,jy:.15}));
test('le rééchantillonnage conserve des lignes planes et sans trous ni amas',()=>{
 for(const count of [30,100,300]){const p=resamplePoints(line,count,rng(),true).sort((a,b)=>a.x-b.x);assert.equal(p.length,count);for(let k=0;k<count;k++){assert.equal(p[k].y,0);assert.equal(p[k].z,0);assert.ok(Math.abs(p[k].x-(k+.5)*2/count)<1e-10);assert.equal(p[k].track,track);}}
 assert.deepEqual(resamplePoints(line,72,rng(),true),resamplePoints(line,72,rng(),true));
});
test('les points continuent à circuler sans sortir du contour de l’interface',()=>{
 const p=resamplePoints(line,100,rng(),true)[23],start=particlePosition(p,0,.37,true);let moved=0;
 for(let time=0;time<120;time+=.17){const v=particlePosition(p,time,.37,true);assert.ok(v[0]>=-.002&&v[0]<=2.002);assert.ok(Math.abs(v[1])<.002);assert.equal(v[2],0);moved=Math.max(moved,Math.hypot(v[0]-start[0],v[1]-start[1]));}assert.ok(moved>1,'A completed formation must not become motionless');
});
test('les points libres respirent dans une enveloppe bornée',()=>{
 const p={x:1,y:2,z:3};let changed=false;const first=particlePosition(p,0,.73,false);
 for(let time=0;time<40;time+=.23){const v=particlePosition(p,time,.73,false);assert.ok(Math.abs(v[0]-1)<.021);assert.ok(Math.abs(v[1]-2)<.020);assert.ok(Math.abs(v[2]-3)<=.02500001);if(Math.hypot(...v.map((n,k)=>n-first[k]))>.01)changed=true;}assert.ok(changed);
});
test('la pause et le mouvement réduit reviennent à une géométrie stable',()=>{
 const p=resamplePoints(line,100,rng(),true)[7],out=[0,0,0];for(const time of [0,1,10,999]){assert.equal(particlePosition(p,time,.3,true,false,out),out);assert.deepEqual(out,[p.x,p.y,0]);}
 const free={x:1,y:2,z:3};assert.deepEqual(particlePosition(free,99,.7,false,false),[1,2,3]);
});
