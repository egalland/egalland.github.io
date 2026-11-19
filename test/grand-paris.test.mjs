import test from 'node:test';
import assert from 'node:assert/strict';
import {areas} from '../public/atlas-outlines.js';
import {areaAt,sectorURL,historicURL} from '../public/grand-paris.js';

test('Paris atlas picks valid destinations inside its 142 displayed administrative areas',()=>{
  assert.equal(areas.length,142);
  for(const a of areas)assert.equal(areaAt(...a.center)?.code,a.code,a.name);
  assert.equal(areaAt(2.29232,48.85935).code,'75107');
  assert.equal(areaAt(2.34790,48.85348).code,'75104');
  assert.equal(areaAt(2.34318,48.88480).code,'75118');
  for(const outside of [[2.12035,48.80595],[2.699,49.002],[NaN,48.85]])assert.equal(sectorURL('https://example.test/',...outside,''),null);
});
test('Sector and historic travel discard obsolete room codes and replace the previous destination',()=>{
  const region=new URL(sectorURL('https://example.test/?salon=ignorer&room=retirer&SaLoN=absent&RoOm=ancien&halte=etoile',2.29232,48.85935,'Tour Eiffel'));
  assert(!region.searchParams.has('salon'));assert(!region.searchParams.has('room'));assert(!region.searchParams.has('SaLoN'));assert(!region.searchParams.has('RoOm'));assert.equal(region.searchParams.get('lon'),'2.29232');
  assert.equal(region.searchParams.get('lat'),'48.85935');assert.equal(region.searchParams.get('lieu'),'Tour Eiffel');
  assert(!region.searchParams.has('halte'));
  region.searchParams.set('room','obsolète');region.searchParams.set('salon','ancien');
  const core=new URL(historicURL(region.href,'louvre'));
  assert(!core.searchParams.has('salon'));assert(!core.searchParams.has('room'));assert.equal(core.searchParams.get('halte'),'louvre');
  for(const field of ['lon','lat','lieu'])assert(!core.searchParams.has(field));
});
