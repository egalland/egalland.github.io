import { readFile } from 'node:fs/promises';
import { summarize } from './bilan-model.mjs';

const [path, date] = process.argv.slice(2);
if (!path) throw new Error('Utilisation : node bilan.mjs fichier.json [AAAA-MM-JJ]');
const input = JSON.parse(await readFile(path, 'utf8'));
const { rows, totals = [] } = input;
if (!Array.isArray(rows) || !Array.isArray(totals)) throw new Error('rows et totals doivent être des listes.');
const dates = date ? [date] : [...new Set(rows.map(row => row.date))].sort();
console.log(JSON.stringify(dates.map(day => summarize(day, rows, totals)), null, 2));
