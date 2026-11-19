import type { DiaryEntry, Film, Profile } from './compare';

type HistoryKind = 'diary' | 'films';

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isFilm(value: unknown): value is Film {
  return record(value) && typeof value.title === 'string' && value.title.trim() !== ''
    && typeof value.year === 'string'
    && (value.rating === null || (typeof value.rating === 'number'
      && value.rating >= 0.5 && value.rating <= 5 && Number.isInteger(value.rating * 2)));
}

function isDiaryEntry(value: unknown): value is DiaryEntry {
  return record(value) && isFilm(value.film) && typeof value.rewatch === 'boolean'
    && (value.watchedDate === null || (typeof value.watchedDate === 'string'
      && /^\d{4}-\d{2}-\d{2}$/.test(value.watchedDate)));
}

const incomplete = () => new Error('Lecture interrompue. Impossible de confirmer que l’historique est complet.');

export async function loadHistoryProfile(
  handle: string,
  signal: AbortSignal,
  onProgress?: (count: number) => void,
): Promise<Profile> {
  let member: string | undefined;
  const diary = new Map<string, DiaryEntry>();
  const films = new Map<string, Film>();

  async function readSeries(kind: HistoryKind) {
    const cursors = new Set<string>();
    let cursor: string | null = null;
    let rowsRead = 0;
    do {
      signal.throwIfAborted();
      const params = new URLSearchParams({username: handle, kind});
      if (member) params.set('member', member);
      if (cursor !== null) params.set('cursor', cursor);
      const response = await fetch('/api/profile/history?' + params, {signal, cache: 'no-store'});
      const page: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(record(page) && typeof page.error === 'string' ? page.error : incomplete().message);
      }
      if (!record(page) || page.kind !== kind || typeof page.name !== 'string'
        || page.name.toLowerCase() !== handle.toLowerCase() || typeof page.member !== 'string'
        || !page.member || (member && page.member !== member) || !Array.isArray(page.items)
        || (page.next !== null && (typeof page.next !== 'string' || !page.next))) throw incomplete();
      member = page.member;
      rowsRead += page.items.length;
      // Letterboxd documents a hard cap on each paginated query. A capped result
      // cannot establish that the final record of the member was reached.
      if (rowsRead >= 100_000) {
        throw new Error('La limite de pagination de Letterboxd est atteinte. La couverture complète de ce profil ne peut pas être confirmée.');
      }
      for (const item of page.items) {
        if (!record(item) || typeof item.key !== 'string' || !item.key) throw incomplete();
        const key = item.key;
        if (kind === 'diary' && isDiaryEntry(item)) diary.set(key, item);
        else if (kind === 'films' && isFilm(item)) films.set(key, item);
        else throw incomplete();
      }
      onProgress?.(diary.size + films.size);
      cursor = page.next;
      if (cursor !== null) {
        if (cursors.has(cursor)) throw incomplete();
        cursors.add(cursor);
      }
    } while (cursor !== null);
  }

  await readSeries('diary');
  await readSeries('films');
  signal.throwIfAborted();
  return {name: handle, films: [...films.values()], diary: [...diary.values()], source: 'api', complete: true};
}
