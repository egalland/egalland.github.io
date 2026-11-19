import { dirtyChunks, regionKeys, type Focus, type ChunkEdits } from './planet';
import { makeWorld, migrateWorld, type World } from './world';

import {RELEASE_ID} from './release';
// A different source/art build opens a fresh universe. Existing revisions remain archived.
export const WORLD_ID='strate-release-'+RELEASE_ID;
const PREFIX=WORLD_ID+':voxel:';
export type Snapshot={world:World;version:number};
/** Fetch the explored window at one database revision without advancing the game. */
export async function readRegionSnapshot(db: D1Database, focus: Focus): Promise<Snapshot | null> {
  const ids = [WORLD_ID, ...regionKeys(focus).map(key => PREFIX + key)];
  const { results } = await db.prepare(
    'SELECT id,state,version FROM voxel_worlds WHERE id IN (SELECT value FROM json_each(?))'
  ).bind(JSON.stringify(ids)).all<{id:string;state:string;version:number}>();
  const header = results.find(row => row.id === WORLD_ID);
  if (!header) return null;
  const world = migrateWorld(JSON.parse(header.state));
  for (const row of results) {
    if (row.id !== WORLD_ID) world.planet.chunks[row.id.slice(PREFIX.length)] = JSON.parse(row.state);
  }
  return {world, version: header.version};
}
export async function readWorld(db:D1Database):Promise<Snapshot|null>{
  const row=await db.prepare('SELECT state,version FROM voxel_worlds WHERE id=?').bind(WORLD_ID)
    .first<{state:string;version:number}>();
  if(!row){
    await db.prepare('INSERT OR IGNORE INTO voxel_worlds (id,state,version) VALUES (?,?,0)')
      .bind(WORLD_ID,JSON.stringify(makeWorld())).run();
    return null;
  }
  return {world:migrateWorld(JSON.parse(row.state)),version:row.version};
}
export async function readChunks(db:D1Database,w:World,keys:string[]){
  for(let offset=0;offset<keys.length;offset+=2000){
    const ids=keys.slice(offset,offset+2000).map(k=>PREFIX+k);
    const rows=await db.prepare('SELECT id,state FROM voxel_worlds WHERE id IN (SELECT value FROM json_each(?))')
      .bind(JSON.stringify(ids)).all<{id:string;state:string}>();
    for(const row of rows.results)w.planet.chunks[row.id.slice(PREFIX.length)]=JSON.parse(row.state) as ChunkEdits;
  }
}
export async function saveWorld(db:D1Database,snapshot:Snapshot){
  const {world:w,version}=snapshot;
  const commit=crypto.randomUUID();
  const {auditPending,...persisted}=w;
  const state=JSON.stringify({...persisted,commit,planet:{...w.planet,chunks:{}}});
  const statements=[db.prepare('UPDATE voxel_worlds SET state=?,version=version+1 WHERE id=? AND version=?')
    .bind(state,WORLD_ID,version)];
  // D1 batches are transactional. A losing compare-and-swap must never leave
  // chunk writes behind, even when two players mine the same block concurrently.
  // A per-batch nonce distinguishes rival writers targeting the same version.
  const changed=dirtyChunks(w.planet);
  for(let offset=0;offset<changed.length;offset+=48){
    const edits=changed.slice(offset,offset+48).map(key=>({id:PREFIX+key,state:w.planet.chunks[key]}));
    statements.push(db.prepare(`INSERT INTO voxel_worlds (id,state,version)
      SELECT json_extract(value,'$.id'),json_extract(value,'$.state'),0 FROM json_each(?)
      WHERE EXISTS (SELECT 1 FROM voxel_worlds WHERE id=? AND version=? AND json_extract(state,'$.commit')=?)
      ON CONFLICT(id) DO UPDATE SET state=excluded.state,version=voxel_worlds.version+1`)
      .bind(JSON.stringify(edits),WORLD_ID,version+1,commit));
  }
  for(let offset=0;offset<(auditPending?.length??0);offset+=80){
    statements.push(db.prepare(`INSERT OR IGNORE INTO game_activity(id,generation,at,actor,name,kind,category,action,summary,context)
      SELECT json_extract(value,'$.id'),json_extract(value,'$.generation'),json_extract(value,'$.at'),json_extract(value,'$.actor'),json_extract(value,'$.name'),json_extract(value,'$.kind'),json_extract(value,'$.category'),json_extract(value,'$.action'),json_extract(value,'$.summary'),json_extract(value,'$.context') FROM json_each(?)
      WHERE EXISTS(SELECT 1 FROM voxel_worlds WHERE id=? AND version=? AND json_extract(state,'$.commit')=?)`).bind(JSON.stringify(auditPending!.slice(offset,offset+80)),WORLD_ID,version+1,commit));
  }
  const [first]=await db.batch(statements);
  return first.meta.changes===1;
}
