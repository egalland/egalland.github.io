"use strict";
const KEY = 'petites-victoires-milestones-v2', MAX = 1_000_000_000;
const $ = (id) => document.getElementById(id);
const input = (id) => $(id);
const dialog = (id) => $(id);
const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);
const dateLabel = (s) => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(s));
const esc = (s) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const emptyData = () => ({ version: 2, tracks: [], logs: [], reduced: false });
const integer = (n, min = 0) => typeof n === 'number' && Number.isSafeInteger(n) && n >= min && n <= MAX;
const textOK = (s, max, min = 0) => typeof s === 'string' && s.trim().length >= min && s.length <= max;
const isoOK = (s) => typeof s === 'string' && /^\d{4}-\d\d-\d\dT/.test(s) && !isNaN(Date.parse(s));
function validate(raw) { const d = raw; if (!d || d.version !== 2 || !Array.isArray(d.tracks) || !Array.isArray(d.logs) || d.tracks.length > 40 || d.logs.length > 20000 || typeof d.reduced !== 'boolean')
    throw Error('Ce fichier n’est pas une sauvegarde de parcours valide.'); const ids = new Set(); for (const t of d.tracks) {
    if (!t || !textOK(t.id, 100, 1) || ids.has(t.id) || !textOK(t.name, 60, 1) || !textOK(t.unit, 25, 1) || !['ticket', 'bolt', 'rocket', 'heart', 'mountain'].includes(t.icon) || !integer(t.value) || !Array.isArray(t.thresholds) || !t.thresholds.length || t.thresholds.length > 8 || !t.thresholds.every((v, i) => integer(v, 1) && (i === 0 || v > t.thresholds[i - 1])) || !t.earned || typeof t.earned !== 'object' || Array.isArray(t.earned))
        throw Error('Un parcours contient des données invalides.');
    if (t.designs !== undefined) {
        if (!t.designs || typeof t.designs !== 'object' || Array.isArray(t.designs))
            throw Error('Styles de médailles invalides.');
        for (const [k, v] of Object.entries(t.designs)) {
            if (!t.thresholds.includes(Number(k)) || String(Number(k)) !== k || !v || !['shield', 'round', 'star', 'crystal', 'crown', 'hexagon'].includes(v.shape) || !['ticket', 'bolt', 'rocket', 'heart', 'mountain'].includes(v.icon))
                throw Error('Un style de médaille est invalide.');
        }
    }
    ids.add(t.id);
    for (const [k, v] of Object.entries(t.earned)) {
        if (!t.thresholds.includes(Number(k)) || String(Number(k)) !== k || !isoOK(v))
            throw Error('Une médaille contient des données invalides.');
    }
    if (t.thresholds.some(n => n <= t.value && !t.earned[String(n)]))
        throw Error('La progression et les médailles de ce fichier sont incohérentes.');
} const logIds = new Set(); for (const l of d.logs) {
    if (!l || !textOK(l.id, 100, 1) || logIds.has(l.id) || !textOK(l.trackId, 100, 1) || !textOK(l.name, 60, 1) || !isoOK(l.at) || !integer(l.from) || !integer(l.to) || !['create', 'add', 'set', 'edit'].includes(l.kind) || !textOK(l.note, 160) || !Array.isArray(l.awards) || l.awards.length > 8 || !l.awards.every(n => integer(n, 1)))
        throw Error('L’historique contient des données invalides.');
    logIds.add(l.id);
} return structuredClone(d); }
let data = emptyData(), blocked = false, demo = null, selected = '', filter = 'all', editing = null, detail = null, view = 'collection';
function active() { return demo ?? data; }
function current() { return active().tracks.find(t => t.id === selected) ?? active().tracks[0]; }
function notify(message, error = false) { $('notice').hidden = false; $('notice').textContent = message; $('notice').classList.toggle('error', error); }
try {
    const raw = localStorage.getItem(KEY);
    if (raw)
        data = validate(JSON.parse(raw));
}
catch {
    blocked = true;
    notify('Le stockage est indisponible ou le carnet est illisible. Vos données existantes sont conservées. Restaurez une sauvegarde depuis les réglages ou autorisez le stockage.', true);
}
function commit(next, restoring = false) { if (demo && !restoring) {
    demo = next;
    return true;
} try {
    if (blocked && !restoring)
        throw Error();
    localStorage.setItem(KEY, JSON.stringify(next));
    data = next;
    blocked = false;
    return true;
}
catch {
    notify('Enregistrement impossible. Votre progression n’a pas changé. Autorisez le stockage du navigateur, puis réessayez.', true);
    return false;
} }
const tiers = [{ name: 'Cuivre', title: 'Première étincelle', light: '#ffd7ad', mid: '#b4764b', dark: '#633c2d', glow: '#bc7c3b44' }, { name: 'Argent', title: 'Dans le rythme', light: '#eaf6ff', mid: '#9faec6', dark: '#465671', glow: '#93b1d438' }, { name: 'Or', title: 'Pilier du parcours', light: '#fff0b4', mid: '#d6ad50', dark: '#78501f', glow: '#e0ac4944' }, { name: 'Obsidienne', title: 'Légende en marche', light: '#e0caff', mid: '#a287dc', dark: '#392a62', glow: '#a17afb44' }, { name: 'Émeraude', title: 'Force tranquille', light: '#b7ffe1', mid: '#59bc95', dark: '#255d50', glow: '#50d4a438' }, { name: 'Saphir', title: 'Toujours plus loin', light: '#bde4ff', mid: '#609be2', dark: '#2c436e', glow: '#5f9be638' }, { name: 'Rubis', title: 'Rien ne vous arrête', light: '#ffd3df', mid: '#dd7b9a', dark: '#6d304c', glow: '#df658c38' }, { name: 'Astral', title: 'Au-delà des étoiles', light: '#fff9d6', mid: '#d7bf9a', dark: '#61516f', glow: '#e7b9f044' }];
const tier = (i) => tiers[i % tiers.length];
const emblems = { ticket: '<path d="M-25-16h50v10a7 7 0 0 0 0 14v10h-50V8a7 7 0 0 0 0-14z"/><path d="M6-14v28" stroke-dasharray="3 4"/>', bolt: '<path d="M5-30-21 4H-3l-3 27L22-7H3z"/>', rocket: '<path d="M-9 10c-14-17 0-36 20-40 8 20 4 42-15 45zM-9-6l-14 7 9 15M5 13l-1 17 14-12M-13 20l-7 10"/><circle cx="5" cy="-12" r="5"/>', heart: '<path d="M0 24C-51-9-14-37 0-16 14-37 51-9 0 24z"/>', mountain: '<path d="M-30 23-7-22l13 26 9-17 21 36zM-16-4l9 7 7-10"/>' };
let artId = 0;
function medal(t, index, mini = false) {
    const v = tier(index), id = 'm' + (++artId);
    const design = t.designs?.[String(t.thresholds[index])] ?? { shape: 'shield', icon: t.icon };
    const ring = design.shape === 'star' ? 10 : index >= 3 ? 12 : 8;
    let rays = '', leaves = '';
    for (let i = 0; i < ring; i++)
        rays += `<path d="M0-94 5-73-5-73z" transform="translate(120 112) rotate(${i * 360 / ring})" fill="url(#${id}metal)" stroke="${v.dark}" stroke-width=".5"/>`;
    for (let i = 0; i < 6; i++) {
        leaves += `<ellipse cx="${67 - i * 3}" cy="${103 + i * 11}" rx="5" ry="11" transform="rotate(${-35 - i * 4} ${67 - i * 3} ${103 + i * 11})"/><ellipse cx="${173 + i * 3}" cy="${103 + i * 11}" rx="5" ry="11" transform="rotate(${35 + i * 4} ${173 + i * 3} ${103 + i * 11})"/>`;
    }
    const outline = shapePath(design.shape);
    const plate = `<path d="${outline}" fill="url(#${id}metal)" stroke="${v.light}" stroke-width="1.2"/><path d="${outline}" transform="translate(120 112) scale(.88) translate(-120 -112)" fill="url(#${id}core)" stroke="${v.dark}" stroke-width="2"/><path d="${outline}" transform="translate(120 112) scale(.80) translate(-120 -112)" fill="url(#${id}shine)" stroke="${v.mid}" stroke-opacity=".7" stroke-width="1"/>`;
    return `<svg class="medal-svg" viewBox="0 0 240 240" aria-hidden="true"><defs><linearGradient id="${id}metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${v.dark}"/><stop offset=".25" stop-color="${v.light}"/><stop offset=".5" stop-color="${v.mid}"/><stop offset=".72" stop-color="${v.light}"/><stop offset="1" stop-color="${v.dark}"/></linearGradient><linearGradient id="${id}core" x1="0" y1="0" x2=".9" y2="1"><stop stop-color="#303849"/><stop offset=".5" stop-color="#131829"/><stop offset="1" stop-color="${v.dark}"/></linearGradient><radialGradient id="${id}shine"><stop stop-color="${v.light}" stop-opacity=".2"/><stop offset="1" stop-color="${v.mid}" stop-opacity="0"/></radialGradient></defs><path d="M77 157 67 226l32-15 22 20 7-69M121 162l-5 69 28-19 27 13-10-68" fill="${v.dark}" stroke="${v.mid}" stroke-width="1.4"/><path d="m83 170-7 39 20-9 12 12 6-41m20 0-4 41 16-12 15 9-7-39" fill="${v.mid}" opacity=".25"/>${rays}<g fill="url(#${id}metal)" opacity=".85">${leaves}</g>${plate}<circle cx="120" cy="107" r="39" fill="#090d1a55" stroke="${v.mid}" stroke-width=".7"/><circle cx="120" cy="107" r="33" fill="none" stroke="${v.mid}" stroke-opacity=".25" stroke-dasharray="1 5"/><g transform="translate(120 106)" fill="${v.mid}" stroke="${v.light}" stroke-width="1.7" stroke-linejoin="round">${emblems[design.icon]}</g><path d="m120 145 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="url(#${id}metal)"/><path d="M78 70 116 52M72 83l-4 27" stroke="${v.light}" stroke-width="2" stroke-opacity=".55" fill="none"/><path d="M173 120q-5 30-35 45" stroke="${v.mid}" stroke-opacity=".6" fill="none"/><path d="M171 49v14m-7-7h14" stroke="${v.light}" stroke-width="1.6" opacity=".8"/></svg>`;
}
const shapeNames = { shield: 'Blason', round: 'Sceau rond', star: 'Étoile', crystal: 'Cristal', crown: 'Couronne', hexagon: 'Hexagone' };
let designDraft = { shape: 'shield', icon: 'ticket' };
function shapePath(shape) {
    if (shape === 'round')
        return 'M120 34a78 78 0 1 1 0 156 78 78 0 1 1 0-156z';
    if (shape === 'crystal')
        return 'M120 20 183 70 173 148 120 198 67 148 57 70z';
    if (shape === 'crown')
        return 'M48 58 87 85 120 29 153 85 192 58 177 166 120 187 63 166z';
    if (shape === 'hexagon')
        return 'M120 26 192 69 192 151 120 194 48 151 48 69z';
    if (shape === 'star') {
        let d = '';
        for (let i = 0; i < 10; i++) {
            const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 54 : 88;
            d += `${i ? 'L' : 'M'}${120 + Math.cos(a) * r} ${112 + Math.sin(a) * r} `;
        }
        return d + 'z';
    }
    return 'M120 33 180 61 189 119q-4 48-69 76-65-28-69-76l9-58z';
}
function previewDesign(t, index, shape = designDraft.shape) { const copy = structuredClone(t); copy.designs = { ...copy.designs, [String(t.thresholds[index])]: { shape, icon: designDraft.icon } }; return medal(copy, index); }
function renderDesignChoices(t, index) { $('design-choices').innerHTML = Object.keys(shapeNames).map(shape => `<button type="button" class="design-choice" data-design="${shape}" aria-pressed="${shape === designDraft.shape}" aria-label="Forme : ${shapeNames[shape]}"><span>${previewDesign(t, index, shape)}</span><b>${shapeNames[shape]}</b></button>`).join(''); }
function updateDesignPreview() { const t = active().tracks.find(t => t.id === detail?.trackId); if (!t || !detail)
    return; const index = t.thresholds.indexOf(detail.threshold); $('detail-art').innerHTML = previewDesign(t, index); document.querySelectorAll('[data-design]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.design === designDraft.shape))); $('design-status').textContent = 'Aperçu uniquement. Enregistrez pour garder ce choix.'; }
$('design-choices').addEventListener('click', ev => { const button = ev.target.closest('[data-design]'); if (!button)
    return; designDraft.shape = button.dataset.design; updateDesignPreview(); });
$('design-icon').onchange = () => { designDraft.icon = $('design-icon').value; const t = active().tracks.find(t => t.id === detail?.trackId); if (t && detail) {
    renderDesignChoices(t, t.thresholds.indexOf(detail.threshold));
    updateDesignPreview();
} };
$('design-save').onclick = () => { if (!detail)
    return; const next = structuredClone(active()), t = next.tracks.find(t => t.id === detail?.trackId); if (!t || !t.thresholds.includes(detail.threshold)) {
    $('design-status').textContent = 'Ce palier n’existe plus. Fermez puis rouvrez la collection.';
    return;
} t.designs = { ...t.designs, [String(detail.threshold)]: structuredClone(designDraft) }; if (!commit(next)) {
    $('design-status').textContent = 'Choix non enregistré : stockage indisponible. Vous pouvez réessayer.';
    return;
} render(); $('design-status').textContent = demo ? 'Choix appliqué dans la démo uniquement.' : 'Votre médaille est personnalisée et enregistrée.'; notify(demo ? 'Apparence modifiée dans la démo.' : 'Apparence de la médaille enregistrée.'); };
function applyMotion() { document.documentElement.classList.toggle('reduced', data.reduced); input('reduced').checked = data.reduced; }
function render() {
    cancelAnimationFrame(countAnimation);
    const d = active();
    if (!d.tracks.some(t => t.id === selected))
        selected = d.tracks[0]?.id ?? '';
    const t = current();
    $('demo-banner').hidden = !demo;
    $('demo-toggle').textContent = demo ? 'Quitter la démo' : 'Essayer la démo';
    $('awards-count').textContent = String(d.tracks.reduce((n, t) => n + Object.keys(t.earned).length, 0)).padStart(2, '0');
    $('track-select').innerHTML = d.tracks.length ? d.tracks.map(t => `<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('') : '<option>Aucun parcours</option>';
    $('track-select').value = selected;
    $('track-select').disabled = !t;
    $('edit-track').hidden = !t;
    $('active-track').hidden = !t;
    $('empty-state').hidden = !!t;
    if (t) {
        const next = t.thresholds.find(n => !t.earned[String(n)]) ?? t.thresholds[t.thresholds.length - 1];
        const idx = t.thresholds.indexOf(next), complete = t.thresholds.every(n => t.earned[String(n)]);
        const ratio = Math.min(1, t.value / next);
        $('stage-eyebrow').textContent = complete ? 'TOUS LES CAPS SONT ATTEINTS' : 'VOTRE PROCHAINE MÉDAILLE';
        $('next-title').textContent = complete ? 'Une collection qui vous ressemble.' : `${tier(idx).title}.`;
        $('next-description').textContent = complete ? 'Votre progression continue. Ajoutez de nouveaux paliers dans « Personnaliser ».' : `Le cap des ${fmt(next)} ${t.unit}. Chaque pas vous en rapproche.`;
        $('current-value').textContent = fmt(t.value);
        $('target-value').textContent = complete ? t.unit : `/ ${fmt(next)} ${t.unit}`;
        $('progress-fill').style.width = `${ratio * 100}%`;
        $('progressbar').setAttribute('aria-valuemax', String(next));
        $('progressbar').setAttribute('aria-valuenow', String(Math.min(t.value, next)));
        $('progressbar').setAttribute('aria-valuetext', `${fmt(t.value)} sur ${fmt(next)} ${t.unit}`);
        $('progress-remaining').textContent = complete ? 'Tous les trophées sont acquis' : `${fmt(Math.max(0, next - t.value))} ${t.unit} avant le prochain cap`;
        $('progress-percent').textContent = `${Math.floor(ratio * 100)} %`;
        $('hero-art').innerHTML = medal(t, idx);
        $('hero-medal').dataset.threshold = String(next);
        $('hero-medal').setAttribute('aria-label', `Inspecter la médaille ${tier(idx).name} à ${fmt(next)} ${t.unit}`);
        renderMedals(t);
        const earned = Object.entries(t.earned).sort((a, b) => b[1].localeCompare(a[1]));
        $('last-unlock').textContent = earned.length ? `Dernier trophée : ${fmt(Number(earned[0][0]))} ${t.unit} · ${dateLabel(earned[0][1])}` : 'Le prochain cap n’attend que vous.';
        $('bottom-description').textContent = demo ? 'Données fictives. Vos essais restent dans la démo.' : 'Une médaille acquise reste dans votre collection, même après une correction du total.';
    }
    renderHistory();
    applyMotion();
}
function renderMedals(t) { const list = t.thresholds.map((n, i) => ({ n, i, earned: t.earned[String(n)] })).filter(m => filter === 'all' || (filter === 'earned' ? m.earned : !m.earned)); $('medals-grid').innerHTML = list.length ? list.map(({ n, i, earned }) => { const v = tier(i); return `<button class="medal-card ${earned ? 'earned' : 'locked'}" style="--tone:${v.mid};--glow:${v.glow}" data-medal="${n}" aria-label="${v.name}, ${fmt(n)} ${esc(t.unit)}, ${earned ? 'acquise' : 'à conquérir'}"><span class="medal-state"><span>${v.name.toUpperCase()}</span><span>${earned ? '✦ ACQUISE' : '◇ VERROUILLÉE'}</span></span>${medal(t, i, true)}<h3>${v.title}</h3><span class="threshold">${fmt(n)} ${esc(t.unit)}</span>${earned ? `<div class="earned-date">✓ Débloquée le ${dateLabel(earned)}</div>` : `<div class="tiny-progress"><i style="width:${Math.min(100, t.value / n * 100)}%"></i></div><div class="earned-date">Encore ${fmt(Math.max(0, n - t.value))} ${esc(t.unit)}</div>`}</button>`; }).join('') : '<div class="empty-message">Aucune médaille dans ce filtre pour l’instant.<br>Les prochains caps vous attendent.</div>'; }
function renderHistory() { const d = active(); const since = Date.now() - 7 * 86400000; const recent = d.logs.filter(l => Date.parse(l.at) >= since); $('recent-activity').textContent = fmt(recent.length); $('recent-awards').textContent = fmt(recent.reduce((n, l) => n + l.awards.length, 0)); const logs = [...d.logs].sort((a, b) => b.at.localeCompare(a.at)); $('history-list').innerHTML = logs.length ? logs.slice(0, 120).map(l => `<article class="history-item"><span class="history-dot" aria-hidden="true">${l.awards.length ? '✦' : '↗'}</span><div><strong>${esc(l.name)}</strong><p>${l.kind === 'create' ? 'Parcours créé' : l.kind === 'set' ? 'Total corrigé' : l.kind === 'edit' ? 'Parcours personnalisé' : 'Progression ajoutée'} : ${fmt(l.from)} → ${fmt(l.to)}${l.awards.length ? ` · Médaille${l.awards.length > 1 ? 's' : ''} : ${l.awards.map(fmt).join(', ')}` : ''}</p>${l.note ? `<p>${esc(l.note)}</p>` : ''}</div><time datetime="${esc(l.at)}">${dateLabel(l.at)} · ${new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(l.at))}</time></article>`).join('') + (logs.length > 120 ? '<p class="subtle">Les 120 dernières actions sont affichées. L’export contient tout l’historique conservé.</p>' : '') : '<div class="empty-message">Le début d’une belle collection.<br>Vos mises à jour et déblocages apparaîtront ici.</div>'; }
function showView(next) { view = next; $('collection-view').hidden = next !== 'collection'; $('history-view').hidden = next !== 'history'; for (const name of ['collection', 'history']) {
    $(name + '-tab').classList.toggle('active', name === next);
    $(name + '-tab').setAttribute('aria-pressed', String(name === next));
} if (next === 'history')
    renderHistory(); }
function errorAt(id, message) { $(id).hidden = false; $(id).textContent = message; }
function award(t, now) { const got = t.thresholds.filter(n => n <= t.value && !t.earned[String(n)]); for (const n of got)
    t.earned[String(n)] = now; return got; }
function appendLog(d, t, from, kind, awards, note = '') { d.logs.push({ id: crypto.randomUUID(), trackId: t.id, name: t.name, at: new Date().toISOString(), from, to: t.value, kind, note, awards }); d.logs = d.logs.slice(-20000); }
function update(value, mode, note = '') { const old = current(); if (!old)
    return false; const n = mode === 'add' ? old.value + value : value; if (!integer(n) || (mode === 'add' && value <= 0))
    return false; const next = structuredClone(active()), t = next.tracks.find(t => t.id === old.id); t.value = n; const awards = award(t, new Date().toISOString()); appendLog(next, t, old.value, mode, awards, note); if (!commit(next))
    return false; render(); animateNumber(old.value, n); notify(`${demo ? 'Démo · ' : ''}${fmt(n)} ${t.unit} ${demo ? 'dans la démo' : 'enregistrés'}.${awards.length ? ` ${awards.length} nouvelle(s) médaille(s) débloquée(s) !` : ''}`); if (awards.length)
    showCelebration(t, awards, false);
else
    burst(innerWidth * .5, innerHeight * .45, tier(0).mid, 24); return true; }
let countAnimation = 0;
function animateNumber(from, to) { cancelAnimationFrame(countAnimation); if (reducedMotion())
    return; const start = performance.now(); function step(now) { const p = Math.min(1, (now - start) / 650); $('current-value').textContent = fmt(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)))); if (p < 1)
    countAnimation = requestAnimationFrame(step); } countAnimation = requestAnimationFrame(step); }
function openTrack(id, preset = false) { editing = id ?? null; const t = id ? active().tracks.find(t => t.id === id) : null; $('track-dialog-title').textContent = t ? 'Personnalisez votre parcours.' : 'Un nouveau cap à franchir.'; input('track-name').value = t?.name ?? (preset ? 'Tickets Jira résolus' : ''); input('track-unit').value = t?.unit ?? (preset ? 'tickets' : ''); $('track-icon').value = t?.icon ?? 'ticket'; input('track-thresholds').value = t?.thresholds.join(', ') ?? '50, 100, 500, 1000'; input('track-value').value = String(t?.value ?? 0); $('track-error').hidden = true; $('delete-track').hidden = !t; dialog('track-dialog').showModal(); }
function thresholds(raw) { const parts = raw.split(',').map(x => x.trim()); if (!parts.length || parts.length > 8 || parts.some(x => !/^\d+$/.test(x)))
    throw Error('Saisissez de 1 à 8 paliers entiers, séparés par des virgules.'); const values = parts.map(Number).sort((a, b) => a - b); if (values.some(v => !integer(v, 1)) || new Set(values).size !== values.length)
    throw Error('Chaque palier doit être unique, entre 1 et 1 000 000 000.'); return values; }
$('track-form').onsubmit = ev => { ev.preventDefault(); try {
    const name = input('track-name').value.trim(), unit = input('track-unit').value.trim(), raw = input('track-value').value, value = Number(raw), caps = thresholds(input('track-thresholds').value);
    if (!textOK(name, 60, 1) || !textOK(unit, 25, 1))
        throw Error('Renseignez un nom (60 caractères maximum) et une unité (25 maximum).');
    if (!raw || !integer(value))
        throw Error('La valeur actuelle doit être un entier entre 0 et 1 000 000 000.');
    const next = structuredClone(active());
    if (!editing && next.tracks.length >= 40)
        throw Error('Vous pouvez conserver jusqu’à 40 parcours.');
    const old = next.tracks.find(t => t.id === editing);
    const t = { id: old?.id ?? crypto.randomUUID(), name, unit, icon: $('track-icon').value, value, thresholds: caps, designs: Object.fromEntries(Object.entries(old?.designs ?? {}).filter(([n]) => caps.includes(Number(n)))), earned: Object.fromEntries(Object.entries(old?.earned ?? {}).filter(([n]) => caps.includes(Number(n)))) };
    const awards = award(t, new Date().toISOString());
    if (old)
        next.tracks[next.tracks.indexOf(old)] = t;
    else
        next.tracks.push(t);
    appendLog(next, t, old?.value ?? 0, old ? 'edit' : 'create', awards);
    if (!commit(next)) {
        errorAt('track-error', 'Le parcours n’a pas été enregistré. Vérifiez l’accès au stockage puis réessayez.');
        return;
    }
    selected = t.id;
    filter = 'all';
    syncFilters();
    render();
    showView('collection');
    dialog('track-dialog').close();
    notify(`${demo ? 'Démo · ' : ''}Parcours ${old ? 'mis à jour' : 'créé'}${demo ? ' dans la démo' : ' et enregistré'}.`);
    if (awards.length)
        showCelebration(t, awards, false);
}
catch (err) {
    errorAt('track-error', err instanceof Error ? err.message : 'Le parcours est invalide.');
} };
$('update-open').onclick = () => { input('update-value').value = '1'; input('update-value').min = '1'; input('update-note').value = ''; $('update-mode').value = 'add'; $('update-error').hidden = true; dialog('update-dialog').showModal(); };
$('update-mode').onchange = () => { input('update-value').min = $('update-mode').value === 'set' ? '0' : '1'; input('update-value').value = $('update-mode').value === 'set' ? String(current()?.value ?? 0) : '1'; };
$('update-form').onsubmit = ev => { ev.preventDefault(); const mode = $('update-mode').value; const raw = input('update-value').value, n = Number(raw), t = current(); if (!t)
    return; if (!raw || !integer(n, mode === 'add' ? 1 : 0) || !integer(mode === 'add' ? t.value + n : n)) {
    errorAt('update-error', 'Saisissez un entier valide. Le total doit rester entre 0 et 1 000 000 000.');
    return;
} if (update(n, mode, input('update-note').value.trim()))
    dialog('update-dialog').close();
else
    errorAt('update-error', 'La mise à jour n’a pas été enregistrée. Réessayez après avoir vérifié le stockage.'); };
function inspect(n) { const t = current(); if (!t)
    return; const i = t.thresholds.indexOf(n); if (i < 0)
    return; detail = { trackId: t.id, threshold: n }; $('detail-art').innerHTML = medal(t, i); $('detail-tier').textContent = `MÉDAILLE ${tier(i).name.toUpperCase()}`; $('detail-title').textContent = tier(i).title; $('detail-description').textContent = `${t.name} · cap des ${fmt(n)} ${t.unit}`; $('detail-status').textContent = t.earned[String(n)] ? `✓ Acquise le ${dateLabel(t.earned[String(n)])}. Ce cap fait partie de votre histoire.` : `◇ À conquérir · encore ${fmt(Math.max(0, n - t.value))} ${t.unit}. Atteignez ce palier pour débloquer la médaille.`; $('replay-medal').textContent = t.earned[String(n)] ? 'Rejouer l’effet visuel ✧' : 'Aperçu du déblocage ✧'; designDraft = structuredClone(t.designs?.[String(n)] ?? { shape: 'shield', icon: t.icon }); $('design-icon').value = designDraft.icon; renderDesignChoices(t, i); $('design-status').textContent = 'Choisissez la forme et l’emblème de cette médaille.'; dialog('medal-dialog').showModal(); }
function showCelebration(t, awards, preview) { const n = Math.max(...awards), i = t.thresholds.indexOf(n); $('celebration-kind').textContent = preview ? 'APERÇU VISUEL · AUCUNE PROGRESSION MODIFIÉE' : demo ? 'DÉBLOCAGE DANS LA DÉMO' : 'NOUVEAU PALIER ATTEINT'; $('celebration-art').innerHTML = medal(t, Math.max(0, i)); $('celebration-title').textContent = preview ? 'Ça, c’est un hourra.' : 'Hourra !'; $('celebration-text').textContent = preview ? `Voici la célébration du cap des ${fmt(n)} ${t.unit}. Votre compteur et vos médailles restent inchangés.` : `${fmt(n)} ${t.unit}. ${awards.length > 1 ? `${awards.length} médailles débloquées d’un coup.` : tier(i).title + '.'} ${demo ? 'Un beau cap dans la démo.' : 'Votre médaille est enregistrée dans la collection.'}`; $('celebration-close').textContent = preview ? 'Fermer l’aperçu ✧' : 'C’est dans la collection ✦'; dialog('celebration').showModal(); burst(innerWidth / 2, innerHeight / 2, tier(Math.max(0, i)).mid, 90); celebrationParticles(tier(Math.max(0, i)).mid); }
function syncFilters() { document.querySelectorAll('[data-filter]').forEach(b => { b.classList.toggle('active', b.dataset.filter === filter); b.setAttribute('aria-pressed', String(b.dataset.filter === filter)); }); }
function toggleDemo(forceOff = false) { cancelAnimationFrame(countAnimation); if (demo || forceOff) {
    demo = null;
    notify('De retour dans votre espace. Les essais de la démo n’ont pas modifié vos parcours.');
}
else {
    const at = new Date(Date.now() - 86400000).toISOString();
    demo = { version: 2, reduced: data.reduced, tracks: [{ id: 'demo-jira', name: 'Tickets Jira résolus', unit: 'tickets', icon: 'ticket', value: 480, thresholds: [50, 100, 500, 1000], earned: { '50': at, '100': at } }], logs: [{ id: 'demo-event', trackId: 'demo-jira', name: 'Tickets Jira résolus', at, from: 0, to: 480, kind: 'create', note: 'Exemple fictif : essayez +20 pour débloquer le palier 500.', awards: [50, 100] }] };
    notify('Démo activée. Cliquez sur +20 pour vivre le déblocage des 500 tickets.');
} selected = ''; filter = 'all'; syncFilters(); render(); showView('collection'); }
let confirmedAction = null;
function confirmAction(title, message, fn) { $('confirm-title').textContent = title; $('confirm-text').textContent = message; confirmedAction = fn; dialog('confirm-dialog').showModal(); }
$('confirm-cancel').onclick = () => { confirmedAction = null; dialog('confirm-dialog').close(); };
$('confirm-ok').onclick = () => { dialog('confirm-dialog').close(); const fn = confirmedAction; confirmedAction = null; fn?.(); };
$('delete-track').onclick = () => { const id = editing; if (!id)
    return; confirmAction('Supprimer ce parcours ?', 'Ce parcours, ses médailles et son historique seront supprimés. Exportez une sauvegarde pour en garder une copie.', () => { const next = structuredClone(active()); next.tracks = next.tracks.filter(t => t.id !== id); next.logs = next.logs.filter(l => l.trackId !== id); if (commit(next)) {
    dialog('track-dialog').close();
    selected = '';
    render();
    notify('Parcours supprimé.');
}
else
    errorAt('track-error', 'Le parcours n’a pas pu être supprimé.'); }); };
$('collection-tab').onclick = () => showView('collection');
$('history-tab').onclick = () => showView('history');
$('demo-toggle').onclick = () => toggleDemo();
$('demo-exit').onclick = () => toggleDemo(true);
$('track-select').onchange = () => { cancelAnimationFrame(countAnimation); selected = $('track-select').value; render(); };
$('new-track').onclick = () => openTrack();
$('start-custom').onclick = () => openTrack();
$('start-jira').onclick = () => openTrack(undefined, true);
$('edit-track').onclick = () => { const t = current(); if (t)
    openTrack(t.id); };
$('hero-medal').onclick = () => inspect(Number($('hero-medal').dataset.threshold));
$('demo-celebrate').onclick = () => { const t = current(); if (t)
    showCelebration(t, [t.thresholds.find(n => !t.earned[String(n)]) ?? t.thresholds[t.thresholds.length - 1]], true); };
$('replay-medal').onclick = () => { const t = active().tracks.find(t => t.id === detail?.trackId); if (t && detail) {
    dialog('medal-dialog').close();
    showCelebration(t, [detail.threshold], true);
} };
$('celebration-close').onclick = () => dialog('celebration').close();
document.querySelectorAll('.close').forEach(b => b.onclick = () => b.closest('dialog')?.close());
document.addEventListener('click', ev => { const target = ev.target.closest('button'); if (!target)
    return; const rect = target.getBoundingClientRect(); burst(ev.clientX || rect.left + rect.width / 2, ev.clientY || rect.top + rect.height / 2, '#bdabff', 12); if (target.dataset.add) {
    const n = Number(target.dataset.add);
    if (!update(n, 'add'))
        notify('Mise à jour impossible : vérifiez le stockage ou le total maximum de 1 milliard.', true);
} if (target.dataset.filter) {
    filter = target.dataset.filter;
    syncFilters();
    const t = current();
    if (t)
        renderMedals(t);
} if (target.dataset.medal)
    inspect(Number(target.dataset.medal)); });
for (const id of ['settings-open', 'backup-open'])
    $(id).onclick = () => { $('settings-status').textContent = demo ? 'Les réglages et sauvegardes concernent vos vrais parcours.' : ''; dialog('settings').showModal(); };
input('reduced').onchange = () => { if (blocked) {
    input('reduced').checked = data.reduced;
    $('settings-status').textContent = 'Stockage illisible : restaurez le carnet avant de modifier les réglages.';
    return;
} if (commit({ ...data, reduced: input('reduced').checked }, true)) {
    applyMotion();
    $('settings-status').textContent = 'Préférence de mouvement enregistrée.';
}
else {
    input('reduced').checked = data.reduced;
    $('settings-status').textContent = 'Préférence non enregistrée : stockage indisponible.';
} };
$('export').onclick = () => { if (blocked) {
    $('settings-status').textContent = 'Le carnet n’a pas pu être lu. Export suspendu pour éviter une sauvegarde vide.';
    return;
} try {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url;
    a.download = `petites-victoires-parcours-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('settings-status').textContent = 'Export préparé. Vérifiez le fichier dans vos téléchargements.';
}
catch {
    $('settings-status').textContent = 'Impossible de préparer l’export.';
} };
input('import-file').onchange = async () => { const file = input('import-file').files?.[0]; if (!file)
    return; try {
    if (file.size > 12 * 1024 * 1024)
        throw Error('Le fichier dépasse 12 Mo.');
    const restored = validate(JSON.parse(await file.text()));
    confirmAction('Restaurer cette sauvegarde ?', `${restored.tracks.length} parcours et ${restored.logs.length} actions remplaceront vos données actuelles. Exportez d’abord votre carnet si vous souhaitez le garder.`, () => { if (commit(restored, true)) {
        demo = null;
        selected = '';
        render();
        $('settings-status').textContent = 'Sauvegarde restaurée et enregistrée.';
        notify('Sauvegarde restaurée. Vos parcours sont prêts.');
    }
    else
        $('settings-status').textContent = 'Échec de la restauration. Aucune donnée modifiée.'; });
}
catch (err) {
    $('settings-status').textContent = `Import refusé : ${err instanceof SyntaxError ? 'JSON illisible' : err instanceof Error ? err.message : 'fichier invalide'}. Aucune donnée modifiée.`;
}
finally {
    input('import-file').value = '';
} };
window.addEventListener('storage', ev => { if (ev.key !== KEY)
    return; try {
    data = ev.newValue ? validate(JSON.parse(ev.newValue)) : emptyData();
    blocked = false;
    render();
    notify('Parcours actualisés depuis un autre onglet.');
}
catch {
    blocked = true;
    notify('Les données d’un autre onglet sont illisibles. Restaurez une sauvegarde.', true);
} });
let particles = [], frame = 0, lastFrame = 0;
const canvas = $('particles'), ctx = canvas.getContext('2d');
function reducedMotion() { return data.reduced || matchMedia('(prefers-reduced-motion: reduce)').matches; }
function resize() { const dpr = Math.min(devicePixelRatio || 1, 2); canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr; ctx?.setTransform(dpr, 0, 0, dpr, 0, 0); }
function burst(x, y, color, count) { if (reducedMotion() || !ctx)
    return; for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 5;
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life: 55 + Math.random() * 25, max: 80, size: 1 + Math.random() * 2.2, color });
} particles = particles.slice(-220); if (!frame) {
    lastFrame = performance.now();
    frame = requestAnimationFrame(draw);
} }
function draw(now) { frame = 0; if (!ctx)
    return; ctx.clearRect(0, 0, innerWidth, innerHeight); if (reducedMotion() || document.hidden) {
    particles = [];
    return;
} const delta = Math.min(2, (now - lastFrame) / 16.67 || 1); lastFrame = now; for (const p of particles) {
    p.x += p.vx * delta;
    p.y += p.vy * delta;
    p.vy += .025 * delta;
    p.vx *= .985;
    p.life -= delta;
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 7;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
} particles = particles.filter(p => p.life > 0); ctx.globalAlpha = 1; ctx.shadowBlur = 0; if (particles.length)
    frame = requestAnimationFrame(draw); }
function celebrationParticles(color) { if (reducedMotion())
    return; dialog('celebration').querySelectorAll('.celebration-spark').forEach(e => e.remove()); for (let i = 0; i < 35; i++) {
    const p = document.createElement('i');
    p.className = 'celebration-spark';
    p.style.setProperty('--x', `${(Math.random() - .5) * 650}px`);
    p.style.setProperty('--y', `${(Math.random() - .5) * 650}px`);
    p.style.background = color;
    p.style.animationDelay = `${Math.random() * .2}s`;
    dialog('celebration').append(p);
    setTimeout(() => p.remove(), 2000);
} }
window.addEventListener('resize', resize);
resize();
$('empty-art').innerHTML = medal({ id: 'empty', name: '', unit: '', icon: 'bolt', value: 0, thresholds: [], earned: {} }, 3);
render();
