import { createServerFn } from '@tanstack/react-start'
import { db, sprints } from '@/db'
import { eq, desc } from 'drizzle-orm'
import type { Sprint, NewSprint } from '@/db/schema'

export const getSprints = createServerFn({ method: 'GET' }).handler(
  async () => {
    const result = await db
      .select()
      .from(sprints)
      .orderBy(desc(sprints.createdAt))
    return result
  },
)

export const getSprintById = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const result = await db.select().from(sprints).where(eq(sprints.id, id))
    return result[0] || null
  })

export const createSprint = createServerFn({ method: 'POST' })
  .inputValidator((sprint: NewSprint) => sprint)
  .handler(async ({ data: sprint }) => {
    const now = new Date().toISOString()
    const result = await db
      .insert(sprints)
      .values({
        ...sprint,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
    return result[0]
  })

export const updateSprint = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; updates: Partial<Sprint> }) => data)
  .handler(async ({ data }) => {
    const result = await db
      .update(sprints)
      .set({ ...data.updates, updatedAt: new Date().toISOString() })
      .where(eq(sprints.id, data.id))
      .returning()
    return result[0]
  })

export const deleteSprint = createServerFn({ method: 'POST' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    await db.delete(sprints).where(eq(sprints.id, id))
    return { success: true }
  })
