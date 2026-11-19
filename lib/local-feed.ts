import { parseFeed, profileName } from "./rss";
import type { Profile } from "./compare";

export async function readLocalFeed(file: File, handle: string): Promise<Profile> {
  if (!file.size || file.size > 6 * 1024 * 1024) {
    throw new Error("Choisissez un journal RSS non vide de moins de 6 Mo.");
  }
  const xml = await file.text();
  const name = profileName(handle);
  // Letterboxd publishes the profile link in the channel header, before any review.
  const header = xml.split(/<item[\s>]/i, 1)[0];
  const profileLink = /<link>\s*(https:\/\/(?:www\.)?letterboxd\.com\/[\w]+\/?)\s*<\/link>/i.exec(header)?.[1];
  if (!profileLink) throw new Error("Choisissez le fichier XML du journal RSS public de ce profil.");
  const owner = profileName(profileLink);
  if (owner !== name) throw new Error("Ce journal appartient à @" + owner + ". Vérifiez le pseudo ou le fichier choisi.");
  try {
    return parseFeed(xml, name);
  } catch {
    throw new Error("Ce fichier XML est illisible. Enregistrez de nouveau le journal RSS du profil.");
  }
}
