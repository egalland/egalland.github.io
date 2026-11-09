import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {PROJECT_STARTS,LAST_SCENE,projectFor,nextProjectFor} from '../points/motion-core.mjs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),read=name=>fs.readFileSync(root+name,'utf8');
const data=JSON.parse(read('portfolio/content.json')),page=read('index.html');
const text=html=>html.replace(/<[^>]*>/g,' ').replaceAll('&amp;','&').replaceAll('&gt;','>').replaceAll('&lt;','<').replaceAll('&quot;','"').replace(/\s+/g,' ').trim();
test('les deux modes présentent les gestes, les projets et leurs liens depuis la même source',()=>{
 for(const html of [page,read('points/index.html')]){
  const shown=text(html);
  for(const item of [...data.projects,...data.atelier.projects,data.inktober]){
   assert.ok(shown.includes(item.description),item.id);
   for(const href of item.links?.map(link=>link.href)??[item.href])assert.ok(html.includes('href="'+href+'"'),href);
  }
  for(const practice of data.about.practices){
   for(const value of [practice.verb,practice.words,practice.project])assert.ok(shown.includes(value),value);
   assert.ok(html.includes('href="'+practice.href+'"'),practice.href);
  }
  assert.ok(shown.includes('Savoir-faire.')||shown.includes('Savoir -faire.'));
  assert.doesNotMatch(shown,/Analyste Tarif|Saint-Gobain|Licence informatique|Mon parcours/i);
  assert.ok(!html.includes('href="https://market-plus.'));
 }
});
test('Pills est une pièce autonome dans les deux présentations et donne accès au dépôt public',()=>{
 for(const html of [page,read('points/index.html')]){
  const pills=html.match(/<(article|section)\b[^>]*\bid="pills"[^>]*>([\s\S]*?)<\/\1>/);
  assert.ok(pills);
  assert.match(pills[2],/href="https:\/\/github\.com\/egalland\/Pills"/);
  for(const tag of data.projects.find(project=>project.id==='pills').tags)assert.ok(text(pills[2]).includes(tag),tag);
 }
});
test('la vue Curseurs conserve des ancres uniques dans un document autonome',()=>{
 const ids=[...page.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);assert.equal([...page.matchAll(/<main\b/g)].length,1);assert.ok(!/<iframe|<template|view-choice|data-view-switch/.test(page));
 for(const p of [...data.projects,...data.atelier.projects,data.inktober])assert.equal(ids.filter(id=>id===p.id).length,1);
 for(const name of ['points','curseurs'])assert.ok(page.includes('data-theme-choice="'+name+'"'));
 for(const [,id] of page.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(id),id);
 assert.ok(!page.includes('data-theme-choice="glitch"'));assert.ok(!page.includes('glitch.css'));
 assert.ok(page.includes('portfolio.mjs'));assert.ok(!page.includes('src="/portfolio-assets/app.js'));assert.ok(!page.includes('{{'));
});
test('les anciennes adresses gardent le thème et la section dans le document commun',()=>{
 for(const theme of ['curseurs'])for(const hash of ['#kikalmo','#redim','#kikalmo-interface','#parcours']){
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

test('Points retrouve ses tableaux indépendants avec les mêmes contenus et liens',()=>{
 const points=read('points/index.html');assert.ok(points.includes('id="particles"'));assert.equal([...points.matchAll(/data-scene=/g)].length,17);
 for(const p of [...data.projects,...data.atelier.projects,data.inktober]){assert.ok(text(points).includes(p.description),p.id);assert.ok(points.includes('id="'+p.id+'"'));}
 assert.ok(!points.includes('portfolio.mjs'));assert.match(points,/<script type="module" src="app\.js(?:\?[^"]*)?"/);
});

test('la sélection conserve trois outils et donne une section et une entrée propres à Inktober',()=>{
 assert.deepEqual(data.atelier.projects.map(p=>p.id),['livre','redim','atlas']);
 for(const html of [page,read('points/index.html')]){
  assert.ok(!html.includes('four-en-route'));assert.ok(!html.includes('biscuit-du-jour'));
  assert.match(html,/<section[^>]*id="inktober"/);assert.ok(html.includes('href="/inktober-2026/"'));
 }
 assert.ok(!/<a class="lab-card[^>]*id="inktober"/.test(page));
 for(const axis of data.hero.metrics)for(const html of [page,read('points/index.html')])assert.ok(text(html).includes(axis.value),axis.value);
});
test('tous les groupes et le dernier tableau Points suivent les scènes réellement générées',()=>{
 const html=read('points/index.html');
 const scenes=[...html.matchAll(/<section[^>]*id="([^"]+)"[^>]*data-scene="(\d+)"/g)].map(m=>m[1]);
 const targets=[...html.matchAll(/<a href="#([^"]+)" data-project="(\d+)"/g)].map(m=>m[1]);
 assert.equal(LAST_SCENE,scenes.length-1);assert.deepEqual(PROJECT_STARTS,targets.map(id=>scenes.indexOf(id)));
 PROJECT_STARTS.forEach((start,i)=>assert.equal(projectFor(start),i));
 assert.equal(nextProjectFor(scenes.indexOf('atlas')),scenes.indexOf('inktober'));
 assert.equal(nextProjectFor(LAST_SCENE),0);
});
