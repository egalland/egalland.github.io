// Rebuild the six shipped relief maps from the illustrated swatches. This is
// an art preparation step; no terrain pixels are generated per simulation tick.
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import ts from 'typescript';
import {SIDE,FACE_ORDER} from '../lib/planet.ts';
const code=await readFile('lib/field-geology.ts','utf8');
const js=ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {groundMix,fieldColors,landformsIn}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
function convert(args,input){
  const job=spawnSync('convert',args,{input,maxBuffer:20*1024*1024});
  if(job.status!==0)throw Error(job.stderr.toString()||'Texture conversion failed');
  return job.stdout;
}
const width=768,worldSize=SIDE,swatch=128,atlasSize=swatch*2;
const material=convert(['public/art/terrain-materials.webp','-resize',atlasSize+'x'+atlasSize+'!','-depth','8','rgb:-']);
function sample(kind,x,y){
  const reflect=p=>{const n=((p%(2*swatch))+2*swatch)%(2*swatch);return n<swatch?n:2*swatch-1-n;};
  const i=((Math.floor(kind/2)*swatch+reflect(y))*atlasSize+(kind%2)*swatch+reflect(x))*3;
  return material[i]*.28+material[i+1]*.56+material[i+2]*.16;
}
const means=fieldColors.map((_,k)=>{
  let total=0;for(let y=0;y<swatch;y++)for(let x=0;x<swatch;x++)total+=sample(k,x,y);
  return total/(swatch*swatch);
});
const detailSize=512,cell=detailSize/2;
const formations=convert(['public/art/terrain-landforms.webp','-resize',detailSize+'x'+detailSize+'!','-depth','8','rgba:-']);
function surveyLandforms(face,bytes){
  for(const patch of landformsIn(face,SIDE,0,0,SIDE,SIDE)){
    const cx=patch.u*width/SIDE,cy=patch.v*width/SIDE,r=patch.size*width/SIDE;
    const cos=Math.cos(patch.turn*Math.PI/2),sin=Math.sin(patch.turn*Math.PI/2);
    for(let y=Math.max(0,Math.floor(cy-r));y<Math.min(width,Math.ceil(cy+r));y++){
      for(let x=Math.max(0,Math.floor(cx-r));x<Math.min(width,Math.ceil(cx+r));x++){
        const dx=(x+.5-cx)/r,dy=(y+.5-cy)/r;
        const u=(dx*cos+dy*sin)*patch.flip+.5,v=-dx*sin+dy*cos+.5;
        if(u<0||v<0||u>=1||v>=1)continue;
        const ai=(Math.floor(u*cell)+(patch.kind%2)*cell+(Math.floor(v*cell)+Math.floor(patch.kind/2)*cell)*detailSize)*4;
        const alpha=formations[ai+3]/255*.44,bi=(y*width+x)*3;
        for(let k=0;k<3;k++)bytes[bi+k]=Math.round(bytes[bi+k]*(1-alpha)+formations[ai+k]*alpha);
      }
    }
  }
}
for(const face of FACE_ORDER){
  const bytes=Buffer.alloc(width*width*3);
  for(let y=0;y<width;y++)for(let x=0;x<width;x++){
    const u=x*worldSize/width,v=y*worldSize/width, mix=groundMix(face,u,v);
    // Illumination uses the derivatives of the same relief as the surface camera.
    const du=11/230*Math.cos(u/230)*Math.cos(v/310)+5/97*Math.cos((u+v)/97)-2/43*Math.sin((u-v)/43);
    const dv=-11/310*Math.sin(u/230)*Math.sin(v/310)+5/97*Math.cos((u+v)/97)+2/43*Math.sin((u-v)/43);
    const relief=(du*.6+dv*.8)*115;
    const folded=Math.sin(u/28+v/54+2.6*Math.sin(v/75));
    const contour=mix[1]*Math.max(0,folded-.65)*17;
    const grain=mix.reduce((total,w,k)=>total+w*(sample(k,x+k*13,y-k*7)-means[k])*.45,0);
    for(let c=0;c<3;c++){
      const tone=mix.reduce((sum,w,k)=>sum+w*fieldColors[k][c],0)+relief+grain-contour;
      bytes[(y*width+x)*3+c]=Math.max(0,Math.min(255,Math.round(tone)));
    }
  }
  surveyLandforms(face,bytes);
  convert(['-size',width+'x'+width,'-depth','8','rgb:-','-quality','85','public/art/surface-'+face+'.webp'],bytes);
}
