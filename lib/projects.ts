export type Status = "ideas" | "todo" | "building" | "testing" | "live" | "archived";
export type Category = "business" | "personal" | "data" | "games" | "ideas";
export type Project = {
  id: string; slug: string; name: string; subtitle: string; description: string;
  category: Category; status: Status; progress: number; priority: string; tags: string[];
  demoUrl: string | null; repositoryUrl: string | null; workUrl: string | null;
  promptCount: number | null; activeMinutes: number | null; aiSessions: number | null;
  commits: number | null; files: number | null; loc: number | null;
  traditionalDevHours: number | null; traditionalDevValue: number | null;
  metricSource: "estimated" | "tracked" | "imported" | "github";
  createdAt: string; lastWorkedAt: string | null; changelog: string[];
};

const base = (id: string, slug: string, name: string, subtitle: string, category: Category, status: Status, progress: number, description: string, demoUrl: string | null = null): Project => ({
  id, slug, name, subtitle, category, status, progress, description, demoUrl,
  priority: "medium", tags: [], repositoryUrl: null, workUrl: null,
  promptCount: null, activeMinutes: null, aiSessions: null, commits: null, files: null, loc: null,
  traditionalDevHours: null, traditionalDevValue: null, metricSource: "estimated",
  createdAt: "2026-09-28", lastWorkedAt: null, changelog: [],
});

export const seedProjects: Project[] = [
  base("PRJ-001", "nuancier", "NUANCIER", "Color studio", "data", "live", 100,
    "Un exemple de projet pour explorer et classer des palettes."),
  base("PRJ-002", "constellations", "CONSTELLATIONS", "Puzzle prototype", "games", "testing", 70,
    "Un prototype de puzzle utilisé pour illustrer le suivi des tests."),
  base("PRJ-003", "carnet", "CARNET", "Creative notebook", "ideas", "ideas", 0,
    "Une idée de carnet créatif à organiser dans l’atelier."),
];

export const categories: Record<Category, string> = { business: "BUSINESS TOOLS", personal: "PERSONAL TOOLS", data: "DATA / IA", games: "GAMES / EXPERIMENTS", ideas: "IDEAS / LAB" };
export const statusLabels: Record<Status, string> = { ideas: "Idées", todo: "À faire", building: "En création", testing: "En test", live: "Publié", archived: "Archivé" };
