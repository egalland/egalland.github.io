import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,normalize,compute} from '../dist/engine.js';
import {equipmentHeight} from '../dist/equipment.js';
import {plan2D,volume} from '../dist/scene.js';

test('mounting height and basin depth survive serialization and use distinct plan layers',()=>{
 const project=defaults();
 const room=project.rooms[0];
 project.objects=[
  {id:'ceiling',kind:'ceiling',roomId:room.id,w:4,l:3},
  {id:'beam',kind:'beam',mountHeight:4.7,equipmentHeight:.38},
  {id:'basin',kind:'pool',w:12,l:2.8,y:7,equipmentHeight:1.7,rotation:90}
 ];
 const saved=normalize(normalize(JSON.parse(JSON.stringify(project))));
 const [ceiling,beam,pool]=saved.objects;
 assert.equal(equipmentHeight(saved,ceiling),room.h);
 assert.equal(equipmentHeight(saved,beam),4.7);
 assert.equal(beam.equipmentHeight,.38);
 assert.equal(pool.w,12);
 assert.equal(pool.equipmentHeight,1.7);
 assert.equal(compute(saved).home,56);
 assert.ok(Math.abs(compute(saved).free-60.4)<1e-9);
 const settings={levelId:'ground',yaw:-27};
 assert.match(plan2D(saved,{...settings,layer:'layout'}),/data-id="basin"/);
 assert.doesNotMatch(plan2D(saved,{...settings,layer:'layout'}),/data-id="ceiling"/);
 assert.match(plan2D(saved,{...settings,layer:'ceiling'}),/data-id="beam"/);
 for (const mode of ['open','fixtures','closed']){
  const {markup}=volume(saved,{...settings,overhead:mode});
  assert.equal(markup.includes('data-id="ceiling"'),mode==='closed');
  assert.equal(markup.includes('data-id="beam"'),mode!=='open');
  assert.match(markup,/data-id="basin"/);
 }
});
