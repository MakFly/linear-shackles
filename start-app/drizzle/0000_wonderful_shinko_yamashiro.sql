CREATE TABLE `analytics_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`data` text NOT NULL,
	`timestamp` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `automations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`trigger_type` text NOT NULL,
	`trigger_condition` text,
	`action_type` text NOT NULL,
	`action_value` text,
	`enabled` integer DEFAULT true,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `issue_relationships` (
	`id` text PRIMARY KEY NOT NULL,
	`source_issue_id` text NOT NULL,
	`target_issue_id` text NOT NULL,
	`type` text NOT NULL,
	FOREIGN KEY (`source_issue_id`) REFERENCES `issues`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_issue_id`) REFERENCES `issues`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `issue_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`default_status` text DEFAULT 'backlog' NOT NULL,
	`default_priority` text DEFAULT 'medium' NOT NULL,
	`custom_fields` text,
	`labels` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `issues` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'backlog' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`date` text,
	`parent_id` text,
	`children_count` integer DEFAULT 0,
	`labels` text,
	`assignees` text,
	`custom_fields` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'active' NOT NULL,
	`progress` integer DEFAULT 0,
	`members` integer DEFAULT 0,
	`issues_count` integer DEFAULT 0,
	`due_date` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sprint_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`sprint_id` text NOT NULL,
	`date` text NOT NULL,
	`summary` text,
	`completed_issues` integer DEFAULT 0,
	`total_issues` integer DEFAULT 0,
	`velocity` integer DEFAULT 0,
	`notes` text,
	FOREIGN KEY (`sprint_id`) REFERENCES `sprints`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sprints` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`goal` text,
	`status` text DEFAULT 'planning' NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`issues` text DEFAULT '[]',
	`velocity` integer DEFAULT 0,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`avatar` text,
	`issues_assigned` integer DEFAULT 0,
	`issues_completed` integer DEFAULT 0,
	`status` text DEFAULT 'offline',
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_members_email_unique` ON `team_members` (`email`);--> statement-breakpoint
CREATE TABLE `updates` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`author` text NOT NULL,
	`content` text NOT NULL,
	`timestamp` text NOT NULL,
	`metadata` text
);
