const letterboxdOrigin = 'https://letterboxd.com';
const maxFeedBytes = 6 * 1024 * 1024;

export type FeedFilm = {
  title: string;
  year: string;
  rating: number | null;
  id?: string;
  url?: string;
  tmdb?: string;
  poster?: string;
};

export class FeedError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function profileName(value: string | null): string {
  let name = value?.trim() || '';
  const profileLink = /^(?:https?:\/\/)?(?:www\.)?letterboxd\.com\/([a-z\d_]+)\/?(?:[?#][^\s]*)?$/i.exec(name);
  if (profileLink) name = profileLink[1];
  name = name.replace(/^@/, '').toLowerCase();
  if (!/^[a-z\d_]{1,40}$/.test(name)) {
    throw new FeedError(400, 'invalid_username', 'Saisis un pseudo Letterboxd ou le lien de son profil.');
  }
  return name;
}

function invalidFeed() {
  return new FeedError(502, 'invalid_feed', 'Letterboxd n’a pas renvoyé de journal lisible. Réessaie ou importe ton export.');
}

const entities: Record<string,string> = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' };
function decodeEntities(text: string): string {
  return text.replace(/&(amp|quot|apos|lt|gt|#x[\da-fA-F]+|#\d+);/g, (match, entity: string) => {
    if (entity[0] !== '#') return entities[entity];
    const codePoint = entity[1] === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return codePoint > 0 && codePoint <= 0x10ffff && (codePoint < 0xd800 || codePoint > 0xdfff)
      ? String.fromCodePoint(codePoint) : match;
  });
}

function canonicalFilm(link: string): string | undefined {
  try {
    const url = new URL(link);
    if (url.origin !== letterboxdOrigin || url.username || url.password) return;
    const slug = /^\/(?:[a-z\d_]+\/)?film\/([a-z\d%_-]+)(?:\/\d+)?\/?$/i.exec(url.pathname)?.[1];
    if (slug) return `${letterboxdOrigin}/film/${slug}/`;
  } catch { /* An entry can have metadata without a usable link. */ }
}

function posterUrl(description: string): string | undefined {
  const src = /<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/i.exec(description)?.[1];
  if (!src) return;
  try {
    const url = new URL(decodeEntities(src));
    if (url.origin === 'https://a.ltrbxd.com' && url.pathname.startsWith('/resized/film-poster/') && !url.username && !url.password) return url.href;
  } catch { /* Some entries have no poster. */ }
}

const fields = new Set(['letterboxd:filmtitle', 'letterboxd:filmyear', 'letterboxd:memberrating', 'tmdb:movieid', 'link', 'description']);
function toFilm(item: Record<string,string>): FeedFilm | undefined {
  const title = item['letterboxd:filmtitle']?.trim();
  if (!title) return;
  const year = item['letterboxd:filmyear']?.trim() || '';
  const ratingText = item['letterboxd:memberrating']?.trim() || '';
  const value = Number(ratingText);
  const rating = value >= 0.5 && value <= 5 && Number.isInteger(value * 2) ? value : null;
  const url = canonicalFilm(item.link || '');
  const tmdb = item['tmdb:movieid']?.trim();
  return {
    title, year: /^\d{4}$/.test(year) ? year : '', rating,
    id: url, url, tmdb: /^\d+$/.test(tmdb || '') ? tmdb : undefined,
    poster: posterUrl(item.description || ''),
  };
}

// Read immediate RSS item fields only. Reviews and list descriptions contain arbitrary HTML
// in CDATA; their markup must never be interpreted as diary entries or metadata.
export function parseFeed(xml: string, name: string) {
  const films: FeedFilm[] = [];
  const seen = new Set<string>();
  const path: string[] = [];
  let item: Record<string,string> | undefined;
  let field: string | undefined;
  let closedChannel = false;
  const tokens = /<!\[CDATA\[([\s\S]*?)\]\]>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<([^<>]+)>|([^<]+)/g;
  for (const token of xml.matchAll(tokens)) {
    const [, cdata, tag, text] = token;
    if (tag === undefined) {
      if (item && field && (cdata !== undefined || text !== undefined)) {
        item[field] += cdata !== undefined ? cdata : decodeEntities(text);
      }
      continue;
    }
    const tagName = /^\/?([\w:-]+)/.exec(tag)?.[1].toLowerCase();
    if (!tagName) throw invalidFeed();
    if (tag.startsWith('/')) {
      if (path.pop() !== tagName) throw invalidFeed();
      if (item && path.length === 3) field = undefined;
      if (tagName === 'item' && path.length === 2 && item) {
        const film = toFilm(item);
        if (film) {
          const key = film.id || film.tmdb || `${film.title.toLowerCase()}|${film.year}`;
          if (!seen.has(key)) { seen.add(key); films.push(film); }
        }
        item = undefined;
      }
      if (tagName === 'channel' && path.length === 1 && path[0] === 'rss') closedChannel = true;
    } else if (!tag.endsWith('/')) {
      if (path.length === 0 && tagName !== 'rss') throw invalidFeed();
      if (path.length === 2 && path[1] === 'channel' && tagName === 'item') item = {};
      if (item && path.length === 3 && fields.has(tagName)) {
        field = tagName;
        item[field] = '';
      }
      path.push(tagName);
    }
  }
  if (path.length || !closedChannel) throw invalidFeed();
  return {name, source: 'rss' as const, films, complete: false as const};
}

async function readFeed(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw invalidFeed();
  let size = 0;
  let text = '';
  const decoder = new TextDecoder();
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) return text + decoder.decode();
      size += value.byteLength;
      if (size > maxFeedBytes) {
        await reader.cancel();
        throw invalidFeed();
      }
      text += decoder.decode(value, {stream:true});
    }
  } finally {
    reader.releaseLock();
  }
}

export async function loadPublicProfile(name: string, requestFeed: typeof fetch = fetch) {
  const nameChecked = profileName(name);
  let url = new URL(`/${nameChecked}/rss/`, letterboxdOrigin);
  const signal = AbortSignal.timeout(14000);
  try {
    for (let i = 0; i < 3; i++) {
      const response = await requestFeed(url.href, {
        redirect:'manual', signal, headers: {Accept: 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8'},
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const next = new URL(response.headers.get('location') || '/', url);
        if (next.origin !== letterboxdOrigin || next.username || next.password || !/^\/[a-z\d_]+\/rss\/?$/i.test(next.pathname) || next.search) throw invalidFeed();
        url = next;
        continue;
      }
      if (response.status === 404 || response.status === 410) throw new FeedError(404, 'not_found', 'Profil introuvable. Vérifie le pseudo Letterboxd.');
      if (response.status === 429) throw new FeedError(429, 'rate_limited', 'Letterboxd reçoit trop de demandes. Réessaie dans un moment ou importe ton export.');
      if ([401, 403, 451].includes(response.status)) throw new FeedError(403, 'unavailable', 'Letterboxd ne donne pas accès à ce flux. Tu peux utiliser un export du profil.');
      if (!response.ok) throw invalidFeed();
      return parseFeed(await readFeed(response), nameChecked);
    }
    throw invalidFeed();
  } catch (error) {
    if (error instanceof FeedError) throw error;
    if (signal.aborted) throw new FeedError(504, 'timeout', 'Letterboxd met du temps à répondre. Réessaie ou importe ton export.');
    throw new FeedError(502, 'network', 'Impossible de joindre Letterboxd. Réessaie ou importe ton export.');
  }
}
