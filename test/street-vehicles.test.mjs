import assert from 'node:assert/strict';
import test from 'node:test';
import {Box3,Vector3} from '../public/three.js';
import {createCar} from '../public/puppets3d.js';
import {drawCanvasCar} from '../public/canvas-puppets.js';
import {vehicleSpec} from '../public/vehicle-types.js';

for(const [type,count,steered] of [['scooter',2,1],['cargo',3,2],['pickup',4,2]]){
  test(type+' articulates its own axles, and an open saddle is occupied only while someone rides it',()=>{
    const car=createCar(type),root=car.group;
    const withName=name=>{const nodes=[];root.traverse(o=>{if(o.name===name)nodes.push(o);});return nodes;};
    try{
      assert.equal(withName('roue').length,count);
      assert.equal(withName('direction').length,steered);
      assert.equal(withName('conducteur').length,0);
      const empty=new Box3().setFromObject(root,true);
      for(let i=0;i<20;i++)car.update({id:'ambient',routeId:'road',angle:i*.035,speed:7},1/30,i/30);
      for(const wheel of withName('roue'))assert.ok(Math.abs(wheel.rotation.z)>1);
      for(const axle of withName('direction'))assert.ok(Math.abs(axle.rotation.y)>.13);
      for(const axle of withName('essieu'))assert.equal(axle.rotation.y,0);
      const body=root.getObjectByName('carrosserie').parent;
      const roll=Math.abs(body.rotation.x);
      assert.ok(roll>(type==='scooter'?.11:.008));
      assert.equal(withName('conducteur').length,Number(vehicleSpec(type).openSeat));
      if(vehicleSpec(type).openSeat){
        const rider=root.getObjectByName('conducteur');
        const top=new Box3().setFromObject(rider,true).getSize(new Vector3());
        assert.ok(top.y>.98&&top.z>.4,'fox ears, tail and seated limbs');
        assert.ok(new Box3().setFromObject(root,true).max.y>empty.max.y+.35);
        car.update({peer:true,appearance:{shape:0,outfit:3,color:'#982f88'}},1/30,1);
        assert.notEqual(root.getObjectByName('conducteur'),rider);
      }
      car.update({parked:true,speed:0},1/30,1);
      assert.equal(withName('conducteur').length,0);
    }finally{car.dispose();}
  });
}

test('software view shows each occupied profile head-on and sideways and keeps the spokes moving',()=>{
  function signature(type,occupied,angle,speed){
    const commands=[],log=(...a)=>commands.push(a);
    const ctx={save(){},restore(){},translate(){},scale(){},beginPath(){},closePath(){},fill(){},stroke(){},
      moveTo:log,lineTo:log,ellipse:log};
    const v={id:'replica',type,peer:occupied,speed,angle:0};
    drawCanvasCar(ctx,v,120,128,96,0,angle);commands.length=0;
    drawCanvasCar(ctx,v,120,128,96,.05,angle);
    assert.ok(commands.every(a=>a.every(Number.isFinite)));
    return JSON.stringify(commands);
  }
  const types=['scooter','cargo','pickup'],images=new Set();
  for(const type of types){
    const empty=signature(type,false,0,0),ridden=signature(type,true,0,0);
    if(vehicleSpec(type).openSeat)assert.notEqual(ridden,empty);else assert.equal(ridden,empty);
    assert.notEqual(signature(type,true,-1.2,0),signature(type,true,-1.2,5));
    images.add(ridden);
  }
  assert.equal(images.size,3);
});
