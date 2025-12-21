import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// Team members table
export const teamMembers = sqliteTable('team_members', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role', {
    enum: ['owner', 'admin', 'member'],
  })
    .notNull()
    .default('member'),
  avatar: text('avatar'),
  issuesAssigned: integer('issues_assigned').default(0),
  issuesCompleted: integer('issues_completed').default(0),
  status: text('status', {
    enum: ['online', 'offline', 'away'],
  }).default('offline'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

// Types
export type TeamMember = typeof teamMembers.$inferSelect
export type NewTeamMember = typeof teamMembers.$inferInsert
