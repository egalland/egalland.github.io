import { readFile } from 'node:fs/promises';
import { simulate } from './model.js';

const [parametersPath, scenario = 'central'] = process.argv.slice(2);
if (!['central', 'prudent', 'soutenu'].includes(scenario)) {
  throw new Error('Le scénario doit être central, prudent ou soutenu.');
}
const parameters = parametersPath ? JSON.parse(await readFile(parametersPath, 'utf8')) : {};
const result = simulate(parameters, scenario);
console.log(JSON.stringify({ scenario, assumptions: result.params, summary: result.summary, years: result.years }, null, 2));
