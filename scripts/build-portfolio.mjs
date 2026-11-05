import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const data=JSON.parse(fs.readFileSync(path.join(root,'portfolio/content.json'),'utf8'));
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const render=(template,values)=>template.replace(/\{\{([\w.]+)\}\}/g,(_,key)=>{const value=key.split('.').reduce((v,k)=>v?.[k],values);if(value===undefined)throw new Error('Missing portfolio field: '+key);return key.endsWith('Html')?value:escape(value);});
const save=(name,content)=>{const target=path.join(root,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,content);};
save('index.html',render(fs.readFileSync(path.join(root,'portfolio/page.template.html'),'utf8'),data));
save('portfolio-assets/content.js','window.PORTFOLIO_CONTENT='+JSON.stringify(data).replaceAll('<','\\u003c')+';\n');
save('portfolio-assets/content.mjs','export default '+JSON.stringify(data).replaceAll('<','\\u003c')+';\n');
// Compatibility entry points always resolve to the same HTML document.
for(const theme of ['points','curseurs'])save(theme+'/index.html',`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Emmanuel Galland — Portfolio</title><link rel="canonical" href="https://egalland.github.io/"><script>const target=new URL('/',location.href);target.search=location.search;if(!target.searchParams.has('theme'))target.searchParams.set('theme','${theme}');const aliases={depart:'home','market-interface':'market-plus','kikalmo-personnage':'kikalmo','kikalmo-interface':'kikalmo','maison-reseaux':'maison','bodyos-tendance':'bodyos',parcours:'about',suite:'contact'};const anchor=location.hash.slice(1);target.hash=aliases[anchor]||anchor;location.replace(target.href);</script><noscript><meta http-equiv="refresh" content="0;url=/?theme=${theme}"></noscript></head><body><a href="/?theme=${theme}">Ouvrir le portfolio</a></body></html>\n`);
console.log('One HTML document generated; Points, Curseurs and Glitch use disposable script engines.');
