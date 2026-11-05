import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),read=name=>fs.readFileSync(root+name,'utf8');
const data=JSON.parse(read('portfolio/content.json')),page=read('index.html');
const text=html=>html.replace(/<[^>]*>/g,' ').replaceAll('&amp;','&').replaceAll('&gt;','>').replaceAll('&lt;','<').replaceAll('&quot;','"').replace(/\s+/g,' ').trim();
const original=execFileSync('git',['show',data.source.commit+':index.html'],{cwd:root,encoding:'utf8'});
test('le document unique conserve les contenus, dates et liens de la page GitHub',()=>{
 const values=[data.hero.intro,...data.projects.map(p=>p.description),...data.atelier.projects.map(p=>p.description),data.about.description,data.about.manifesto,data.contact.description];
 for(const value of values){assert.ok(text(original).includes(value));assert.ok(text(page).includes(value),value);}
 for(const t of data.about.timeline)for(const k of ['date','label','note'])assert.ok(text(page).includes(t[k]),t[k]);
 for(const href of [...data.projects.flatMap(p=>p.links.map(l=>l.href)),...data.atelier.projects.map(p=>p.href)])assert.ok(page.includes('href="'+href+'"'),href);
 assert.ok(!page.includes('href="https://market-plus.'));assert.ok(page.includes('2018–2025'));
});
test('les trois thèmes partagent un seul contenu HTML et des ancres uniques',()=>{
 const ids=[...page.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);assert.equal([...page.matchAll(/<main\b/g)].length,1);assert.ok(!/<iframe|<template|view-choice|data-view-switch/.test(page));
 for(const p of [...data.projects,...data.atelier.projects])assert.equal(ids.filter(id=>id===p.id).length,1);
 for(const name of ['points','curseurs','glitch'])assert.ok(page.includes('data-theme-choice="'+name+'"'));
 for(const [,id] of page.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(id),id);
 assert.ok(page.includes('portfolio.mjs'));assert.ok(!page.includes('src="/portfolio-assets/app.js'));assert.ok(!page.includes('{{'));
});
test('les anciennes adresses gardent le thème et la section dans le document commun',()=>{
 for(const theme of ['points','curseurs'])for(const hash of ['#kikalmo','#redim','#kikalmo-interface','#parcours']){
  const alias=read(theme+'/index.html');assert.ok(!alias.includes('<main'));let actual;
  const location={href:'https://egalland.github.io/'+theme+'/?test=1'+hash,search:'?test=1',hash,replace:value=>{actual=value;}};
  vm.runInNewContext(alias.match(/<script>(.*?)<\/script>/s)[1],{URL,location});const u=new URL(actual);
  assert.equal(u.pathname,'/');assert.equal(u.searchParams.get('theme'),theme);assert.equal(u.searchParams.get('test'),'1');assert.equal(u.hash,hash==='#kikalmo-interface'?'#kikalmo':hash==='#parcours'?'#about':hash);
 }
});
test('les dossiers des applications restent hors du périmètre des modifications',()=>{
 const changed=execFileSync('git',['diff','--name-only','48359f09fe15e09fd8c8e3409ed302b7a66d11e0'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean);
 for(const name of changed)assert.match(name,/^(?:index\.html|README\.md|portfolio-assets\/|points\/|curseurs\/|portfolio\/|scripts\/|tests\/portfolio-)/,name);
});
