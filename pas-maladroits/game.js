export const COURSES = [
    { name: 'La mise en jambes', steps: [50, 50, 40, 50, 60, 40, 50, 60] },
    { name: 'Les grandes enjambées', steps: [40, 65, 35, 70, 50, 30, 60, 45, 75, 35, 55, 65] },
    { name: 'Le drôle de détour', steps: [30, 70, 40, 60, 25, 75, 35, 65, 45, 30, 70, 50, 25, 60, 35, 75] }
];
export const STORAGE_KEY = 'pas-maladroits-v1';
export function fresh(course = 0) { return { course, index: 0, attempts: 0, lives: 3, next: 'left', left: -10, right: 0, status: 'ready' }; }
export function initial() { return { version: 1, game: fresh(), stride: 50, records: [null, null, null] }; }
export function front(g) { return Math.max(g.left, g.right); }
export function target(g) { return COURSES[g.course].steps.slice(0, g.index + 1).reduce((a, b) => a + b, 0); }
export function distance(g) { return target(g) - front(g); }
export function step(g, foot, stride) {
    if (g.status !== 'playing')
        return { game: g, message: 'Lancez une traversée pour commencer.', error: false };
    if (!Number.isFinite(stride) || stride < 25 || stride > 75 || stride % 5 !== 0)
        return { game: g, message: 'Amplitude invalide : choisissez de 25 à 75 cm, par pas de 5.', error: true };
    const n = { ...g, attempts: g.attempts + 1 };
    const delta = Math.abs(stride - distance(g));
    let message = '';
    if (foot !== g.next)
        message = `Un pied après l’autre ! Posez le pied ${g.next === 'left' ? 'gauche' : 'droit'}.`;
    else if (delta > 8)
        message = `Pas trop ${stride < distance(g) ? 'court' : 'long'} : il fallait viser ${distance(g)} cm. Réessayez avec le même pied.`;
    if (message) {
        n.lives--;
        if (n.lives === 0)
            n.status = 'lost';
        return { game: n, message: message + ' −1 équilibre.', error: true };
    }
    // Snap a successful landing to the stone's centre, so future distances remain usable.
    n[foot] = target(g);
    n.index++;
    n.next = foot === 'left' ? 'right' : 'left';
    if (n.index === COURSES[g.course].steps.length)
        n.status = 'won';
    return { game: n, message: n.status === 'won' ? 'Traversée réussie. Vos longues jambes ont trouvé leur rythme !' : `Bien posé ! Au pied ${n.next === 'left' ? 'gauche' : 'droit'} de jouer.`, error: false };
}
export function validate(value) {
    const s = value;
    if (!s || s.version !== 1 || !s.game || !Array.isArray(s.records) || s.records.length !== 3)
        throw Error('Sauvegarde non reconnue');
    const g = s.game;
    if (!Number.isInteger(g.course) || g.course < 0 || g.course > 2 || !Number.isInteger(g.index) || g.index < 0 || g.index > COURSES[g.course].steps.length || !Number.isInteger(g.attempts) || g.attempts < g.index || !Number.isInteger(g.lives) || g.lives < 0 || g.lives > 3 || !['left', 'right'].includes(g.next) || !['ready', 'playing', 'won', 'lost'].includes(g.status))
        throw Error('Partie invalide');
    if (!Number.isFinite(s.stride) || s.stride < 25 || s.stride > 75 || s.stride % 5 !== 0 || s.records.some((v, i) => v !== null && (!Number.isInteger(v) || v < COURSES[i].steps.length)))
        throw Error('Réglages invalides');
    const total = COURSES[g.course].steps.slice(0, g.index).reduce((a, b) => a + b, 0);
    const prev = g.index > 0 ? total - COURSES[g.course].steps[g.index - 1] : -10;
    if (g.next !== (g.index % 2 === 0 ? 'left' : 'right') || g.left !== (g.index % 2 === 1 ? total : prev) || g.right !== (g.index % 2 === 0 ? total : Math.max(0, prev)))
        throw Error('Positions invalides');
    const failures = g.attempts - g.index;
    if (failures !== 3 - g.lives || g.status === 'won' && g.index !== COURSES[g.course].steps.length || g.status !== 'won' && g.index === COURSES[g.course].steps.length || g.status === 'lost' && g.lives !== 0 || g.status === 'playing' && g.lives === 0 || g.status === 'ready' && (g.index !== 0 || g.attempts !== 0))
        throw Error('État incohérent');
    return { version: 1, game: { ...g }, stride: s.stride, records: [...s.records] };
}
export function load(storage) {
    try {
        const raw = storage.getItem(STORAGE_KEY);
        return { save: raw ? validate(JSON.parse(raw)) : initial(), error: '' };
    }
    catch {
        return { save: initial(), error: 'La sauvegarde est inaccessible ou endommagée. Une nouvelle partie est prête ; les anciennes données n’ont pas pu être récupérées.' };
    }
}
export function persist(save, storage) { try {
    storage.setItem(STORAGE_KEY, JSON.stringify(save));
    return true;
}
catch {
    return false;
} }
