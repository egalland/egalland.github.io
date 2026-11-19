'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { AtSign, Check, ChevronDown, ExternalLink, FileArchive, Film as FilmIcon, Info, Layers, Play, Star, Upload, Users } from 'lucide-react';
import { compareProfiles, importProfile, type Film, type Profile } from '@/lib/compare';
import { demoProfiles } from '@/lib/demo';
import './comparator.css';

type Pair = [Profile, Profile];
type Mode = 'rss' | 'export';
type ResultsTab = 'common' | 'agreements' | 'differences' | 'recommendations';
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
  throw new Error('Saisissez un pseudo Letterboxd ou le lien de son profil.');
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
  const [tab, setTab] = useState<ResultsTab>('common');
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
  const empty = tab === 'common' ? 'Aucun film en commun dans les données comparées.' : tab === 'agreements' ? 'Il faut au moins un film que vous avez tous les deux noté.' : tab === 'differences' ? (comparison.ratedCount ? 'Vous avez attribué les mêmes notes à tous vos films co-notés.' : 'Aucun film co-noté à comparer.') : `Aucun film à proposer à ${recipient.name} avec ces données.`;
  return <div className="dp-output">
    <div className="dp-results-head"><div className="dp-results-names"><span>{a.name}</span><i> & </i><span>{b.name}</span></div><span className="dp-source">{demo ? 'Exemple · profils fictifs' : a.source === 'rss' ? 'Journaux publics récents' : 'Exports Letterboxd'}</span></div>
    <div className="dp-stats">
      <div className="dp-stat dp-stat-main"><strong>{comparison.score === null ? '—' : <>{comparison.score}<small> %</small></>}</strong><span>Affinité des notes</span></div>
      <div className="dp-stat"><strong>{comparison.commonCount.toLocaleString('fr-FR')}</strong><span>{comparison.commonCount > 1 ? 'Films en commun' : 'Film en commun'}</span></div>
      <div className="dp-stat"><strong>{comparison.ratedCount.toLocaleString('fr-FR')}</strong><span>{comparison.ratedCount > 1 ? 'Films co-notés' : 'Film co-noté'}</span></div>
    </div>
    <details className="dp-score-method"><summary><Info size={15} aria-hidden="true"/>Comprendre ce résultat<ChevronDown size={15} aria-hidden="true"/></summary><div><p>Le score mesure la proximité de vos notes sur les films co-notés. Des notes identiques donnent 100 %. Chaque demi-étoile d’écart moyen retire environ 11 points.</p><p>{a.name} · {plural(a.films.length,'film','films')} dans la comparaison. {b.name} · {plural(b.films.length,'film','films')}.</p>{!demo && <p>{a.source === 'rss' ? 'Les pseudos donnent accès aux entrées récentes des journaux publics. Les films plus anciens ou simplement marqués comme vus peuvent manquer.' : a.complete && b.complete ? 'Les deux exports incluent la liste des films marqués comme vus.' : 'Les résultats portent sur les films présents dans les fichiers fournis. Un fichier de notes seul couvre uniquement les films notés.'}</p>}</div></details>
    {comparison.ratedCount < 5 && <p className="dp-sample">{comparison.ratedCount === 0 ? 'Aucun score d’affinité sans film co-noté.' : `Le score repose sur ${plural(comparison.ratedCount, 'film co-noté', 'films co-notés')}. Il peut beaucoup évoluer.`}</p>}
    <div className="dp-results-nav" aria-label="Vues de comparaison" role="group">{tabs.map(([key,label]) => <button type="button" aria-pressed={tab === key} onClick={() => {setTab(key); setVisible(PAGE_SIZE);}} key={key}>{label}</button>)}</div>
    {tab === 'recommendations' ? <div className="dp-reco-intro"><div className="dp-for" aria-label="Destinataire" role="group">{SIDES.map(i => <button type="button" key={i} aria-pressed={direction === i} onClick={() => {setDirection(i); setVisible(PAGE_SIZE);}}>Pour {profiles[i].name}</button>)}</div><p>Films notés au moins 3,5/5 par {donor.name} et absents des données de {recipient.name}.</p></div> : <p className="dp-list-note">{tab === 'common' ? 'Les films présents dans vos deux profils, avec vos notes sur cinq.' : tab === 'agreements' ? 'Vos films co-notés, du plus petit au plus grand écart.' : 'Les films sur lesquels vos notes s’éloignent le plus, par écart décroissant.'}</p>}
    {total > 0 ? <div className="dp-film-table-wrap"><table className="dp-film-table"><thead><tr><th scope="col">Film</th>{tab === 'recommendations' ? <th scope="col">{donor.name}</th> : <><th scope="col">{a.name}</th><th scope="col">{b.name}</th></>}</tr></thead><tbody>{tab === 'recommendations' ? suggestions.slice(0,visible).map((film,i) => <tr key={`${film.title}-${film.year}-${i}`}><td><FilmTitle film={film}/></td><td><Rating film={film}/></td></tr>) : pairs.slice(0,visible).map((pair,i) => <tr key={`${pair.a.title}-${pair.a.year}-${i}`}><td><FilmTitle film={pair.a}/></td><td><Rating film={pair.a}/></td><td><Rating film={pair.b}/></td></tr>)}</tbody></table></div> : <div className="dp-empty"><FilmIcon size={23} aria-hidden="true"/><span>{empty}</span></div>}
    {total > visible && <button type="button" className="dp-more" onClick={() => setVisible(v => v + PAGE_SIZE)}>Afficher {Math.min(PAGE_SIZE,total-visible)} de plus <ChevronDown size={16} aria-hidden="true"/></button>}
  </div>;
}

export default function Comparator() {
  const [mode, setMode] = useState<Mode>('rss');
  const [handles, setHandles] = useState<[string,string]>(['','']);
  const [files, setFiles] = useState<[File | null, File | null]>([null,null]);
  const [errors, setErrors] = useState<[string,string]>(['','']);
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Pair | null>(null);
  const [revision, setRevision] = useState(0);
  const controller = useRef<AbortController | null>(null);
  const output = useRef<HTMLElement>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const submission = useRef(0);
  useEffect(() => () => { submission.current += 1; controller.current?.abort(); }, []);
  useEffect(() => { if (revision && output.current) { output.current.focus({preventScroll:true}); output.current.scrollIntoView({block:'start', behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'}); } }, [revision]);

  function resetPending() { submission.current += 1; controller.current?.abort(); setLoading(false); setErrors(['','']); }
  function toggleMode(next: Mode) { if (next !== mode) { resetPending(); setMode(next); } }
  function showExample() { resetPending(); setProfiles([demoProfiles[0],demoProfiles[1]]); setRevision(v => v + 1); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetPending();
    const current = submission.current;
    const fieldErrors: [string,string] = ['',''];
    const names: [string,string] = ['',''];
    for (const i of SIDES) {
      try { if (mode === 'rss') names[i] = username(handles[i]); else if (!files[i]) throw new Error('Choisissez un fichier ZIP ou CSV pour ce profil.'); }
      catch (error) { fieldErrors[i] = error instanceof Error ? error.message : 'Vérifiez ce profil.'; }
    }
    if (mode === 'rss' && names[0] && names[0] === names[1]) fieldErrors[1] = 'Choisissez un deuxième profil différent.';
    if (fieldErrors.some(Boolean)) { setErrors(fieldErrors); inputs.current[fieldErrors[0] ? 0 : 1]?.focus(); return; }
    setLoading(true);
    const request = new AbortController(); controller.current = request;
    const results = await Promise.allSettled(SIDES.map(i => mode === 'rss' ? fetchProfile(names[i], request.signal) : importProfile(files[i]!, `Profil ${i === 0 ? 'A' : 'B'}`)));
    if (current !== submission.current || request.signal.aborted) return;
    setLoading(false);
    for (const i of SIDES) {
      const result = results[i];
      if (result.status === 'rejected') fieldErrors[i] = result.reason instanceof Error && result.reason.message !== 'Failed to fetch' ? result.reason.message : 'La connexion a échoué. Réessayez dans un instant.';
    }
    if (fieldErrors.some(Boolean)) { setErrors(fieldErrors); inputs.current[fieldErrors[0] ? 0 : 1]?.focus(); return; }
    if (results[0].status === 'fulfilled' && results[1].status === 'fulfilled') {
      setProfiles([results[0].value, results[1].value]); setRevision(v => v + 1);
    }
  }

  return <>
    <section className="dp-comparator" id="comparateur" aria-labelledby="dp-form-title">
      <div className="dp-form-top"><h2 id="dp-form-title">Comparer deux profils</h2><div className="dp-modes" role="group" aria-label="Source des profils"><button type="button" aria-pressed={mode === 'rss'} onClick={() => toggleMode('rss')}><Users size={16} aria-hidden="true"/>Pseudos</button><button type="button" aria-pressed={mode === 'export'} onClick={() => toggleMode('export')}><Upload size={16} aria-hidden="true"/>Exports</button></div></div>
      <form onSubmit={submit} noValidate className="dp-form" aria-busy={loading}>
        <div className="dp-field-row">{SIDES.map(i => <div className={`dp-field dp-side-${i}`} key={i}>
          <label className="dp-label" htmlFor={`dp-field-${i}`}><span className="dp-side-dot" aria-hidden="true"/>{i === 0 ? 'Premier profil' : 'Deuxième profil'}</label>
          {mode === 'rss' ? <div className={`dp-input-box ${errors[i] ? 'dp-invalid' : ''}`}><AtSign size={17} aria-hidden="true"/><input id={`dp-field-${i}`} ref={el => {inputs.current[i]=el;}} type="text" placeholder={PROFILE_HINTS[i]} value={handles[i]} autoCapitalize="none" autoCorrect="off" autoComplete="off" spellCheck={false} aria-invalid={Boolean(errors[i])} aria-describedby={errors[i] ? `dp-error-${i}` : undefined} onChange={e => { resetPending(); const next: [string,string] = [...handles]; next[i]=e.target.value; setHandles(next); }}/></div> : <div className={`dp-file-box ${errors[i] ? 'dp-invalid' : ''}`}><input type="file" id={`dp-field-${i}`} ref={el => {inputs.current[i]=el;}} accept=".zip,.csv" aria-invalid={Boolean(errors[i])} aria-describedby={errors[i] ? `dp-error-${i}` : undefined} onChange={e => {resetPending(); const next: [File|null, File|null] = [...files]; next[i]=e.target.files?.[0] ?? null; setFiles(next);}}/><span aria-hidden="true">{files[i] ? <Check size={17}/> : <FileArchive size={17}/>}<span>{files[i]?.name || 'Choisir un ZIP ou CSV'}</span></span></div>}
          {errors[i] && <div className="dp-error" id={`dp-error-${i}`} role="alert">{errors[i]}</div>}
        </div>)}<button type="submit" className="dp-submit" disabled={loading}>{loading ? <span className="dp-spinner" aria-hidden="true"/> : <Layers size={18} aria-hidden="true"/>}{loading ? 'Comparaison…' : 'Comparer'}</button></div>
      </form>
      <div className="dp-form-foot"><p>{mode === 'rss' ? <><Info size={15} aria-hidden="true"/><span>Les pseudos comparent vos journaux récents. Pour tout l’historique, utilisez les exports.</span></> : <><FileArchive size={15} aria-hidden="true"/><span>ZIP Letterboxd ou CSV des films vus ou notés. Traitement sur votre appareil. <a href="https://letterboxd.com/user/exportdata/" target="_blank" rel="noopener noreferrer">Obtenir un export <ExternalLink size={12} aria-hidden="true"/></a></span></>}</p><button type="button" onClick={showExample} className="dp-demo"><Play size={13} fill="currentColor" aria-hidden="true"/>Voir un exemple</button></div>
    </section>
    {profiles && <section className="dp-comparison-result" id="resultats" ref={output} tabIndex={-1} aria-label="Résultat de la comparaison"><Results key={revision} profiles={profiles}/></section>}
  </>;
}
