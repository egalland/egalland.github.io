import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {Scene,Raycaster,Vector3} from '../public/three.js';
import {createCity3D} from '../public/city3d.js';
import {createCanvasView} from '../public/canvas-view.js';
import {SPAWN,getTravelPoint,nearbyProps} from '../public/paris-world.js';
import {terrainHeight} from '../public/terrain-height.js';

const require=createRequire(import.meta.url);
const paths=[process.cwd(),process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean);
const native=require(require.resolve('@napi-rs/canvas',{paths}));
function installCanvas(t){
  const bindings={Path2D:native.Path2D,OffscreenCanvas:class{constructor(w,h){return native.createCanvas(w,h);}},
    document:{createElement:()=>native.createCanvas(1,1)}};
  const previous=Object.fromEntries(Object.keys(bindings).map(k=>[k,globalThis[k]]));
  Object.assign(globalThis,bindings);
  t.after(()=>{for(const [k,value] of Object.entries(previous))if(value===undefined)delete globalThis[k];else globalThis[k]=value;});
}

test('the 3D mesh puts walkable pavement at its physics elevation across Paris and La Défense',t=>{
  installCanvas(t);
  const scene=new Scene(),city=createCity3D(scene),down=new Vector3(0,-1,0),elevations=[];
  t.after(()=>city.dispose());
  for(const key of ['etoile','concorde','arche']){
    const stop=getTravelPoint(key),expected=terrainHeight(stop.x,stop.y);
    const state={destroyed:new Set(),props:nearbyProps(stop.x,stop.y,90)};
    // Allow the same streamed street meshes that render during play to arrive.
    for(let i=0;i<6;i++)city.update(stop,1+i/30,state);
    scene.updateMatrixWorld(true);
    const ray=new Raycaster(new Vector3(stop.x,expected+1.5,stop.y),down,0,2.2);
    const surfaces=ray.intersectObjects(scene.children,true).map(hit=>hit.point.y);
    assert.ok(surfaces.some(y=>Math.abs(y-expected)<.45),`${key}: expected ${expected}, found ${surfaces}`);
    const actual=surfaces.reduce((a,b)=>Math.abs(a-expected)<Math.abs(b-expected)?a:b);
    elevations.push(actual);
    t.diagnostic(`${key} mesh ${actual.toFixed(2)} m, physics ${expected.toFixed(2)} m`);
  }
  assert.ok(Math.max(...elevations)-Math.min(...elevations)>25);
});

test('on the mobile Canvas view a jumping character visibly separates from its pavement shadow',t=>{
  installCanvas(t);
  const width=390,height=640,surface=native.createCanvas(width,height),yaw=SPAWN.angle;
  Object.assign(surface,{clientWidth:width,clientHeight:height});
  const view=createCanvasView(surface,SPAWN);
  t.after(()=>view.dispose());
  const state={p:SPAWN,speed:0,yaw,car:null,pitch:.13,snap:true,destroyed:new Set()};
  const character={id:'jumper',type:'fox',angle:yaw,walk:0,x:SPAWN.x+Math.cos(yaw)*6,y:SPAWN.y+Math.sin(yaw)*6};
  const context=surface.getContext('2d');
  function capture(entities){view.render({...state,entities},1/30,1);return context.getImageData(0,0,width,height).data;}
  const background=capture([]),onGround=capture([{...character,lift:0,motion:'idle'}]);
  const inAir=capture([{...character,lift:1.05,motion:'jump',verticalSpeed:.6,motionPhase:.46}]);
  function extent(data){
    const rows=[];
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const i=(y*width+x)*4;
      const diff=Math.abs(background[i]-data[i])+Math.abs(background[i+1]-data[i+1])+Math.abs(background[i+2]-data[i+2]);
      if(diff>105)rows.push(y);
    }
    assert.ok(rows.length>260,`actually painted ${rows.length} character pixels`);
    return [rows[Math.floor(rows.length*.20)],rows[Math.floor(rows.length*.62)]];
  }
  const foot=view.projectTarget(character.x,character.y,0);
  const cx=Math.round(foot.x*width),cy=Math.round(foot.y*height)-1;
  let shadowPixels=0;
  for(let y=cy-3;y<=cy+3;y++)for(let x=cx-12;x<=cx+12;x++){
    const i=(y*width+x)*4;
    const darkening=background[i]+background[i+1]+background[i+2]-inAir[i]-inAir[i+1]-inAir[i+2];
    if(darkening>9)shadowPixels++;
  }
  assert.ok(shadowPixels>24,`shadow remains visible under airborne feet: ${shadowPixels} pixels`);
  const grounded=extent(onGround),jumping=extent(inAir);
  const mid=view.projectTarget(character.x,character.y,1),high=view.projectTarget(character.x,character.y,2.05);
  assert.ok(mid&&high);
  const projected=(mid.y-high.y)*height;
  assert.ok(projected>20);
  for(let i=0;i<grounded.length;i++)assert.ok(grounded[i]-jumping[i]>projected*.58,
    `body percentile ${i} lifted ${grounded[i]-jumping[i]} px, camera predicts ${projected.toFixed(1)} px`);
  t.diagnostic(`Jump lifts the visible silhouette ${grounded[0]-jumping[0]} / ${grounded[1]-jumping[1]} px on a ${width} × ${height} display`);
});
