import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Vector3 } from '../public/three.js';
import { createCar, createPuppet } from '../public/puppets3d.js';
import { vehicleSpec, vehicleTypes, vehicleDoorways } from '../public/vehicle-types.js';
import { destinations, parkedCars, routeAgents, contactAt } from '../public/paris-world.js';
import { ragdollPose } from '../public/ragdoll.js';

test('the Paris fleet fits its drivable colliders, places accessible doors and uses different handling',()=>{
  const observed=new Set();
  for(const stop of destinations)for(let i=0;i<3;i++){
    const {cars}=routeAgents(stop.x,stop.y,300,1780000121000+i*24000);
    cars.forEach(v=>observed.add(v.type));
  }
  assert.deepEqual([...observed].sort(),[...vehicleTypes].sort());
  for(const v of parkedCars){
    const spec=vehicleSpec(v.type);
    assert.equal(contactAt(v.x,v.y,{angle:v.angle,halfLength:spec.halfLength,halfWidth:spec.halfWidth}),null,v.id);
    const stop=destinations.find(d=>v.id==='car-'+d.key);
    assert.ok(vehicleDoorways(v).some(d=>Math.hypot(d.x-stop.x,d.y-stop.y)<4.4),v.id);
  }
  for(const type of vehicleTypes){
    const spec=vehicleSpec(type),object=createCar(type),bounds=new Box3().setFromObject(object.group,true);
    const size=bounds.getSize(new Vector3());
    assert.ok(Math.abs(size.x-spec.halfLength*2)<.56,type+' length '+size.x);
    assert.ok(Math.abs(size.z-spec.halfWidth*2)<.4,type+' width '+size.z);
    assert.ok(Math.abs(size.y-spec.height)<.36,type+' height '+size.y);
    object.dispose();
  }
  const bus=vehicleSpec('bus'),compact=vehicleSpec('compact'),sport=vehicleSpec('sport');
  assert.ok(bus.halfLength>2*compact.halfLength && compact.steering>2*bus.steering);
  assert.ok(sport.accel>2*bus.accel && sport.forward>1.8*bus.forward);
  const doors=vehicleDoorways({x:7,y:13,type:'bus',angle:Math.PI/2},.87);
  assert.ok(doors.some(d=>d.y>15 && d.x<7));
  assert.ok(doors.every(d=>Math.abs(Math.abs(d.x-7)-bus.halfWidth-.87)<.001));
});

test('the same falling body drives separate forearms, knees and head, then returns to the standing walk rig',()=>{
  const figure=createPuppet('fox','#668877',4);
  const event={at:1000,until:3700,angle:.75,force:.9,seed:13};
  const sample=ragdollPose(event,0,1860);
  figure.update({ragdoll:sample,stunned:true},.016,1);
  figure.group.updateMatrixWorld(true);
  const bone=name=>figure.group.getObjectByName(name);
  const center=(node,offset=[0,0,0])=>node.localToWorld(new Vector3(...offset));
  assert.ok(center(bone('head'),[0,.124,0]).distanceTo(new Vector3(...sample.head))<.02);
  for(const [side,suffix] of [['left','L'],['right','R']]){
    assert.ok(center(bone('elbow'+suffix)).distanceTo(new Vector3(...sample[side+'Elbow']))<.024);
    assert.ok(center(bone('knee'+suffix)).distanceTo(new Vector3(...sample[side+'Knee']))<.024);
  }
  assert.ok(bone('elbowL').quaternion.angleTo(bone('elbowR').quaternion)>.1);
  figure.update({speed:1.5},.016,3);
  figure.group.updateMatrixWorld(true);
  assert.ok(center(bone('head'),[0,.124,0]).y>1.24);
  const reference=createPuppet('fox','#668877',4);
  reference.update({speed:1.5},.016,3);
  for(const name of ['kneeL','kneeR','elbowL','elbowR']){
    assert.ok(bone(name).quaternion.angleTo(reference.group.getObjectByName(name).quaternion)<.001);
  }
  reference.dispose();
  figure.dispose();
});

test('the software renderer draws each silhouette and emits different articulated limbs as the character falls',async t=>{
  const {drawCanvasCar,drawCanvasPuppet}=await import('../public/canvas-puppets.js');
  if(!globalThis.Path2D){globalThis.Path2D=class{};t.after(()=>{delete globalThis.Path2D;});}
  function painter(){
    const lines=[],labels=[];
    const noop=()=>{};
    const ctx={save:noop,restore:noop,translate:noop,rotate:noop,scale:noop,ellipse:noop,beginPath:noop,closePath:noop,
      stroke:noop,fill:noop,quadraticCurveTo:noop,moveTo(x,y){lines.push([x,y]);},lineTo(x,y){lines.push([x,y]);},fillText(s){labels.push(s);}};
    return {ctx,lines,labels};
  }
  const signatures=new Set();
  for(const type of ['compact','sedan','taxi','sport','van','bus']){
    const out=painter();
    drawCanvasCar(out.ctx,{id:'proof',type,color:'#548f98'},0,0,90,0,1);
    assert.ok(out.lines.flat().every(Number.isFinite));
    if(type==='bus')assert.deepEqual(out.labels,['73  ÉTOILE']);
    signatures.add(JSON.stringify(out.lines));
  }
  assert.equal(signatures.size,6);
  const event={at:100,until:2600,angle:.65,force:1,seed:9},poses=[];
  for(const now of [105,380,940]){
    const out=painter();
    drawCanvasPuppet(out.ctx,{id:'fox',type:'fox',ragdoll:ragdollPose(event,0,now)},0,0,100,0,.65);
    assert.ok(out.lines.length>=24);
    assert.ok(out.lines.flat().every(Number.isFinite));
    poses.push(out.lines.slice(0,12));
  }
  assert.notDeepEqual(poses[0],poses[1]);assert.notDeepEqual(poses[1],poses[2]);
});

test('the same cut felt is visible on the front and rear windows of the main vehicle and service bodies',async()=>{
  const {createRequire}=await import('node:module');
  const require=createRequire(import.meta.url);
  const native=require(require.resolve('@napi-rs/canvas',{paths:[process.cwd(),process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
  const {drawCanvasCar}=await import('../public/canvas-puppets.js');
  const {fleetFabric}=await import('../public/vehicle-fabric.js');
  const {Color}=await import('../public/three.js');
  const rgb=parseInt(fleetFabric.gleam.slice(1),16),r=rgb>>16,g=(rgb>>8)&255,b=rgb&255;
  const tint=new Color(fleetFabric.gleam);
  for(const type of ['car','bus','ambulance']){
    const model=createCar(type,'#487d81');let embroideredVertices=0;
    model.group.traverse(o=>{
      if(!o.isMesh)return;
      const a=o.geometry.attributes.color;
      for(let i=0;i<a.count;i++)if(Math.abs(a.getX(i)-tint.r)+Math.abs(a.getY(i)-tint.g)+Math.abs(a.getZ(i)-tint.b)<.003)
        embroideredVertices++;
    });
    model.dispose();
    assert.ok(embroideredVertices>=12,type+' front and rear cutwork in the shared geometry');
    for(const bearing of [.50,-2.65]){
      const canvas=native.createCanvas(460,230),ctx=canvas.getContext('2d');
      drawCanvasCar(ctx,{id:'yarn',type,color:'#487d81'},230,180,105,0,bearing);
      const data=ctx.getImageData(0,0,460,230).data;let visible=0;
      for(let i=0;i<data.length;i+=4)if(data[i+3]>240&&Math.hypot(data[i]-r,data[i+1]-g,data[i+2]-b)<7)visible++;
      assert.ok(visible>28,type+' visible felt at '+bearing);
    }
  }
});
