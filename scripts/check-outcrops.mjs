import assert from 'node:assert/strict';
import {
  FACE_ORDER, SIDE, createPlanet, facePoint, nearestPrismOutcrop, prismOutcropsIn,
  oreAt, regionView, machineMine, isRemoved,
} from '../lib/planet.ts';

for (const face of FACE_ORDER) {
  for (const [u,v] of [[0,0],[SIDE-1,0],[SIDE-1,SIDE-1],[0,SIDE-1],[SIDE/2,SIDE/2-160]]) {
    const approach={face,u,v,depth:12};
    const field=nearestPrismOutcrop(approach);
    assert.equal(field.face,face);
    assert.equal(field.depth,0);
    assert.deepEqual(nearestPrismOutcrop(field),field);
    assert(Math.hypot(field.u-u,field.v-v) < 363);
    assert.equal(prismOutcropsIn(face,field.u,field.v,field.u,field.v).length,1);
    const center=facePoint(face,field.u,field.v);
    assert.equal(oreAt(createPlanet(1872),center),'prisme');
  }
}
console.log('PASS Each planetary face has discoverable exposed crystal fields, including near face boundaries.');

const world=createPlanet(1872);
const hint=nearestPrismOutcrop({face:'north',u:SIDE/2-288,v:SIDE/2+236,depth:0});
const before=regionView(world,hint);
const oreTiles=before.tiles.filter(cell=>cell.ore==='prisme');
assert(oreTiles.length>=3 && oreTiles.length<=24);
assert(oreTiles.every(cell=>cell.depth===0 && cell.status==='solid'));
const cut=regionView(world,{...hint,depth:1});
assert(cut.tiles.every(cell=>cell.status==='unknown' && cell.ore===null));
for (const tile of oreTiles) {
  assert.equal(machineMine(world,'first',tile.point)?.ore,'prisme');
  assert.equal(machineMine(world,'second',tile.point),null);
  assert(isRemoved(world,tile.point));
}
const restored=JSON.parse(JSON.stringify(world));
const after=regionView(restored,hint);
assert(after.tiles.every(cell=>cell.ore!=='prisme' || cell.depth>0));
for (const old of oreTiles) {
  const tile=after.tiles.find(cell=>cell.u===old.u && cell.v===old.v);
  assert.equal(tile.depth,1);
  assert.notDeepEqual(tile.point,old.point);
}
assert.deepEqual(nearestPrismOutcrop(hint),hint);
console.log('PASS One shared, exhaustible surface deposit. Optical clues persist, surviving underground ore remains masked until exposed.');
