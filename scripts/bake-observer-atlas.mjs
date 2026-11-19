// Precompute the orbital geology already used by the planet renderer so an
// observer can rotate the six faces without baking textures in the browser.
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import ts from 'typescript';
import {FACE_ORDER,SIDE} from '../lib/planet.ts';
const source=await readFile(new URL('../lib/planet-orbit-detail.ts',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/import .*?from '.\/planet';/,'const FACE_ORDER='+JSON.stringify(FACE_ORDER)+',SIDE='+SIDE+';');
const {paintRockTile}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const width=640;
for(const face of FACE_ORDER){
  let pixels;
  const context={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:image=>{pixels=image.data;}};
  paintRockTile(context,face,0,0,SIDE,width);
  const result=spawnSync('convert',['-size',width+'x'+width,'-depth','8','rgba:-','-quality','82','public/art/orbit-'+face+'.webp'],{input:Buffer.from(pixels)});
  if(result.status!==0)throw Error(result.stderr.toString());
}
