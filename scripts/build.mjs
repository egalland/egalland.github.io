import { readdir, readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, extname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.woff2':'font/woff2','.woff':'font/woff','.png':'image/png','.webp':'image/webp','.gz':'application/octet-stream'};
const assets = {};
for (const file of (await readdir('public')).sort()) {
  const type = mime[extname(file)];
  if (!type) continue;
  if (extname(file) === '.js') {
    const result = spawnSync(process.execPath, ['--check','public/'+file], {stdio:'inherit'});
    if (result.status !== 0) throw Error('Invalid JavaScript in '+file);
  }
  const bytes = await readFile('public/'+file);
  const etag = '"'+createHash('sha256').update(bytes).digest('hex').slice(0,16)+'"';
  const contents = type.startsWith('text/') ? {text:bytes.toString('utf8')} : {encoded:bytes.toString('base64')};
  assets['/' + file] = {type,etag,...contents};
}
// Resolve relative imports from the module that declares them. Server-only
// rules stay in the Worker while shared game rules keep one source of truth.
function inlineModule(file) {
  const source=readFileSync(file,'utf8');
  return source.replace(/^import\s*\{([^}]+)\}\s*from\s*['"](\.{1,2}\/[\w./-]+\.js)['"];?/gm, (_, names, reference) => {
    const body=inlineModule(join(dirname(file),reference)).replace(/^export /gm,'');
    return 'const {'+names+'} = (()=>{\n'+body+'\nreturn {'+names+'};\n})();';
  });
}
const api = inlineModule('worker/game-api.js');
const geo = await readFile('worker/geo-api.js','utf8');
const router = (await readFile('worker/index.js','utf8')).replace("import { handleApi } from './game-api.js';", '').replace("import { handleGeo } from './geo-api.js';", '');
await mkdir('dist/server',{recursive:true});
await mkdir('dist/.openai',{recursive:true});
await writeFile('dist/server/index.js','const packedAssets = '+JSON.stringify(assets)+';\n'+api+'\n'+geo+'\n'+router);
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
const worker = (await import('../dist/server/index.js')).default;
for (const path of ['/','/main.js','/paris-world.js','/paris-data.js','/city3d.js','/canvas-view.js','/paris-core.js','/paris-sector.js','/sector-eiffel.gz','/sector-notre-dame.gz','/sector-sacre-coeur.gz','/puppets3d.js','/three.js','/sprites.js','/game.js','/net.js','/panels.js','/brand.js','/maille.woff']) {
  const response = await worker.fetch(new Request('https://test.local'+path),{});
  if (response.status !== 200 || (await response.arrayBuffer()).byteLength < 30) throw Error('Missing asset '+path);
}
console.log('Worker and '+Object.keys(assets).length+' assets ready.');
