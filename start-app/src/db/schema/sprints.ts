import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// Sprints table
export const sprints = sqliteTable('sprints', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  goal: text('goal'),
  status: text('status', {
    enum: ['planning', 'active', 'completed', 'archived'],
  })
    .notNull()
    .default('planning'),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  issues: text('issues', { mode: 'json' }).$type<string[]>().default([]),
  velocity: integer('velocity').default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

// Sprint reviews
export const sprintReviews = sqliteTable('sprint_reviews', {
  id: text('id').primaryKey(),
  sprintId: text('sprint_id')
    .notNull()
    .references(() => sprints.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  summary: text('summary'),
  completedIssues: integer('completed_issues').default(0),
  totalIssues: integer('total_issues').default(0),
  velocity: integer('velocity').default(0),
  notes: text('notes'),
})

// Relations
export const sprintsRelations = relations(sprints, ({ many }) => ({
  reviews: many(sprintReviews),
}))

export const sprintReviewsRelations = relations(sprintReviews, ({ one }) => ({
  sprint: one(sprints, {
    fields: [sprintReviews.sprintId],
    references: [sprints.id],
  }),
}))

// Types
export type Sprint = typeof sprints.$inferSelect
export type NewSprint = typeof sprints.$inferInsert
export type SprintReview = typeof sprintReviews.$inferSelect
export type NewSprintReview = typeof sprintReviews.$inferInsert
