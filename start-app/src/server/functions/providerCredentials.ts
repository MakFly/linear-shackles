import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { providerCredentials } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

type Provider = 'github' | 'gitlab'

// Get credentials for a specific project and provider
export const getProviderCredentials = createServerFn({
  method: 'GET',
})
  .inputValidator((data: { projectId: string; provider: Provider }) => data)
  .handler(async ({ data }) => {
    const credential = await db.query.providerCredentials.findFirst({
      where: and(
        eq(providerCredentials.projectId, data.projectId),
        eq(providerCredentials.provider, data.provider),
      ),
    })
    return credential
  })

// Get all credentials for a project
export const getAllProjectCredentials = createServerFn({
  method: 'GET',
})
  .inputValidator((data: { projectId: string }) => data)
  .handler(async ({ data }) => {
    const credentials = await db.query.providerCredentials.findMany({
      where: eq(providerCredentials.projectId, data.projectId),
    })
    return credentials
  })

// Save or update provider credentials for a project
export const saveProviderCredentials = createServerFn({
  method: 'POST',
})
  .inputValidator(
    (data: {
      projectId: string
      provider: Provider
      token: string
      providerUrl?: string
      providerRepo?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    // Check if credentials already exist
    const existing = await db.query.providerCredentials.findFirst({
      where: and(
        eq(providerCredentials.projectId, data.projectId),
        eq(providerCredentials.provider, data.provider),
      ),
    })

    const now = new Date().toISOString()

    if (existing) {
      // Update existing
      const updated = await db
        .update(providerCredentials)
        .set({
          token: data.token,
          providerUrl: data.providerUrl || null,
          providerRepo: data.providerRepo || null,
          updatedAt: now,
        })
        .where(eq(providerCredentials.id, existing.id))
        .returning()
      return updated[0]
    } else {
      // Create new
      const newCredential = await db
        .insert(providerCredentials)
        .values({
          id: `cred-${data.provider}-${data.projectId}-${Date.now()}`,
          provider: data.provider,
          projectId: data.projectId,
          token: data.token,
          providerUrl: data.providerUrl || null,
          providerRepo: data.providerRepo || null,
          createdAt: now,
          updatedAt: now,
        })
        .returning()
      return newCredential[0]
    }
  })

// Delete provider credentials
export const deleteProviderCredentials = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { projectId: string; provider: Provider }) => data)
  .handler(async ({ data }) => {
    const existing = await db.query.providerCredentials.findFirst({
      where: and(
        eq(providerCredentials.projectId, data.projectId),
        eq(providerCredentials.provider, data.provider),
      ),
    })

    if (existing) {
      await db
        .delete(providerCredentials)
        .where(eq(providerCredentials.id, existing.id))
      return { success: true }
    }

    return { success: false }
  })
