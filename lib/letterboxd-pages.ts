import { FeedError, profileName } from './rss';
import { letterboxdConfigured, letterboxdGet } from './letterboxd-client';
import type { DiaryEntry, Film } from './compare';

type RecordValue = Record<string, unknown>;
const lidPattern = /^[a-zA-Z0-9]{1,64}$/;

function malformed(): never {
  throw new FeedError(502, 'invalid_history', 'Letterboxd a renvoyé des données incomplètes. Réessayez la comparaison.');
}

function record(value: unknown): RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return malformed();
  return value as RecordValue;
}

function lid(value: unknown): string {
  if (typeof value !== 'string' || !lidPattern.test(value)) return malformed();
  return value;
}

function rating(value: unknown) {
  if (value == null) return null;
  if (typeof value !== 'number' || value < 0.5 || value > 5 || !Number.isInteger(value * 2)) return malformed();
  return value;
}

function page(value: unknown) {
  const {items, next} = record(value);
  if (!Array.isArray(items)) return malformed();
  if (next != null && (typeof next !== 'string' || !next.length || next.length > 4096)) return malformed();
  return {items: items as unknown[], next: (next ?? null) as string | null};
}

function filmInfo(film: RecordValue, stars: unknown): Film & { lid: string } {
  if (typeof film.name !== 'string' || !film.name.trim()) return malformed();
  const year = film.releaseYear;
  if (year != null && (typeof year !== 'number' || !Number.isInteger(year))) return malformed();
  return {
    lid: lid(film.id),
    title: film.name,
    year: year == null ? '' : String(year),
    rating: rating(stars),
    url: typeof film.link === 'string' ? film.link : undefined,
  };
}

function watchedFilm(row: unknown, member: string) {
  const film = record(row);
  if (!Array.isArray(film.relationships)) return malformed();
  const owner = film.relationships.map(record).find(item => record(item.member).id === member);
  if (!owner) return malformed();
  const relationship = record(owner.relationship);
  if (relationship.memberId !== member || relationship.productionId !== film.id || relationship.watched !== true) return malformed();
  const details = filmInfo(film, relationship.rating);
  return {key: details.lid, ...details};
}

function diaryEntry(row: unknown, member: string): DiaryEntry & {key: string} {
  const log = record(row);
  if (record(log.owner).id !== member) return malformed();
  const {diaryDate, rewatch} = record(log.diaryDetails);
  if (typeof diaryDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(diaryDate) || typeof rewatch !== 'boolean') return malformed();
  const timestamp = Date.parse(diaryDate);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== diaryDate) return malformed();
  const production = record(log.film ?? log.production);
  // A non-film ProductionSummary need only carry its LID. The log's own public
  // description keeps that session identifiable even when no title is exposed.
  const summary = typeof production.name === 'string' && production.name.trim()
    ? production : {...production, name: log.name};
  return {key: lid(log.id), film: filmInfo(summary, log.rating), watchedDate: diaryDate, rewatch};
}

async function resolveMember(name: string, knownId: string | null, signal: AbortSignal) {
  if (knownId !== null) {
    if (!lidPattern.test(knownId)) throw new FeedError(400, 'invalid_member', 'Identifiant de profil incorrect.');
    const profile = record(await letterboxdGet('/member/' + knownId, new URLSearchParams(), signal));
    if (profile.id !== knownId || typeof profile.username !== 'string' || profile.username.toLowerCase() !== name) {
      throw new FeedError(409, 'member_changed', 'Le pseudo a changé. Relancez la comparaison avec le pseudo actuel.');
    }
    return knownId;
  }
  const search = new URLSearchParams({input: name, include: 'MemberSearchItem', searchMethod: 'Autocomplete', perPage: '100'});
  const cursors = new Set<string>();
  do {
    const results = page(await letterboxdGet('/search', search, signal));
    for (const row of results.items) {
      const hit = record(row);
      const member = record(hit.member ?? hit);
      if (typeof member.username !== 'string') return malformed();
      if (member.username.toLowerCase() === name) return lid(member.id);
    }
    if (!results.next) break;
    if (cursors.has(results.next)) return malformed();
    cursors.add(results.next);
    search.set('cursor', results.next);
  } while (true);
  throw new FeedError(404, 'not_found', 'Ce pseudo est introuvable dans les profils accessibles à l’API Letterboxd.');
}

export async function historyPage(input: URLSearchParams, signal: AbortSignal) {
  const name = profileName(input.get('username'));
  const kind = input.get('kind');
  const cursor = input.get('cursor');
  if (kind !== 'films' && kind !== 'diary') throw new FeedError(400, 'invalid_kind', 'Type d’historique incorrect.');
  if (cursor !== null && (!cursor.length || cursor.length > 4096)) throw new FeedError(400, 'invalid_cursor', 'Page d’historique incorrecte.');
  if (!letterboxdConfigured()) {
    throw new FeedError(503, 'history_unavailable', 'L’accès à l’API Letterboxd pour le mode complet n’est pas configuré sur ce site.');
  }
  const member = await resolveMember(name, input.get('member'), signal);
  const params = new URLSearchParams({member, perPage: '100', memberRelationship: kind === 'films' ? 'Watched' : 'Owner'});
  if (cursor) params.set('cursor', cursor);
  if (kind === 'diary') {
    params.append('where', 'HasDiaryDate');
    params.append('where', 'NoDrafts');
    params.set('sort', 'Date');
    params.set('excludeMemberFilmRelationships', 'true');
  } else {
    params.set('sort', 'DateLatestFirst');
  }
  const data = page(await letterboxdGet(kind === 'diary' ? '/log-entries' : '/films', params, signal));
  const items = kind === 'diary'
    ? data.items.map(item => diaryEntry(item, member))
    : data.items.map(item => watchedFilm(item, member));
  return {name, member, kind, items, next: data.next};
}
