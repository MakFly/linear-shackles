import { createServerFn } from '@tanstack/react-start'
import { db, sprints } from '@/db'
import { eq, desc } from 'drizzle-orm'
import type { Sprint, NewSprint } from '@/db/schema'

type CreateSprintInput = Omit<NewSprint, 'createdAt' | 'updatedAt'> & {
  id?: string
}

type CreateSprintArgs = CreateSprintInput | { data: CreateSprintInput }

const normalizeCreateInput = (input: CreateSprintArgs) => {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid input: sprint payload is required')
  }
  return 'data' in input ? input.data : input
}

const generateId = () => {
  const cryptoApi = globalThis.crypto
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export const getSprints = createServerFn({ method: 'GET' }).handler(async () => {
    const result = await db
      .select()
      .from(sprints)
      .orderBy(desc(sprints.createdAt))
    return result
})

export const getSprintById = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const result = await db.select().from(sprints).where(eq(sprints.id, id))
    return result[0] || null
  })

export const createSprint = createServerFn({ method: 'POST' })
  .inputValidator((sprint: CreateSprintArgs | undefined) => {
    if (!sprint || typeof sprint !== 'object') {
      throw new Error('Invalid input: sprint payload is required')
    }
    return sprint
  })
  .handler(async ({ data: sprint }) => {
    if (!sprint) {
      throw new Error('Invalid input: sprint payload is required')
    }
    const payload = normalizeCreateInput(sprint)
    if (!payload.name || !payload.startDate || !payload.endDate) {
      throw new Error('Invalid input: name, startDate, endDate are required')
    }
    const now = new Date().toISOString()
    const result = await db
      .insert(sprints)
      .values({
        ...payload,
        id: payload.id ?? generateId(),
        issues: payload.issues ?? [],
        velocity: payload.velocity ?? 0,
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
