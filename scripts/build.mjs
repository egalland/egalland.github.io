import { readdir, readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { spawnSync } from 'node:child_process';
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.woff2':'font/woff2','.woff':'font/woff','.png':'image/png'};
const assets = {};
for (const file of (await readdir('public')).sort()) {
  const type = mime[extname(file)];
  if (!type) continue;
  if (extname(file) === '.js') {
    const result = spawnSync(process.execPath, ['--check','public/'+file], {stdio:'inherit'});
    if (result.status !== 0) throw Error('Invalid JavaScript in '+file);
  }
  assets['/' + file] = {type, encoded:(await readFile('public/'+file)).toString('base64')};
}
const api = await readFile('worker/game-api.js','utf8');
const router = (await readFile('worker/index.js','utf8')).replace("import { handleApi } from './game-api.js';", '');
await mkdir('dist/server',{recursive:true});
await mkdir('dist/.openai',{recursive:true});
await writeFile('dist/server/index.js','const packedAssets = '+JSON.stringify(assets)+';\n'+api+'\n'+router);
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
const worker = (await import('../dist/server/index.js')).default;
for (const path of ['/','/main.js','/world.js','/sprites.js','/game.js','/net.js','/panels.js','/brand.js','/maille.woff']) {
  const response = await worker.fetch(new Request('https://test.local'+path),{});
  if (response.status !== 200 || (await response.arrayBuffer()).byteLength < 30) throw Error('Missing asset '+path);
}
console.log('Worker and '+Object.keys(assets).length+' assets ready.');
