import { COURSES, fresh, front, distance, step, load, persist, initial } from './game.js';
const $ = (id) => document.getElementById(id);
let saved = initial();
let storage;
try {
    storage = window.localStorage;
    const loaded = load(storage);
    saved = loaded.save;
    $('storage-status').textContent = loaded.error;
}
catch {
    $('storage-status').textContent = 'Stockage indisponible : votre progression ne sera pas conservée après actualisation.';
}
let busy = false;
let frame = 0;
let paintGame = { ...saved.game };
const slider = $('stride');
slider.value = String(saved.stride);
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
function save() { if (!storage || !persist(saved, storage))
    $('storage-status').textContent = 'La sauvegarde a échoué. Vous pouvez jouer, mais cette progression peut être perdue après actualisation.'; }
function message(text, error = false, success = false) { $('notice').textContent = text; $('notice').className = error ? 'error' : success ? 'success' : ''; }
function reset(course = saved.game.course, start = false) { cancelAnimationFrame(frame); busy = false; saved.game = fresh(course); if (start)
    saved.game.status = 'playing'; paintGame = { ...saved.game }; save(); render(); message(start ? 'Réglez votre amplitude, puis posez le pied gauche.' : 'Votre prochaine aventure commence du pied gauche.'); if (start)
    $('left').focus();
else
    $('start').focus(); }
function scene(g = paintGame) {
    const actual = saved.game;
    const w = window.innerWidth < 681 ? 600 : 900;
    const scale = 2.5;
    const camera = front(g) - 110;
    const x = (v) => (v - camera) * scale;
    const lx = x(g.left), rx = x(g.right), hip = (lx + rx) / 2 + 7;
    let sum = 0;
    const positions = [0, ...COURSES[g.course].steps.map(d => (sum += d))];
    const stones = positions.map((p, i) => { const px = x(p); if (px < -100 || px > w + 100)
        return ''; const isNext = i === actual.index + 1 && actual.status === 'playing'; return `<g><path d="M${px - 24} 275 Q${px - 20} 265 ${px} 266 Q${px + 22} 265 ${px + 25} 277 L${px + 20} 288 L${px - 20} 288Z" fill="${isNext ? '#6b5ac8' : i <= actual.index ? '#d6cfdf' : '#dedbd1'}"/><text x="${px}" y="307" text-anchor="middle" fill="${isNext ? '#6b5ac8' : '#77747d'}" font-family="Arial" font-size="11">${i === 0 ? 'DÉPART' : i === positions.length - 1 ? 'ARRIVÉE' : String(i).padStart(2, '0')}</text>${isNext ? `<path d="M${px - 7} 242 l7 7 7-7" fill="none" stroke="#6b5ac8" stroke-width="2"/>` : ''}</g>`; }).join('');
    const last = x(positions[positions.length - 1]);
    const ghostX = x(front(actual) + saved.stride);
    const active = actual.status === 'playing';
    $('scene').setAttribute('viewBox', `0 0 ${w} 330`);
    $('scene').setAttribute('aria-label', `Parcours ${g.course + 1}, pierre ${actual.index} sur ${COURSES[g.course].steps.length}. ${active ? `Prochain pied ${actual.next === 'left' ? 'gauche' : 'droit'}, pierre à ${distance(actual)} centimètres.` : actual.status === 'won' ? 'Traversée réussie.' : actual.status === 'lost' ? 'Équilibre perdu.' : 'Prêt à partir.'}`);
    $('scene').innerHTML = `<defs><pattern id="water" width="60" height="20" patternUnits="userSpaceOnUse"><path d="M5 10 q10 -5 20 0 t20 0" fill="none" stroke="#c8c7dd" stroke-width="1"/></pattern></defs><circle cx="${w - 120}" cy="76" r="37" fill="#f0e9d9"/><path d="M0 217 Q130 170 270 213 T${w} 205 L${w} 278H0Z" fill="#f0edf4"/><path d="M0 238 Q130 205 250 238 T${w} 225 L${w} 279H0Z" fill="#e6e1ed"/><rect y="279" width="${w}" height="51" fill="#e7e7f0"/><rect y="280" width="${w}" height="50" fill="url(#water)"/>${stones}<g stroke="#777181" stroke-width="2"><path d="M${last + 30} 265V181"/><path d="M${last + 30} 181l36 11-36 15" fill="#df745b" stroke="none"/></g>${active ? `<g class="ghost"><path d="M${hip} 150 Q${ghostX} 170 ${ghostX} 264" fill="none" stroke="#6b5ac8" stroke-width="1.5" stroke-dasharray="4 6"/><ellipse cx="${ghostX}" cy="272" rx="18" ry="5" stroke="#6b5ac8" stroke-width="1.5" fill="none" stroke-dasharray="3 3"/><text x="${ghostX}" y="229" text-anchor="middle" fill="#6b5ac8" font-family="Arial" font-size="12">${saved.stride} cm</text></g>` : ''}<g id="character"><path d="M${hip - 5} 143 Q${(hip + lx) / 2 - 18} 205 ${lx} 269" fill="none" stroke="#6b5ac8" stroke-width="10" stroke-linecap="round"/><path d="M${hip + 5} 145 Q${(hip + rx) / 2 + 22} 205 ${rx} 268" fill="none" stroke="#9284d4" stroke-width="10" stroke-linecap="round"/><path d="M${hip - 17} 95 Q${hip + 3} 89 ${hip + 20} 101 L${hip + 13} 150 L${hip - 18} 147Z" fill="#df745b"/><path d="M${hip - 13} 103 l-28 33 -20-13 M${hip + 17} 106 l25 19 17-25" fill="none" stroke="#333448" stroke-width="4" stroke-linecap="round"/><path d="M${hip} 89l3-13" stroke="#333448" stroke-width="4"/><ellipse cx="${hip + 4}" cy="62" rx="15" ry="19" fill="#eed5b4" stroke="#333448" stroke-width="2.5" transform="rotate(12 ${hip + 4} 62)"/><path d="M${hip - 11} 52q7-18 23-7l7 7" stroke="#333448" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="${hip + 12}" cy="60" r="1.7" fill="#333448"/><path d="M${hip + 12} 71l-6 1" stroke="#333448" stroke-width="1.5"/><path d="M${lx - 8} 270h24q8 0 8 7h-32Z" fill="#333448"/><path d="M${rx - 8} 270h24q8 0 8 7h-32Z" fill="#333448"/><text x="${lx}" y="258" text-anchor="middle" font-family="Arial" font-size="10" fill="#26283a">G</text><text x="${rx}" y="250" text-anchor="middle" font-family="Arial" font-size="10" fill="#26283a">D</text></g><text x="${w - 24}" y="25" text-anchor="end" font-family="Georgia" font-style="italic" font-size="15" fill="#928b9c">L’art de ne pas tomber.</text>`;
}
function render() {
    const g = saved.game, c = COURSES[g.course], active = g.status === 'playing';
    $('course-label').textContent = `0${g.course + 1} / ${c.name.toLocaleUpperCase('fr')}`;
    $('progress-label').textContent = g.status === 'ready' ? 'Prêt à partir' : `${g.index} / ${c.steps.length} pierres`;
    $('progress-bar').style.width = `${100 * g.index / c.steps.length}%`;
    $('step-count').textContent = `${g.attempts} pas`;
    $('balance').innerHTML = `Équilibre <b aria-label="${g.lives} sur 3">${Array.from({ length: 3 }, (_, i) => i < g.lives ? '●' : '○').join(' ')}</b>`;
    $('next-foot').textContent = `Pied ${g.next === 'left' ? 'gauche' : 'droit'}`;
    $('foot-badge').textContent = g.next === 'left' ? 'G' : 'D';
    $('distance').textContent = active ? `${distance(g)} cm` : '—';
    $('stride-value').textContent = `${saved.stride} cm`;
    for (const f of ['left', 'right']) {
        $(f).disabled = !active || busy;
        $(f).classList.toggle('expected', g.next === f);
    }
    $('start-panel').hidden = g.status !== 'ready';
    $('end-panel').hidden = g.status !== 'won' && g.status !== 'lost';
    if (g.status === 'won' || g.status === 'lost') {
        $('end-tag').textContent = g.status === 'won' ? 'BIEN JOUÉ, GRANDES JAMBES' : 'ÇA ARRIVE AUX MEILLEURS';
        $('end-title').textContent = g.status === 'won' ? 'Tout en équilibre.' : 'Un pas de travers.';
        $('end-text').textContent = g.status === 'won' ? `${c.steps.length} pierres franchies en ${g.attempts} pas. ${g.lives === 3 ? 'Un sans-faute !' : 'Vous avez gardé le cap.'}` : 'Trois erreurs, et les chaussures sont mouillées. Le parcours vous attend pour un nouvel essai.';
        $('again').textContent = g.status === 'won' && g.course < 2 ? 'Parcours suivant →' : 'Retenter la traversée →';
    }
    document.querySelectorAll('[data-course]').forEach(b => { const selected = Number(b.dataset.course) === g.course; b.classList.toggle('selected', selected); b.setAttribute('aria-pressed', String(selected)); });
    saved.records.forEach((r, i) => { $(`record-${i}`).textContent = r === null ? 'Aucun record pour le moment' : `Record : ${r} pas${r === COURSES[i].steps.length ? ' · sans-faute' : ''}`; });
    scene();
}
function walk(foot) {
    if (busy || saved.game.status !== 'playing')
        return;
    const old = { ...saved.game };
    const result = step(old, foot, saved.stride);
    saved.game = result.game;
    if (saved.game.status === 'won') {
        const r = saved.records[saved.game.course];
        if (r === null || saved.game.attempts < r)
            saved.records[saved.game.course] = saved.game.attempts;
    }
    save();
    message(result.message, result.error, saved.game.status === 'won');
    if (!result.error && !reduced.matches) {
        busy = true;
        const from = performance.now();
        const animate = (now) => { const t = Math.min(1, (now - from) / 250); const ease = 1 - (1 - t) ** 3; paintGame = { ...saved.game, left: old.left + (saved.game.left - old.left) * ease, right: old.right + (saved.game.right - old.right) * ease }; scene(); if (t < 1)
            frame = requestAnimationFrame(animate);
        else {
            busy = false;
            paintGame = { ...saved.game };
            render();
            if (saved.game.status === 'won')
                $('again').focus();
        } };
        render();
        frame = requestAnimationFrame(animate);
    }
    else {
        paintGame = { ...saved.game };
        render();
        if (saved.game.status === 'won' || saved.game.status === 'lost')
            $('again').focus();
    }
}
$('start').addEventListener('click', () => reset(saved.game.course, true));
$('restart').addEventListener('click', () => reset());
$('again').addEventListener('click', () => reset(saved.game.status === 'won' && saved.game.course < 2 ? saved.game.course + 1 : saved.game.course, true));
$('left').addEventListener('click', () => walk('left'));
$('right').addEventListener('click', () => walk('right'));
slider.addEventListener('input', () => { saved.stride = Number(slider.value); save(); $('stride-value').textContent = `${saved.stride} cm`; scene(); });
$('reset-settings').addEventListener('click', () => { saved.stride = 50; slider.value = '50'; save(); render(); message('Amplitude réinitialisée à 50 cm. Votre progression est conservée.'); });
$('help').addEventListener('click', () => { const d = $('instructions'); d.open = !d.open; if (d.open) {
    d.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'center' });
    d.querySelector('summary')?.focus();
} });
document.querySelectorAll('[data-course]').forEach(b => b.addEventListener('click', () => reset(Number(b.dataset.course))));
window.addEventListener('keydown', e => { if (e.repeat || e.ctrlKey || e.altKey || e.metaKey)
    return; const el = e.target; if (el.matches('input,select,textarea,summary') || el.isContentEditable)
    return; const key = e.key.toLowerCase(); if (key === 'q' || key === 'd' || key === 'arrowleft' || key === 'arrowright') {
    if (saved.game.status === 'playing') {
        e.preventDefault();
        walk(key === 'q' || key === 'arrowleft' ? 'left' : 'right');
    }
}
else if (!el.matches('button,a') && (key === 'arrowup' || key === 'arrowdown')) {
    e.preventDefault();
    slider.value = String(Math.max(25, Math.min(75, saved.stride + (key === 'arrowup' ? 5 : -5))));
    slider.dispatchEvent(new Event('input'));
} });
window.addEventListener('resize', () => scene());
render();
if (saved.game.status === 'playing')
    message('Partie reprise. Votre prochain pas vous attend.');
