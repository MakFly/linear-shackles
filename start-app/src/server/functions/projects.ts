import { createServerFn } from '@tanstack/react-start'
import { db, projects } from '@/db'
import { eq, desc } from 'drizzle-orm'
import type { Project, NewProject, ProviderProjectInput } from '@/db/schema'

export const getProjects = createServerFn({ method: 'GET' }).handler(
  async () => {
    const result = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt))
    return result
  },
)

export const getProjectById = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const result = await db.select().from(projects).where(eq(projects.id, id))
    return result[0] || null
  })

export const createProject = createServerFn({ method: 'POST' })
  .inputValidator((project: NewProject) => project)
  .handler(async ({ data: project }) => {
    const now = new Date().toISOString()
    const result = await db
      .insert(projects)
      .values({
        ...project,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
    return result[0]
  })

export const updateProject = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; updates: Partial<Project> }) => data)
  .handler(async ({ data }) => {
    const result = await db
      .update(projects)
      .set({ ...data.updates, updatedAt: new Date().toISOString() })
      .where(eq(projects.id, data.id))
      .returning()
    return result[0]
  })

export const deleteProject = createServerFn({ method: 'POST' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    await db.delete(projects).where(eq(projects.id, id))
    return { success: true }
  })

export const findOrCreateProjectByProvider = createServerFn({
  method: 'POST',
})
  .inputValidator((input: unknown) => {
    const data = input as ProviderProjectInput

    // Validation runtime explicite
    if (!data || typeof data !== 'object') {
      throw new Error(`Invalid input: data is required, got: ${typeof data}`)
    }
    if (!data.provider || !['github', 'gitlab'].includes(data.provider)) {
      throw new Error('Invalid input: provider must be "github" or "gitlab"')
    }
    if (!data.providerId || typeof data.providerId !== 'string') {
      throw new Error('Invalid input: providerId is required')
    }
    return data
  })
  .handler(async ({ data }) => {
    // Chercher un projet existant avec ce providerId
    const providerPrefix = `provider:${data.provider}:${data.providerId}`

    const allProjects = await db.select().from(projects)
    const existingProject = allProjects.find(
      (p) =>
        p.description?.includes(providerPrefix) ||
        p.name.includes(providerPrefix),
    )

    if (existingProject) {
      return existingProject
    }

    // Creer un nouveau projet
    const projectName =
      data.name ||
      (data.provider === 'github'
        ? data.providerId.split('/')[1] || data.providerId
        : data.providerId)

    const projectDescription = data.description
      ? `${data.description}\n\n${providerPrefix}`
      : providerPrefix

    const generateId = () =>
      `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

    const now = new Date().toISOString()
    const newProject = await db
      .insert(projects)
      .values({
        id: generateId(),
        name: projectName,
        description: projectDescription,
        status: 'active',
        progress: 0,
        members: 0,
        issuesCount: 0,
        dueDate: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    return newProject[0]
  })
