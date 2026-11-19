import {index,integer, sqliteTable, text} from 'drizzle-orm/sqlite-core';
export const rooms=sqliteTable('rooms',{id:text('id').primaryKey(),state:text('state').notNull(),version:integer('version').notNull().default(0)});
export const voxelWorlds=sqliteTable('voxel_worlds',{id:text('id').primaryKey(),state:text('state').notNull(),version:integer('version').notNull().default(0)});

export const gameActivity=sqliteTable('game_activity',{id:text('id').primaryKey(),generation:text('generation').notNull(),at:integer('at').notNull(),actor:text('actor').notNull(),name:text('name').notNull(),kind:text('kind').notNull(),category:text('category').notNull(),action:text('action').notNull(),summary:text('summary').notNull(),context:text('context').notNull()},table=>[index('activity_time').on(table.at,table.id),index('activity_generation').on(table.generation,table.at),index('activity_actor').on(table.actor,table.at),index('activity_category').on(table.category,table.at)]);
