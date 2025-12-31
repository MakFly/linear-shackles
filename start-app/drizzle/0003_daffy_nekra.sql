CREATE TABLE `provider_credentials` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`project_id` text NOT NULL,
	`token` text NOT NULL,
	`provider_url` text,
	`provider_repo` text,
	`user_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `issues` ADD `position` integer DEFAULT 0;