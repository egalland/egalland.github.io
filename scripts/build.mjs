import fs from 'node:fs';
const types={js:'text/javascript',css:'text/css',html:'text/html; charset=utf-8',png:'image/png',svg:'image/svg+xml',webmanifest:'application/manifest+json'};
const assets={};for(const file of fs.readdirSync('web')){const mime=types[file.split('.').pop()];if(mime)assets['/'+file]={mime,data:fs.readFileSync('web/'+file).toString('base64')}}
fs.mkdirSync('dist/server',{recursive:true});
fs.writeFileSync('dist/server/index.js','const assets='+JSON.stringify(assets)+';\nconst seed='+fs.readFileSync('web/seed.json','utf8')+';\n'+fs.readFileSync('worker.mjs','utf8'));
