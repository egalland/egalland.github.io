export type Film = {
  title: string;
  year: string;
  rating: number | null;
  lid?: string;
  url?: string;
  id?: string;
  tmdb?: string;
};

export type DiaryEntry = {
  film: Film;
  watchedDate: string | null;
  rewatch: boolean;
};

export type Profile = {
  name: string;
  source: "api" | "rss" | "export" | "demo";
  films: Film[];
  complete: boolean;
  diary?: DiaryEntry[];
};

type Pair = { a: Film; b: Film };
const csvLimit = 32 * 1024 * 1024;
const filmOrder = new Intl.Collator("fr", { sensitivity: "base", numeric: true });

function filmLink(value?: string) {
  if (!value || !/^https?:\/\//i.test(value)) return undefined;
  try {
    const url = new URL(value);
    if (url.port || url.username || url.password) return undefined;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "letterboxd.com") {
      const slug = /^\/(?:[a-z0-9_]+\/)?film\/([\w%-]+)(?:\/\d+)?\/?$/i.exec(url.pathname)?.[1];
      if (slug) return "https://letterboxd.com/film/" + slug.toLowerCase() + "/";
    }
    if (host === "boxd.it" && /^\/[A-Za-z0-9]+\/?$/.test(url.pathname)) {
      return "https://boxd.it" + url.pathname.replace(/\/$/, "");
    }
  } catch { /* Ignore invalid optional links. */ }
  return undefined;
}

function identities(film: Film) {
  const ids = new Map<string, string>();
  if (film.lid) ids.set("lid", film.lid);
  for (const value of [film.id, film.url]) {
    const uri = filmLink(value);
    if (uri) ids.set(uri.includes("://boxd.it/") ? "short" : "slug", uri);
  }
  if (film.tmdb && /^\d+$/.test(film.tmdb)) ids.set("tmdb", film.tmdb);
  return ids;
}

function normalizeTitle(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘ʼ]/g, "'").replace(/\s+/g, " ").trim().toLowerCase();
}

function titleKey(film: Film) {
  return /^\d{4}$/.test(film.year) ? film.year + "|" + normalizeTitle(film.title) : undefined;
}

function titleIndex(films: Film[]) {
  const index = new Map<string, number>();
  films.forEach((film, i) => {
    const key = titleKey(film);
    if (key) index.set(key, index.has(key) ? -1 : i);
  });
  return index;
}

function matchFilms(left: Film[], right: Film[]) {
  const matches = new Map<number, number>();
  const used = new Set<number>();
  const leftIds = left.map(identities);
  const rightIds = right.map(identities);
  const byId = new Map<string, number>();
  rightIds.forEach((ids, i) => {
    for (const [kind, value] of ids) {
      const key = kind + ":" + value;
      byId.set(key, byId.has(key) ? -1 : i);
    }
  });
  leftIds.forEach((ids, i) => {
    for (const [kind, value] of ids) {
      const j = byId.get(kind + ":" + value);
      if (j === undefined || j < 0 || used.has(j)) continue;
      matches.set(i, j);
      used.add(j);
      break;
    }
  });

  // Different sources can identify the same film with short and full links.
  // Fall back only when both catalogues contain a single title/year candidate.
  const aTitles = titleIndex(left);
  const bTitles = titleIndex(right);
  for (const [key, i] of aTitles) {
    const j = bTitles.get(key);
    if (i < 0 || matches.has(i) || j === undefined || j < 0 || used.has(j)) continue;
    const target = rightIds[j];
    const conflicts = [...leftIds[i]].some(([kind, value]) => target.has(kind) && target.get(kind) !== value);
    if (conflicts) continue;
    matches.set(i, j);
    used.add(j);
  }
  return { matches, used };
}

export function compareProfiles(a: Profile, b: Profile) {
  const { matches, used } = matchFilms(a.films, b.films);
  const common: Pair[] = [];
  for (const [i, j] of matches) common.push({ a: a.films[i], b: b.films[j] });
  common.sort((x, y) => filmOrder.compare(x.a.title, y.a.title) || x.a.year.localeCompare(y.a.year));
  const rated = common.filter(pair => pair.a.rating != null && pair.b.rating != null);
  const gap = (pair: Pair) => Math.abs(pair.a.rating! - pair.b.rating!);
  const sum = (pair: Pair) => pair.a.rating! + pair.b.rating!;
  const agreements = [...rated].sort((x, y) => gap(x) - gap(y) || sum(y) - sum(x));
  const differences = [...rated].sort((x, y) => gap(y) - gap(x) || sum(y) - sum(x));
  const totalGap = rated.reduce((n, pair) => n + gap(pair), 0);
  const score = rated.length ? Math.round(100 * (1 - totalGap / (4.5 * rated.length))) : null;
  function suggestions(films: Film[], seen: (index: number) => boolean) {
    return films.filter((film, i) => !seen(i) && film.rating != null && film.rating >= 3.5)
      .sort((x, y) => y.rating! - x.rating! || filmOrder.compare(x.title, y.title));
  }
  return {
    common, commonCount: common.length, ratedCount: rated.length, score, agreements, differences,
    fromA: suggestions(a.films, i => matches.has(i)), fromB: suggestions(b.films, i => used.has(i))
  };
}

function csvRows(text: string) {
  text = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false, closed = false;
  function finishRow() {
    row.push(field);
    if (row.some(cell => cell.trim() !== "")) rows.push(row);
    if (rows.length > 200_001) throw new Error("Le CSV dépasse 200 000 lignes.");
    row = [];
    field = "";
    closed = false;
  }
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch !== '"') { field += ch; continue; }
      if (text[i + 1] === '"') { field += '"'; i++; continue; }
      quoted = false;
      closed = true;
    } else if (ch === ",") {
      row.push(field); field = ""; closed = false;
      if (row.length > 128) throw new Error("Le CSV contient trop de colonnes.");
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      finishRow();
    } else if (ch === '"' && !field && !closed) {
      quoted = true;
    } else if (closed) {
      if (!/\s/.test(ch)) throw new Error("Les guillemets du CSV sont mal formés.");
    } else {
      field += ch;
    }
  }
  if (quoted) throw new Error("Une valeur entre guillemets est incomplète dans le CSV.");
  finishRow();
  return rows;
}

type FilmCsv = { header: string[]; rows: string[][] };
function filmCsv(text: string): FilmCsv {
  const rows = csvRows(text);
  return { header: (rows.shift() ?? []).map(cell => cell.trim().toLowerCase()), rows };
}

function rowFilms(file: FilmCsv, kind: "watched" | "ratings" | "diary") {
  const { header, rows } = file;
  const titleCol = header.indexOf("name"), yearCol = header.indexOf("year");
  const ratingCol = header.indexOf("rating"), urlCol = header.indexOf("letterboxd uri");
  if (titleCol < 0 || yearCol < 0 || (kind === "ratings" && ratingCol < 0)) {
    throw new Error("Format CSV inattendu. Choisissez ratings.csv, watched.csv ou diary.csv dans un export Letterboxd.");
  }
  return rows.map((row, index): Film => {
    const title = row[titleCol]?.trim();
    if (!title) throw new Error("Titre de film manquant à la ligne " + (index + 2) + " du CSV.");
    const rawRating = row[ratingCol]?.trim();
    const rating = rawRating ? Number(rawRating) : null;
    if (rating !== null && (!Number.isFinite(rating) || rating < 0.5 || rating > 5 || !Number.isInteger(rating * 2))) {
      throw new Error("Note invalide à la ligne " + (index + 2) + " du CSV. Les notes Letterboxd vont de ½ à 5.");
    }
    const link = filmLink(row[urlCol]);
    // Short diary links can identify the individual log, not the film.
    const url = kind === "diary" && link?.startsWith("https://boxd.it/") ? undefined : link;
    return { title, year: row[yearCol]?.trim() ?? "", rating, ...(url ? { url } : {}) };
  });
}

function catalog(file: FilmCsv, watched: boolean) {
  const films = new Map<string, Film>();
  rowFilms(file, watched ? "watched" : "ratings").forEach((film, index) => {
    const key = film.url ?? titleKey(film) ?? ("row:" + index);
    if (!films.has(key) || film.rating !== null) films.set(key, film);
  });
  return [...films.values()];
}

function parseDiary(file: FilmCsv): DiaryEntry[] {
  const watchedCol = file.header.indexOf("watched date");
  const rewatchCol = file.header.indexOf("rewatch");
  if (watchedCol < 0) throw new Error("La colonne « Watched Date » manque dans le journal Letterboxd.");
  const entries = rowFilms(file, "diary").map((film, index) => {
    const row = file.rows[index];
    const watchedDate = row[watchedCol]?.trim() || null;
    if (watchedDate) {
      const day = new Date(watchedDate + "T00:00:00Z");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(watchedDate) || !Number.isFinite(day.getTime()) || day.toISOString().slice(0,10) !== watchedDate) {
        throw new Error("Date de visionnage invalide à la ligne " + (index + 2) + " du journal.");
      }
    }
    return { film, watchedDate, rewatch: /^(yes|true|1)$/i.test(row[rewatchCol]?.trim() ?? "") };
  });
  return entries.sort((a,b) => (b.watchedDate ?? "").localeCompare(a.watchedDate ?? ""));
}

function addDiary(films: Film[], diary: DiaryEntry[], hasWatched: boolean, hasRatings: boolean) {
  const catalogTitles = titleIndex(films);
  const byUrl = new Map<string, Film>();
  for (const film of films) if (film.url) byUrl.set(film.url, film);

  // A diary-only export can include several screenings of a film. Resolve known
  // film slugs before title/year so a short log link can join an unambiguous film.
  const knownSlugs = new Map<string, string | null>();
  for (const { film } of diary) {
    const key = titleKey(film);
    if (!key || !film.url) continue;
    const previous = knownSlugs.get(key);
    knownSlugs.set(key, previous === undefined || previous === film.url ? film.url : null);
  }
  const extra = new Map<string, Film>();
  for (const entry of diary) {
    const logged = entry.film;
    const key = titleKey(logged);
    const slug = logged.url ?? (key ? knownSlugs.get(key) : undefined);
    let found = slug ? byUrl.get(slug) : undefined;
    const candidate = key ? catalogTitles.get(key) : undefined;
    if (!found && key && candidate !== undefined && candidate >= 0 && knownSlugs.get(key) !== null) {
      const film = films[candidate];
      if (!slug || !film.url?.startsWith("https://letterboxd.com/film/") || film.url === slug) found = film;
    }
    if (!found && !hasWatched) {
      if (!slug && (candidate === -1 || (key && knownSlugs.get(key) === null))) continue;
      const extraKey = slug ?? key ?? ("untitled-year:" + normalizeTitle(logged.title));
      found = extra.get(extraKey);
      if (!found) {
        found = { ...logged, rating: null, ...(slug ? { url: slug } : {}) };
        extra.set(extraKey, found);
      }
    }
    if (found) {
      if (!hasRatings && found.rating === null) found.rating = logged.rating;
      entry.film = { ...found, rating: logged.rating };
    }
  }
  return films.concat([...extra.values()]);
}

type ZipEntry = { method: number; size: number; packed: number; offset: number; flags: number };
const decoder = new TextDecoder("utf-8");
const archiveError = () => new Error("Archive ZIP illisible. Choisis l’export Letterboxd d’origine ou son fichier ratings.csv.");
async function section(file: File, start: number, length: number) {
  if (start < 0 || length < 0 || start + length > file.size) throw archiveError();
  return new DataView(await file.slice(start, start + length).arrayBuffer());
}

async function zipFiles(file: File) {
  // Read the directory from the end of the ZIP, leaving private unrelated entries untouched.
  const tail = await section(file, Math.max(0, file.size - 65_557), Math.min(file.size, 65_557));
  let end = tail.byteLength - 22;
  while (end >= 0 && (tail.getUint32(end, true) !== 0x06054b50 ||
    end + 22 + tail.getUint16(end + 20, true) !== tail.byteLength)) end--;
  if (end < 0 || tail.getUint32(end + 4, true) !== 0) throw archiveError();
  const count = tail.getUint16(end + 10, true);
  const length = tail.getUint32(end + 12, true);
  if (count === 65535 || length > 16 * 1024 * 1024) throw archiveError();
  const directory = await section(file, tail.getUint32(end + 16, true), length);
  const groups = new Map<string, Map<string, ZipEntry>>();
  let at = 0;
  for (let n = 0; n < count; n++) {
    if (at + 46 > directory.byteLength || directory.getUint32(at, true) !== 0x02014b50) throw archiveError();
    const nameLength = directory.getUint16(at + 28, true);
    const next = at + 46 + nameLength + directory.getUint16(at + 30, true) + directory.getUint16(at + 32, true);
    if (next > directory.byteLength) throw archiveError();
    const name = decoder.decode(new Uint8Array(directory.buffer, at + 46, nameLength));
    const match = /^(?:(?!deleted\/|lists\/|__macosx\/)([^/]+)\/)?(ratings\.csv|watched\.csv|diary\.csv|profile\.csv)$/i.exec(name);
    if (match) {
      const path = match[1] ?? "";
      const group = groups.get(path) ?? new Map<string, ZipEntry>();
      const basename = match[2].toLowerCase();
      if (group.has(basename)) throw archiveError();
      group.set(basename, {
        method: directory.getUint16(at + 10, true), flags: directory.getUint16(at + 8, true),
        packed: directory.getUint32(at + 20, true), size: directory.getUint32(at + 24, true),
        offset: directory.getUint32(at + 42, true)
      });
      groups.set(path, group);
    }
    at = next;
  }
  const candidates = [...groups].filter(([, entries]) => entries.has("ratings.csv") || entries.has("watched.csv") || entries.has("diary.csv"));
  const root = candidates.find(([path]) => !path);
  if (root) return root[1];
  if (candidates.length === 1) return candidates[0][1];
  throw new Error("L’archive doit contenir les films d’un seul profil Letterboxd (ratings.csv, watched.csv ou diary.csv).");
}

async function readEntry(file: File, entry: ZipEntry, limit = csvLimit) {
  if (entry.size > limit) throw new Error("Un fichier CSV de l’archive dépasse la taille autorisée.");
  if ((entry.flags & 1) || ![0, 8].includes(entry.method)) throw archiveError();
  const local = await section(file, entry.offset, 30);
  if (local.getUint32(0, true) !== 0x04034b50) throw archiveError();
  const start = entry.offset + 30 + local.getUint16(26, true) + local.getUint16(28, true);
  if (start + entry.packed > file.size) throw archiveError();
  const data = file.slice(start, start + entry.packed);
  if (entry.method === 0) {
    if (entry.packed !== entry.size) throw archiveError();
    return data.text();
  }
  let stream;
  try {
    stream = data.stream().pipeThrough(new DecompressionStream("deflate-raw"));
  } catch {
    throw new Error("Ce navigateur ne peut pas ouvrir le ZIP. Extrais-le et importe ratings.csv.");
  }
  const reader = stream.getReader(), decode = new TextDecoder("utf-8");
  let total = 0;
  const parts: string[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > entry.size) { await reader.cancel(); throw archiveError(); }
      parts.push(decode.decode(value, { stream: true }));
    }
  } catch { throw archiveError(); }
  if (total !== entry.size) throw archiveError();
  parts.push(decode.decode());
  return parts.join("");
}

function usernameFromProfile(content: string) {
  const rows = csvRows(content);
  const usernameIndex = rows[0]?.findIndex(header => header.trim().toLowerCase() === "username") ?? -1;
  const username = rows[1]?.[usernameIndex]?.trim();
  return username && /^[a-zA-Z0-9_-]{1,64}$/.test(username) ? username : undefined;
}

export async function importProfile(file: File, fallbackName: string): Promise<Profile> {
  if (!file.size) throw new Error("Le fichier sélectionné est vide.");
  const zip = /\.zip$/i.test(file.name);
  const fallback = fallbackName.trim() || "Profil importé";
  let name = fallback;
  let complete = false;
  let diary: DiaryEntry[] | undefined;
  let films: Film[];
  if (zip) {
    const entries = await zipFiles(file);
    const watched = entries.get("watched.csv"), ratings = entries.get("ratings.csv");
    const watchedFilms = watched ? catalog(filmCsv(await readEntry(file, watched)), true) : [];
    const ratedFilms = ratings ? catalog(filmCsv(await readEntry(file, ratings)), false) : [];
    const { matches, used } = matchFilms(watchedFilms, ratedFilms);
    films = watchedFilms.map((film, index) => {
      const match = matches.get(index);
      return match === undefined ? film : { ...film, ...ratedFilms[match] };
    }).concat(ratedFilms.filter((_, i) => !used.has(i)));
    complete = Boolean(watched);
    const journal = entries.get("diary.csv");
    if (journal) {
      diary = parseDiary(filmCsv(await readEntry(file, journal)));
      films = addDiary(films, diary, complete, Boolean(ratings));
    }
    const profile = entries.get("profile.csv");
    let username: string | undefined;
    if (profile && profile.size <= 512 * 1024) {
      try { username = usernameFromProfile(await readEntry(file, profile, 512 * 1024)); }
      catch { /* Profile metadata is optional. The film catalogue remains usable. */ }
    }
    name = username || /^letterboxd-([a-z0-9_-]+?)-\d{4}-\d{2}-\d{2}(?:-|\.)/i.exec(file.name)?.[1] || fallback;
  } else if (/\.csv$/i.test(file.name)) {
    if (file.size > csvLimit) throw new Error("Le CSV dépasse 32 Mo.");
    if (/^(?:watchlist|reviews|profile|comments|likes)\.csv$/i.test(file.name)) {
      throw new Error("Choisissez ratings.csv, watched.csv, diary.csv ou le ZIP complet.");
    }
    const csv = filmCsv(await file.text());
    if (csv.header.includes("review")) throw new Error("Choisissez diary.csv pour lire votre journal de visionnage.");
    if (/^diary\.csv$/i.test(file.name) || csv.header.includes("watched date")) {
      diary = parseDiary(csv);
      films = addDiary([], diary, false, false);
    } else {
      complete = /^watched\.csv$/i.test(file.name);
      films = catalog(csv, complete);
    }
  } else {
    throw new Error("Choisis un export Letterboxd au format ZIP ou CSV.");
  }
  if (!films.length) throw new Error("Ce fichier ne contient encore aucun film à comparer.");
  return { source: "export", name, films, complete, ...(diary ? { diary } : {}) };
}
