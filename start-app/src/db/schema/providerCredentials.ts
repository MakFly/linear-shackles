import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

// Provider credentials table - stores GitHub/GitLab tokens per project
export const providerCredentials = sqliteTable('provider_credentials', {
  id: text('id').primaryKey(),
  provider: text('provider', { enum: ['github', 'gitlab'] }).notNull(),
  projectId: text('project_id').notNull(), // Reference to projects.id
  token: text('token').notNull(), // Encrypted API token
  providerUrl: text('provider_url'), // GitHub API URL or GitLab instance URL
  providerRepo: text('provider_repo'), // owner/repo for GitHub or group/project for GitLab
  userId: text('user_id'), // Optional: for multi-user support
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

// Types
export type ProviderCredential = typeof providerCredentials.$inferSelect
export type NewProviderCredential = typeof providerCredentials.$inferInsert
