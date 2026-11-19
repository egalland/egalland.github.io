'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { AtSign, Check, ChevronDown, ExternalLink, FileArchive, Film as FilmIcon, Info, Layers, Play, Star, Upload, Users } from 'lucide-react';
import { compareProfiles, importProfile, type Film, type Profile } from '@/lib/compare';
import { demoProfiles, demoHistoryProfiles } from '@/lib/demo';
import { HistoryView } from './history';
import { readLocalFeed } from '@/lib/local-feed';
import { loadHistoryProfile } from '@/lib/load-history';
import './comparator.css';

type Pair = [Profile, Profile];
type Mode = 'history' | 'rss' | 'export';
const MODE_PARAM: Record<Mode, string> = { history: 'historique', rss: 'recent', export: 'import' };
type ResultsTab = 'common' | 'agreements' | 'differences' | 'recommendations' | 'history';
const SIDES = [0, 1] as const;
const PAGE_SIZE = 15;
const PROFILE_HINTS = ['Ex. davidehrlich', 'Ex. demiadejuyigbe'];

function username(value: string) {
  const raw = value.trim().replace(/^@/, '');
  if (/^[a-z\d_]{1,40}$/i.test(raw)) return raw.toLowerCase();
  try {
    const url = new URL(raw.includes('://') ? raw : `https://${raw}`);
    const match = url.pathname.match(/^\/([a-z\d_]{1,40})\/?$/i);
    if (/^https?:$/.test(url.protocol) && /^(www\.)?letterboxd\.com$/i.test(url.hostname) && !url.port && !url.username && !url.password && match) return match[1].toLowerCase();
  } catch { /* A clear field error is shown below. */ }
  return '';
}

function replaced<T>(pair: [T, T], side: 0 | 1, value: T): [T, T] {
  return side === 0 ? [value, pair[1]] : [pair[0], value];
}

function LocalFeedPicker({ handle, side, open, file, onToggle, onFile }: {
  handle: string;
  side: 0 | 1;
  open: boolean;
  file: File | null;
  onToggle: () => void;
  onFile: (file: File | null) => void;
}) {
  const prompt = `dp-rss-${side}`;
  return <div className="dp-feed-picker">
    <button type="button" className="dp-rss-toggle" aria-expanded={open} aria-controls={prompt} onClick={onToggle}>
      {file ? <Check size={14} aria-hidden="true"/> : <ChevronDown size={14} aria-hidden="true"/>}
      {file ? 'Journal RSS sélectionné' : 'Importer un journal RSS'}
      <span className="dp-sr"> pour {handle}</span>
    </button>
    <div id={prompt} className="dp-rss-panel" hidden={!open}>
      <a href={`https://letterboxd.com/${encodeURIComponent(handle)}/rss/`} target="_blank" rel="noopener noreferrer">
        Ouvrir le journal RSS <ExternalLink size={13} aria-hidden="true"/><span className="dp-sr"> de {handle}</span>
      </a>
      <p>Enregistrez la page au format XML depuis votre navigateur, puis choisissez le fichier ici.</p>
      <label className="dp-rss-select">
        <Upload size={15} aria-hidden="true"/><span>{file ? file.name : 'Choisir le journal téléchargé'}</span>
        <input type="file" accept=".xml,.rss,application/rss+xml,application/xml,text/xml" aria-label={`Choisir le journal téléchargé de ${handle}`}
          onChange={event => { const selected = event.currentTarget.files?.[0]; if (selected) onFile(selected); event.currentTarget.value = ''; }} />
      </label>
      {file && <button type="button" className="dp-rss-remove" onClick={() => onFile(null)}>Retirer le fichier</button>}
    </div>
  </div>;
}

async function fetchProfile(handle: string, signal: AbortSignal): Promise<Profile> {
  const response = await fetch(`/api/profile?username=${encodeURIComponent(handle)}`, { signal });
  const payload: unknown = await response.json().catch(() => null);
  const data = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
  if (!response.ok || typeof data.name !== 'string' || !Array.isArray(data.films)) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Le journal public est indisponible. Réessayez ou comparez les exports.');
  }
  return { name: data.name, source: 'rss', complete: false, films: data.films as Film[] };
}

function plural(count: number, singular: string, many: string) {
  return `${count.toLocaleString('fr-FR')} ${count > 1 ? many : singular}`;
}

function Rating({ film }: { film: Film }) {
  return film.rating === null ? <span className="dp-unnamed-rating" aria-label="Sans note">—</span> : <span className="dp-rating"><Star size={13} fill="currentColor" aria-hidden="true" />{film.rating.toLocaleString('fr-FR', { minimumFractionDigits: 1 })}<span className="dp-sr"> sur 5</span></span>;
}

function FilmTitle({ film }: { film: Film }) {
  let href: string | undefined;
  if (film.url) {
    try {
      const url = new URL(film.url);
      if (url.protocol === 'https:' && /^(letterboxd\.com|www\.letterboxd\.com|boxd\.it)$/i.test(url.hostname)) href = url.href;
    } catch { /* Display the plain film title for unknown URLs. */ }
  }
  return <span className="dp-film-name">{href ? <a href={href} target="_blank" rel="noopener noreferrer">{film.title}</a> : <strong>{film.title}</strong>}{film.year && <small>{film.year}</small>}</span>;
}

function Results({ profiles }: { profiles: Pair }) {
  const [a, b] = profiles;
  const comparison = useMemo(() => compareProfiles(a, b), [a, b]);
  const hasDiary = profiles.some(profile => profile.diary !== undefined);
  const showHistoryTab = hasDiary || a.source === 'export';
  const [tab, setTab] = useState<ResultsTab>(hasDiary ? 'history' : 'common');
  const [direction, setDirection] = useState<0 | 1>(1);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const differences = useMemo(() => comparison.differences.filter(({ a, b }) => a.rating !== b.rating), [comparison]);
  const pairs = tab === 'common' ? comparison.common : tab === 'agreements' ? comparison.agreements : differences;
  const suggestions = direction === 1 ? comparison.fromA : comparison.fromB;
  const recipient = profiles[direction];
  const donor = profiles[direction === 0 ? 1 : 0];
  const total = tab === 'recommendations' ? suggestions.length : pairs.length;
  const demo = a.source === 'demo';
  const tabs: [ResultsTab, string][] = [['common','Films en commun'], ['agreements','Accords'], ['differences','Désaccords'], ['recommendations','À découvrir']];
  if (showHistoryTab) tabs.unshift(['history', 'Chronologie']);
  const resultLabel = {
    api: 'Historique public des films · complet',
    rss: 'Activité récente uniquement',
    export: a.complete && b.complete ? 'Catalogues complets importés' : 'Données importées',
    demo: 'Exemple · profils fictifs',
  }[a.source];
  const coverageText = {
    api: 'La comparaison inclut les films vus et les séances publiques de films des deux profils. Chaque film compte une fois dans le score, même après plusieurs séances.',
    rss: 'Le score utilise uniquement les dernières entrées des deux flux. Des films plus anciens ou simplement marqués comme vus peuvent manquer.',
    export: a.complete && b.complete ? 'Les deux exports incluent la liste des films marqués comme vus.' : 'Les résultats portent sur les films présents dans les fichiers fournis. Un fichier de notes seul couvre uniquement les films notés.',
    demo: '',
  }[a.source];
  const empty = tab === 'common' ? 'Aucun film en commun dans les données comparées.' : tab === 'agreements' ? 'Il faut au moins un film que vous avez tous les deux noté.' : tab === 'differences' ? (comparison.ratedCount ? 'Vous avez attribué les mêmes notes à tous vos films co-notés.' : 'Aucun film co-noté à comparer.') : `Aucun film à proposer à ${recipient.name} avec ces données.`;
  return <div className="dp-output">
    <div className="dp-results-head"><div className="dp-results-names"><span>{a.name}</span><i> & </i><span>{b.name}</span></div><span className="dp-source">{resultLabel}</span></div>
    <div className="dp-stats">
      <div className="dp-stat dp-stat-main"><strong>{comparison.score === null ? '—' : <>{comparison.score}<small> %</small></>}</strong><span>Affinité des notes</span></div>
      <div className="dp-stat"><strong>{comparison.commonCount.toLocaleString('fr-FR')}</strong><span>{comparison.commonCount > 1 ? 'Films en commun' : 'Film en commun'}</span></div>
      <div className="dp-stat"><strong>{comparison.ratedCount.toLocaleString('fr-FR')}</strong><span>{comparison.ratedCount > 1 ? 'Films co-notés' : 'Film co-noté'}</span></div>
    </div>
    <details className="dp-score-method"><summary><Info size={15} aria-hidden="true"/>Comprendre ce résultat<ChevronDown size={15} aria-hidden="true"/></summary><div><p>Le score mesure la proximité de vos notes sur les films co-notés. Des notes identiques donnent 100 %. Chaque demi-étoile d’écart moyen retire environ 11 points.</p><p>{a.name} · {plural(a.films.length,'film','films')} dans la comparaison. {b.name} · {plural(b.films.length,'film','films')}.</p>{!demo && <p>{coverageText}</p>}</div></details>
    {comparison.ratedCount < 5 && <p className="dp-sample">{comparison.ratedCount === 0 ? 'Aucun score d’affinité sans film co-noté.' : `Le score repose sur ${plural(comparison.ratedCount, 'film co-noté', 'films co-notés')}. Il peut beaucoup évoluer.`}</p>}
    <div className="dp-results-nav" aria-label="Vues de comparaison" role="group">{tabs.map(([key,label]) => <button type="button" aria-pressed={tab === key} onClick={() => {setTab(key); setVisible(PAGE_SIZE);}} key={key}>{label}</button>)}</div>
    {tab === 'history' ? <HistoryView profiles={profiles}/> : <>
    {tab === 'recommendations' ? <div className="dp-reco-intro"><div className="dp-for" aria-label="Destinataire" role="group">{SIDES.map(i => <button type="button" key={i} aria-pressed={direction === i} onClick={() => {setDirection(i); setVisible(PAGE_SIZE);}}>Pour {profiles[i].name}</button>)}</div><p>Films notés au moins 3,5/5 par {donor.name} et absents des données de {recipient.name}.</p></div> : <p className="dp-list-note">{tab === 'common' ? 'Les films présents dans vos deux profils, avec vos notes sur cinq.' : tab === 'agreements' ? 'Vos films co-notés, du plus petit au plus grand écart.' : 'Les films sur lesquels vos notes s’éloignent le plus, par écart décroissant.'}</p>}
    {total > 0 ? <div className="dp-film-table-wrap"><table className="dp-film-table"><thead><tr><th scope="col">Film</th>{tab === 'recommendations' ? <th scope="col">{donor.name}</th> : <><th scope="col">{a.name}</th><th scope="col">{b.name}</th></>}</tr></thead><tbody>{tab === 'recommendations' ? suggestions.slice(0,visible).map((film,i) => <tr key={`${film.title}-${film.year}-${i}`}><td><FilmTitle film={film}/></td><td><Rating film={film}/></td></tr>) : pairs.slice(0,visible).map((pair,i) => <tr key={`${pair.a.title}-${pair.a.year}-${i}`}><td><FilmTitle film={pair.a}/></td><td><Rating film={pair.a}/></td><td><Rating film={pair.b}/></td></tr>)}</tbody></table></div> : <div className="dp-empty"><FilmIcon size={23} aria-hidden="true"/><span>{empty}</span></div>}
    {total > visible && <button type="button" className="dp-more" onClick={() => setVisible(v => v + PAGE_SIZE)}>Afficher {Math.min(PAGE_SIZE,total-visible)} de plus <ChevronDown size={16} aria-hidden="true"/></button>}
    </>}
  </div>;
}

export default function Comparator({ initialMode = 'history', historyAvailable = false }: {
  initialMode?: Mode;
  historyAvailable?: boolean;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [handles, setHandles] = useState<[string,string]>(['','']);
  const [files, setFiles] = useState<[File | null, File | null]>([null,null]);
  const [feeds, setFeeds] = useState<[File | null, File | null]>([null,null]);
  const [feedOpen, setFeedOpen] = useState<[boolean, boolean]>([false,false]);
  const partial = useRef<[Profile | null, Profile | null]>([null,null]);
  const names = handles.map(username);
  const [errors, setErrors] = useState<[string,string]>(['','']);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<[number, number]>([0, 0]);
  const [profiles, setProfiles] = useState<Pair | null>(null);
  const [revision, setRevision] = useState(0);
  const controller = useRef<AbortController | null>(null);
  const output = useRef<HTMLElement>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const submission = useRef(0);
  useEffect(() => () => { submission.current += 1; controller.current?.abort(); }, []);
  useEffect(() => { if (revision && output.current) { output.current.focus({preventScroll:true}); output.current.scrollIntoView({block:'start', behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'}); } }, [revision]);

  const historyUnavailable = mode === 'history' && !historyAvailable;

  function resetPending() {
    submission.current += 1;
    controller.current?.abort();
    setLoading(false);
    setProfiles(null);
    setErrors(['','']);
  }
  function toggleMode(next: Mode) {
    if (next === mode) return;
    resetPending();
    partial.current = [null, null];
    setMode(next);
    const url = new URL(window.location.href);
    url.searchParams.set('mode', MODE_PARAM[next]);
    window.history.replaceState(window.history.state, '', url);
  }
  function showExample() { resetPending(); setProfiles(mode === 'rss' ? demoProfiles : demoHistoryProfiles); setRevision(v => v + 1); }
  function changeHandle(side: 0 | 1, value: string) {
    resetPending();
    if (username(value) !== names[side]) {
      setFeeds(previous => replaced(previous, side, null));
      setFeedOpen(previous => replaced(previous, side, false));
      partial.current[side] = null;
    }
    setHandles(previous => replaced(previous, side, value));
  }

  function checkManualHandle(side: 0 | 1) {
    if (!historyUnavailable) return;
    if (handles[side].trim() && !names[side]) {
      setErrors(previous => replaced(previous, side, 'Saisissez un pseudo Letterboxd ou le lien de son profil.'));
    } else if (names[side] && names[0] === names[1]) {
      setErrors(previous => replaced(previous, side, 'Choisissez deux profils différents pour voir leurs films en commun.'));
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (historyUnavailable) return;
    resetPending();
    const current = submission.current;
    const fieldErrors: [string,string] = ['',''];
    for (const i of SIDES) {
      if (mode !== 'export' && !names[i]) fieldErrors[i] = 'Saisissez un pseudo Letterboxd ou le lien de son profil.';
      if (mode === 'export' && !files[i]) fieldErrors[i] = 'Choisissez un fichier ZIP ou CSV pour ce profil.';
    }
    if (mode !== 'export' && names[0] && names[0] === names[1]) fieldErrors[1] = 'Choisissez un deuxième profil différent.';
    if (fieldErrors.some(Boolean)) {
      setErrors(fieldErrors);
      inputs.current[fieldErrors[0] ? 0 : 1]?.focus();
      return;
    }
    setLoading(true);
    setCounts([0, 0]);
    const request = new AbortController();
    controller.current = request;
    async function loadSide(side: 0 | 1) {
      if (mode === 'export') return importProfile(files[side]!, `Profil ${side === 0 ? 'A' : 'B'}`);
      if (mode === 'history') {
        return loadHistoryProfile(names[side], request.signal, count => {
          if (current === submission.current) setCounts(previous => replaced(previous, side, count));
        });
      }
      if (feeds[side]) return readLocalFeed(feeds[side], names[side]);
      return partial.current[side] ?? fetchProfile(names[side], request.signal);
    }
    const results = await Promise.allSettled(SIDES.map(loadSide));
    if (current !== submission.current || request.signal.aborted) return;
    setLoading(false);
    for (const i of SIDES) {
      const result = results[i];
      if (result.status === 'rejected') {
        fieldErrors[i] = result.reason instanceof Error && result.reason.message !== 'Failed to fetch' ? result.reason.message : 'La connexion a échoué. Réessayez dans un instant.';
        if (mode === 'rss') setFeedOpen(previous => replaced(previous, i, true));
      }
      if (result.status === 'fulfilled' && mode === 'rss' && !feeds[i]) partial.current[i] = result.value;
    }
    if (fieldErrors.some(Boolean)) {
      setErrors(fieldErrors);
      inputs.current[fieldErrors[0] ? 0 : 1]?.focus();
      return;
    }
    if (results[0].status === 'fulfilled' && results[1].status === 'fulfilled') {
      partial.current = [null,null];
      setProfiles([results[0].value, results[1].value]);
      setRevision(v => v + 1);
    }
  }

  return <>
    <section className="dp-comparator" id="comparateur" aria-labelledby="dp-form-title">
      <div className="dp-form-top">
        <h2 id="dp-form-title">Comparer deux profils</h2>
        <div className="dp-modes" role="group" aria-label="Mode de comparaison">
          <button type="button" aria-pressed={mode === 'history'} onClick={() => toggleMode('history')}><Users size={16} aria-hidden="true"/>Historique complet</button>
          <button type="button" aria-pressed={mode === 'rss'} onClick={() => toggleMode('rss')}>Activité récente</button>
          <button type="button" aria-pressed={mode === 'export'} onClick={() => toggleMode('export')}><Upload size={16} aria-hidden="true"/>Importer</button>
        </div>
      </div>
      {historyUnavailable && <div className="dp-history-unavailable" role="status">
        <Info size={19} aria-hidden="true"/>
        <div><strong>Comparaison complète par pseudo indisponible</strong>
          <p>Ce site n’a pas accès à l’API Letterboxd. Saisissez vos deux pseudos pour ouvrir vos journaux et retrouver vos films en commun sur Letterboxd.</p>
        </div>
      </div>}
      {mode === 'export' && <div className="dp-history-import-intro">
        <p>Choisissez <strong>le ZIP de chaque profil</strong> pour comparer tous les films marqués comme vus et parcourir les deux journaux de visionnage.</p>
        <a href="https://letterboxd.com/user/exportdata/" target="_blank" rel="noopener noreferrer">Télécharger mon export Letterboxd <ExternalLink size={13} aria-hidden="true"/></a>
      </div>}
      <form onSubmit={submit} noValidate className="dp-form" aria-busy={loading}>
        <div className={historyUnavailable ? 'dp-field-row dp-field-row-manual' : 'dp-field-row'}>{SIDES.map(i => <div className={`dp-field dp-side-${i}`} key={i}>
          <label className="dp-label" htmlFor={`dp-field-${i}`}><span className="dp-side-dot" aria-hidden="true"/>{i === 0 ? 'Premier profil' : 'Deuxième profil'}</label>
          {mode !== 'export' ? <div className={`dp-input-box ${errors[i] ? 'dp-invalid' : ''}`}>
            <AtSign size={17} aria-hidden="true"/>
            <input id={`dp-field-${i}`} ref={el => { inputs.current[i] = el; }} type="text"
              placeholder={PROFILE_HINTS[i]} value={handles[i]} autoCapitalize="none" autoCorrect="off"
              autoComplete="off" spellCheck={false} aria-invalid={Boolean(errors[i])}
              aria-describedby={errors[i] ? `dp-error-${i}` : undefined}
              onChange={e => changeHandle(i, e.target.value)} onBlur={() => checkManualHandle(i)}/>
          </div> : <div className={`dp-file-box ${errors[i] ? 'dp-invalid' : ''}`}>
            <input type="file" id={`dp-field-${i}`} ref={el => { inputs.current[i] = el; }}
              accept=".zip,.csv" aria-invalid={Boolean(errors[i])} aria-describedby={errors[i] ? `dp-error-${i}` : undefined}
              onChange={e => {
                const file = e.target.files?.[0] ?? null;
                resetPending();
                setFiles(previous => replaced(previous, i, file));
              }}/>
            <span aria-hidden="true">{files[i] ? <Check size={17}/> : <FileArchive size={17}/>}<span>{files[i]?.name || 'Choisir un ZIP ou CSV'}</span></span>
          </div>}
          {mode === 'history' && names[i] && <a className="dp-diary-link" href={`https://letterboxd.com/${encodeURIComponent(names[i])}/diary/`} target="_blank" rel="noopener noreferrer">Journal de @{names[i]} <ExternalLink size={14} aria-hidden="true"/></a>}
          {errors[i] && <div className="dp-error" id={`dp-error-${i}`} role="alert">{errors[i]}</div>}
          {mode === 'rss' && names[i] && <LocalFeedPicker handle={names[i]} side={i} open={feedOpen[i]} file={feeds[i]}
            onToggle={() => setFeedOpen(previous => replaced(previous, i, !previous[i]))}
            onFile={file => { resetPending(); partial.current[i] = null; setFeeds(previous => replaced(previous, i, file)); }} />}
        </div>)}{!historyUnavailable && <button type="submit" className="dp-submit" disabled={loading}>{loading ? <span className="dp-spinner" aria-hidden="true"/> : <Layers size={18} aria-hidden="true"/>}{loading ? 'Chargement…' : mode === 'rss' ? 'Comparer le récent' : 'Comparer'}</button>}</div>
      </form>
      {historyUnavailable && names[0] && names[1] && names[0] !== names[1] &&
        <section className="dp-shared-films" aria-labelledby="dp-shared-title">
          <h3 id="dp-shared-title">Films en commun sur Letterboxd</h3>
          <p>Choisissez le compte auquel vous êtes connecté sur Letterboxd pour voir tous les films que vous avez tous les deux marqués comme vus. Cette liste compte chaque film une fois et ne détaille pas les séances.</p>
          <div className="dp-shared-links">{SIDES.map(side =>
            <a key={side} href={`https://letterboxd.com/${encodeURIComponent(names[1 - side])}/films/?filters=show-watched`} target="_blank" rel="noopener noreferrer">
              Je suis @{names[side]} <ExternalLink size={14} aria-hidden="true"/>
            </a>)}</div>
        </section>}
      {mode === 'history' && loading && <p className="dp-api-progress" role="status">Lecture en cours · {names.map((name, i) => `@${name} · ${plural(counts[i], 'entrée lue', 'entrées lues')}`).join(' / ')}</p>}
      <div className="dp-form-foot">
        {mode === 'history' && historyAvailable && <p><Info size={15} aria-hidden="true"/><span>La comparaison couvre les films marqués comme vus et toutes les séances publiques de films, revisionnages compris.</span></p>}
        {mode === 'rss' && <p><Info size={15} aria-hidden="true"/><span>Le flux RSS couvre les dernières entrées de chaque journal.</span></p>}
        {mode === 'export' && <p><FileArchive size={15} aria-hidden="true"/><span>Les fichiers restent sur votre appareil. Un CSV seul compare uniquement ce qu’il contient.</span></p>}
        <button type="button" onClick={showExample} className="dp-demo"><Play size={13} fill="currentColor" aria-hidden="true"/>Voir un exemple</button>
      </div>
    </section>
    {profiles && <section className="dp-comparison-result" id="resultats" ref={output} tabIndex={-1} aria-label="Résultat de la comparaison"><Results key={revision} profiles={profiles}/></section>}
  </>;
}
