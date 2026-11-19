// Historical command harness for engine/CAS regression tests. Never routed.
import { env } from 'cloudflare:workers';
import { normalizeFocus, validPoint } from '@/lib/planet';
import { act, advance, wakeFleet, join, localRegion, neededChunks, publicWorld, validFaction, type GameAction, type World } from '@/lib/world';
import { readChunks, readRegionSnapshot, readWorld, saveWorld } from '@/lib/world-store';

const response=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
function playerFor(w:World,account:string|null,token:unknown){
  const guest=typeof token==='string'&&token.length>0?w.players.find(p=>!p.account&&p.token===token):undefined;
  return account?w.players.find(p=>p.account===account)??guest:guest;
}
function parseAction(input:unknown):GameAction|undefined{
  if(!input||typeof input!=='object'||typeof (input as GameAction).type!=='string')return undefined;
  const a={...input} as GameAction;
  for(const key of ['block','parcel']){
    const pt=a[key];
    if(validPoint(pt))a[key]={x:pt.x,y:pt.y,z:pt.z};
  }
  return a;
}
export async function POST(req:Request){
  try{
    const db=env.DB;
    if(!db)return response({error:'Connexion au monde indisponible.'},503);
    const raw=await req.text();
    if(raw.length>12000)return response({error:'Commande trop longue.'},413);
    const a=JSON.parse(raw);
    if(!a||!['view','join','poll','action','region'].includes(a.op))return response({error:'Requête invalide.'},400);
    const action=parseAction(a.action);
    if(a.op==='action'&&!action)return response({error:'Commande invalide.'},400);
    const focus=normalizeFocus(a.focus);
    if(a.focus!=null&&!focus)return response({error:'Coordonnées hors de la planète.'},400);
    const account=req.headers.get('oai-authenticated-user-id');
    if (a.op === 'region') {
      if (!focus) return response({error:'Choisissez un secteur à explorer.'}, 400);
      const snapshot = await readRegionSnapshot(db, focus);
      if (!snapshot) return response({error:'La planète est en cours de préparation.'}, 503);
      const viewer = playerFor(snapshot.world, account, a.token);
      return response({region:localRegion(snapshot.world, focus, viewer, snapshot.version)});
    }
    for(let retry=0;retry<12;retry++){
      const snapshot=await readWorld(db);
      if(!snapshot)continue;
      const {world:w,version}=snapshot;
      if(w.frontier)return response({error:'STRATE utilise désormais les gisements et les expéditions. Rechargez la page pour rejoindre votre base.'},410);
      const now=Date.now();
      let p=playerFor(w,account,a.token);
      const previous=p?{last:p.lastSeen,mined:p.reportedMined??p.mined,coins:p.reportedCoins??p.coins,delivered:p.reportedDelivered??p.logistics?.delivered??0}:null;
      let token:string|undefined;
      if(a.op==='action'&&!p)return response({error:'Rejoignez une faction pour jouer.'},401);
      await readChunks(db,w,neededChunks(w,focus,action,now));
      advance(w,now);
      if(p)wakeFleet(p,now);
      if(a.op==='join'&&!p){
        if(!validFaction(a.faction))return response({error:'Choisissez une faction.'},400);
        if(w.players.length>=200)return response({error:'Ce monde a atteint sa capacité.'},409);
        token=crypto.randomUUID();p=join(w,String(a.name||'Mineur'),token,a.faction,now);
      }
      if(p&&account&&!p.account)p.account=account;
      const result=a.op==='action'&&p&&action?act(w,p,action,now):null;
      const offline=p&&previous&&now-previous.last>60000?{
        blocks:p.mined-previous.mined,delivered:(p.logistics?.delivered??0)-previous.delivered,coins:p.coins-previous.coins,seconds:Math.min(14400,(now-previous.last)/1000),
      }:null;
      if(p){p.lastSeen=now;p.reportedMined=p.mined;p.reportedCoins=p.coins;p.reportedDelivered=p.logistics?.delivered??0;}
      const view=publicWorld(w,p,now,focus);
      if(await saveWorld(db,snapshot)){
        if (view.region) view.region.revision = version + 1;
        return response({world:view,version:version+1,...(token?{token}:{}),result,offline});
      }
    }
    return response({error:'Le monde est très actif. Réessayez dans un instant.'},409);
  }catch(err){
    const message=err instanceof Error?err.message:'Erreur serveur.';
    if(/D1_|SQLITE_|no such table|query failed/i.test(message)){
      return response({error:'Connexion au monde interrompue. Réessayez dans un instant.'},503);
    }
    return response({error:err instanceof SyntaxError?'Commande illisible.':message},400);
  }
}
