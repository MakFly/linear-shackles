import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// Projects table
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  // NEW: Slug for user-friendly URLs
  slug: text('slug').unique(),
  // NEW: Provider fields (null for native projects)
  provider: text('provider', { enum: ['github', 'gitlab'] }),
  providerProjectId: text('provider_project_id'), // owner/repo or group/project
  providerUrl: text('provider_url'), // Full URL to external project
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
