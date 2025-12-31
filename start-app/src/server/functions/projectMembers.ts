import { createServerFn } from '@tanstack/react-start'
import { db, projectMembers, users, projects, issues } from '@/db'
import { eq, and, inArray } from 'drizzle-orm'
import type {
  ProjectMember,
  NewProjectMember,
  ProjectRole,
} from '@/db/schema/users'

// Helper: Generate ID
const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

export const getProjectMembers = createServerFn({ method: 'GET' })
  .inputValidator((projectId: string) => projectId)
  .handler(async ({ data: projectId }) => {
    const members = await db
      .select({
        id: projectMembers.id,
        role: projectMembers.role,
        addedAt: projectMembers.addedAt,
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        userAvatar: users.avatar,
      })
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, projectId))
      .orderBy(projectMembers.createdAt)

    // Compter les issues assignées par membre
    const membersWithCount = await Promise.all(
      members.map(async (member) => {
        const issuesCountResult = await db
          .select()
          .from(issues)
          .where(eq(issues.assignedTo, member.userId))

        return {
          ...member,
          issuesCount: issuesCountResult.length || 0,
        }
      }),
    )

    return membersWithCount
  })

export const addProjectMember = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { projectId: string; userId: string; role?: ProjectRole; addedBy?: string }) =>
      data,
  )
  .handler(async ({ data }) => {
    const now = new Date().toISOString()
    const newMember = await db
      .insert(projectMembers)
      .values({
        id: generateId(),
        projectId: data.projectId,
        userId: data.userId,
        role: data.role || 'member',
        addedBy: data.addedBy,
        addedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    // Mettre à jour le compteur de membres du projet
    const allMembers = await db
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.projectId, data.projectId))
    await db
      .update(projects)
      .set({ members: allMembers.length, updatedAt: now })
      .where(eq(projects.id, data.projectId))

    return newMember[0]
  })

export const removeProjectMember = createServerFn({ method: 'POST' })
  .inputValidator((data: { projectId: string; userId: string }) => data)
  .handler(async ({ data }) => {
    const now = new Date().toISOString()
    await db
      .delete(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, data.projectId),
          eq(projectMembers.userId, data.userId),
        ),
      )

    // Mettre à jour le compteur de membres du projet
    const allMembers = await db
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.projectId, data.projectId))
    await db
      .update(projects)
      .set({ members: allMembers.length, updatedAt: now })
      .where(eq(projects.id, data.projectId))

    return { success: true }
  })

export const updateMemberRole = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { projectId: string; userId: string; role: ProjectRole }) => data,
  )
  .handler(async ({ data }) => {
    const result = await db
      .update(projectMembers)
      .set({
        role: data.role,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(projectMembers.projectId, data.projectId),
          eq(projectMembers.userId, data.userId),
        ),
      )
      .returning()
    return result[0]
  })

export const getProjectsForUser = createServerFn({ method: 'GET' })
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const memberships = await db
      .select({
        projectId: projectMembers.projectId,
        role: projectMembers.role,
      })
      .from(projectMembers)
      .where(eq(projectMembers.userId, userId))

    const projectIds = memberships.map((m) => m.projectId)
    if (projectIds.length === 0) return []

    const userProjects = await db
      .select()
      .from(projects)
      .where(inArray(projects.id, projectIds))

    return userProjects.map((project) => ({
      ...project,
      role: memberships.find((m) => m.projectId === project.id)?.role,
    }))
  })
