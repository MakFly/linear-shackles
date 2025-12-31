import { createServerFn } from '@tanstack/react-start'
import { db, projects, issues, providerCredentials } from '@/db'
import { eq, or, and, desc } from 'drizzle-orm'
import type {
  Project,
  NewProject,
  ProviderProjectInput,
} from '@/db/schema/projects'

// Helper: Generate unique slug from name
async function generateUniqueSlug(
  name: string,
  excludeId?: string,
): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dashes
    .replace(/^-+|-+$/g, '') // Trim leading/trailing dashes
    .substring(0, 50) // Max 50 chars

  let slug = baseSlug
  let counter = 1

  // Check for collisions
  const existing = await db
    .select({ slug: projects.slug, id: projects.id })
    .from(projects)
    .where(
      excludeId
        ? or(eq(projects.slug, slug), eq(projects.id, excludeId))
        : eq(projects.slug, slug),
    )

  while (existing.some((p) => p.slug === slug)) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}

export const getProjects = createServerFn({ method: 'GET' }).handler(
  async () => {
    const result = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt))
    return result
  },
)

// NEW: Get project by slug OR id (supports both URL patterns)
export const getProjectByIdOrSlug = createServerFn({ method: 'GET' })
  .inputValidator((identifier: string) => identifier)
  .handler(async ({ data: identifier }) => {
    const result = await db
      .select()
      .from(projects)
      .where(or(eq(projects.id, identifier), eq(projects.slug, identifier)))

    // If slug is ambiguous (unlikely with unique constraint), prefer exact id match
    if (result.length > 1) {
      return result.find((p) => p.id === identifier) || result[0]
    }
    return result[0] || null
  })

// NEW: Get project by provider (uses proper columns)
export const getProjectByProvider = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: { provider: 'github' | 'gitlab'; providerProjectId: string }) =>
      data,
  )
  .handler(async ({ data }) => {
    const result = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.provider, data.provider),
          eq(projects.providerProjectId, data.providerProjectId),
        ),
      )
    return result[0] || null
  })

export const createProject = createServerFn({ method: 'POST' })
  .inputValidator((project: NewProject) => project)
  .handler(async ({ data: project }) => {
    const now = new Date().toISOString()
    const slug = await generateUniqueSlug(project.name)

    const result = await db
      .insert(projects)
      .values({
        ...project,
        slug,
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
    // Supprimer d'abord les issues liées au projet
    await db.delete(issues).where(eq(issues.projectId, id))
    // Puis supprimer le projet
    await db.delete(projects).where(eq(projects.id, id))
    return { success: true }
  })

// REFACTORED: findOrCreateProjectByProvider - now uses proper columns
export const findOrCreateProjectByProvider = createServerFn({
  method: 'POST',
})
  .inputValidator((input: unknown): ProviderProjectInput => {
    // Validation runtime explicite
    if (!input || typeof input !== 'object') {
      throw new Error(`Invalid input: data is required, got: ${typeof input}`)
    }

    const data = input as Record<string, unknown>

    if (
      !data.provider ||
      typeof data.provider !== 'string' ||
      !['github', 'gitlab'].includes(data.provider)
    ) {
      throw new Error('Invalid input: provider must be "github" or "gitlab"')
    }
    if (!data.providerId || typeof data.providerId !== 'string') {
      throw new Error('Invalid input: providerId is required')
    }

    return {
      provider: data.provider as 'github' | 'gitlab',
      providerId: data.providerId,
      name: typeof data.name === 'string' ? data.name : undefined,
      description: typeof data.description === 'string' ? data.description : undefined,
    }
  })
  .handler(async ({ data }) => {
    // Use NEW provider columns to find existing project
    const existing = await getProjectByProvider({
      data: { provider: data.provider, providerProjectId: data.providerId },
    })

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (existing) {
      return existing
    }

    // Generate project name from providerId
    const projectName =
      data.name ||
      (data.provider === 'github'
        ? data.providerId.split('/')[1] || data.providerId
        : data.providerId.split('/').pop() || data.providerId)

    // Generate unique slug
    const slug = await generateUniqueSlug(projectName)

    // Generate provider URL
    const providerUrl =
      data.provider === 'github'
        ? `https://github.com/${data.providerId}`
        : `https://gitlab.com/${data.providerId}`

    const generateId = () =>
      `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

    const now = new Date().toISOString()
    const newProject = await db
      .insert(projects)
      .values({
        id: generateId(),
        name: projectName,
        slug,
        description: data.description || null,
        provider: data.provider,
        providerProjectId: data.providerId,
        providerUrl,
        status: 'active',
        progress: 0,
        members: 0,
        issuesCount: 0,
        dueDate: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    const createdProject = newProject[0]

    // Copy credentials from 'global' to the new project
    const globalCredential = await db.query.providerCredentials.findFirst({
      where: and(
        eq(providerCredentials.provider, data.provider),
        eq(providerCredentials.projectId, 'global'),
      ),
    })

    if (globalCredential) {
      await db.insert(providerCredentials).values({
        id: `${createdProject.id}-${data.provider}`,
        provider: data.provider,
        projectId: createdProject.id,
        token: globalCredential.token,
        providerUrl: globalCredential.providerUrl,
        providerRepo: data.providerId, // Store the repo for this project
        userId: globalCredential.userId,
        createdAt: now,
        updatedAt: now,
      })
    }

    return createdProject
  })
