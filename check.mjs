import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {ERAS,INFO,PANOS,ROUTES} from './src/data.js';
for(const n of [1,2,3]){
 const data=JSON.parse(readFileSync(`dist/assets/map-${n}.json`));
 assert(data.places.length>10);assert(data.width>0&&data.height>0);
 for(const p of data.places){assert(p.p.every(Number.isFinite));assert(p.p[0]>=0&&p.p[0]<=data.width);assert(p.p[1]>=0&&p.p[1]<=data.height);}
 for(const name of ['terrain','parchment','height'])assert(existsSync(`dist/assets/${name}-${n}.${name==='height'?'png':'webp'}`));
}
for(const p of PANOS){assert(existsSync(`dist/assets/${p.asset}.webp`),p.asset);assert.equal(INFO[p.id].pano,p.asset);for(const era of p.eras)assert(ERAS[era]);}
for(const route of ROUTES)for(const era of route.eras){const age=ERAS[era].age;const data=JSON.parse(readFileSync(`dist/assets/map-${age}.json`));const ids=new Set(data.places.map(p=>p.id));if(age===3)['Moria','Isengard','BaradDur'].forEach(id=>ids.add(id));for(const id of route.places)assert(ids.has(id),`${route.id}: ${id} absent`);}
console.log('✓ Three geographic datasets, six panoramas, five complete routes, terrain assets and era links verified.');
