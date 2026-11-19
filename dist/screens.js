/* Secondary views share Élan's stored records and its existing editing dialogs. */
const screenFilters = { ideas: 'all', contacts: 'all', stats: 'month', journal: 'ledger' };

const screenSymbols = {
  etsy: '<rect x="7" y="3" width="12" height="16" rx="2"/><path d="M7 6H5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h10M10 8h6m-6 4h6m-6 4h3"/>',
  print: '<path d="m12 2 9 5v10l-9 5-9-5V7l9-5Zm-9 5 9 5 9-5m-9 5v10M7.5 4.5l9 5"/>',
  dev: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8h20m-12 3-3 3 3 3m4-6 3 3-3 3"/>',
  general: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  list: '<path d="m3 7 2 2 3-4m3 2h10M3 16l2 2 3-4m3 2h10"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-13 5h4"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m3 6 9 7 9-7"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  people: '<circle cx="9" cy="9" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2m0-15a3 3 0 0 1 0 6m3 2a5 5 0 0 1 3 5v2"/>',
  tune: '<path d="M4 7h7m4 0h5M4 17h3m4 0h9"/><circle cx="13" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  wallet: '<path d="M19 8V4L4 6v13h17V8H5m16 4h-5v4h5"/>',
  plusCircle: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8m-4-4h8"/>',
  minusCircle: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>'
};

function screenIcon(name) {
  return '<svg class="sc-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (screenSymbols[name] || '') + '</svg>';
}

function screenHeading(title, summary, action = '') {
  return '<div class="sc-heading"><div><h1>' + title + '</h1><p>' + summary + '</p></div>' + action + '</div>';
}

function screenChip(group, key, label, count) {
  const active = screenFilters[group] === key;
  const number = count === undefined ? '' : '<span class="sc-chip-count">' + count + '</span>';
  return '<button type="button" class="sc-chip" aria-pressed="' + active + '" data-screen-group="' + group + '" data-screen-value="' + key + '">' + label + number + '</button>';
}

function screenPercent(numerator, denominator) {
  return denominator > 0 ? Math.min(100, Math.round(100 * numerator / denominator)) : 0;
}

function screenAmount(amount) {
  const digits = Number.isInteger(Math.round(amount * 100) / 100) ? 0 : 2;
  return Number(amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function screenDate(value) {
  if (!value) return '';
  return new Date(value + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: value.slice(0, 4) !== today().slice(0, 4) ? 'numeric' : undefined });
}

const screenIdeaCopy = {
  etsy: ['Produits numériques sur Etsy', 'Crée un modèle téléchargeable, prépare sa fiche et mesure les premiers retours.', 'Sans stock'],
  print: ['Tester une idée en 3D', 'Obtiens deux devis de fabrication et présente ton concept à trois acheteurs potentiels.', 'Sans imprimante'],
  dev: ['Automatiser une tâche Excel ou web', 'Monte une démo courte et propose une petite mission à des prospects ciblés.', 'Avec tes outils'],
  general: ['Tester ta propre idée', 'Décris ton client, choisis une expérience courte, puis décide de la suite.', 'Test libre']
};

function renderIdeas() {
  const active = state.activated;
  const shown = ideas.filter(idea => screenFilters.ideas === 'all' || active.includes(idea.id));
  const cards = shown.map(idea => {
    const [title, description, need] = screenIdeaCopy[idea.id] || [idea.title, idea.desc, idea.budget];
    const activated = active.includes(idea.id);
    const total = idea.steps.reduce((sum, step) => sum + step[1], 0);
    return `<article class="sc-idea" data-tone="${esc(idea.id)}">
      <div class="sc-idea-top"><span class="sc-idea-emblem">${screenIcon(idea.id)}</span><span class="sc-status ${activated ? 'on' : ''}">${activated ? 'Plan activé' : need}</span></div>
      <h2>${esc(title)}</h2><p>${esc(description)}</p>
      <div class="sc-idea-bottom"><div class="sc-inline-meta"><span>${screenIcon('list')}${idea.steps.length} actions</span><span>${screenIcon('clock')}${fmt(total)}</span></div>
      <button class="sc-link" data-activate="${esc(idea.id)}">${activated ? 'Revoir le plan' : 'Voir le plan'} ${screenIcon('arrow')}</button></div>
    </article>`;
  }).join('');
  return `<div class="sc-page">${screenHeading('Pistes de revenus', 'Choisis une piste pour ajouter ses actions à ton planning.')}
    <div class="sc-chips" aria-label="Plans à afficher">${screenChip('ideas','all','Toutes',ideas.length)}${screenChip('ideas','active','Activées',active.length)}</div>
    <div class="sc-ideas-grid">${cards || '<div class="sc-empty"><h3>Aucune piste activée</h3><p>Ouvre un plan pour en programmer les actions.</p><button class="sc-link" data-screen-group="ideas" data-screen-value="all">Voir les pistes</button></div>'}</div></div>`;
}

function screenFollowDue(contact) {
  return Boolean(contact.follow && contact.follow <= today() && !['won', 'lost'].includes(contact.status));
}

function screenContactCard(contact) {
  const initials = contact.name.trim().split(/\s+/).slice(0, 2).map(word => Array.from(word)[0] || '').join('');
  const open = !['won', 'lost'].includes(contact.status);
  const due = open && contact.follow ? (contact.follow === today() ? 'Relance aujourd’hui' : 'Relance ' + (contact.follow < today() ? 'échue le ' : 'le ') + screenDate(contact.follow)) : '';
  const id = esc(contact.id);
  return `<article class="sc-contact">
    <div class="sc-contact-head"><span class="sc-avatar" aria-hidden="true">${esc(initials.toUpperCase())}</span><div><button class="sc-contact-name" data-contact="${id}">${esc(contact.name)}</button><div class="sc-contact-stage" data-stage="${esc(contact.status)}">${esc(statuses[contact.status] || '')}</div></div><button class="sc-edit" data-contact="${id}" aria-label="Modifier le contact ${esc(contact.name)}">${screenIcon('tune')}</button></div>
    <p class="sc-offer">${esc(contact.offer)}</p>
    ${contact.channel || contact.note || contact.value ? `<details class="sc-details"><summary>Coordonnées et notes</summary><div>${contact.channel ? '<p>' + esc(contact.channel) + '</p>' : ''}${contact.value ? '<p>Devis envisagé · ' + screenAmount(contact.value) + '</p>' : ''}${contact.note ? '<p>' + esc(contact.note) + '</p>' : ''}</div></details>` : ''}
    <div class="sc-contact-foot">${due ? `<span class="sc-due ${screenFollowDue(contact) ? 'due' : ''}">${screenIcon('calendar')}${due}</span>` : ''}<div class="sc-card-actions"><button data-follow="${id}" class="sc-soft">${screenIcon('calendar')}Planifier une relance</button><button data-message="${id}" class="sc-soft">${screenIcon('mail')}Brouillon</button></div></div>
    </article>`;
}

function screenContactList(contacts) {
  const searchTerm = search.trim().toLocaleLowerCase('fr');
  const predicates = { all: () => true, due: screenFollowDue, ongoing: c => ['sent','talk','quote'].includes(c.status), won: c => c.status === 'won' };
  const shown = contacts.filter(contact => predicates[screenFilters.contacts](contact) && [contact.name, contact.offer, contact.channel].join(' ').toLocaleLowerCase('fr').includes(searchTerm)).sort((a,b) => Number(screenFollowDue(b)) - Number(screenFollowDue(a)) || (a.follow || '9999').localeCompare(b.follow || '9999') || a.name.localeCompare(b.name, 'fr'));
  const empty = contacts.length
    ? '<div class="sc-empty"><h3>Aucun contact pour cette sélection</h3><button class="sc-link" data-clear-contact-filters>Effacer les filtres</button></div>'
    : '<div class="sc-empty"><span class="sc-empty-icon">' + screenIcon('people') + '</span><h3>Ton premier prospect</h3><p>Ajoute son nom et le besoin repéré. Tu pourras ensuite planifier ta relance.</p></div>';
  return shown.map(screenContactCard).join('') || empty;
}

function renderContacts() {
  const contacts = state.contacts;
  const due = contacts.filter(screenFollowDue).length;
  const ongoing = contacts.filter(contact => ['sent','talk','quote'].includes(contact.status)).length;
  const won = contacts.filter(contact => contact.status === 'won').length;
  const button = '<button class="sc-main-action" data-contact>' + screenIcon('plus') + 'Ajouter un prospect</button>';
  return `<div class="sc-page">${screenHeading('Prospection', 'Retrouve tes échanges et les contacts à relancer.', button)}
    <div class="sc-search"><span>${screenIcon('search')}</span><input id="search" type="search" aria-label="Rechercher un prospect" placeholder="Nom, besoin ou coordonnées" value="${esc(search)}"></div>
    <div class="sc-chips" aria-label="Contacts à afficher">${screenChip('contacts','all','Tous',contacts.length)}${screenChip('contacts','due','À relancer',due)}${screenChip('contacts','ongoing','En échange',ongoing)}${screenChip('contacts','won','Gagnés',won)}</div>
    <div class="sc-contact-grid">${screenContactList(contacts)}</div></div>`;
}

function screenTimeBreakdown(entries, minutes) {
  const totals = new Map(Object.entries(cats).map(([key]) => [key, 0]));
  entries.forEach(row => totals.set(row.cat, (totals.get(row.cat) || 0) + row.actual));
  const rows = [...totals].sort((a,b) => b[1] - a[1]).map(([key, total]) => {
    const share = screenPercent(total, minutes);
    return `<div class="sc-time-row" data-tone="${esc(key)}"><div><span>${esc(cats[key] || key)}</span><b>${fmt(total)}</b></div><div class="sc-track"><i style="width:${share}%"></i></div></div>`;
  }).join('');
  return '<section class="sc-panel"><div class="sc-panel-heading"><h2>Temps par piste</h2><span>' + fmt(minutes) + '</span></div>' + rows + '</section>';
}

function screenJournal(entries, ledgerMode) {
  if (!entries.length) return '<div class="sc-journal-empty">' + (ledgerMode ? 'Aucun montant saisi sur cette période.' : 'Aucune action terminée sur cette période.') + '</div>';
  return entries.slice().reverse().sort((a,b) => b.date.localeCompare(a.date)).map(row => {
    const isIncome = row.type === 'income';
    const detail = ledgerMode ? cats[row.cat] : 'Prévu ' + fmt(row.estimate);
    const value = ledgerMode ? (isIncome ? '+' : '−') + screenAmount(row.amount) : fmt(row.actual);
    const button = ledgerMode ? '<button data-removemoney="' + esc(row.id) + '" class="sc-inline-action">Supprimer</button>' : '<button data-undo="' + esc(row.id) + '" class="sc-inline-action">Réouvrir</button>';
    return `<div class="sc-journal-row"><span class="sc-journal-icon">${screenIcon(ledgerMode ? (isIncome ? 'plusCircle' : 'minusCircle') : 'list')}</span><div class="sc-journal-text"><strong>${esc(ledgerMode ? row.label : row.title)}</strong><small>${screenDate(row.date)} · ${esc(detail || '')}</small></div><div class="sc-journal-value"><strong>${value}</strong>${button}</div></div>`;
  }).join('');
}

function renderStats() {
  const thisMonth = today().slice(0,7);
  const lastWeekStart = addDays(today(), -6);
  function inPeriod(entry) {
    if (screenFilters.stats === 'all') return true;
    if (screenFilters.stats === 'week') return entry.date >= lastWeekStart && entry.date <= today();
    return entry.date.slice(0,7) === thisMonth;
  }
  const ledger = state.ledger.filter(inPeriod);
  const history = state.history.filter(inPeriod);
  const time = history.reduce((total, entry) => total + entry.actual, 0);
  const amountOf = type => ledger.filter(row => row.type === type).reduce((total, entry) => total + entry.amount, 0);
  const income = amountOf('income');
  const expenses = amountOf('expense');
  const goal = state.settings.goal;
  const received = monthIncome();
  const goalPercent = screenPercent(received, goal);
  const ledgerMode = screenFilters.journal === 'ledger';
  const action = '<button class="sc-main-action" data-money>' + screenIcon('plus') + 'Saisir un montant</button>';
  return `<div class="sc-page">${screenHeading('Mes résultats', 'Compare ton temps de travail aux montants réellement encaissés.', action)}
    <div class="sc-chips" aria-label="Période des résultats">${screenChip('stats','week','7 jours')}${screenChip('stats','month','Ce mois')}${screenChip('stats','all','Depuis le début')}</div>
    <div class="sc-stats-top"><section class="sc-net"><span>${screenIcon('wallet')}Résultat net saisi</span><strong>${screenAmount(income - expenses)}</strong><div><div><small>Encaissé</small><b>${screenAmount(income)}</b></div><div><small>Dépensé</small><b>${screenAmount(expenses)}</b></div></div></section>
    <section class="sc-effort"><span>${screenIcon('clock')}Temps investi</span><strong>${fmt(time)}</strong><p>${history.length} action${history.length === 1 ? '' : 's'} terminée${history.length === 1 ? '' : 's'}</p><small>${time ? screenAmount((income - expenses) / (time / 60)) + ' nets par heure saisie' : 'Le temps se renseigne en terminant une action.'}</small></section></div>
    <div class="sc-stats-details">${screenTimeBreakdown(history, time)}<section class="sc-panel sc-goal"><div class="sc-panel-heading"><h2>Objectif du mois</h2><button data-settings class="sc-edit" aria-label="Modifier l’objectif du mois">${screenIcon('tune')}</button></div><strong>${screenAmount(received)} <small>/ ${screenAmount(goal)}</small></strong><div class="sc-track"><i style="width:${goalPercent}%"></i></div><p>${goalPercent >= 100 ? 'Objectif atteint' : screenAmount(Math.max(0,goal - received)) + ' à encaisser pour atteindre ton objectif'}</p></section></div>
    <section class="sc-panel"><div class="sc-panel-heading"><h2>Journal</h2></div><div class="sc-chips" aria-label="Type de journal">${screenChip('journal','ledger','Montants',ledger.length)}${screenChip('journal','history','Actions',history.length)}</div>${screenJournal(ledgerMode ? ledger : history, ledgerMode)}</section></div>`;
}

document.addEventListener('click', event => {
  const chip = event.target.closest('button[data-screen-group]');
  if (chip) {
    const group = chip.dataset.screenGroup;
    screenFilters[group] = chip.dataset.screenValue;
    render();
    const replacement = Array.from(document.querySelectorAll('button[data-screen-group]')).find(button => button.dataset.screenGroup === group && button.dataset.screenValue === screenFilters[group]);
    replacement?.focus({ preventScroll: true });
  }
  if (event.target.closest('button[data-clear-contact-filters]')) {
    screenFilters.contacts = 'all';
    search = '';
    render();
    document.querySelector('#search')?.focus({ preventScroll: true });
  }
});

// Keep the same native input and caret while a phone keyboard is composing text.
document.addEventListener('input', event => {
  if (view !== 'contacts' || event.target.id !== 'search') return;
  const list = document.querySelector('.sc-contact-grid');
  if (!list) return;
  event.stopImmediatePropagation();
  search = event.target.value;
  list.innerHTML = screenContactList(state.contacts);
}, true);
