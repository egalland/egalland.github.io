import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
await Promise.all([
  build({ entryPoints: ['api.ts'], outfile: 'dist/api.mjs', bundle: true, format: 'esm', platform: 'node', target: 'node24' }),
  build({ entryPoints: ['web/app.ts'], outfile: 'dist/app.js', bundle: true, format: 'esm', target: 'es2022' }),
  ...['index.html','style.css'].map(name=>copyFile('web/'+name,'dist/'+name))
]);
