import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
export const sessions = sqliteTable("sessions", {hour: integer("hour").primaryKey(), payload: text("payload").notNull()});
