import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

export function installKikalmoRaster(){
  const req=createRequire(import.meta.url);
  const paths=[process.cwd(),...(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES]:[])];
  const sharp=req(req.resolve('sharp',{paths})),native=req(req.resolve('@napi-rs/canvas',{paths}));
  globalThis.document={createElement:()=>native.createCanvas(224,224)};
  const src=Object.getOwnPropertyDescriptor(native.Image.prototype,'src').set;
  globalThis.Image=class extends native.Image{
    set src(value){
      if(value.startsWith('file:'))return src.call(this,readFileSync(fileURLToPath(value)));
      if(value.startsWith('data:image/svg')){
        const svg=decodeURIComponent(value.slice(value.indexOf(',')+1));
        sharp(Buffer.from(svg)).png().toBuffer().then(bytes=>src.call(this,bytes)).catch(e=>this.onerror(e));return;
      }
      src.call(this,value);
    }
  };
  return native;
}
