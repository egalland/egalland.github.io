import { readQuotas } from '../bridge/server.mjs';
try {
 const result = await readQuotas();
 console.log('Lecture du compte reussie :');
 for (const w of result.windows) console.log(`${w.minutes} minutes : ${w.remaining} % restant ; renouvellement ${new Date(w.resetsAt*1000).toISOString()}`);
} catch (e) { console.error('ECHEC : '+e.message); process.exitCode=1; }
