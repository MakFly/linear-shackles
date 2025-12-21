import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// Issues table
export const issues = sqliteTable('issues', {
  id: text('id').primaryKey(),
  projectId: text('project_id'), // Lien vers le projet
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', {
    enum: ['done', 'warning', 'backlog', 'progress'],
  })
    .notNull()
    .default('backlog'),
  priority: text('priority', {
    enum: ['urgent', 'high', 'medium', 'low', 'none'],
  })
    .notNull()
    .default('medium'),
  date: text('date'),
  parentId: text('parent_id'),
  childrenCount: integer('children_count').default(0),
  labels: text('labels', { mode: 'json' }).$type<Array<string>>(),
  assignees: text('assignees', { mode: 'json' }).$type<Array<string>>(),
  customFields: text('custom_fields', { mode: 'json' }),
  providerIssueId: text('provider_issue_id'), // ID de l'issue sur GitHub/GitLab
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

// Issue relationships
export const issueRelationships = sqliteTable('issue_relationships', {
  id: text('id').primaryKey(),
  sourceIssueId: text('source_issue_id')
    .notNull()
    .references(() => issues.id, { onDelete: 'cascade' }),
  targetIssueId: text('target_issue_id')
    .notNull()
    .references(() => issues.id, { onDelete: 'cascade' }),
  type: text('type', {
    enum: [
      'blocks',
      'blocked_by',
      'relates_to',
      'duplicates',
      'parent',
      'child',
    ],
  }).notNull(),
})

// Relations
export const issuesRelations = relations(issues, ({ many, one }) => ({
  relationships: many(issueRelationships, { relationName: 'sourceRelations' }),
  parent: one(issues, {
    fields: [issues.parentId],
    references: [issues.id],
    relationName: 'parentChild',
  }),
  children: many(issues, { relationName: 'parentChild' }),
}))

export const issueRelationshipsRelations = relations(
  issueRelationships,
  ({ one }) => ({
    sourceIssue: one(issues, {
      fields: [issueRelationships.sourceIssueId],
      references: [issues.id],
      relationName: 'sourceRelations',
    }),
    targetIssue: one(issues, {
      fields: [issueRelationships.targetIssueId],
      references: [issues.id],
      relationName: 'targetRelations',
    }),
  }),
)

// Types
export type Issue = typeof issues.$inferSelect
export type NewIssue = typeof issues.$inferInsert
export type IssueRelationship = typeof issueRelationships.$inferSelect
export type NewIssueRelationship = typeof issueRelationships.$inferInsert
