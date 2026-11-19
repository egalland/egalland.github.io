import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import * as schema from './schema';

function openDatabase() {
  const file = resolve(process.env.BODYOS_DEMO_DB ?? '.local/bodyos-demo.sqlite');
  mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=3000; BEGIN IMMEDIATE');
  try {
    const version = Number(db.prepare('PRAGMA user_version').get()?.user_version);
    const applicationId = Number(db.prepare('PRAGMA application_id').get()?.application_id);
    const demoId = 0x424f4453;
    if (version === 0 && applicationId === 0) {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      if (tables.length) throw new Error('Utilisez une base de démonstration neuve.');
      db.exec(readFileSync(resolve('db/schema.sql'), 'utf8'));
      db.prepare(`INSERT INTO profiles
        (id,name,height_cm,baseline_weight_kg,target_phase_one_kg,target_weight_kg,target_body_fat_pct,daily_calories,daily_steps,weekly_workouts)
        VALUES (1,?,?,?,?,?,?,?,?,?)`).run('Alex Démo', 165, 64, 64, 64, 24, 2000, 6000, 2);
      db.prepare('INSERT INTO app_settings (id,weekly_budget_cents) VALUES (1,0)').run();
      db.exec('PRAGMA application_id=1112491091; PRAGMA user_version=1');
    } else if (version !== 1 || applicationId !== demoId) throw new Error('Version de démonstration SQLite inconnue.');
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); db.close(); throw error; }
  return db;
}

let connection: DatabaseSync | undefined;
export function getConnection() { return connection ??= openDatabase(); }
export function getDb() {
  const db = getConnection();
  return drizzle(async (sql, params, method) => {
    const statement = db.prepare(sql);
    if (method === 'run') { statement.run(...params); return {rows: []}; }
    statement.setReturnArrays(true);
    if (method === 'get') return {rows: statement.get(...params) as unknown as unknown[]};
    return {rows: statement.all(...params) as unknown as unknown[][]};
  }, {schema});
}
