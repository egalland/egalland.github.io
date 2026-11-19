import test from 'node:test';
import assert from 'node:assert/strict';
import {createStateEncoder,stateReferences} from '../public/state-wire.js';
import {handleApi} from '../worker/game-api.js';
import {localDatabase} from '../scripts/local-db.mjs';

test('combat snapshots reuse acknowledged appearance and traffic, then repair missing references or clear removed fields',async t=>{
  const DB=localDatabase();t.after(()=>DB.close());
  const session={id:crypto.randomUUID(),token:crypto.randomUUID(),protocol:2};
  const encoder=createStateEncoder(),traffic={at:Date.now(),cars:[['local-route',0,10,4]]};
  const net=async(route,packet)=>{
    const response=await handleApi(new Request('https://world.test/api/world/'+route,{
      method:'POST',body:JSON.stringify({...session,...packet})
    }),{DB});
    assert.equal(response.status,200);
    return response.json();
  };
  const state={x:10,y:2,appearance:{outfit:1},traffic};
  const enter=await net('join',encoder.packet(state,true));
  encoder.ack(enter.stateRefs);
  const fire=encoder.packet({...state,x:11},false);
  assert.deepEqual(fire.state,{x:11,y:2});
  assert.deepEqual(fire.keepState,enter.stateRefs);
  const moved=await net('sync',fire);
  assert.deepEqual(moved.stateRefs,enter.stateRefs);
  const otherAppearance={outfit:2};
  await net('sync',{state:{...state,appearance:otherAppearance}});
  const corrected=await net('sync',fire);
  assert.notEqual(corrected.stateRefs[0],fire.keepState[0]);
  encoder.ack(corrected.stateRefs);
  const repair=encoder.packet(state,false);
  assert.deepEqual(repair.state.appearance,state.appearance);
  assert.equal(repair.state.traffic,undefined);
  encoder.ack((await net('sync',repair)).stateRefs);
  const empty=await net('sync',encoder.packet({x:12,y:3},false));
  assert.deepEqual(empty.stateRefs,[null,null]);
  encoder.ack(null);
  assert.deepEqual(encoder.packet(state,false),{state});
  assert.deepEqual(stateReferences({}),[null,null]);
});
