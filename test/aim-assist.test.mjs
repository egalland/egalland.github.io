import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseTouchShot,traceShot} from '../public/aim-assist.js';
const origin={x:0,y:0},rad=degrees=>degrees*Math.PI/180;
const candidate=(id,a,d,fields={})=>({id,x:d*Math.cos(rad(a)),y:d*Math.sin(rad(a)),r:.22,type:'pedestrian',hitKind:'npc',...fields});
function acquire(targets,options={}){
  const {contact=()=>null,project=()=>({x:.55,y:.47}),wanted=0,previousId}=options;
  const trace=angle=>traceShot(origin,angle,.35,30,targets,contact);
  return chooseTouchShot({position:origin,yaw:0,muzzle:.35,range:30,targets,wanted,previousId,project,trace,direct:trace(0)});
}

test('Touch aim only ranks visible targets in front, inside the cone and within weapon reach',()=>{
  const side=candidate('side',12.7,18),far=candidate('far',3,33),behind=candidate('behind',178,12);
  const invisible=candidate('offscreen',2,18),tooHigh=candidate('sky',3,16),self=candidate('self',4,14,{self:true}),down=candidate('down',7,11,{stunned:true});
  const project=x=>x===invisible.x?null:{x:.57,y:x===tooHigh.x?.06:.5};
  assert.equal(acquire([side,far,behind,invisible,tooHigh,self,down],{project}),null);
  const live=candidate('legal',9,19);
  assert.equal(acquire([side,far,behind,invisible,tooHigh,self,down,live],{project}).target.id,'legal');
  // Wrap around north so camera rotations beyond +/- pi do not affect acquisition.
  const opposite=candidate('opposite',-178,20),yaw=rad(174);
  const trace=a=>traceShot(origin,a,.35,30,[opposite],()=>null);
  assert.equal(chooseTouchShot({position:origin,yaw,muzzle:.35,range:30,targets:[opposite],trace,direct:trace(yaw)}).target.id,'opposite');
});

test('An officer gets a small pursuit preference while a direct first hit stays at the reticle',()=>{
  const civilian=candidate('civil',4,22),officer=candidate('unit-swat',6,18,{type:'swat'});
  assert.equal(acquire([officer,civilian]).target.id,'civil');
  assert.equal(acquire([officer,civilian],{wanted:2}).target.id,'unit-swat');
  const bin=candidate('bin',0,13,{hitKind:'prop'}),peer=candidate('peer',0,20,{hitKind:'peer'});
  assert.equal(acquire([peer,officer,bin],{wanted:3}).target.id,'bin');
  const blocked=candidate('wall-hidden',3.8,20),visible=candidate('visible',9.7,18);
  const wall=(x,y)=>x>4&&x<5.4&&y<.5?{id:'wall'}:null;
  assert.equal(acquire([blocked],{contact:wall}),null);
  assert.equal(acquire([blocked,visible],{contact:wall}).target.id,'visible');
});

test('Trace stops on a vehicle or nearer person and ignores only the target collider at its endpoint',()=>{
  const behind=candidate('target',0,16),closer=candidate('passerby',0,8);
  const car={id:'parked-car'};
  const blocked=traceShot(origin,0,.35,25,[behind],(x,y,ignore)=>{assert.equal(ignore,'target');return x>=3.8&&x<=5?car:null;});
  assert.equal(blocked.hit,null);assert(blocked.length<5);
  assert.equal(traceShot(origin,0,.35,25,[behind,closer],()=>null).hit.id,'passerby');
  const post=candidate('post',0,8,{hitKind:'prop'});
  assert.equal(traceShot(origin,0,.35,25,[post],(x,y,ignore)=>ignore===post.id?null:post).hit.id,'post');
});
