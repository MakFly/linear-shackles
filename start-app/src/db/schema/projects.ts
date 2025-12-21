import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// Projects table
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status', {
    enum: ['active', 'completed', 'paused'],
  })
    .notNull()
    .default('active'),
  progress: integer('progress').default(0),
  members: integer('members').default(0),
  issuesCount: integer('issues_count').default(0),
  dueDate: text('due_date'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

// Types
export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert

// Server function input types
export type ProviderProjectInput = {
  provider: 'github' | 'gitlab'
  providerId: string
  name?: string
  description?: string
}
