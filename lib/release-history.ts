/** User-facing notes curated from the saved version history, not raw requests or commit logs. */
export type ReleaseNote = { version: number; date: string; title: string; changes: string[] };
export const releaseHistory: ReleaseNote[] = [
 {version:1,date:"2026-11-19",title:"Édition locale pour les réunions",changes:["Création de points, mise en page et partage de classeurs locaux."]}
];
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export function findReleases(query: string): ReleaseNote[] {
  const term = normalize(query.trim());
  const version = /^v?(\d+)$/.exec(term);
  return releaseHistory.filter(entry => version ? entry.version === Number(version[1]) : normalize(`V${entry.version} ${entry.date} ${entry.title} ${entry.changes.join(" ")}`).includes(term));
}
