import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_APPEARANCE,normalizeAppearance} from '../dist/appearance.js';
import {createState,exportSave,importSave,advance,buyObject,acceptOrder} from '../dist/model.js';

test('an old save receives an avatar without changing the workshop or its money',()=>{
 const s=createState(992);buyObject(s,'fdm',1,1);acceptOrder(s,s.orders[0].id);advance(s,40);
 const old=JSON.parse(exportSave(s));delete old.state.appearance;const restored=importSave(JSON.stringify(old));
 assert.deepEqual(restored.appearance,DEFAULT_APPEARANCE);assert.equal(restored.cash,s.cash);assert.deepEqual(restored.objects,s.objects);assert.deepEqual(restored.orders,s.orders);
});

test('avatar choices survive export and do not change financial simulation',()=>{
 const a=createState(633),b=createState(633);b.appearance=normalizeAppearance({...DEFAULT_APPEARANCE,name:'Filou',kind:'fox',hat:'wizard',sweater:'#9993b4',glasses:true});
 const loaded=importSave(exportSave(b));assert.equal(loaded.appearance.kind,'fox');assert.equal(loaded.appearance.hat,'wizard');assert.equal(loaded.appearance.name,'Filou');assert.equal(loaded.appearance.glasses,true);
 advance(a,1440*4);advance(loaded,1440*4);assert.equal(a.cash,loaded.cash);assert.deepEqual(a.orders,loaded.orders);assert.deepEqual(a.books,loaded.books);
});

test('invalid avatar fields are bounded before rendering',()=>{
 const a=normalizeAppearance({name:'x'.repeat(100),skin:'url(javascript:bad)',hat:'unknown',kind:'unknown',glasses:'yes'});
 assert.equal(a.name.length,24);assert.equal(a.skin,DEFAULT_APPEARANCE.skin);assert.equal(a.hat,'beanie');assert.equal(a.kind,'human');assert.equal(a.glasses,false);
});
