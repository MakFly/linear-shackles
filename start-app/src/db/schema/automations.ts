import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// Automations table
export const automations = sqliteTable('automations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  triggerType: text('trigger_type', {
    enum: ['status_change', 'priority_change', 'field_change'],
  }).notNull(),
  triggerCondition: text('trigger_condition', { mode: 'json' }),
  actionType: text('action_type', {
    enum: ['set_status', 'set_priority', 'add_label', 'assign', 'notify'],
  }).notNull(),
  actionValue: text('action_value', { mode: 'json' }),
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

// Types
export type Automation = typeof automations.$inferSelect
export type NewAutomation = typeof automations.$inferInsert
