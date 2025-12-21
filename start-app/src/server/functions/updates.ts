import { createServerFn } from '@tanstack/react-start'
import { db, updates } from '@/db'
import { desc } from 'drizzle-orm'
import type { NewUpdate } from '@/db/schema'

export const getUpdates = createServerFn({ method: 'GET' }).handler(
  async () => {
    const result = await db
      .select()
      .from(updates)
      .orderBy(desc(updates.timestamp))
    return result
  },
)

export const createUpdate = createServerFn({ method: 'POST' })
  .inputValidator((update: NewUpdate) => update)
  .handler(async ({ data: update }) => {
    const result = await db.insert(updates).values(update).returning()
    return result[0]
  })
