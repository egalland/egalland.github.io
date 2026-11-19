// Historical command harness for engine/CAS regression tests. Never routed.
import {readActivity,appendActivity,actorSnapshot} from '@/lib/activity-journal';
import {ensurePlaytester,tickPlaytester,playtestView} from '@/lib/playtester';
import {env} from 'cloudflare:workers';
import {join, validFaction} from '@/lib/world';
import {readWorld, saveWorld} from '@/lib/world-store';
import {ensureFrontier, advanceFrontier, actFrontier, frontierView} from '@/lib/frontier';

const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(request:Request) {
  try {
    if(!env.DB)return reply({error:'Le monde est temporairement indisponible.'},503);
    const text=await request.text();
    if(text.length>10000)return reply({error:'Ordre trop long.'},413);
    const input=JSON.parse(text);
    if(!input||!['view','join','action','journal'].includes(input.op))return reply({error:'Requête invalide.'},400);
    const account=request.headers.get('oai-authenticated-user-id');
    for(let retry=0;retry<12;retry++){
      const snapshot=await readWorld(env.DB);
      if(!snapshot)continue;
      let w=snapshot.world;const now=Date.now();
      let p=account?w.players.find(p=>p.account===account):undefined;
      if(!p&&typeof input.token==='string'&&input.token)p=w.players.find(p=>!p.account&&p.token===input.token);
      if(input.op==='journal'){if(!p)return reply({error:'Installez votre base pour consulter le journal.'},401);return reply(await readActivity(env.DB,p,input.query&&typeof input.query==='object'?input.query:{}));}
      if(input.op==='action'&&!p)return reply({error:'Installez votre base pour donner un ordre.'},401);
      let token:string|undefined;
      if(input.op==='join'&&!p){
        if(!validFaction(input.faction))return reply({error:'Choisissez une faction.'},400);
        if(w.players.length>=200)return reply({error:'Ce monde est complet.'},409);
        token=crypto.randomUUID();
        p=join(w,String(input.name??'Éclaireur'),token,input.faction,now);appendActivity(w,p,'command','join','Camp installé, six ouvriers disponibles.',{after:actorSnapshot(p,now)},now);
      }
      if(p&&account&&!p.account)p.account=account;
      ensurePlaytester(w,now,4);
      ensureFrontier(w,now);
      advanceFrontier(w,now,tickPlaytester,{maxSteps:48,cpuMs:20});
      let message='',commandError:string|null=null;
      if(input.op==='action'){
        const backup=structuredClone(w),actor=p!.id;
        try{message=actFrontier(w,p!,input.action??{},now);}
        catch(error){const failure=w.auditPending?.at(-1);snapshot.world=w=backup;p=w.players.find(q=>q.id===actor);if(failure?.category==='blocked')(w.auditPending??=[]).push(failure);commandError=(error as Error).message;}
      }
      if(p)p.lastSeen=now;
      const view={...frontierView(w,p,now),playtest:playtestView(w,now,typeof input.watchAI==='string'?input.watchAI:undefined)};
      if(await saveWorld(env.DB,snapshot))return commandError?reply({error:commandError,view,version:snapshot.version+1},400):reply({view,message,version:snapshot.version+1,...token?{token}:{}});
    }
    return reply({error:'Ce secteur est très actif. Réessayez dans un instant.'},409);
  }catch(error){
    const text=error instanceof Error?error.message:'Ordre indisponible.';
    return reply({error:/D1_|SQLITE_|no such table/i.test(text)?'Connexion au monde interrompue.':text},error instanceof SyntaxError?400:/D1_|SQLITE_|no such table/i.test(text)?503:400);
  }
}
