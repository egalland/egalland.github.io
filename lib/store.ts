import { asc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { projects } from "../db/schema";
import { Project, seedProjects } from "./projects";

export function fromRow(row: typeof projects.$inferSelect): Project {
  return { ...row, category: row.category as Project["category"], status: row.status as Project["status"],
    metricSource: row.metricSource as Project["metricSource"],
    tags: JSON.parse(row.tags) as string[], changelog: JSON.parse(row.changelog) as string[] };
}

export async function listProjects(): Promise<Project[]> {
  const db = getDb();
  const rows = await db.select().from(projects).orderBy(asc(projects.id));
  if (rows.length) return rows.map(fromRow);
  await db.insert(projects).values(seedProjects.map(p => ({...p, tags: JSON.stringify(p.tags), changelog: JSON.stringify(p.changelog)}))).onConflictDoNothing();
  return (await db.select().from(projects).orderBy(asc(projects.id))).map(fromRow);
}

export async function publicProjects(): Promise<Project[]> {
  try { return await listProjects(); } catch { return seedProjects; }
}

export async function projectBySlug(slug: string): Promise<Project | undefined> {
  try {
    const rows = await getDb().select().from(projects).where(eq(projects.slug, slug)).limit(1);
    return rows[0] ? fromRow(rows[0]) : seedProjects.find(p => p.slug === slug);
  } catch { return seedProjects.find(p => p.slug === slug); }
}
