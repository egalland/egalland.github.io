const json=(value,status=200)=>Response.json(value,{status,headers:{'cache-control':'no-store'}});
class Problem extends Error{constructor(message,status=400){super(message);this.status=status}}
function requireThat(condition,message,status){if(!condition)throw new Problem(message,status)}
async function digest(value){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('')}
async function api(request,db,path){
 const body=request.method==='POST'?await request.json():{};const stmt=(q,...args)=>db.prepare(q).bind(...args);
 if(path==='/join'&&request.method==='POST'){
 const name=String(body.name||'').trim();requireThat(name.length>=2&&name.length<=24,'Choisissez un nom de 2 à 24 caractères.');
 const id=crypto.randomUUID(),token=crypto.randomUUID()+crypto.randomUUID();
 await stmt('INSERT INTO players(id,secret,name) VALUES(?,?,?)',id,await digest(token),name).run();return json({id,token})}
 const token=request.headers.get('Authorization')?.replace(/^Bearer /,'')||'';requireThat(token.length===72,'Identifiez votre maison.',401);
 const me=await stmt('SELECT id,name,layout,gear FROM players WHERE secret=?',await digest(token)).first();requireThat(me,'Maison inconnue.',401);
 if(path==='/hall'&&request.method==='GET'){
 const [houses,journal,coins]=await Promise.all([
 stmt('SELECT id,name,layout FROM players WHERE id<>? AND layout IS NOT NULL ORDER BY name LIMIT 100',me.id).all(),
 stmt('SELECT a.name AS attacker,d.name AS defender,r.attacker AS aid,r.defender AS did,r.kind,r.result,r.reward,r.started FROM raids r JOIN players a ON a.id=r.attacker LEFT JOIN players d ON d.id=r.defender WHERE (r.attacker=? OR r.defender=?) AND r.result IS NOT NULL ORDER BY r.started DESC LIMIT 20',me.id,me.id).all(),
 stmt('SELECT COALESCE(SUM(reward),0) AS earned FROM raids WHERE attacker=?',me.id).first()]);
 return json({id:me.id,name:me.name,layout:me.layout?JSON.parse(me.layout):null,gear:me.gear,coins:coins.earned-15*me.gear*(me.gear+1),houses:houses.results.map(h=>({id:h.id,name:h.name,power:JSON.parse(h.layout).reduce((n,t)=>n+costs[t],0)})),journal:journal.results})}
 requireThat(request.method==='POST','Méthode inconnue.',405);
 if(path==='/upgrade'){const cost=15*(me.gear+1)*(me.gear+2);
 const row=await stmt('UPDATE players SET gear=gear+1 WHERE id=? AND gear=? AND gear<5 AND (SELECT COALESCE(SUM(reward),0) FROM raids WHERE attacker=?)>=?',me.id,me.gear,me.id,cost).run();requireThat(row.meta.changes,'Or insuffisant ou arsenal au maximum.');return json({ok:true})}
 if(path==='/start'){
 let layout,defender=null;const kind=body.kind;
 if(kind==='test'){requireThat(validLayout(body.layout),'Le plan doit contenir une défense et coûter au plus 12 points.');layout=body.layout}
 else if(kind==='training')layout=training;
 else{requireThat(kind==='raid'&&body.target!==me.id,'Cible incorrecte.');const house=await stmt('SELECT layout FROM players WHERE id=? AND layout IS NOT NULL',body.target||'').first();requireThat(house,'Forteresse indisponible.',404);layout=JSON.parse(house.layout);defender=body.target}
 const hero=body.hero||'knight';requireThat(typeof hero==='string'&&Object.hasOwn(classes,hero),'Personnage inconnu.');
 const id=crypto.randomUUID(),gear=kind==='test'?0:me.gear,version=body.version===4?4:3;
 await stmt('INSERT INTO raids(id,attacker,defender,kind,layout,gear,started) VALUES(?,?,?,?,?,?,?)',id,me.id,defender,kind,JSON.stringify({version,hero,layout}),gear,Date.now()).run();return json({id,kind,layout,gear,hero,version})}
 if(path==='/finish'){
 const raid=await stmt('SELECT * FROM raids WHERE id=? AND attacker=?',body.id||'',me.id).first();requireThat(raid,'Raid introuvable.',404);
 if(raid.result)return json({result:raid.result,reward:raid.reward});
 const snapshot=JSON.parse(raid.layout),old=Array.isArray(snapshot),layout=old?snapshot:snapshot.layout;
 const sim=old?legacy.startRaid(layout,raid.gear):startRaid(layout,raid.gear,snapshot.hero,snapshot.version===4?4:3);
 if(!body.abandon){requireThat(Array.isArray(body.moves)&&body.moves.length<=maxSteps,'Enregistrement invalide.');
 for(const w of body.moves){requireThat(Number.isInteger(w)&&w>=0&&w<=32767,'Commande invalide.');(old?legacy.advance:advance)(sim,w)}
 requireThat(sim.result,'Le raid est encore en cours.');requireThat(sim.tick*1000/30<=Date.now()-raid.started+2000,'Durée de raid invalide.')}
 const result=body.abandon?'lost':sim.result,reward=result!=='won'||raid.kind==='test'?0:raid.kind==='training'?12:20+layout.reduce((n,t)=>n+costs[t],0);
 await stmt('UPDATE raids SET result=?,reward=? WHERE id=? AND result IS NULL',result,reward,raid.id).run();return json(await stmt('SELECT result,reward FROM raids WHERE id=?',raid.id).first())}
 if(path==='/publish'){const proof=await stmt("SELECT layout FROM raids WHERE id=? AND attacker=? AND kind='test' AND result='won'",body.id||'',me.id).first();requireThat(proof,'Validez ce plan en atteignant son trésor.');const snap=JSON.parse(proof.layout);await stmt('UPDATE players SET layout=? WHERE id=?',JSON.stringify(Array.isArray(snap)?snap:snap.layout),me.id).run();return json({ok:true})}
 throw new Problem('Route inconnue.',404)}
export default {async fetch(request,env){const path=new URL(request.url).pathname;if(path.startsWith('/api/')){try{return await api(request,env.DB,path.slice(4))}catch(e){return json({error:e instanceof Problem?e.message:'Le registre est indisponible. Réessayez.'},e.status||500)}}
 const asset=assets[path==='/'?'/index.html':path];return asset?new Response(asset.binary?Uint8Array.from(atob(asset.content),c=>c.charCodeAt(0)):asset.content,{headers:{'content-type':asset.type,'x-content-type-options':'nosniff'}}):new Response('Introuvable',{status:404})}};
