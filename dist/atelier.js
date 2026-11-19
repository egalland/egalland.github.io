const lineIcons = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
  flag: '<path d="M5 21V4c4-3 8 3 14 0v10c-5 3-10-3-14 0"/>',
  play: '<path d="m8 4 12 8-12 8Z"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  filter: '<path d="M3 7h7m4 0h7M3 17h11m4 0h3"/><circle cx="12" cy="7" r="2"/><circle cx="16" cy="17" r="2"/>',
  arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  repeat:'<path d="M4 10V7h15l-3-3m4 10v3H5l3 3"/>',
  check:'<path d="m5 13 4 4L19 7"/>', spark:'<path d="m12 3 2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2Z"/>',
  layers:'<path d="m3 8 9-5 9 5-9 5zM3 12l9 5 9-5M3 16l9 5 9-5"/>',
  scan:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  bag:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v5m10-5v5M3 10h18"/>'
};
function glyph(name, size = 18) {
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${lineIcons[name] || icons[name] || ''}</svg>`;
}
const navNames = {plan:'Agenda',ideas:'Pistes',contacts:'Prospection',stats:'Résultats'};
const routes = {plan:'agenda', ideas:'pistes', contacts:'prospection', stats:'resultats'};
function readRoute() {
  return Object.keys(routes).find(key => '#'+routes[key] === location.hash) || 'plan';
}
view = readRoute();
let displayedView = view;
window.addEventListener('hashchange', () => {
  if (view === readRoute()) return;
  view = readRoute();
  displayedView = view;
  search = '';
  if ($('#modal').open) close();
  render();
  window.scrollTo(0,0);
});
let filtersOpen = false;
let pickedDate = null;
const fullDate = day => new Date(day+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
const compactDate = day => new Date(day+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
function render() {
  save();
  if (view !== displayedView) {
    displayedView = view;
    history.pushState(null,'','#'+routes[view]);
  }
  const count = state.tasks.filter(item => item.date <= today()).length;
  $('#nav').innerHTML = Object.entries(navNames).map(([key,name]) =>
    `<button data-view="${key}" ${view===key?'aria-current="page" class="active"':''}>${glyph(key==='plan'?'calendar':key)}<span>${name}</span>${key==='plan' && count ? `<b class="nav-count">${count}</b>` : ''}</button>`
  ).join('');
  const draw = {plan:renderPlan,ideas:renderIdeas,contacts:renderContacts,stats:renderStats};
  $('#content').innerHTML = draw[view]();
  $('#content').dataset.view = view;
}
function byPriority(a,b) {
  return (b.priority==='high')-(a.priority==='high') || a.date.localeCompare(b.date) || a.min-b.min;
}
const trackedMinutes = day => state.history.filter(h=>h.date===day).reduce((sum,h)=>sum+h.actual,0);
function nextAction() {
  const active = window.elanChrono?.current();
  if (active) return state.tasks.find(t=>t.id===active.id);
  const remaining = Math.max(0,state.settings.budget-trackedMinutes(today()));
  const due = state.tasks.filter(t=>t.date<=today()).sort(byPriority);
  return due.find(t=>t.min<=remaining) || due[0];
}
function focusCard() {
  const t = nextAction();
  const active = window.elanChrono?.current();
  const title = t ? esc(t.title) : 'Choisis ta prochaine piste';
  return `<section class="focus-card"><div class="focus-copy"><div class="focus-eyebrow"><i></i>${active?(active.running?'SESSION EN COURS':'SESSION EN PAUSE'):'PROCHAINE ACTION'}</div>
    <h2>${title}</h2>
    ${t?`<div class="focus-meta"><span>${glyph('clock',15)} ${fmt(t.min)}</span><span>${esc(cats[t.cat])}</span></div>`:'<p>Aucune action prévue pour aujourd’hui.</p>'}
    <button class="start-action" ${t?`data-focus="${esc(t.id)}"`:'data-view="ideas"'}>${glyph(t?'play':'spark',16)} ${active?'Ouvrir le chrono':t?'Démarrer':'Explorer les pistes'}</button>
    </div><div class="sculpture-stage" aria-hidden="true"><img class="sculpture studio-sculpture" width="760" height="700" src="sculpture.webp" alt="" fetchpriority="high"></div></section>`;
}
function weekData() {
  const day = new Date(today()+'T12:00:00').getDay();
  const monday = addDays(today(),-((day+6)%7));
  return Array.from({length:7},(_,i)=>{
    const date = addDays(monday,i);
    return {date,done:trackedMinutes(date),plan:state.tasks.filter(t=>t.date===date).reduce((n,t)=>n+t.min,0)};
  });
}
function weekCard() {
  const days = weekData();
  const total = days.reduce((s,d)=>s+d.done,0);
  const peak = Math.max(30,...days.map(d=>d.done+d.plan));
  const initials = ['Lu','Ma','Me','Je','Ve','Sa','Di'];
  return `<section class="week-card"><div class="wk-head"><h2>Ma semaine</h2><small>${compactDate(days[0].date)} – ${compactDate(days[6].date)}</small></div>
    <div class="wk-number">${fmt(total)} <span>de travail réalisé</span></div>
    <div class="bars">${days.map((d,i)=>`<button class="bar-day ${d.date===today()?'is-today':''}" data-day="${d.date}" aria-label="Voir ${esc(fullDate(d.date))}, ${fmt(d.done)} effectuées et ${fmt(d.plan)} à faire">
      <span class="chart-value" aria-hidden="true">${fmt(d.done+d.plan)}</span><span class="bar-column"><b style="height:${100*d.plan/peak}%"></b><i style="height:${100*d.done/peak}%"></i></span>
      <span class="day-label">${initials[i]}</span></button>`).join('')}</div><div class="legend"><span><i></i>Réalisé</span><span><i></i>À faire</span></div></section>`;
}
function taskRow(t) {
  const overdue = t.date<today();
  return `<article class="action-row" data-category="${esc(t.cat)}">
    <button class="complete-target" data-done="${esc(t.id)}" aria-label="Terminer : ${esc(t.title)}"><i>${glyph('check',13)}</i></button>
    <button class="task-detail" data-edit="${esc(t.id)}"><strong>${esc(t.title)}</strong>
    <span class="action-details"><span class="track-chip ${esc(t.cat)}"><i></i>${esc(cats[t.cat])}</span><span>${glyph('clock',13)} ${fmt(t.min)}</span>${t.repeat!=='none'?`<span title="${esc(repeatName[t.repeat])}">${glyph('repeat',14)}<span class="sr-only">${esc(repeatName[t.repeat])}</span></span>`:''}${overdue?`<span class="late">Depuis le ${compactDate(t.date)}</span>`:t.date!==today()?`<span>${compactDate(t.date)}</span>`:''}</span></button>
    <button class="row-start" data-focus="${esc(t.id)}" aria-label="Démarrer : ${esc(t.title)}">${glyph('play',15)}</button></article>`;
}
function taskList() {
  let relevant = state.tasks.filter(t=>{
    if (filter==='day') return t.date===pickedDate;
    if (filter==='today') return t.date<=today();
    if (filter==='week') return t.date<=addDays(today(),6);
    return true;
  }).filter(t=>(category==='all'||category===t.cat)&&t.title.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr'))).sort(byPriority);
  const filters=[['today','Aujourd’hui'],['week','7 jours'],['all','Tout']];
  if(filter==='day') filters.push(['day',compactDate(pickedDate)]);
  return `<section class="actions-block" id="actions"><div class="block-title"><h2>Mes actions <span class="count-pill">${relevant.length}</span></h2><button class="text-tool" data-auto>${glyph('spark',16)} Composer ma session</button></div>
    <div class="list-controls"><div class="scope-tabs">${filters.map(([k,v])=>`<button data-filter="${k}" aria-pressed="${filter===k}">${v}</button>`).join('')}</div>
    <button class="filter-button" data-showfilters aria-label="Recherche et filtres" aria-expanded="${filtersOpen}" title="Recherche et filtres">${glyph('filter',17)}<span>Filtres</span>${search||category!=='all'?' •':''}</button></div>
    ${filtersOpen?`<div class="query-row"><input id="agendaQuery" type="search" placeholder="Rechercher une action" aria-label="Rechercher une action" value="${esc(search)}"><select id="catFilter" aria-label="Piste">${options({all:'Toutes les pistes',...cats},category)}</select><button class="quiet" data-clearfilters>Effacer</button></div>`:''}
    <div class="action-list">${relevant.map(taskRow).join('') || `<div class="no-actions"><strong>Aucune action dans cette vue</strong><button class="text-tool" data-new>${glyph('plus',16)} Ajouter une action</button></div>`}</div>
    <div class="list-total">${glyph('clock',14)} ${fmt(relevant.reduce((s,t)=>s+t.min,0))} au total</div></section>`;
}
function overview() {
  const active = state.contacts.filter(c=>!['won','lost'].includes(c.status));
  const overdue=active.filter(c=>c.follow&&c.follow<=today()).length;
  const income=monthIncome(), goal=state.settings.goal;
  return `<section class="overview"><div class="block-title"><h2>Repères du mois</h2>${glyph('flag',18)}</div>
    <button class="glance" data-view="stats"><span class="glance-icon pale">${glyph('stats',21)}</span><span><small>Revenus encaissés</small><strong>${euro(income)} <em>/ ${euro(goal)}</em></strong></span>${glyph('arrow',15)}</button><div class="money-line"><i style="width:${Math.min(100,income/Math.max(1,goal)*100)}%"></i></div>
    <button class="glance" data-view="contacts"><span class="glance-icon clay">${glyph('contacts',21)}</span><span><small>Prospects à relancer</small><strong>${overdue} <em>/ ${active.length} en suivi</em></strong></span>${glyph('arrow',15)}</button></section>`;
}
function renderPlan() {
  const remaining = Math.max(0,state.settings.budget-trackedMinutes(today()));
  return `<div class="agenda-heading"><div><div class="agenda-date">${glyph('sun',15)} ${fullDate(today())}</div><h1>Mon agenda<span>.</span></h1><p><b>${fmt(remaining)}</b> disponibles aujourd’hui</p></div>
    <button class="add-action" data-new>${glyph('plus',18)}<span class="new-full">Nouvelle action</span><span class="new-short">Ajouter</span></button></div>
    <div class="agenda-grid">${focusCard()}${weekCard()}${taskList()}${overview()}</div>`;
}
document.addEventListener('click', event=>{
  const button=event.target.closest('button');
  if(!button) return;
  if(button.hasAttribute('data-showfilters')) {
    filtersOpen=!filtersOpen;
    render();
    if(filtersOpen) $('#agendaQuery')?.focus();
  } else if(button.hasAttribute('data-clearfilters')){
    category='all'; search=''; render();
  } else if(button.dataset.day) {
    pickedDate=button.dataset.day;filter='day';category='all';search=''; render();
    $('#actions').scrollIntoView({behavior:'smooth',block:'start'});
  }
});
document.addEventListener('elan:chronochange',()=>{if(view==='plan') render()});

// Keep the live input mounted so typing preserves the phone keyboard and caret.
document.addEventListener('input', event => {
  if (event.target.id !== 'agendaQuery') return;
  search = event.target.value;
  const template = document.createElement('template');
  template.innerHTML = taskList();
  for (const selector of ['.action-list','.count-pill','.list-total','.filter-button']) {
    document.querySelector('#actions '+selector).replaceWith(template.content.querySelector(selector));
  }
});
