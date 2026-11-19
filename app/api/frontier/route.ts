import { env } from 'cloudflare:workers';
import { observerJournal, recentAiActivity } from '@/lib/activity-journal';
import { advanceFrontier } from '@/lib/frontier';
import { isObserverSpeed, observerClock } from '@/lib/observation-clock';
import { canObserve } from '@/lib/observer-access';
import { observerView } from '@/lib/observatory';
import { ensurePlaytester, tickPlaytester } from '@/lib/playtester';
import { readWorld, saveWorld } from '@/lib/world-store';

const reply = (data: unknown, status = 200) => Response.json(data,
  {status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie, Authorization'}});

export async function POST(request: Request) {
  try {
    if (!await canObserve(request,env.STRATE_OWNER_EMAIL_SHA256,import.meta.env.DEV)) {
      return reply({error:'Cet observatoire est réservé au propriétaire du monde.'},403);
    }
    if (request.headers.get('sec-fetch-site') === 'cross-site' || !request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
      return reply({error:'Cette requête doit provenir de l’observatoire.'},403);
    }
    const raw = await request.text();
    if (raw.length > 4000) return reply({error:'Requête trop longue.'},413);
    const input = JSON.parse(raw);
    if (!input || typeof input !== 'object' || Array.isArray(input)) return reply({error:'Requête illisible.'},400);
    if (input.op !== 'observe' && input.op !== 'journal') return reply({error:'Les ordres de jeu sont réservés aux IA.'},403);
    if (input.speed !== undefined && !isObserverSpeed(input.speed)) return reply({error:'Vitesse de simulation inconnue.'},400);
    if (!env.DB) return reply({error:'Le monde est temporairement indisponible.'},503);
    if (input.op === 'journal') return reply(await observerJournal(env.DB,input.query));

    for (let retry=0; retry<8; retry++) {
      const snapshot = await readWorld(env.DB);
      if (!snapshot) continue;
      const w = snapshot.world, now = Date.now();
      const oldTime = w.frontier?.time, newClock = !('observationClock' in w);
      const previous = observerClock(w,now);
      const clock = input.speed !== undefined && input.speed !== previous.speed ? observerClock(w,now,input.speed) : previous;
      ensurePlaytester(w, oldTime ?? w.created);
      advanceFrontier(w,clock.target,tickPlaytester,{maxSteps:48,cpuMs:20});
      const changed = newClock || previous.speed !== clock.speed || oldTime !== w.frontier?.time || !!w.auditPending?.length;
      if (changed && !await saveWorld(env.DB,snapshot)) continue;
      const latest = await recentAiActivity(env.DB, w.frontier!.time);
      return reply({view:observerView(w,now,typeof input.watchAI==='string'?input.watchAI:undefined,latest,clock),
        version:snapshot.version+(changed?1:0)});
    }
    return reply({error:'Le monde vient d’avancer. Reconnexion dans un instant.'},409);
  } catch(error) {
    return error instanceof SyntaxError ? reply({error:'Requête illisible.'},400)
      : reply({error:'Impossible de lire ou de sauvegarder la simulation. Réessayez dans un instant.'},503);
  }
}
