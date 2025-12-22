CREATE TABLE `teams` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `issues` ADD `project_id` text;--> statement-breakpoint
ALTER TABLE `issues` ADD `provider_issue_id` text;--> statement-breakpoint
ALTER TABLE `team_members` ADD `team_id` text REFERENCES teams(id);
--> statement-breakpoint
-- Create default team and assign existing members
INSERT INTO `teams` (`id`, `name`, `description`, `created_at`, `updated_at`) 
VALUES ('default-team', 'Équipe par défaut', 'Équipe créée automatiquement', datetime('now'), datetime('now'));
--> statement-breakpoint
UPDATE `team_members` SET `team_id` = 'default-team' WHERE `team_id` IS NULL;
--> statement-breakpoint
-- Now make team_id NOT NULL
-- Note: SQLite doesn't support ALTER COLUMN, so we need to recreate the table
-- This is handled by drizzle-kit in practice, but for manual migration:
-- The constraint will be enforced by the application layer