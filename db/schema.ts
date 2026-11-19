import { sql } from "drizzle-orm";
import {
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  heightCm: real("height_cm").notNull(),
  baselineWeightKg: real("baseline_weight_kg").notNull(),
  baselineBodyFatPct: real("baseline_body_fat_pct"),
  targetPhaseOneKg: real("target_phase_one_kg").notNull(),
  targetWeightKg: real("target_weight_kg").notNull(),
  targetBodyFatPct: real("target_body_fat_pct").notNull(),
  dailyCalories: integer("daily_calories").notNull(),
  dailyProteinG: integer("daily_protein_g"),
  dailySteps: integer("daily_steps").notNull(),
  weeklyWorkouts: integer("weekly_workouts").notNull(),
  personalGoalDate: text("personal_goal_date"),
  weeklyLossRateKg: real("weekly_loss_rate_kg").notNull().default(0.5),
  wristCm: real("wrist_cm"),
  ankleCm: real("ankle_cm"),
  proportionModel: text("proportion_model").notNull().default("classic"),
  proportionTolerancePct: real("proportion_tolerance_pct").notNull().default(4),
  customBodyTargets: text("custom_body_targets").notNull().default("{}"),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const dailyLogs = sqliteTable("daily_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  logDate: text("log_date").notNull().unique(),
  weightKg: real("weight_kg"),
  bodyFatPct: real("body_fat_pct"),
  waistCm: real("waist_cm"),
  calories: integer("calories"),
  proteinG: integer("protein_g"),
  carbsG: integer("carbs_g"),
  fatG: integer("fat_g"),
  steps: integer("steps"),
  waterMl: integer("water_ml"),
  sleepHours: real("sleep_hours"),
  energy: integer("energy"),
  trainingMinutes: integer("training_minutes"),
  notes: text("notes").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const measurements = sqliteTable("measurements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  measuredAt: text("measured_at").notNull(),
  weightKg: real("weight_kg"),
  bodyFatPct: real("body_fat_pct"),
  chestCm: real("chest_cm"),
  waistCm: real("waist_cm"),
  abdomenCm: real("abdomen_cm"),
  hipsCm: real("hips_cm"),
  bicepsLeftCm: real("biceps_left_cm"),
  bicepsRightCm: real("biceps_right_cm"),
  thighLeftCm: real("thigh_left_cm"),
  thighRightCm: real("thigh_right_cm"),
  calvesCm: real("calves_cm"),
  neckCm: real("neck_cm"),
  shouldersCm: real("shoulders_cm"),
  forearmLeftCm: real("forearm_left_cm"),
  forearmRightCm: real("forearm_right_cm"),
  calfLeftCm: real("calf_left_cm"),
  calfRightCm: real("calf_right_cm"),
  note: text("note").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const workouts = sqliteTable("workouts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workoutDate: text("workout_date").notNull(),
  type: text("type").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  volumeKg: real("volume_kg"),
  rpe: real("rpe"),
  exercises: integer("exercises"),
  note: text("note").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const activityLogs = sqliteTable("activity_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  activityDate: text("activity_date").notNull(),
  activityType: text("activity_type").notNull(),
  category: text("category").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  distanceKm: real("distance_km"),
  steps: integer("steps"),
  calories: integer("calories"),
  intensity: integer("intensity"),
  note: text("note").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const trainingPrograms = sqliteTable("training_programs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  active: integer("active", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const programDays = sqliteTable("program_days", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  programId: integer("program_id")
    .notNull()
    .references(() => trainingPrograms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  cardioMinutes: integer("cardio_minutes"),
  note: text("note").notNull().default(""),
});

export const programExercises = sqliteTable("program_exercises", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  dayId: integer("day_id")
    .notNull()
    .references(() => programDays.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  catalogKey: text("catalog_key"),
  muscleGroup: text("muscle_group").notNull().default("Autre"),
  primaryMuscles: text("primary_muscles").notNull().default("[]"),
  secondaryMuscles: text("secondary_muscles").notNull().default("[]"),
  equipment: text("equipment").notNull().default(""),
  orderIndex: integer("order_index").notNull().default(0),
  targetSets: integer("target_sets").notNull().default(3),
  targetRepsMin: integer("target_reps_min").notNull().default(8),
  targetRepsMax: integer("target_reps_max").notNull().default(12),
  restSeconds: integer("rest_seconds").notNull().default(90),
  defaultWeightKg: real("default_weight_kg"),
  note: text("note").notNull().default(""),
});

export const strengthSessions = sqliteTable("strength_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  programDayId: integer("program_day_id").references(() => programDays.id, {
    onDelete: "set null",
  }),
  sessionName: text("session_name").notNull(),
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at"),
  durationSeconds: integer("duration_seconds"),
  totalVolumeKg: real("total_volume_kg").notNull().default(0),
  totalSets: integer("total_sets").notNull().default(0),
  note: text("note").notNull().default(""),
});

export const strengthSets = sqliteTable(
  "strength_sets",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sessionId: integer("session_id")
      .notNull()
      .references(() => strengthSessions.id, { onDelete: "cascade" }),
    exerciseId: integer("exercise_id").references(() => programExercises.id, {
      onDelete: "set null",
    }),
    exerciseName: text("exercise_name").notNull(),
    setIndex: integer("set_index").notNull(),
    reps: integer("reps").notNull(),
    weightKg: real("weight_kg").notNull().default(0),
    rir: real("rir"),
    restSeconds: integer("rest_seconds"),
    completedAt: text("completed_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("strength_sets_session_exercise_set_unique").on(
      table.sessionId,
      table.exerciseName,
      table.setIndex,
    ),
  ],
);

export const foods = sqliteTable("foods", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull().default("Autre"),
  pricePerKg: real("price_per_kg"),
  kcalPer100g: real("kcal_per_100g"),
  proteinPer100g: real("protein_per_100g"),
  carbsPer100g: real("carbs_per_100g"),
  fatPer100g: real("fat_per_100g"),
  source: text("source").notNull().default(""),
  favorite: integer("favorite", { mode: "boolean" }).notNull().default(false),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const supplements = sqliteTable("supplements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  dose: text("dose").notNull().default("À paramétrer"),
  timing: text("timing").notNull().default("À paramétrer"),
  costCents: integer("cost_cents"),
  servingsPerPack: integer("servings_per_pack"),
  stockServings: integer("stock_servings"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  note: text("note").notNull().default(""),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const appSettings = sqliteTable("app_settings", {
  id: integer("id").primaryKey(),
  weeklyBudgetCents: integer("weekly_budget_cents").notNull(),
  email: text("email").notNull().default(""),
  weeklyEmail: integer("weekly_email", { mode: "boolean" })
    .notNull()
    .default(false),
  emailDay: text("email_day").notNull().default("dimanche"),
  emailTime: text("email_time").notNull().default("18:00"),
  compactMode: integer("compact_mode", { mode: "boolean" })
    .notNull()
    .default(false),
  accent: text("accent").notNull().default("lime"),
  gardenHistoryImportedAt: text("garden_history_imported_at"),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const taskDefinitions = sqliteTable("task_definitions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  domain: text("domain").notNull().default("Personnel"),
  recurrence: text("recurrence").notNull().default("daily"),
  defaultTime: text("default_time"),
  autoSource: text("auto_source"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const taskStates = sqliteTable(
  "task_states",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    taskId: integer("task_id")
      .notNull()
      .references(() => taskDefinitions.id, { onDelete: "cascade" }),
    taskDate: text("task_date").notNull(),
    status: text("status").notNull().default("done"),
    completedAt: text("completed_at"),
    note: text("note").notNull().default(""),
  },
  (table) => [
    uniqueIndex("task_states_task_date_unique").on(
      table.taskId,
      table.taskDate,
    ),
  ],
);

export const produceCatalog = sqliteTable(
  "produce_catalog",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    variety: text("variety").notNull().default(""),
    category: text("category").notNull().default("Légume"),
    defaultPricePerKg: real("default_price_per_kg"),
    priceSource: text("price_source").notNull().default(""),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("produce_catalog_name_variety_unique").on(
      table.name,
      table.variety,
    ),
  ],
);

export const producePrices = sqliteTable("produce_prices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  produceId: integer("produce_id")
    .notNull()
    .references(() => produceCatalog.id, { onDelete: "cascade" }),
  effectiveAt: text("effective_at").notNull(),
  pricePerKg: real("price_per_kg").notNull(),
  source: text("source").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const harvestEntries = sqliteTable(
  "harvest_entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    harvestDate: text("harvest_date").notNull(),
    produceId: integer("produce_id").references(() => produceCatalog.id, {
      onDelete: "set null",
    }),
    produceName: text("produce_name").notNull(),
    variety: text("variety").notNull().default(""),
    weightKg: real("weight_kg").notNull(),
    unitCount: integer("unit_count"),
    destination: text("destination").notNull().default("À consommer"),
    priceMode: text("price_mode", {
      enum: ["legacy", "catalog", "manual"],
    })
      .notNull()
      .default("legacy"),
    pricePerKg: real("price_per_kg"),
    valueCents: integer("value_cents"),
    note: text("note").notNull().default(""),
    sourceKey: text("source_key"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("harvest_entries_source_key_unique").on(table.sourceKey),
  ],
);
