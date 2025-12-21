import { createServerFn } from '@tanstack/react-start'
import { db, issues, sprints } from '@/db'

export const getAnalyticsData = createServerFn({ method: 'GET' }).handler(
  async () => {
    const allIssues = await db.select().from(issues)
    const allSprints = await db.select().from(sprints)

    const issuesByStatus = {
      done: allIssues.filter((i) => i.status === 'done').length,
      progress: allIssues.filter((i) => i.status === 'progress').length,
      warning: allIssues.filter((i) => i.status === 'warning').length,
      backlog: allIssues.filter((i) => i.status === 'backlog').length,
    }

    const issuesByPriority = {
      urgent: allIssues.filter((i) => i.priority === 'urgent').length,
      high: allIssues.filter((i) => i.priority === 'high').length,
      medium: allIssues.filter((i) => i.priority === 'medium').length,
      low: allIssues.filter((i) => i.priority === 'low').length,
      none: allIssues.filter((i) => i.priority === 'none').length,
    }

    const activeSprint = allSprints.find((s) => s.status === 'active')

    return {
      totalIssues: allIssues.length,
      issuesByStatus,
      issuesByPriority,
      activeSprint,
      sprints: allSprints,
    }
  },
)
