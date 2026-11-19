import { summarize } from './bilan-model.mjs';

const form = document.querySelector('form');
const error = document.querySelector('#error');
const output = document.querySelector('#output');
const number = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
const count = n => n == null ? 'Indisponible' : number.format(n);
const money = n => n == null ? 'Indisponible' : number.format(n) + ' €';
function addText(parent, tag, content) {
  const item = document.createElement(tag);
  item.textContent = content;
  parent.append(item);
  return item;
}
function metrics(values) {
  const list = document.createElement('dl');
  list.className = 'metrics';
  for (const [label, value] of values) {
    const group = document.createElement('div');
    addText(group, 'dt', label);
    addText(group, 'dd', value);
    list.append(group);
  }
  output.append(list);
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
  const day = '2000-01-01';
  const row = { date: day };
  for (const [name, value] of values) row[name] = Number(value);
  if (row.vmin > row.vmax || row.dmin > row.dmax) throw new Error('Chaque minimum doit être inférieur ou égal à son maximum.');
  const r = summarize(day, [row]);
  metrics([['Temps assisté', `${count(r.vmin)} à ${count(r.vmax)} min`], ['Équivalent développeur', `${count(r.dmin)} à ${count(r.dmax)} h`], ['Écart de valorisation', `${money(r.gapEuroMin)} à ${money(r.gapEuroMax)}`]]);
  table(['Lignes ajoutées', 'Lignes supprimées', 'Solde net', 'Écart de temps (min)'], [[count(r.added), count(r.deleted), count(r.net), `${count(r.gapMin)} à ${count(r.gapMax)}`]]);
}

refresh();
