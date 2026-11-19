import test from 'node:test';
import assert from 'node:assert/strict';
import { applyPropDamage, propMaterial, propMaxHealth, vehiclePropDamage } from '../public/prop-damage.js';

test('Material profiles resist different numbers of hits and report only damage actually taken',()=>{
  assert.equal(propMaterial('bench'),'wood');
  assert.equal(propMaterial('hydrant'),'iron');
  assert(propMaxHealth('bin')<propMaxHealth('lamp'));
  assert.equal(propMaxHealth('__proto__'),0);
  assert.equal(applyPropDamage('wall',null,17),null);
  assert.equal(applyPropDamage('crate',null,NaN),null);
  assert.deepEqual(applyPropDamage('crate',null,17),{health:7,maxHealth:24,damage:17});
  assert.deepEqual(applyPropDamage('crate',7,23),{health:0,maxHealth:24,damage:7});
  assert.deepEqual(applyPropDamage('crate',0,23),{health:0,maxHealth:24,damage:0});
});

test('A bumper needs approach speed. A bus transfers more damage than a scooter and a faster impact hits harder',()=>{
  assert.equal(vehiclePropDamage(0,2),0);
  assert.equal(vehiclePropDamage(2.1,4.25),0);
  assert(vehiclePropDamage(9,4.25)>vehiclePropDamage(9,1.01));
  assert(vehiclePropDamage(12,2)>vehiclePropDamage(8,2));
  assert.equal(vehiclePropDamage(80,4.25),150);
});
