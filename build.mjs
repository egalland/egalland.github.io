import {build} from 'esbuild';
await build({entryPoints:['src/app.js'],bundle:true,minify:true,format:'esm',outfile:'dist/app.js',sourcemap:false,target:'es2022'});
