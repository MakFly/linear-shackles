import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

// Templates table
export const issueTemplates = sqliteTable('issue_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  defaultStatus: text('default_status', {
    enum: ['done', 'warning', 'backlog', 'progress'],
  })
    .notNull()
    .default('backlog'),
  defaultPriority: text('default_priority', {
    enum: ['urgent', 'high', 'medium', 'low', 'none'],
  })
    .notNull()
    .default('medium'),
  customFields: text('custom_fields', { mode: 'json' }),
  labels: text('labels', { mode: 'json' }).$type<Array<string>>(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

// Types
export type IssueTemplate = typeof issueTemplates.$inferSelect
export type NewIssueTemplate = typeof issueTemplates.$inferInsert
