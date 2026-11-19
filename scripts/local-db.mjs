import { DatabaseSync } from 'node:sqlite';

// SQLite adapter for the subset of the D1 API used by the Worker, shared by preview and integration tests.
export function localDatabase() {
  const database=new DatabaseSync(':memory:');
  return {
    prepare(sql) {
      let args=[];
      const stmt={
        bind(...values){args=values;return stmt;},
        results(){return database.prepare(sql).all(...args);},
        async first(){return database.prepare(sql).get(...args) || null;},
        async run(){return database.prepare(sql).run(...args);}
      };
      return stmt;
    },
    async batch(stmts) {
      database.exec('BEGIN IMMEDIATE');
      try {
        const result=stmts.map(stmt=>({results:stmt.results()}));
        database.exec('COMMIT');return result;
      } catch(error) {
        database.exec('ROLLBACK');throw error;
      }
    },
    close() {database.close();}
  };
}
