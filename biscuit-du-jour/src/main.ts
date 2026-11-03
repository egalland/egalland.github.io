// Biscuit du jour — application TypeScript, sans framework ni service externe.
// Les données persistantes sont stockées dans localStorage sous STORAGE_KEY.
const STORAGE_KEY = 'biscuit-du-jour:v1';
const MAX_NOTES = 100;
const MAX_MESSAGE_LENGTH = 160;

type Source = 'demo' | 'perso';
type Note = { id: string; text: string; recipient: string; source: Source; createdAt: string };
type Draw = { noteId: string; text: string; recipient: string; at: string; number: number };
type AppData = {
  schema: 1;
  notes: Note[];
  drawnIds: string[];
  repeatMode: boolean;
  lastDraw: Draw | null;
  totalDraws: number;
};

const examples = [
  'Aujourd’hui, votre sourire est une excellente idée.',
  'Une aventure minuscule peut devenir une grande histoire.',
  'Votre bonne étoile a mis son chapeau du dimanche.',
  'Faites un compliment inattendu : il pourrait changer une journée.',
  'La chance adore ceux qui osent demander un second biscuit.',
  'Le secret du bonheur ? Un peu plus de danse et un peu moins de sérieux.',
  'Il se pourrait bien que cette journée vous réserve un joli détour.',
  'Même les nuages ont parfois une doublure dorée.',
  'Vous avez le droit de vous offrir une minute de gloire.',
  'Votre prochaine grande idée commencera peut-être par « et si… ».',
  'Quelqu’un sera heureux de recevoir de vos nouvelles.',
  'La vie est un film : aujourd’hui, improvisez la plus belle scène.'
];

function makeDefaults(): AppData {
  const now = '2026-01-01T00:00:00.000Z';
  return {
    schema: 1,
    notes: examples.map((text, i) => ({ id: `demo-${String(i + 1).padStart(2, '0')}`, text, recipient: '', source: 'demo' as const, createdAt: now })),
    drawnIds: [], repeatMode: false, lastDraw: null, totalDraws: 0
  };
}

const el = <T extends HTMLElement>(id: string): T => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Élément d’interface introuvable : ${id}`);
  return node as T;
};

const ui = {
  manager: el<HTMLDialogElement>('managerDialog'),
  openManager: el<HTMLButtonElement>('openManager'),
  openManagerBottom: el<HTMLButtonElement>('openManagerBottom'),
  closeManager: el<HTMLButtonElement>('closeManager'),
  cookieTap: el<HTMLButtonElement>('cookieTap'),
  drawButton: el<HTMLButtonElement>('drawButton'),
  drawHint: el<HTMLElement>('drawHint'),
  ticketPlaceholder: el<HTMLElement>('ticketPlaceholder'),
  ticketReveal: el<HTMLElement>('ticketReveal'),
  fortuneText: el<HTMLElement>('fortuneText'),
  fortuneRecipient: el<HTMLElement>('fortuneRecipient'),
  fortuneMeta: el<HTMLElement>('fortuneMeta'),
  ticketNumber: el<HTMLElement>('ticketNumber'),
  copyButton: el<HTMLButtonElement>('copyButton'),
  repeatToggle: el<HTMLInputElement>('repeatToggle'),
  repeatDescription: el<HTMLElement>('repeatDescription'),
  resetDraws: el<HTMLButtonElement>('resetDraws'),
  availableCount: el<HTMLElement>('availableCount'),
  drawnCount: el<HTMLElement>('drawnCount'),
  headerCount: el<HTMLElement>('headerCount'),
  managerCount: el<HTMLElement>('managerCount'),
  demoBadge: el<HTMLElement>('demoBadge'),
  demoNotice: el<HTMLElement>('demoNotice'),
  noteForm: el<HTMLFormElement>('noteForm'),
  noteText: el<HTMLTextAreaElement>('noteText'),
  noteRecipient: el<HTMLInputElement>('noteRecipient'),
  charCount: el<HTMLElement>('charCount'),
  formError: el<HTMLElement>('formError'),
  submitNote: el<HTMLButtonElement>('submitNote'),
  cancelEdit: el<HTMLButtonElement>('cancelEdit'),
  collectionList: el<HTMLElement>('collectionList'),
  collectionEmpty: el<HTMLElement>('collectionEmpty'),
  exportNotes: el<HTMLButtonElement>('exportNotes'),
  importNotes: el<HTMLInputElement>('importNotes'),
  restoreDemo: el<HTMLButtonElement>('restoreDemo'),
  storageAlert: el<HTMLElement>('storageAlert'),
  storageAlertText: el<HTMLElement>('storageAlertText'),
  toast: el<HTMLElement>('toast')
};

let editingId: string | null = null;
let storageError = '';
let blockedByCorruptData = false;
let toastTimer: ReturnType<typeof setTimeout> | undefined;
let mobileScrollTimer: ReturnType<typeof setTimeout> | undefined;

function parseNote(raw: unknown): Note {
  if (!raw || typeof raw !== 'object') throw new Error('Message invalide.');
  const n = raw as Record<string, unknown>;
  if (typeof n.id !== 'string' || !n.id.trim() || n.id.length > 120 ||
      typeof n.text !== 'string' || n.text.trim().length < 3 || n.text.length > MAX_MESSAGE_LENGTH ||
      typeof n.recipient !== 'string' || n.recipient.length > 40 ||
      (n.source !== 'demo' && n.source !== 'perso') ||
      typeof n.createdAt !== 'string') {
    throw new Error('Le fichier contient un message mal formé.');
  }
  return { id: n.id, text: n.text, recipient: n.recipient, source: n.source, createdAt: n.createdAt };
}
function parseNotes(raw: unknown): Note[] {
  if (!Array.isArray(raw) || raw.length > MAX_NOTES) throw new Error('La boîte doit contenir au plus 100 messages.');
  const notes = raw.map(parseNote);
  if (new Set(notes.map(n => n.id)).size !== notes.length) throw new Error('Identifiants de message en double.');
  return notes;
}
function parseData(raw: unknown): AppData {
  if (!raw || typeof raw !== 'object') throw new Error('Fichier de sauvegarde invalide.');
  const d = raw as Record<string, unknown>;
  if (d.schema !== 1 || typeof d.repeatMode !== 'boolean' ||
    typeof d.totalDraws !== 'number' || !Number.isSafeInteger(d.totalDraws) || d.totalDraws < 0 ||
    !Array.isArray(d.drawnIds) || d.drawnIds.some(id => typeof id !== 'string')) {
    throw new Error('Format de sauvegarde non reconnu.');
  }
  const notes = parseNotes(d.notes);
  const known = new Set(notes.map(n => n.id));
  const drawnIds = [...new Set(d.drawnIds as string[])].filter(id => known.has(id));
  let lastDraw: Draw | null = null;
  if (d.lastDraw !== null && d.lastDraw !== undefined) {
    if (typeof d.lastDraw !== 'object') throw new Error('Dernier billet invalide.');
    const last = d.lastDraw as Record<string, unknown>;
    if (typeof last.noteId !== 'string' || typeof last.text !== 'string' || last.text.length > MAX_MESSAGE_LENGTH ||
      typeof last.recipient !== 'string' || last.recipient.length > 40 ||
      typeof last.at !== 'string' || typeof last.number !== 'number' || !Number.isSafeInteger(last.number) || last.number < 1) {
      throw new Error('Dernier billet invalide.');
    }
    lastDraw = {noteId:last.noteId, text:last.text, recipient:last.recipient, at:last.at, number:last.number};
  }
  return {schema:1, notes, drawnIds, repeatMode:d.repeatMode, lastDraw, totalDraws:d.totalDraws};
}

function load(): AppData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === null ? makeDefaults() : parseData(JSON.parse(raw) as unknown);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    // Si le stockage contient une sauvegarde corrompue, elle n'est jamais écrasée silencieusement.
    try {
      if (window.localStorage.getItem(STORAGE_KEY) !== null) blockedByCorruptData = true;
    } catch { /* stockage entièrement bloqué */ }
    storageError = blockedByCorruptData
      ? `Sauvegarde illisible (${message}). Aucune écriture ne sera effectuée avant restauration explicite.`
      : `Stockage indisponible (${message}). Les changements risquent d’être perdus après rechargement.`;
    return makeDefaults();
  }
}
let state = load();

function save(): boolean {
  if (blockedByCorruptData) {
    showStorageAlert();
    return false;
  }
  try {
    const serialized = JSON.stringify(state);
    window.localStorage.setItem(STORAGE_KEY, serialized);
    // Vérification immédiate après écriture ; les tests recréent ensuite l’application avec le même stockage.
    if (window.localStorage.getItem(STORAGE_KEY) !== serialized) throw new Error('La relecture ne correspond pas.');
    storageError = '';
    showStorageAlert();
    return true;
  } catch (error) {
    storageError = `Écriture non confirmée (${error instanceof Error ? error.message : 'erreur inconnue'}). Les changements restent temporaires.`;
    showStorageAlert();
    return false;
  }
}
function showStorageAlert(): void {
  ui.storageAlert.hidden = !storageError;
  ui.storageAlertText.textContent = storageError;
}
function toast(message: string): void {
  window.clearTimeout(toastTimer);
  ui.toast.textContent = message;
  ui.toast.hidden = false;
  toastTimer = window.setTimeout(() => { ui.toast.hidden = true; }, 3500);
}
function commit(success: string): void {
  const saved = save();
  render();
  toast(saved ? success : 'Modification temporaire : sauvegarde NON confirmée.');
}
function available(): Note[] {
  if (state.repeatMode) return [...state.notes];
  const used = new Set(state.drawnIds);
  return state.notes.filter(note => !used.has(note.id));
}
function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Date inconnue';
  return new Intl.DateTimeFormat('fr-FR', { day:'numeric', month:'short', year:'numeric' }).format(date);
}
function render(): void {
  const notes = state.notes;
  const left = available().length;
  const none = notes.length === 0;
  const exhausted = !state.repeatMode && !none && left === 0;
  const inactive = none || exhausted;
  ui.drawButton.disabled = inactive;
  ui.cookieTap.disabled = inactive;
  ui.cookieTap.setAttribute('aria-label', exhausted ? 'Boîte épuisée : nouvelle tournée nécessaire' : none ? 'Aucun message : ajoutez-en un' : 'Ouvrir un biscuit surprise');
  ui.drawButton.innerHTML = exhausted ? '✳ &nbsp; PLUS DE BISCUITS' : none ? '✎ &nbsp; BOÎTE VIDE' : '<span aria-hidden="true">✦</span> OUVRIR UN BISCUIT <span class="button-arrow" aria-hidden="true">↗</span>';
  ui.drawHint.textContent = exhausted ? 'Vous avez tout lu. Lancez une nouvelle tournée !'
    : none ? 'Ouvrez « Ma boîte » pour écrire votre premier message.'
    : state.lastDraw ? 'Biscuit ouvert ! Retrouvez votre billet juste à côté, ou plus bas sur mobile. ↓'
    : state.repeatMode ? 'Tirage avec répétitions : tous les mots sont dans la boîte.'
    : 'Tirage sans répétition : chaque message sort une seule fois.';
  // L'état du dessin reflète le dernier tirage, y compris après rechargement.
  if (state.lastDraw) ui.cookieTap.classList.add('cracked');
  else ui.cookieTap.classList.remove('cracked');
  ui.headerCount.textContent = String(notes.length);
  ui.managerCount.textContent = `(${notes.length})`;
  const demoCount = notes.filter(n => n.source === 'demo').length;
  ui.demoBadge.hidden = demoCount === 0;
  ui.demoNotice.hidden = demoCount === 0;
  ui.demoNotice.textContent = `✳ ${demoCount} message${demoCount > 1 ? 's' : ''} d’exemple encore présent${demoCount > 1 ? 's' : ''} dans votre boîte (données de démonstration).`;
  ui.availableCount.innerHTML = `${left} <small>/ ${notes.length}</small>`;
  ui.drawnCount.textContent = String(state.totalDraws);
  ui.repeatToggle.checked = state.repeatMode;
  ui.repeatDescription.textContent = state.repeatMode ? 'Avec répétitions : un mot peut revenir.' : 'Sans répétition, jusqu’à épuisement.';
  ui.resetDraws.hidden = state.drawnIds.length === 0;
  const last = state.lastDraw;
  ui.ticketPlaceholder.hidden = Boolean(last);
  ui.ticketReveal.hidden = !last;
  ui.copyButton.disabled = !last;
  if (last) {
    ui.fortuneText.textContent = last.text;
    ui.fortuneRecipient.textContent = `Pour ${last.recipient}`;
    ui.fortuneRecipient.hidden = last.recipient.trim().length === 0;
    ui.fortuneMeta.textContent = `TIRÉ LE ${formatDate(last.at).toLocaleUpperCase('fr-FR')}`;
    ui.ticketNumber.textContent = `BILLET N° ${String(last.number).padStart(3, '0')}`;
  } else {
    ui.ticketNumber.textContent = 'BILLET N° —';
  }
  renderCollection();
  showStorageAlert();
}
function createAction(text: string, aria: string, className: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = text;
  button.className = className;
  button.setAttribute('aria-label', aria);
  button.addEventListener('click', onClick);
  return button;
}
function renderCollection(): void {
  ui.collectionList.replaceChildren();
  ui.collectionEmpty.hidden = state.notes.length !== 0;
  for (const note of state.notes) {
    const row = document.createElement('article');
    row.className = `collection-item${note.source === 'demo' ? ' example' : ''}`;
    const textBlock = document.createElement('div');
    textBlock.className = 'collection-copy';
    const quote = document.createElement('p');
    quote.textContent = `“${note.text}”`;
    const meta = document.createElement('small');
    meta.textContent = `${note.source === 'demo' ? 'Exemple' : 'Personnel'}${note.recipient ? ` · Pour ${note.recipient}` : ''}`;
    textBlock.append(quote, meta);
    const controls = document.createElement('div');
    controls.className = 'collection-actions';
    controls.append(
      createAction('✎', `Modifier : ${note.text}`, 'edit-button', () => editNote(note.id)),
      createAction('×', `Supprimer : ${note.text}`, 'remove-button', () => removeNote(note.id))
    );
    row.append(textBlock, controls);
    ui.collectionList.append(row);
  }
}
function draw(): void {
  const choices = available();
  if (choices.length === 0) {
    toast(state.notes.length ? 'Tous les biscuits ont été ouverts.' : 'Ajoutez d’abord un message à votre boîte.');
    return;
  }
  let index = Math.floor(Math.random() * choices.length);
  if (window.crypto?.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    index = (array[0] ?? 0) % choices.length;
  }
  const note = choices[index];
  if (!note) return;
  state.totalDraws += 1;
  state.lastDraw = { noteId:note.id, text:note.text, recipient:note.recipient, at:new Date().toISOString(), number:state.totalDraws };
  if (!state.drawnIds.includes(note.id)) state.drawnIds.push(note.id);
  // La révélation est immédiate ; l'animation n'est que décorative.
  ui.cookieTap.classList.remove('cracked');
  void ui.cookieTap.offsetWidth;
  ui.cookieTap.classList.add('cracked');
  commit('Petit mot révélé et tirage enregistré.');
  // Sur téléphone, le billet est sous le dessin : le montrer automatiquement.
  // Le dessin reste ouvert, sans se refermer après une seconde.
  if (window.matchMedia?.('(max-width: 760px)').matches) {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    window.clearTimeout(mobileScrollTimer);
    mobileScrollTimer = window.setTimeout(() => {
      ui.ticketReveal.scrollIntoView({behavior: reduced ? 'auto' : 'smooth', block: 'center'});
    }, reduced ? 0 : 480);
  }
}
function updateCharCount(): void {
  ui.charCount.textContent = `${ui.noteText.value.length} / ${MAX_MESSAGE_LENGTH} caractères`;
}
function resetForm(): void {
  editingId = null;
  ui.noteForm.reset();
  ui.formError.hidden = true;
  ui.formError.textContent = '';
  ui.submitNote.textContent = '+ Ajouter à la boîte';
  ui.cancelEdit.hidden = true;
  updateCharCount();
}
function formError(message: string): void {
  ui.formError.textContent = message;
  ui.formError.hidden = false;
  ui.noteText.focus();
}
function makeId(): string {
  return typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `note-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
function submitNote(e: SubmitEvent): void {
  e.preventDefault();
  const text = ui.noteText.value.trim();
  const recipient = ui.noteRecipient.value.trim();
  if (text.length < 3) return formError('Écrivez un message de 3 caractères au minimum.');
  if (text.length > MAX_MESSAGE_LENGTH) return formError('Le message ne peut pas dépasser 160 caractères.');
  if (recipient.length > 40) return formError('Le destinataire est limité à 40 caractères.');
  if (!editingId && state.notes.length >= MAX_NOTES) return formError('La boîte est pleine (100 messages maximum).');
  const existing = state.notes.find(n => n.id === editingId);
  if (editingId && !existing) return formError('Ce message n’existe plus.');
  if (existing) {
    // Toute édition transforme un exemple en message personnel.
    state.notes = state.notes.map(n => n.id === editingId ? {...n,text,recipient,source:'perso'} : n);
    resetForm();
    commit('Message modifié et sauvegardé.');
  } else {
    state.notes.unshift({id:makeId(),text,recipient,source:'perso',createdAt:new Date().toISOString()});
    resetForm();
    commit('Message ajouté et sauvegardé.');
  }
}
function editNote(id: string): void {
  const note = state.notes.find(n => n.id === id);
  if (!note) return;
  editingId = id;
  ui.noteText.value = note.text;
  ui.noteRecipient.value = note.recipient;
  ui.submitNote.textContent = '✓ Enregistrer la modification';
  ui.cancelEdit.hidden = false;
  ui.formError.hidden = true;
  updateCharCount();
  ui.noteText.focus();
}
function removeNote(id: string): void {
  const note = state.notes.find(n => n.id === id);
  if (!note || !window.confirm(`Supprimer définitivement ce message ?\n\n« ${note.text} »`)) return;
  state.notes = state.notes.filter(n => n.id !== id);
  state.drawnIds = state.drawnIds.filter(other => other !== id);
  if (editingId === id) resetForm();
  commit('Message supprimé et changement sauvegardé.');
}
function openManager(): void {
  ui.manager.showModal();
  ui.noteText.focus();
}
function resetDraws(): void {
  state.drawnIds = [];
  state.lastDraw = null;
  commit('Nouvelle tournée : tous les messages sont disponibles.');
}
function exportNotes(): void {
  try {
    const content = JSON.stringify({format:'biscuit-du-jour',version:1,exportedAt:new Date().toISOString(),notes:state.notes},null,2);
    const blob = new Blob([content], {type:'application/json;charset=utf-8'});
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `biscuit-du-jour-${new Date().toISOString().slice(0,10)}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
    toast('Export JSON déclenché. Vérifiez les téléchargements du navigateur.');
  } catch {
    toast('Impossible de préparer le fichier JSON.');
  }
}
async function importNotes(): Promise<void> {
  const file = ui.importNotes.files?.[0];
  if (!file) return;
  ui.importNotes.value = '';
  if (file.size > 500_000) return toast('Fichier trop volumineux (limite : 500 Ko).');
  try {
    const payload = JSON.parse(await file.text()) as unknown;
    if (!payload || typeof payload !== 'object') throw new Error('Structure invalide.');
    const data = payload as Record<string, unknown>;
    if (data.format !== 'biscuit-du-jour' || data.version !== 1) throw new Error('Ce fichier n’est pas un export de Biscuit du jour.');
    const notes = parseNotes(data.notes);
    if (!window.confirm(`Importer ${notes.length} messages ? Cela remplacera les ${state.notes.length} messages actuels.`)) return;
    state.notes = notes;
    state.drawnIds = [];
    state.lastDraw = null;
    // Le mode de tirage et le compteur total sont conservés.
    blockedByCorruptData = false;
    commit('Import validé : les messages ont été enregistrés.');
    resetForm();
  } catch (error) {
    toast(`Import refusé : ${error instanceof Error ? error.message : 'fichier invalide'}`);
  }
}
async function copyFortune(): Promise<void> {
  const last = state.lastDraw;
  if (!last) return;
  const text = `“${last.text}”${last.recipient ? ` — Pour ${last.recipient}` : ''}`;
  try {
    await navigator.clipboard.writeText(text);
    toast('Petit mot copié dans le presse-papiers.');
  } catch {
    toast('Copie impossible : vérifiez les permissions du navigateur.');
  }
}

ui.drawButton.addEventListener('click', draw);
ui.cookieTap.addEventListener('click', draw);
ui.repeatToggle.addEventListener('change', () => {state.repeatMode = ui.repeatToggle.checked; commit(state.repeatMode ? 'Répétitions autorisées et préférence sauvegardée.' : 'Répétitions désactivées et préférence sauvegardée.');});
ui.resetDraws.addEventListener('click', resetDraws);
ui.copyButton.addEventListener('click', () => {void copyFortune();});
ui.openManager.addEventListener('click', openManager);
ui.openManagerBottom.addEventListener('click', openManager);
ui.closeManager.addEventListener('click', () => ui.manager.close());
ui.manager.addEventListener('close', resetForm);
ui.manager.addEventListener('click', e => {if (e.target === ui.manager) ui.manager.close();});
ui.noteForm.addEventListener('submit', submitNote);
ui.noteText.addEventListener('input', updateCharCount);
ui.cancelEdit.addEventListener('click', resetForm);
ui.exportNotes.addEventListener('click', exportNotes);
ui.importNotes.addEventListener('change', () => {void importNotes();});
ui.restoreDemo.addEventListener('click', () => {
  if (!window.confirm('Restaurer les 12 messages d’exemple ? Vos messages personnels seront remplacés, et la progression réinitialisée.')) return;
  const repeat = state.repeatMode;
  state = makeDefaults();
  state.repeatMode = repeat;
  blockedByCorruptData = false;
  resetForm();
  commit('Exemples restaurés et sauvegardés.');
});
window.addEventListener('storage', e => {
  if (e.key !== STORAGE_KEY) return;
  // Les changements d'un autre onglet sont rechargés ; aucun écrasement automatique.
  state = load();
  resetForm();
  render();
  toast('Boîte actualisée depuis un autre onglet.');
});
render();