import { readFile } from 'node:fs/promises';
import { analyzeEvents } from './analysis.mjs';
const [path, count = '2'] = process.argv.slice(2);
if (!path) throw new Error('Utilisation : node report.mjs fichier.json [nombre-usines]');
const input = JSON.parse(await readFile(path, 'utf8'));
console.log(JSON.stringify(analyzeEvents(Array.isArray(input) ? input : input.rows, Number(count)), null, 2));
