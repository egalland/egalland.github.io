import fs from 'node:fs';
const assets={};
for(const file of fs.readdirSync('client')){
 const ext=file.split('.').pop(),binary=ext==='webp';
 const type={webp:'image/webp',html:'text/html',css:'text/css',js:'application/javascript',mjs:'application/javascript'}[ext];
 if(!type)continue;assets['/'+file]={content:fs.readFileSync('client/'+file,binary?'base64':'utf8'),type:binary?type:type+'; charset=utf-8',binary}
}
fs.mkdirSync('dist/server',{recursive:true});
const engine=assets['/engine.mjs'].content.replace(/^export /gm,'');
const legacy=fs.readFileSync('server/legacy.mjs','utf8').replace(/^export /gm,'');
fs.writeFileSync('dist/server/index.js','const assets='+JSON.stringify(assets)+';\nconst legacy=(()=>{'+legacy+';return {startRaid,advance,maxSteps}})();\n'+engine+'\n'+fs.readFileSync('server/api.mjs','utf8'));
