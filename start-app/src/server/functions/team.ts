import { createServerFn } from '@tanstack/react-start'
import { db, teamMembers } from '@/db'
import { eq, asc } from 'drizzle-orm'
import type { TeamMember, NewTeamMember } from '@/db/schema'

export const getTeamMembers = createServerFn({ method: 'GET' }).handler(
  async () => {
    const result = await db
      .select()
      .from(teamMembers)
      .orderBy(asc(teamMembers.name))
    return result
  },
)

export const getTeamMemberById = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const result = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.id, id))
    return result[0] || null
  })

export const createTeamMember = createServerFn({ method: 'POST' })
  .inputValidator((member: NewTeamMember) => member)
  .handler(async ({ data: member }) => {
    const now = new Date().toISOString()
    const result = await db
      .insert(teamMembers)
      .values({
        ...member,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
    return result[0]
  })

export const updateTeamMember = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; updates: Partial<TeamMember> }) => data)
  .handler(async ({ data }) => {
    const result = await db
      .update(teamMembers)
      .set({ ...data.updates, updatedAt: new Date().toISOString() })
      .where(eq(teamMembers.id, data.id))
      .returning()
    return result[0]
  })

export const deleteTeamMember = createServerFn({ method: 'POST' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    await db.delete(teamMembers).where(eq(teamMembers.id, id))
    return { success: true }
  })
