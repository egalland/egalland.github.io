import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {defaultState} from '../dist/knit.js';
import {CATALOG, fabricArea, validateMeasures} from '../dist/catalog.js';
import {PATTERNS} from '../dist/textiles.js';
import {ProjectBook, applyPattern, createProject, parseProject, removeYarn, sampleSignature} from '../dist/projects.js';
import {estimate} from '../dist/budget.js';
import {buildPiece, meshCellAreas} from '../dist/scene.js';
import {patternSampler} from '../dist/fabric.js';
import {meterLabel} from '../dist/ui.js';

class BrowserStorage {
  values = new Map();
  get length(){return this.values.size;}
  key(i){return [...this.values.keys()][i];}
  getItem(key){return this.values.get(key) ?? null;}
  setItem(key,value){this.values.set(key,value);}
}
function weighedBlanket(){
  const p=createProject('couverture');
  p.measures={width:100,length:100};
  Object.assign(p.yarns[0],{grams:50,meters:100,stock:3});
  Object.assign(p.sample,{enabled:true,width:10,height:10,grams:5});
  p.margin=0;p.floatAllowance=0;
  return p;
}

test('Une pesée donne les mètres et le nombre entier de pelotes de chaque fil',()=>{
  const p=weighedBlanket();const b=estimate(p);
  assert.equal(b.area,10000);assert.equal(b.entries[0].meters,1000);
  assert.equal(b.entries[0].grams,500);assert.equal(b.balls,10);assert.equal(b.toBuy,7);
  assert.equal(b.entries[1].balls,0);
  Object.assign(p.yarns[1],{grams:25,meters:200});p.yarns[0].heldWith=p.yarns[1].id;
  const paired=estimate(p);
  assert.deepEqual(paired.entries.map(e=>e.meters),[800,800,0]);
  assert.deepEqual(paired.entries.map(e=>e.balls),[8,4,0]);
  assert.equal(paired.entries[0].grams+paired.entries[1].grams,500);
  p.yarns[0].heldWith=p.yarns[0].id;
  assert.equal(estimate(p).entries[0].meters,1000);
});

test('La marge et les flottés s’appliquent aux zones prévues, puis chaque coloris est arrondi séparément',()=>{
  const p=weighedBlanket();p.margin=10;p.floatAllowance=20;
  const b=estimate(p,{shares:[.86,.14,0],patterned:[.20,.14,0]});
  assert.ok(Math.abs(b.entries[0].meters-990)<1e-8);
  assert.ok(Math.abs(b.entries[1].meters-184.8)<1e-8);
  assert.deepEqual(b.entries.map(e=>e.balls),[10,2,0]);
  assert.equal(meterLabel(.38),'0,4 m');assert.equal(meterLabel(.008),'moins de 0,1 m');
  assert.equal(estimate(createProject('chaussettes')).pair,true);
  assert.equal(fabricArea({...p,kind:'libre',form:'triangle'}).cm2,5000);
});

test('Le carnet conserve le pull de la version précédente et les nouveaux ouvrages après réouverture',()=>{
  const storage=new BrowserStorage(),old=defaultState();old.name='Pull conservé';old.progress=12;old.palette[1].hex='#92749d';
  storage.setItem('maille-atelier-v1',JSON.stringify(old));
  const book=new ProjectBook(storage),p=book.startup();
  assert.deepEqual(p.grid,old.grid);assert.equal(p.progress,12);assert.equal(p.yarns[1].color,'#92749d');
  const next=createProject('echarpe','Écharpe longue');next.measures.length=185.5;next.step=4;next.progress=4;
  book.save(next);assert.equal(new ProjectBook(storage).startup().id,next.id);
  assert.equal(book.load(p.id).name,'Pull conservé');
  const recovered=new ProjectBook(storage);assert.equal(recovered.startup().id,p.id);
  assert.equal(recovered.load(next.id).measures.length,185.5);assert.equal(recovered.list().length,2);
  const clone=book.duplicate(next,'Écharpe bleue');clone.grid[0][0]=1;book.save(clone);
  assert.notEqual(clone.id,next.id);assert.deepEqual(recovered.load(next.id).grid,next.grid);
  assert.equal(recovered.exportAll().projects.length,3);
});

test('Deux versions ouvertes se conservent toutes les deux en cas de modification concurrente',()=>{
  const storage=new BrowserStorage(),book1=new ProjectBook(storage),p=book1.startup();
  const book2=new ProjectBook(storage),other=book2.startup();
  p.name='Version verte';book1.save(p);other.name='Version bleue';
  assert.equal(book2.save(other).conflict,true);assert.notEqual(other.id,p.id);
  assert.equal(book1.load(p.id).name,'Version verte');assert.equal(book1.load(other.id).name,'Version bleue (copie)');
});

test('Un fil retiré est remplacé dans la grille et détaché des brins associés',()=>{
  const p=createProject();p.cols=2;p.rows=2;p.grid=[[0,1],[2,1]];p.selected=2;p.yarns[0].heldWith=p.yarns[1].id;
  const reference=sampleSignature(p);removeYarn(p,1);
  assert.deepEqual(p.grid,[[0,0],[1,0]]);assert.equal(p.selected,1);assert.equal(p.yarns[0].heldWith,null);
  assert.notEqual(sampleSignature(p),reference);assert.deepEqual(parseProject(p).grid,p.grid);
  const invalid=structuredClone(p);invalid.grid[1][1]=7;assert.throws(()=>parseProject(invalid),/grille/);
});

test('Chaque ouvrage produit un volume fini avec un devant et une estimation positive',()=>{
  for(const kind of Object.keys(CATALOG)){
    const p=createProject(kind);assert.equal(validateMeasures(kind,p.measures),'',kind);
    const forms=kind==='libre'?['rectangle','triangle','tube','disque']:['rectangle'];
    for(const form of forms){p.form=form;const model=buildPiece(p,true);const size=new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
      assert.ok([size.x,size.y,size.z].every(v=>Number.isFinite(v)&&v>0),kind+'/'+form);
      assert.ok(model.getObjectByProperty('isMesh',true));assert.ok(estimate(p).meters>0);
      const surfaces=[];model.traverse(obj=>{if(obj.userData.knit&&!obj.userData.knit.inside)surfaces.push(obj.userData.knit.surface);});
      assert.ok(surfaces.includes('body'),kind+'/'+form);
    }
  }
  assert.equal(Object.keys(CATALOG).length,21);
});

test('Tous les motifs restent éditables et sérialisables comme les grilles dessinées à la main',()=>{
  const p=createProject('sac');
  for(const pat of PATTERNS){applyPattern(p,pat);const restored=parseProject(p);assert.deepEqual(restored.grid,pat.grid,pat.id);assert.notEqual(restored.grid[0],pat.grid[0]);}
  assert.equal(PATTERNS.length,28);
});

test('Un motif isolé suit sa position, les coutures et le panneau de tissu réellement utilisé',()=>{
  const p=createProject('pull');p.rows=2;p.cols=2;p.grid=[[0,1],[1,0]];p.motif={id:'custom',layout:'single',u:.5,v:.5,scale:1,surface:'body'};
  p.gauge={stitches:10,rows:10};const k={surface:'body',part:'body',widthCm:10,heightCm:10,circular:true};
  assert.equal(patternSampler(p,k).read(.54,.54).color,1);assert.equal(patternSampler(p,{...k,surface:'other'}).read(.54,.54).color,0);
  p.motif.u=.99;assert.equal(patternSampler(p,k).read(.01,.54).color,1);assert.equal(patternSampler(p,k).read(.54,.54).color,0);
  const geom=new THREE.PlaneGeometry(4,2);const uv=geom.attributes.uv;
  for(let i=0;i<uv.count;i++)uv.setX(i,uv.getX(i)*.5);
  const mesh=new THREE.Mesh(geom),areas=meshCellAreas(mesh,10,10);
  assert.equal(areas.area,8);let left=0,right=0;
  for(let i=0;i<areas.weights.length;i++){if(i%10<5)left+=areas.weights[i];else right+=areas.weights[i];}
  assert.ok(Math.abs(left-8)<1e-8);assert.equal(right,0);
});
