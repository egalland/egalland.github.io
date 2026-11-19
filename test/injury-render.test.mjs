import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createBleedFibers} from '../public/bleed-fibers.js';
import {createBleedMesh} from '../public/bleed-mesh.js';
import {createCanvasView} from '../public/canvas-view.js';
import {SPAWN} from '../public/paris-world.js';
import {terrainHeight} from '../public/terrain-height.js';
import {Scene,Box3} from '../public/three.js';

const start=150000,severity=2,wound={at:start,until:start+6000,severity};
const hero={...SPAWN,id:'self',self:true,type:'fox',bleeding:wound};

test('world yarn scatters on impact, lies on a raised surface after treatment, then disappears',()=>{
  const blood=createBleedFibers(),scene=new Scene(),display=createBleedMesh(scene);
  const height=terrainHeight(hero.x,hero.y)+2;
  const paint=t=>{
    blood.begin(t,start+t*1000);display.begin();
    const drawn=blood.actor({...hero,lift:2,supportHeight:2,bleeding:t===0?wound:null});
    display.draw(drawn);
    const marks=[];
    blood.eachDrop((id,p,lines)=>{display.draw(lines);marks.push(p);});
    display.finish();
    const mesh=scene.children[0];
    mesh.computeBoundingBox();
    return {marks,box:new Box3().copy(mesh.boundingBox),count:mesh.count};
  };
  const hit=paint(0);
  assert.equal(hit.marks.length,2+severity);
  assert.ok(hit.box.min.y>height+.45&&hit.box.max.y>height+.80);
  const settled=paint(1.6);
  assert.equal(settled.marks.length,hit.marks.length);
  assert.ok(settled.box.max.y<height+.16&&settled.box.min.y>height);
  assert.deepEqual(paint(2.3).marks,settled.marks);
  assert.equal(paint(8).count,0);
  blood.begin(10,start+10000);
  assert.equal(blood.actor({...hero,isCar:true,bleeding:{...wound,until:start+12000}}),null);
  const continued=blood.actor({...hero,bleeding:{...wound,until:start+12000}});
  assert.ok(continued.length);let remoteBurst=0;blood.eachDrop(()=>remoteBurst++);
  assert.equal(remoteBurst,0,'joining an already wounded peer does not replay its impact');
  display.dispose();
});

test('the mobile perspective view paints crimson wool on a body and temporary stitches on the street',t=>{
  const require=createRequire(import.meta.url);
  const native=require(require.resolve('@napi-rs/canvas',{paths:[process.cwd(),process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
  const bindings={Path2D:native.Path2D,OffscreenCanvas:class{constructor(w,h){return native.createCanvas(w,h);}},
    document:{createElement:()=>native.createCanvas(1,1)}};
  const previous=Object.fromEntries(Object.keys(bindings).map(k=>[k,globalThis[k]]));
  Object.assign(globalThis,bindings);t.after(()=>{for(const [k,v] of Object.entries(previous))if(v===undefined)delete globalThis[k];else globalThis[k]=v;});
  const w=390,h=640,canvas=native.createCanvas(w,h);Object.assign(canvas,{clientWidth:w,clientHeight:h});
  const view=createCanvasView(canvas,SPAWN);t.after(()=>view.dispose());
  function capture(time,entities){view.render({p:SPAWN,yaw:SPAWN.angle,pitch:.13,snap:true,epoch:start+time*1000,destroyed:new Set(),entities},.033,time);
    return canvas.getContext('2d').getImageData(0,0,w,h).data;}
  function redChanges(a,b){
    let n=0;
    for(let i=0;i<a.length;i+=4)if(a[i]>a[i+1]*1.65&&a[i+2]<a[i]*.88&&Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>70)n++;
    return n;
  }
  const clean=capture(0,[{...hero,bleeding:null}]),hit=capture(0,[hero]);
  const street=capture(8,[]);capture(10,[{...hero,bleeding:{at:start+10000,until:start+15000,severity}}]);
  const drips=capture(11.6,[]),gone=capture(18,[]);
  const onBody=redChanges(hit,clean),onRoad=redChanges(drips,street);
  assert.ok(onBody>25,'wound pixels '+onBody);assert.ok(onRoad>12,'stitch pixels '+onRoad);
  assert.equal(redChanges(gone,street),0);
  t.diagnostic('Phone view: '+onBody+' wound pixels and '+onRoad+' contrasting pavement pixels.');
});
