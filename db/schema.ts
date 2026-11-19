import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(), slug: text("slug").notNull().unique(),
  name: text("name").notNull(), subtitle: text("subtitle").notNull().default(""),
  description: text("description").notNull().default(""), category: text("category").notNull().default("ideas"),
  status: text("status").notNull().default("ideas"), progress: integer("progress").notNull().default(0),
  priority: text("priority").notNull().default("medium"), tags: text("tags").notNull().default("[]"),
  demoUrl: text("demo_url"), repositoryUrl: text("repository_url"), workUrl: text("work_url"),
  promptCount: integer("prompt_count"), activeMinutes: integer("active_minutes"), aiSessions: integer("ai_sessions"),
  commits: integer("commits"), files: integer("files"), loc: integer("loc"),
  traditionalDevHours: integer("traditional_dev_hours"), traditionalDevValue: integer("traditional_dev_value"),
  metricSource: text("metric_source").notNull().default("estimated"),
  createdAt: text("created_at").notNull(), lastWorkedAt: text("last_worked_at"),
  changelog: text("changelog").notNull().default("[]"),
});

export const workSessions = sqliteTable("work_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: text("project_id").notNull().references(() => projects.id),
  startedAt: text("started_at").notNull(), pausedAt: text("paused_at"), stoppedAt: text("stopped_at"),
  accumulatedSeconds: integer("accumulated_seconds").notNull().default(0),
});
