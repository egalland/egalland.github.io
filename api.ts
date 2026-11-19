import { GET, POST } from './app/api/bodyos/route';
import { getConnection } from './db';
export { GET };
export async function write(request: Request) {
  const db = getConnection();
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = await POST(request);
    db.exec(result.ok ? 'COMMIT' : 'ROLLBACK');
    return result;
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}
