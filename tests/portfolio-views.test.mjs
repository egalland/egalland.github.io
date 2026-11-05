import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {PROJECT_STARTS,LAST_SCENE,projectFor,nextProjectFor} from '../points/motion-core.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=name=>fs.readFileSync(root+name,'utf8');
const data=JSON.parse(read('portfolio/content.json'));
const text=html=>html.replace(/<[^>]*>/g,' ').replaceAll('&amp;','&').replaceAll('&gt;','>').replaceAll('&lt;','<').replaceAll('&quot;','"').replace(/\s+/g,' ').trim();
const cursors=read('curseurs/index.html'),points=read('points/index.html');
const original=execFileSync('git',['show',data.source.commit+':index.html'],{cwd:root,encoding:'utf8'});

test('les deux vues reprennent les descriptions, liens et dates de la page GitHub actuelle',()=>{
 const descriptions=[data.hero.intro,...data.projects.map(p=>p.description),...data.atelier.projects.map(p=>p.description),data.about.description,data.about.manifesto,data.contact.description];
 for(const description of descriptions){assert.ok(text(original).includes(description),'Source: '+description);for(const html of [cursors,points])assert.ok(text(html).includes(description),'Missing shared content: '+description);}
 for(const entry of data.about.timeline)for(const field of ['date','label','note'])for(const html of [original,cursors,points])assert.ok(text(html).includes(entry[field]),entry[field]);
 for(const href of [...data.projects.flatMap(p=>p.links.map(l=>l.href)),...data.atelier.projects.map(p=>p.href)])for(const html of [cursors,points])assert.ok(html.includes('href="'+href+'"'),href);
 assert.ok(points.includes('2018–2025'));assert.ok(!points.includes('mailto:'));assert.ok(!points.includes('href="https://market-plus.'));
});

test('accueil, bascule et ancres des dix projets restent des liens statiques valides',()=>{
 const home=read('index.html');for(const href of ['/points/','/curseurs/','/inktober-2026/','/livre/','/redim/','/map/'])assert.ok(home.includes('href="'+href+'"'));
 for(const html of [cursors,points]){
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'Unique DOM IDs');
  for(const [,id] of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(id),'Valid local anchor: '+id);
  assert.ok(html.includes('data-view-switch'));assert.ok(!html.includes('{{'),'No unresolved content token');
  for(const project of [...data.projects,...data.atelier.projects])assert.ok(ids.includes(project.id),'Direct project access: '+project.id);
 }
 assert.ok(!points.includes('<img'),'The point presentation remains entirely in particles');
});

test('les 19 tableaux couvrent les six groupes et les changements de projet dans les deux sens',()=>{
 const scenes=[...points.matchAll(/data-scene="(\d+)" data-formation="(\d+)"/g)];assert.equal(scenes.length,19);
 for(let i=0;i<scenes.length;i++){assert.equal(Number(scenes[i][1]),i);assert.ok(Number(scenes[i][2])<=17);}
 assert.equal(LAST_SCENE,18);assert.deepEqual(PROJECT_STARTS,[1,3,6,8,10,16]);
 assert.equal(projectFor(0),-1);assert.equal(projectFor(18),-1);
 for(let i=1;i<LAST_SCENE;i++){assert.equal(projectFor(i),PROJECT_STARTS.findLastIndex(n=>n<=i));assert.ok(nextProjectFor(i)>i);}
 assert.equal(nextProjectFor(18),0);
});

test('les dossiers des applications et la construction des curseurs ne sont pas modifiés',()=>{
 const changed=execFileSync('git',['diff','--name-only',data.source.commit],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean);
 const allowed=/^(?:index\.html|README\.md|portfolio-assets\/|points\/|curseurs\/|portfolio\/|scripts\/|source-history\/portfolio-points\.|tests\/portfolio-)/;
 for(const name of changed)assert.match(name,allowed,'Unexpected change outside portfolio: '+name);
 for(const name of ['construction.js','portfolio.css','style.css'])assert.equal(read('portfolio-assets/'+name),execFileSync('git',['show',data.source.commit+':portfolio-assets/'+name],{cwd:root,encoding:'utf8'}));
});
