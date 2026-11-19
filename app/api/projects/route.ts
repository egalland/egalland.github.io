import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { projects } from "../../../db/schema";
import { isOwner } from "../../../lib/owner";
import { listProjects } from "../../../lib/store";

const input = z.object({
  name: z.string().trim().min(2).max(100), subtitle: z.string().trim().max(120).default("New experiment"),
  description: z.string().trim().max(4000).default(""),
  category: z.enum(["business","personal","data","games","ideas"]).default("ideas"),
  priority: z.enum(["low","medium","high"]).default("medium"),
});

export async function GET() {
  if (!await isOwner()) return Response.json({error:"Accès privé"},{status:403});
  try { return Response.json({projects:await listProjects()}); }
  catch { return Response.json({error:"Les données du Lab sont temporairement indisponibles."},{status:503}); }
}

export async function POST(request: Request) {
  if (!await isOwner()) return Response.json({error:"Accès privé"},{status:403});
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({error:"Données invalides"},{status:400});
  try {
    const db = getDb();
    const all = await listProjects();
    const next = Math.max(0,...all.map(p => Number(p.id.split("-")[1]) || 0)) + 1;
    const id = `PRJ-${String(next).padStart(3,"0")}`;
    const slug = `${parsed.data.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}-${next}`;
    const [project] = await db.insert(projects).values({...parsed.data,id,slug,status:"ideas",progress:0,tags:"[]",changelog:"[]",metricSource:"estimated",createdAt:new Date().toISOString()}).returning();
    return Response.json({project},{status:201});
  } catch { return Response.json({error:"Création impossible pour le moment."},{status:503}); }
}

export async function PATCH(request: Request) {
  if (!await isOwner()) return Response.json({error:"Accès privé"},{status:403});
  const parsed = z.object({ id:z.string().regex(/^PRJ-\d{3,}$/), status:z.enum(["ideas","todo","building","testing","live","archived"]).optional(), progress:z.number().int().min(0).max(100).optional(), description:z.string().max(4000).optional(), demoUrl:z.string().url().nullable().optional(), workUrl:z.string().url().nullable().optional(), repositoryUrl:z.string().url().nullable().optional() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({error:"Données invalides"},{status:400});
  const {id,...changes} = parsed.data;
  if (!Object.keys(changes).length) return Response.json({error:"Aucun changement"},{status:400});
  try {
    const db=getDb();
    const [previous]=await db.select().from(projects).where(eq(projects.id,id)).limit(1);
    if(!previous)return Response.json({error:"Projet introuvable"},{status:404});
    const now=new Date().toISOString();
    const log=JSON.parse(previous.changelog) as string[];
    log.push(`${now} — Fiche mise à jour dans Project Lab`);
    const [updated] = await db.update(projects).set({...changes,lastWorkedAt:now,changelog:JSON.stringify(log)}).where(eq(projects.id,id)).returning();
    return updated ? Response.json({project:updated}) : Response.json({error:"Projet introuvable"},{status:404});
  } catch { return Response.json({error:"Enregistrement impossible."},{status:503}); }
}
