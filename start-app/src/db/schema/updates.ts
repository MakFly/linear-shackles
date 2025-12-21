import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

// Updates/Activity table
export const updates = sqliteTable('updates', {
  id: text('id').primaryKey(),
  type: text('type', {
    enum: [
      'status_change',
      'sprint_created',
      'issue_created',
      'comment',
      'relationship',
      'review',
    ],
  }).notNull(),
  author: text('author').notNull(),
  content: text('content').notNull(),
  timestamp: text('timestamp').notNull(),
  metadata: text('metadata', { mode: 'json' }),
})

// Types
export type Update = typeof updates.$inferSelect
export type NewUpdate = typeof updates.$inferInsert
