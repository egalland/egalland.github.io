import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createProject, parseProject, removeYarn} from '../dist/projects.js';
import {pullGuide,pullSheet,pullCoverage,colorRuns,readsFromRight,countStitches,progressFor,doneFor,stepsCount,stageAt,placementOnPull} from '../dist/pull-guide.js';
import {editKey,paintPullCell} from '../dist/pull-state.js';
import {readPanel,overview} from '../dist/pull-views.js';
import {estimate} from '../dist/budget.js';
import {buildRaglanPull} from '../dist/raglan-model.js';

function blankPull() {
  const p=createProject('pull');
  p.rows=p.cols=2; p.grid=[[0,0],[0,0]]; p.motif.layout='single';
  return p;
}

test('Toute la surface tricotée reste disponible avec un motif vide de deux rangs',()=>{
  const p=blankPull(),g=pullGuide(p),cov=pullCoverage(p,g);
  const cloth=g.pieces.filter(piece=>piece.rows.length);
  assert.deepEqual(cloth.map(piece=>piece.rows.length),[186,186,205,205,7]);
  assert.equal(cov.total,cloth.reduce((total,piece)=>total+piece.rows.reduce((n,row)=>n+countStitches(row),0),0));
  assert.equal(cov.cm2,cov.total*100/(22*30));
  assert.deepEqual(cov.shares,[1,0,0]);
  assert.equal(estimate(p,cov).area,cov.cm2);
  for (const piece of cloth) {
    const sheet=pullSheet(p,g,piece);
    for (const [i,row] of piece.rows.entries()) {
      const reading=colorRuns(sheet,i);
      assert.equal(reading.groups.flat().reduce((sum,run)=>sum+run.n,0),countStitches(row));
      assert.equal(reading.groups.length,row.spans.length);
    }
  }
  const front=g.byId.get('front');
  assert.equal(front.setupCount,112);
  assert.equal(front.rows.at(-1).spans.length,2);
  assert.match(overview(p,g),/Coutures du raglan/);
  assert.match(readPanel(p,g,front,170),/Rang 170 sur 186/);
});

test('Une maille dessinée reste unique et identique dans la grille, le suivi, les UV et la consommation',()=>{
  const p=blankPull();
  let g=pullGuide(p);
  const sleeve=g.byId.get('sleeve-left'),other=g.byId.get('sleeve-right'),r=89,c=Math.floor(sleeve.width/2);
  assert.ok(paintPullCell(p,sleeve,r,c,2));
  assert.equal(paintPullCell(p,sleeve,r,c,2),false);
  g=pullGuide(p);
  let sheet=pullSheet(p,g,sleeve);
  assert.equal(sheet.totals[2],1);
  assert.equal(sheet.color(r,c),2);
  assert.equal(sheet.texture((c+.5)/sleeve.width,(r+.5)/sleeve.rows.length).color,2);
  assert.equal(pullSheet(p,g,other).totals[2],0);
  assert.deepEqual(colorRuns(sheet,r).groups.flat().filter(run=>run.color===2),[{color:2,n:1}]);
  assert.ok(pullCoverage(p,g).shares[2]>0);
  p.pullDesign.base[other.id]=1;g=pullGuide(p);
  const cov=pullCoverage(p,g), budget=estimate(p,cov);
  assert.ok(cov.shares[1]>.1&&cov.shares[2]<.001);
  assert.ok(budget.entries[1].meters>budget.entries[2].meters&&budget.entries[2].meters>0);
  assert.equal(pullSheet(p,g,other).totals[1],pullSheet(p,g,other).stitches);
  assert.equal(pullSheet(p,g,g.byId.get('front')).totals[1],0);
  assert.equal(paintPullCell(p,sleeve,0,0,2),false);
  assert.ok(paintPullCell(p,sleeve,r,c,null));
  sheet=pullSheet(p,pullGuide(p),sleeve);
  assert.equal(sheet.totals[2],0);
});

test('La lecture alternée conserve les groupes séparés au col et le premier envers du col V',()=>{
  const p=blankPull();p.collar='v';
  const g=pullGuide(p),front=g.byId.get('front'),collar=g.byId.get('collar');
  for (const i of [front.rows.length-2,front.rows.length-1]) {
    const spans=front.rows[i].spans;assert.equal(spans.length,2);
    for (const [index,[l,h]] of spans.entries()) for (let c=l;c<=h;c++) paintPullCell(p,front,i,c,index+1);
  }
  const sheet=pullSheet(p,pullGuide(p),front);
  for(const i of [front.rows.length-2,front.rows.length-1]){
    assert.deepEqual(colorRuns(sheet,i).groups.map(r=>r[0].color),readsFromRight(front,i)?[2,1]:[1,2]);
  }
  assert.equal(collar.firstSide,'wrong');
  assert.equal(readsFromRight(collar,0),false);assert.equal(readsFromRight(collar,1),true);
  assert.ok(placementOnPull(p,'sleeve-left',{x:.4,y:.5}).surface==='sleeve-left');
  assert.equal(placementOnPull(p,'collar',{x:.4,y:.5}),null);
  assert.match(readPanel(p,g,collar,1),/Envers · de gauche à droite/);
});

test('La reprise du patron reste indépendante de la répétition et survit à l’export et au changement de taille',()=>{
  const old=createProject('pull');old.version=2;old.progress=8;delete old.pullWork;delete old.pullDesign;
  const p=parseProject(old),g=pullGuide(p),front=g.byId.get('front');
  assert.equal(progressFor(p,g).done,0);assert.equal(p.progress,8);
  p.pullWork={piece:'front',done:{back:1,front:171,'join-raglans':1},signature:g.signature};
  const row=165,col=front.rows[row].spans[0][0];
  p.pullDesign.base.back=2;paintPullCell(p,front,row,col,1);
  const resumed=parseProject(JSON.parse(JSON.stringify(p)));
  assert.deepEqual(resumed.pullWork,p.pullWork);assert.deepEqual(resumed.pullDesign,p.pullDesign);
  assert.equal(stageAt(front,doneFor(resumed,front)).title,'Rang 171 sur 186');
  assert.equal(progressFor(resumed,pullGuide(resumed)).done,173);
  removeYarn(resumed,1);
  assert.equal(resumed.pullDesign.base.back,1);assert.equal(resumed.pullDesign.edits.front[editKey(front,row,col)],0);
  const invalid=structuredClone(p);invalid.pullDesign.edits.front[editKey(front,row,col)]=100;
  assert.throws(()=>parseProject(invalid),/retouche/);
  resumed.measures.length+=4;
  const larger=pullGuide(resumed);assert.notEqual(larger.signature,g.signature);
  assert.match(readPanel(resumed,larger,larger.byId.get('front'),171),/patron a été recalculé/);
  assert.ok(larger.byId.get('front').rows.length>front.rows.length);
  resumed.pullWork.done.front=9999;
  assert.equal(doneFor(resumed,larger.byId.get('front')),stepsCount(larger.byId.get('front')));
  const unchanged=larger.signature;resumed.gauge.manual=true;
  const calibrated=pullGuide(resumed);
  assert.equal(calibrated.signature,unchanged);
  assert.ok(calibrated.construction.warnings.every(w=>!w.includes('indicatif')));
});



test('Les deux manches sont orientées du point de vue de la personne qui porte le pull',()=>{
  for(const collar of ['round','v','high']){
    const p=createProject();p.collar=collar;
    const guide=pullGuide(p),model=buildRaglanPull(p,guide.construction,true);
    const areas=new Map();
    model.traverse(mesh=>{
      const fabric=mesh.userData.knit;
      if(!fabric||fabric.inside)return;
      const id=fabric.pullPiece,geometry=mesh.geometry;
      if(id.startsWith('sleeve')){
        geometry.computeBoundingBox();
        const box=geometry.boundingBox;
        assert.ok(id==='sleeve-left'?box.min.x>0:box.max.x<0);
      }
      const uv=geometry.attributes.uv,indices=geometry.index.array;
      let area=areas.get(id)||0;
      for(let i=0;i<indices.length;i+=3){
        const a=indices[i],b=indices[i+1],c=indices[i+2];
        area+=Math.abs((uv.getX(b)-uv.getX(a))*(uv.getY(c)-uv.getY(a))-
          (uv.getY(b)-uv.getY(a))*(uv.getX(c)-uv.getX(a)))/2;
      }
      areas.set(id,area);
    });
    assert.equal(areas.size,5);
    for(const [id,area] of areas){
      const piece=guide.byId.get(id);
      const covered=area*piece.width*piece.rows.length;
      assert.ok(Math.abs(covered-pullSheet(p,guide,piece).stitches)<.005,id);
    }
  }
});
