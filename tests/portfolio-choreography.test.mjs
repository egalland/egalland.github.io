import test from 'node:test';
import assert from 'node:assert/strict';
import {scatteredPose,placementPose} from '../portfolio-assets/themes/choreography.mjs';
import {ScrollConstruction} from '../portfolio-assets/themes/construction.mjs';

test('les tirages varient sans alternance et restent bornés sur mobile',()=>{
 for(const value of [0,.1,.35,.75,.999]){
  const a=scatteredPose(0,390,()=>value),b=scatteredPose(99,390,()=>value);
  assert.deepEqual(a,b);assert.equal(a.angle,0);assert.ok(Math.abs(a.x)<=28);
 }
 assert.notDeepEqual(scatteredPose(1,1440,()=>.1),scatteredPose(1,1440,()=>.9));
});
test('les chemins aléatoires restent continus et terminent précisément au repos',()=>{
 for(const v of [.02,.25,.75,.99]){
  const source=scatteredPose(7,1440,()=>v);
  assert.deepEqual(placementPose(source,0),{x:source.x,y:source.y,angle:0,flip:0});
  assert.deepEqual(placementPose(source,1),{x:0,y:0,angle:0,flip:0});
  let previous=placementPose(source,0);
  for(let p=.001;p<=1;p+=.001){const current=placementPose(source,p);for(const key of ['x','y','angle']){assert.ok(Number.isFinite(current[key]));assert.ok(Math.abs(current[key]-previous[key])<1);}previous=current;}
 }
});
test('le cadre est tracé droit, écrit puis transporté avec inertie',()=>{
 const c=Object.create(ScrollConstruction.prototype),unit={el:{dataset:{}},letters:[1,2],stage:'create'},worker={job:{unit,task:'create'},node:{},cursor:{trail:[]}};
 c.geometry=()=>{};c.details=()=>{};c.pose=(_unit,x,y)=>{unit.x=x;unit.y=y;};c.typeText=()=>{};c.restoreText=u=>{u.letters=[];};
 c.finish(worker);assert.equal(unit.stage,'write');
 worker.job={unit,task:'write'};c.finish(worker);assert.equal(unit.stage,'place');
 worker.job={unit,task:'place'};c.finish(worker);assert.equal(unit.stage,'done');assert.equal(unit.x,0);assert.equal(unit.y,0);assert.equal(unit.el.dataset.construction,'done');
 assert.equal(c.chooseAdjustment(),null);
});

test('une construction complète attend le curseur, trace, écrit puis déplace sans blocage',()=>{
 const previousWindow=globalThis.window;globalThis.window={scrollY:0};
 try{
  let top=200;
  const style={values:{},setProperty(k,v){this.values[k]=v;},getPropertyValue(k){return this.values[k]||'';}};
  const unit={el:{style,dataset:{},offsetWidth:300,offsetHeight:80,getBoundingClientRect(){return {left:100,top,width:300,height:80};}},index:1,category:'TEXTE',parts:[],dx:0,dy:0,angle:0,stage:'create',state:'waiting',letters:[],owner:null,eligible:true};
  const node={hidden:true,dataset:{},classList:{toggle(){}}},part=()=>({style:{},hidden:false});
  const worker={node,role:'create',frame:part(),pointer:part(),caret:part(),caption:{},cursor:{x:0,y:0,trail:[]},job:null};
  const c=Object.create(ScrollConstruction.prototype);
  Object.assign(c,{units:[unit],team:[worker],scrollY:0,clock:0,delay:0,measuredAt:0,overlay:{dataset:{}},reduced:false,scrollingUp:false});
  c.measure=()=>{};c.prepareText=u=>{u.letters=[1,2,3];};c.geometry=()=>{};c.details=()=>{};c.typeText=(u,n)=>{u.written=n;};c.restoreText=u=>{u.letters=[];};c.caretRect=()=>null;
  c.choose=()=>top>65&&top<900&&unit.stage!=='done'&&!unit.owner?unit:null;
  const stages=new Set();
  for(let i=0;i<350;i++){
   if(i===35)top=-500;if(i===70)top=200;
   c.update(.04,{width:1440,height:900,count:8,showOutlines:true,enabled:true});stages.add(unit.el.dataset.construction);
   if(i===40){assert.ok(unit.suspended);assert.notEqual(unit.stage,'done');}
   if(i===0){assert.equal(unit.el.dataset.construction,'approach');assert.equal(style.values['--build-opacity'],'0');}
   if(worker.job?.task==='write')assert.equal(unit.angle,0);
  }
  assert.equal(unit.stage,'done');assert.equal(unit.angle,0);
  for(const state of ['create','place','write','done'])assert.ok(stages.has(state),state);
 }finally{globalThis.window=previousWindow;}
});

test('le mouvement crée une inclinaison passagère et les incidents se terminent à plat',()=>{
 const source={...scatteredPose(0,1440,()=>.9),x:50};
 assert.equal(source.angle,0);assert.ok(Math.abs(placementPose(source,.2).angle)>.1);
 for(const kind of ['normal','drop','flip']){
  const pose={...source,kind,flip:kind==='flip'?180:0};
  assert.deepEqual(placementPose(pose,1),{x:0,y:0,angle:0,flip:0});
 }
 assert.equal(placementPose({...source,kind:'flip',flip:180},0).flip,180);
 assert.ok(placementPose({...source,kind:'flip',flip:180},.5).flip>80);
});
