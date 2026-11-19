CREATE TABLE `game_activity` (
	`id` text PRIMARY KEY NOT NULL,
	`generation` text NOT NULL,
	`at` integer NOT NULL,
	`actor` text NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`category` text NOT NULL,
	`action` text NOT NULL,
	`summary` text NOT NULL,
	`context` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `activity_time` ON `game_activity` (`at`,`id`);--> statement-breakpoint
CREATE INDEX `activity_generation` ON `game_activity` (`generation`,`at`);--> statement-breakpoint
CREATE INDEX `activity_actor` ON `game_activity` (`actor`,`at`);--> statement-breakpoint
CREATE INDEX `activity_category` ON `game_activity` (`category`,`at`);