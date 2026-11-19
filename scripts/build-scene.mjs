import { build } from 'esbuild';
import { mkdir,copyFile } from 'node:fs/promises';
await mkdir(new URL('../dist/vendor/',import.meta.url),{recursive:true});
await build({entryPoints:[new URL('../src/market-scene.mjs',import.meta.url).pathname],outfile:new URL('../dist/market-scene.mjs',import.meta.url).pathname,bundle:true,minify:true,format:'esm',target:['es2022'],external:['./scene-data.mjs'],legalComments:'eof',logLevel:'info'});
await copyFile(new URL('../node_modules/three/LICENSE',import.meta.url),new URL('../dist/vendor/THREE-LICENSE.txt',import.meta.url));
