CREATE TABLE `activity_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`activity_date` text NOT NULL,
	`activity_type` text NOT NULL,
	`category` text NOT NULL,
	`duration_minutes` integer NOT NULL,
	`distance_km` real,
	`steps` integer,
	`calories` integer,
	`intensity` integer,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `app_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`weekly_budget_cents` integer NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`weekly_email` integer DEFAULT false NOT NULL,
	`email_day` text DEFAULT 'dimanche' NOT NULL,
	`email_time` text DEFAULT '18:00' NOT NULL,
	`compact_mode` integer DEFAULT false NOT NULL,
	`accent` text DEFAULT 'lime' NOT NULL,
	`garden_history_imported_at` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `daily_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`log_date` text NOT NULL,
	`weight_kg` real,
	`body_fat_pct` real,
	`waist_cm` real,
	`calories` integer,
	`protein_g` integer,
	`carbs_g` integer,
	`fat_g` integer,
	`steps` integer,
	`water_ml` integer,
	`sleep_hours` real,
	`energy` integer,
	`training_minutes` integer,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_logs_log_date_unique` ON `daily_logs` (`log_date`);--> statement-breakpoint
CREATE TABLE `foods` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`category` text DEFAULT 'Autre' NOT NULL,
	`price_per_kg` real,
	`kcal_per_100g` real,
	`protein_per_100g` real,
	`carbs_per_100g` real,
	`fat_per_100g` real,
	`source` text DEFAULT '' NOT NULL,
	`favorite` integer DEFAULT false NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `harvest_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`harvest_date` text NOT NULL,
	`produce_id` integer,
	`produce_name` text NOT NULL,
	`variety` text DEFAULT '' NOT NULL,
	`weight_kg` real NOT NULL,
	`unit_count` integer,
	`destination` text DEFAULT 'À consommer' NOT NULL,
	`price_mode` text DEFAULT 'legacy' NOT NULL,
	`price_per_kg` real,
	`value_cents` integer,
	`note` text DEFAULT '' NOT NULL,
	`source_key` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`produce_id`) REFERENCES `produce_catalog`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `harvest_entries_source_key_unique` ON `harvest_entries` (`source_key`);--> statement-breakpoint
CREATE TABLE `measurements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`measured_at` text NOT NULL,
	`weight_kg` real,
	`body_fat_pct` real,
	`chest_cm` real,
	`waist_cm` real,
	`abdomen_cm` real,
	`hips_cm` real,
	`biceps_left_cm` real,
	`biceps_right_cm` real,
	`thigh_left_cm` real,
	`thigh_right_cm` real,
	`calves_cm` real,
	`neck_cm` real,
	`shoulders_cm` real,
	`forearm_left_cm` real,
	`forearm_right_cm` real,
	`calf_left_cm` real,
	`calf_right_cm` real,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `produce_catalog` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`variety` text DEFAULT '' NOT NULL,
	`category` text DEFAULT 'Légume' NOT NULL,
	`default_price_per_kg` real,
	`price_source` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `produce_catalog_name_variety_unique` ON `produce_catalog` (`name`,`variety`);--> statement-breakpoint
CREATE TABLE `produce_prices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`produce_id` integer NOT NULL,
	`effective_at` text NOT NULL,
	`price_per_kg` real NOT NULL,
	`source` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`produce_id`) REFERENCES `produce_catalog`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`height_cm` real NOT NULL,
	`baseline_weight_kg` real NOT NULL,
	`baseline_body_fat_pct` real,
	`target_phase_one_kg` real NOT NULL,
	`target_weight_kg` real NOT NULL,
	`target_body_fat_pct` real NOT NULL,
	`daily_calories` integer NOT NULL,
	`daily_protein_g` integer,
	`daily_steps` integer NOT NULL,
	`weekly_workouts` integer NOT NULL,
	`personal_goal_date` text,
	`weekly_loss_rate_kg` real DEFAULT 0.5 NOT NULL,
	`wrist_cm` real,
	`ankle_cm` real,
	`proportion_model` text DEFAULT 'classic' NOT NULL,
	`proportion_tolerance_pct` real DEFAULT 4 NOT NULL,
	`custom_body_targets` text DEFAULT '{}' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `program_days` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`program_id` integer NOT NULL,
	`name` text NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`cardio_minutes` integer,
	`note` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`program_id`) REFERENCES `training_programs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `program_exercises` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`day_id` integer NOT NULL,
	`name` text NOT NULL,
	`catalog_key` text,
	`muscle_group` text DEFAULT 'Autre' NOT NULL,
	`primary_muscles` text DEFAULT '[]' NOT NULL,
	`secondary_muscles` text DEFAULT '[]' NOT NULL,
	`equipment` text DEFAULT '' NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`target_sets` integer DEFAULT 3 NOT NULL,
	`target_reps_min` integer DEFAULT 8 NOT NULL,
	`target_reps_max` integer DEFAULT 12 NOT NULL,
	`rest_seconds` integer DEFAULT 90 NOT NULL,
	`default_weight_kg` real,
	`note` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`day_id`) REFERENCES `program_days`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `strength_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`program_day_id` integer,
	`session_name` text NOT NULL,
	`started_at` text NOT NULL,
	`completed_at` text,
	`duration_seconds` integer,
	`total_volume_kg` real DEFAULT 0 NOT NULL,
	`total_sets` integer DEFAULT 0 NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`program_day_id`) REFERENCES `program_days`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `strength_sets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`exercise_id` integer,
	`exercise_name` text NOT NULL,
	`set_index` integer NOT NULL,
	`reps` integer NOT NULL,
	`weight_kg` real DEFAULT 0 NOT NULL,
	`rir` real,
	`rest_seconds` integer,
	`completed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `strength_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `program_exercises`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `strength_sets_session_exercise_set_unique` ON `strength_sets` (`session_id`,`exercise_name`,`set_index`);--> statement-breakpoint
CREATE TABLE `supplements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`dose` text DEFAULT 'À paramétrer' NOT NULL,
	`timing` text DEFAULT 'À paramétrer' NOT NULL,
	`cost_cents` integer,
	`servings_per_pack` integer,
	`stock_servings` integer,
	`active` integer DEFAULT true NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `task_definitions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`domain` text DEFAULT 'Personnel' NOT NULL,
	`recurrence` text DEFAULT 'daily' NOT NULL,
	`default_time` text,
	`auto_source` text,
	`active` integer DEFAULT true NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `task_states` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL,
	`task_date` text NOT NULL,
	`status` text DEFAULT 'done' NOT NULL,
	`completed_at` text,
	`note` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `task_definitions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `task_states_task_date_unique` ON `task_states` (`task_id`,`task_date`);--> statement-breakpoint
CREATE TABLE `training_programs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workouts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workout_date` text NOT NULL,
	`type` text NOT NULL,
	`duration_minutes` integer NOT NULL,
	`volume_kg` real,
	`rpe` real,
	`exercises` integer,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
