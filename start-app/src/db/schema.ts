import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// Issues table
export const issues = sqliteTable("issues", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["done", "warning", "backlog", "progress"] }).notNull().default("backlog"),
  priority: text("priority", { enum: ["urgent", "high", "medium", "low", "none"] }).notNull().default("medium"),
  date: text("date"),
  parentId: text("parent_id"),
  childrenCount: integer("children_count").default(0),
  labels: text("labels", { mode: "json" }).$type<string[]>(),
  assignees: text("assignees", { mode: "json" }).$type<string[]>(),
  customFields: text("custom_fields", { mode: "json" }),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Issue relationships
export const issueRelationships = sqliteTable("issue_relationships", {
  id: text("id").primaryKey(),
  sourceIssueId: text("source_issue_id").notNull().references(() => issues.id, { onDelete: "cascade" }),
  targetIssueId: text("target_issue_id").notNull().references(() => issues.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["blocks", "blocked_by", "relates_to", "duplicates", "parent", "child"] }).notNull(),
});

// Projects table
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status", { enum: ["active", "completed", "paused"] }).notNull().default("active"),
  progress: integer("progress").default(0),
  members: integer("members").default(0),
  issuesCount: integer("issues_count").default(0),
  dueDate: text("due_date"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Sprints table
export const sprints = sqliteTable("sprints", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  goal: text("goal"),
  status: text("status", { enum: ["planning", "active", "completed", "archived"] }).notNull().default("planning"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  issues: text("issues", { mode: "json" }).$type<string[]>().default([]),
  velocity: integer("velocity").default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Sprint reviews
export const sprintReviews = sqliteTable("sprint_reviews", {
  id: text("id").primaryKey(),
  sprintId: text("sprint_id").notNull().references(() => sprints.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  summary: text("summary"),
  completedIssues: integer("completed_issues").default(0),
  totalIssues: integer("total_issues").default(0),
  velocity: integer("velocity").default(0),
  notes: text("notes"),
});

// Team members table
export const teamMembers = sqliteTable("team_members", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["owner", "admin", "member"] }).notNull().default("member"),
  avatar: text("avatar"),
  issuesAssigned: integer("issues_assigned").default(0),
  issuesCompleted: integer("issues_completed").default(0),
  status: text("status", { enum: ["online", "offline", "away"] }).default("offline"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Updates/Activity table
export const updates = sqliteTable("updates", {
  id: text("id").primaryKey(),
  type: text("type", { 
    enum: ["status_change", "sprint_created", "issue_created", "comment", "relationship", "review"] 
  }).notNull(),
  author: text("author").notNull(),
  content: text("content").notNull(),
  timestamp: text("timestamp").notNull(),
  metadata: text("metadata", { mode: "json" }),
});

// Templates table
export const issueTemplates = sqliteTable("issue_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  defaultStatus: text("default_status", { enum: ["done", "warning", "backlog", "progress"] }).notNull().default("backlog"),
  defaultPriority: text("default_priority", { enum: ["urgent", "high", "medium", "low", "none"] }).notNull().default("medium"),
  customFields: text("custom_fields", { mode: "json" }),
  labels: text("labels", { mode: "json" }).$type<string[]>(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Automations table
export const automations = sqliteTable("automations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  triggerType: text("trigger_type", { enum: ["status_change", "priority_change", "field_change"] }).notNull(),
  triggerCondition: text("trigger_condition", { mode: "json" }),
  actionType: text("action_type", { enum: ["set_status", "set_priority", "add_label", "assign", "notify"] }).notNull(),
  actionValue: text("action_value", { mode: "json" }),
  enabled: integer("enabled", { mode: "boolean" }).default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Analytics data (for caching)
export const analyticsCache = sqliteTable("analytics_cache", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // "issues_by_status", "velocity", "trends", etc.
  data: text("data", { mode: "json" }).notNull(),
  timestamp: text("timestamp").notNull(),
});

// Relations
export const issuesRelations = relations(issues, ({ many, one }) => ({
  relationships: many(issueRelationships, { relationName: "sourceRelations" }),
  parent: one(issues, {
    fields: [issues.parentId],
    references: [issues.id],
    relationName: "parentChild",
  }),
  children: many(issues, { relationName: "parentChild" }),
}));

export const issueRelationshipsRelations = relations(issueRelationships, ({ one }) => ({
  sourceIssue: one(issues, {
    fields: [issueRelationships.sourceIssueId],
    references: [issues.id],
    relationName: "sourceRelations",
  }),
  targetIssue: one(issues, {
    fields: [issueRelationships.targetIssueId],
    references: [issues.id],
    relationName: "targetRelations",
  }),
}));

export const sprintsRelations = relations(sprints, ({ many }) => ({
  reviews: many(sprintReviews),
}));

export const sprintReviewsRelations = relations(sprintReviews, ({ one }) => ({
  sprint: one(sprints, {
    fields: [sprintReviews.sprintId],
    references: [sprints.id],
  }),
}));

// Type exports for use in the app
export type Issue = typeof issues.$inferSelect;
export type NewIssue = typeof issues.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Sprint = typeof sprints.$inferSelect;
export type NewSprint = typeof sprints.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type Update = typeof updates.$inferSelect;
export type NewUpdate = typeof updates.$inferInsert;
