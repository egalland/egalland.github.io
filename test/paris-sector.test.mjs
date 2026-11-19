import test from 'node:test';
import assert from 'node:assert/strict';
import {loadSector} from '../public/paris-sector.js';

function polygon(lon,lat) {
  return {type:'Polygon',coordinates:[[[lon,lat],[lon+.0002,lat],[lon+.0002,lat+.0002],[lon,lat+.0002],[lon,lat]]]};
}
function feature(id,geometry,properties={}) {
  return {type:'Feature',properties:{cleabs:id,...properties},geometry};
}
const page=(features,total=features.length)=>new Response(JSON.stringify({type:'FeatureCollection',features,numberMatched:total}));

test('loads all WFS pages, preserves metric positions and caches the site sector',async t=>{
  const calls=[],house=polygon(2.36,48.94);
  t.mock.method(globalThis,'fetch',async url=>{
    const q=new URL(url,'https://example.test').searchParams,l=q.get('layer'),n=Number(q.get('start'));
    assert(url.startsWith('/api/geo/ign?'));calls.push([l,n]);
    if(l==='batiment'){
      const count=n===0?1000:1;
      const features=Array.from({length:count},(_,i)=>feature('BATIMENT'+(10_000+n+i),house,{hauteur:i===0?null:14,nombre_d_etages:2,usage_1:'Résidentiel'}));
      return page(features,1001);
    }
    if(l==='troncon_de_route'){
      const line={type:'LineString',coordinates:[[2.33,48.94],[2.36,48.94],[2.39,48.94]]};
      return page([feature('TRONROUT123',line,{nature:'Route à 2 chaussées',importance:'3',position_par_rapport_au_sol:'1',largeur_de_chaussee:12}),
        feature('TRONROUT124',line,{position_par_rapport_au_sol:'-1'})]);
    }
    return page([]);
  });
  const a=await loadSector(2.36,48.94,'Saint-Denis');
  assert.equal(a.buildings.length,1001);assert.equal(a.streets.length,1);
  assert.deepEqual(a.buildings[0].poly[0],[8051,-6679]);assert.equal(a.buildings[0].observedHeight,false);
  assert.equal(a.buildings[0].h,6);assert.equal(a.streets[0].bridge,true);
  const [left,,right]=a.metadata.bounds;
  assert.equal(a.streets[0].path[0][0],left);assert.equal(a.streets[0].path.at(-1)[0],right);
  assert.equal(a.metadata.undergroundRoadsOmitted,1);assert.equal(a.metadata.sector.name,'Saint-Denis');
  assert(calls.some(([l,n])=>l==='batiment'&&n===1000));
  const count=calls.length;
  const b=await loadSector(2.36,48.94,'Nouvelle étiquette');
  assert.equal(b.metadata.sector.name,'Nouvelle étiquette');
  assert.equal(calls.length,count);
});

test('switches to official WFS when proxy unavailable; rejects non-local coordinates without fetching',async t=>{
  let upstream=0;
  t.mock.method(globalThis,'fetch',async url=>{
    if(url.startsWith('/api/'))return new Response(null,{status:502});
    const q=new URL(url);
    assert.equal(q.origin,'https://data.geopf.fr');assert.equal(q.searchParams.get('SRSNAME'),'CRS:84');
    assert.equal(q.searchParams.get('COUNT'),'1000');upstream++;
    if(q.searchParams.get('TYPENAMES')==='BDTOPO_V3:batiment')return page([feature('BATIMENT137',polygon(2.57,48.71),{hauteur:9})]);
    return page([]);
  });
  const sector=await loadSector(2.57,48.71,'Marolles');
  assert.equal(sector.metadata.counts.buildings,1);assert.equal(upstream,4);
  await assert.rejects(()=>loadSector(100,40),/petite couronne/);
  assert.equal(upstream,4);
});
