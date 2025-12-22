import { createServerFn } from '@tanstack/react-start'
import { db, teamMembers, teams } from '@/db'
import { eq, asc } from 'drizzle-orm'
import type { TeamMember, NewTeamMember, Team, NewTeam } from '@/db/schema'

// Types pour créer sans les champs auto-générés
type CreateTeamData = Omit<NewTeam, 'id' | 'createdAt' | 'updatedAt'>
type CreateTeamMemberData = Omit<
  NewTeamMember,
  'id' | 'createdAt' | 'updatedAt'
>

// Teams functions
export const getTeams = createServerFn({ method: 'GET' }).handler(async () => {
  const result = await db
    .select()
    .from(teams)
    .orderBy(asc(teams.name))
  return result
})

export const getTeamById = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const result = await db.select().from(teams).where(eq(teams.id, id))
    return result[0] || null
  })

export const getTeamWithMembers = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const team = await db.select().from(teams).where(eq(teams.id, id))
    if (!team[0]) return null

    const members = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.teamId, id))
      .orderBy(asc(teamMembers.name))

    return { ...team[0], members }
  })

export const createTeam = createServerFn({ method: 'POST' })
  .inputValidator((team: CreateTeamData) => team)
  .handler(async ({ data: team }) => {
    const now = new Date().toISOString()
    const result = await db
      .insert(teams)
      .values({
        ...team,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      })
      .returning()
    return result[0]
  })

export const updateTeam = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; updates: Partial<Team> }) => data)
  .handler(async ({ data }) => {
    const result = await db
      .update(teams)
      .set({ ...data.updates, updatedAt: new Date().toISOString() })
      .where(eq(teams.id, data.id))
      .returning()
    return result[0]
  })

export const deleteTeam = createServerFn({ method: 'POST' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const result = await db.delete(teams).where(eq(teams.id, id)).returning()
    return { success: true, deleted: result.length }
  })

// Team members functions
export const getTeamMembers = createServerFn({ method: 'GET' })
  .inputValidator((teamId?: string) => teamId ?? undefined)
  .handler(async ({ data: teamId }) => {
    if (teamId) {
      const result = await db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.teamId, teamId))
        .orderBy(asc(teamMembers.name))
      return result
    }
    // Si pas de teamId, retourner tous les membres
    const result = await db
      .select()
      .from(teamMembers)
      .orderBy(asc(teamMembers.name))
    return result
  })

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
  .inputValidator((member: CreateTeamMemberData) => member)
  .handler(async ({ data: member }) => {
    const now = new Date().toISOString()
    const result = await db
      .insert(teamMembers)
      .values({
        ...member,
        id: crypto.randomUUID(),
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
  .inputValidator((input: { data: string }) => input)
  .handler(async ({ data: input }) => {
    const id = input.data
    const result = await db
      .delete(teamMembers)
      .where(eq(teamMembers.id, id))
      .returning()
    return { success: true, deleted: result.length }
  })
