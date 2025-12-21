import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

// Analytics data (for caching)
export const analyticsCache = sqliteTable('analytics_cache', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // "issues_by_status", "velocity", "trends", etc.
  data: text('data', { mode: 'json' }).notNull(),
  timestamp: text('timestamp').notNull(),
})

// Types
export type AnalyticsCache = typeof analyticsCache.$inferSelect
export type NewAnalyticsCache = typeof analyticsCache.$inferInsert
