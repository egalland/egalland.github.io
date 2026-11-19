CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`subtitle` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`category` text DEFAULT 'ideas' NOT NULL,
	`status` text DEFAULT 'ideas' NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`demo_url` text,
	`repository_url` text,
	`work_url` text,
	`prompt_count` integer,
	`active_minutes` integer,
	`ai_sessions` integer,
	`commits` integer,
	`files` integer,
	`loc` integer,
	`traditional_dev_hours` integer,
	`traditional_dev_value` integer,
	`metric_source` text DEFAULT 'estimated' NOT NULL,
	`created_at` text NOT NULL,
	`last_worked_at` text,
	`changelog` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);--> statement-breakpoint
CREATE TABLE `work_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` text NOT NULL,
	`started_at` text NOT NULL,
	`paused_at` text,
	`stopped_at` text,
	`accumulated_seconds` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
