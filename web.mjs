import { simulate } from './model.js';

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
  const params = {};
  for (const name of ['horizon', 'initialCapital', 'initialMachines', 'ownerHours']) params[name] = Number(values.get(name));
  const result = simulate(params, values.get('scenario'));
  const { totalRevenue, totalProfit, terminalCash } = result.summary;
  metrics([['CA cumulé', money(totalRevenue)], ['Bénéfice net cumulé', money(totalProfit)], ['Trésorerie finale', money(terminalCash)]]);
  table(['Année', 'CA', 'Bénéfice net', 'Trésorerie fin d’année'], result.years.map(y => [String(y.year), money(y.revenue), money(y.netProfit), money(y.cash)]));
}

refresh();
