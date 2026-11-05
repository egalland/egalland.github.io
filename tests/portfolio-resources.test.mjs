import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import images from '../points/assets/images.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=name=>fs.readFileSync(root+name,'utf8');
const source=JSON.parse(read('points/assets/resources.json'));
const gitHash=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
test('les images et polices intégrées gardent exactement les octets du modèle Points original',()=>{
 const assets={'kikalmo-logo.webp':Buffer.from(images.logo.split(',')[1],'base64'),'kikalmo-personnage.png':Buffer.from(images.puppet.split(',')[1],'base64')};
 for(const name of ['display','text','mono'])assets[name+'.woff']=Buffer.from(read('points/assets/font-'+name+'.css').match(/base64,([^)]*)\)/)[1],'base64');
 for(const [name,bytes] of Object.entries(assets))assert.equal(gitHash(bytes),source.gitBlobSha1[name],name);
});
test('les parties de l’historique restituent un bundle Git complet et identique',()=>{
 const manifest=JSON.parse(read('source-history/portfolio-points.bundle.manifest.json'));
 const bytes=Buffer.from(manifest.parts.map(name=>read('source-history/'+name)).join(''),'base64');
 assert.equal(bytes.length,manifest.originalBytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),manifest.sha256);
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'portfolio-history-'));
 try{const file=path.join(folder,'original.bundle');fs.writeFileSync(file,bytes);execFileSync('git',['bundle','verify',file],{cwd:root,stdio:'pipe'});}finally{fs.rmSync(folder,{recursive:true,force:true});}
});
