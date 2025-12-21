import { createServerFn } from '@tanstack/react-start'
import { db, issueRelationships } from '@/db'
import { eq } from 'drizzle-orm'

export const getIssueRelationships = createServerFn({ method: 'GET' })
  .inputValidator((issueId: string) => issueId)
  .handler(async ({ data: issueId }) => {
    const result = await db
      .select()
      .from(issueRelationships)
      .where(eq(issueRelationships.sourceIssueId, issueId))
    return result
  })
