'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, Repeat2 } from 'lucide-react';
import type { DiaryEntry, Profile } from '@/lib/compare';
import './history.css';

const PAGE_SIZE = 25;
const formatDate = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const formatNumber = new Intl.NumberFormat('fr-FR');

type Session = {
  entry: DiaryEntry;
  side: number;
  index: number;
};

function ProfileLabel({ side, name }: { side: number; name: string }) {
  return <span className="history-profile"><i data-side={side} aria-hidden="true" />{name}</span>;
}

function plural(count: number, singular: string, pluralForm: string) {
  return formatNumber.format(count) + ' ' + (count > 1 ? pluralForm : singular);
}

export function HistoryView({ profiles }: { profiles: [Profile, Profile] }) {
  const [a, b] = profiles;
  const [profileFilter, setProfileFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const duplicate = a.name.trim().toLowerCase() === b.name.trim().toLowerCase();
  const labels = duplicate ? [a.name + ' (profil A)', b.name + ' (profil B)'] : [a.name, b.name];

  const sessions = useMemo(() => {
    const merged: Session[] = [];
    [a, b].forEach((profile, side) => {
      profile.diary?.forEach((entry, index) => merged.push({ entry, side, index }));
    });
    return merged.sort((left, right) =>
      (right.entry.watchedDate ?? '').localeCompare(left.entry.watchedDate ?? ''));
  }, [a, b]);

  const personalSessions = useMemo(() =>
    sessions.filter(session => profileFilter === 'all' || String(session.side) === profileFilter),
  [sessions, profileFilter]);
  const years = useMemo(() =>
    [...new Set(personalSessions.map(({entry}) => entry.watchedDate?.slice(0, 4) ?? ''))],
  [personalSessions]);
  const filtered = useMemo(() =>
    personalSessions.filter(({entry}) => yearFilter === 'all' || (entry.watchedDate?.slice(0, 4) ?? '') === yearFilter),
  [personalSessions, yearFilter]);
  const rewatches = useMemo(() => filtered.reduce((total, {entry}) => total + Number(entry.rewatch), 0), [filtered]);
  const visible = filtered.slice(0, limit);

  return <section className="dp-history" aria-label="Journal des séances">
    <div className="history-toolbar">
      <h3>Journal des séances</h3>
      {sessions.length > 0 && <div className="history-filters">
        <label>Profil
          <span className="history-select">
            <select value={profileFilter} onChange={event => {
              setProfileFilter(event.target.value);
              setYearFilter('all');
              setLimit(PAGE_SIZE);
            }}>
              <option value="all">Les deux profils</option>
              {labels.map((name, side) => <option key={side} value={String(side)}>{name}</option>)}
            </select>
            <ChevronDown size={16} aria-hidden="true" />
          </span>
        </label>
        <label>Année de visionnage
          <span className="history-select">
            <select value={yearFilter} onChange={event => {
              setYearFilter(event.target.value);
              setLimit(PAGE_SIZE);
            }}>
              <option value="all">Toutes les années</option>
              {years.map(year => <option key={year} value={year}>{year || 'Sans date'}</option>)}
            </select>
            <ChevronDown size={16} aria-hidden="true" />
          </span>
        </label>
      </div>}
    </div>
    {profiles.map((profile, side) => {
      if (profileFilter !== 'all' && profileFilter !== String(side)) return null;
      if (profile.diary?.length) return null;
      return <p key={side} className="history-coverage">
        <ProfileLabel side={side} name={labels[side]} />{' · '}
        {profile.diary ? 'Le journal fourni est vide.' : 'Journal absent. Pour afficher les séances, importez le ZIP contenant diary.csv ou ce CSV seul.'}
      </p>;
    })}
    <p className="history-count" role="status">
      {plural(filtered.length, 'séance', 'séances')} <span>·</span> {plural(rewatches, 'revisionnage marqué', 'revisionnages marqués')}
    </p>
    {visible.length > 0 && <ol className="history-rows" aria-label="Séances de la plus récente à la plus ancienne">
      {visible.map(({entry, side, index}) => {
        const {film, watchedDate, rewatch} = entry;
        return <li key={side + '-' + index}>
          <span className="history-date">{watchedDate
            ? <time dateTime={watchedDate}>{formatDate.format(new Date(watchedDate + 'T00:00:00Z'))}</time>
            : 'Sans date'}</span>
          <div className="history-film">
            <strong>{film.title}</strong>
            <div className="history-metadata">
              {film.year && <span>Sortie {film.year}</span>}
              {rewatch && <span className="history-repeat"><Repeat2 size={14} aria-hidden="true" />Revu</span>}
            </div>
          </div>
          <ProfileLabel side={side} name={labels[side]} />
          <span className="history-rating">{film.rating === null
            ? <span className="history-unrated">Sans note</span>
            : <><span aria-hidden="true">★ </span>{formatNumber.format(film.rating)}<small>/5</small></>}</span>
        </li>;
      })}
    </ol>}
    {visible.length < filtered.length && <button type="button" className="dp-more" onClick={() => setLimit(limit + PAGE_SIZE)}>
      Afficher {plural(Math.min(PAGE_SIZE, filtered.length - limit), 'séance de plus', 'séances de plus')}
      <ChevronDown size={16} aria-hidden="true"/>
    </button>}
  </section>;
}
