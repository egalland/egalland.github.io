import { analyzeEvents } from './analysis.mjs';

const form = document.querySelector('form');
const error = document.querySelector('#error');
const output = document.querySelector('#output');
const number = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
const count = n => n == null ? 'Indisponible' : number.format(n);
function addText(parent, tag, content) {
  const item = document.createElement(tag);
  item.textContent = content;
  parent.append(item);
  return item;
}
function table(headings, rows) {
  const wrap = document.createElement('div');
  wrap.className = 'scroll';
  const element = document.createElement('table');
  const head = element.createTHead().insertRow();
  for (const label of headings) addText(head, 'th', label).scope = 'col';
  const body = element.createTBody();
  for (const values of rows) {
    const row = body.insertRow();
    for (const value of values) addText(row, 'td', value);
  }
  wrap.append(element);
  output.append(wrap);
}
function refresh() {
  error.textContent = '';
  output.replaceChildren();
  try { render(new FormData(form)); }
  catch (problem) { error.textContent = problem.message; }
}
form.addEventListener('submit', event => { event.preventDefault(); refresh(); });

function render(values) {
  let input;
  try { input = JSON.parse(values.get('events')); }
  catch { throw new Error('Le journal doit contenir un tableau JSON valide.'); }
  const rows = Array.isArray(input) ? input : input?.rows;
  if (!Array.isArray(rows) || !rows.every(row => row && typeof row === 'object')) throw new Error('Une liste d’événements est attendue.');
  const agents = analyzeEvents(rows, Number(values.get('factoryCount')));
  if (!agents.length) { addText(output, 'p', 'Le journal ne contient aucun événement.'); return; }
  table(['Agent', 'Événements', 'Ventes', 'Crédits mesurés', 'Ventes sans montant', 'Blocages', 'Reprises', 'Suspension totale'], agents.map(a => [a.name, count(a.events), count(a.sales), count(a.revenue), count(a.unvaluedSales), count(a.blocks), count(a.resumptions), a.pausePct == null ? 'Indisponible' : count(a.pausePct) + ' %']));
}

refresh();
