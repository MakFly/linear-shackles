import { createServerFn } from '@tanstack/react-start'
import { db, issues } from '@/db'
import { eq, desc } from 'drizzle-orm'
import type { Issue, NewIssue } from '@/db/schema'

export const getIssues = createServerFn({ method: 'GET' }).handler(async () => {
  const result = await db.select().from(issues).orderBy(desc(issues.createdAt))
  return result
})

export const getIssueById = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const result = await db.select().from(issues).where(eq(issues.id, id))
    return result[0] || null
  })

export const createIssue = createServerFn({ method: 'POST' })
  .inputValidator((issue: NewIssue) => issue)
  .handler(async ({ data: issue }) => {
    const now = new Date().toISOString()
    const result = await db
      .insert(issues)
      .values({
        ...issue,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
    return result[0]
  })

export const updateIssue = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; updates: Partial<Issue> }) => data)
  .handler(async ({ data }) => {
    const result = await db
      .update(issues)
      .set({ ...data.updates, updatedAt: new Date().toISOString() })
      .where(eq(issues.id, data.id))
      .returning()
    return result[0]
  })

export const deleteIssue = createServerFn({ method: 'POST' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    await db.delete(issues).where(eq(issues.id, id))
    return { success: true }
  })
