import {
  createFileRoute,
} from '@tanstack/react-router'
import { useMemo } from 'react'
import {
  Users,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { getProjectByIdOrSlug, getIssues, getUpdates } from '@/server/db'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export const Route = createFileRoute('/projects/$slugOrId/')({
  component: ProjectDashboard,
  loader: async ({ params }) => {
    const [project, allIssues, allUpdates] = await Promise.all([
      getProjectByIdOrSlug({ data: params.slugOrId }),
      getIssues(),
      getUpdates(),
    ])

    // Filtrer les issues de ce projet
    const issues = allIssues.filter((i) => i.projectId === project.id)
    // Filtrer les updates liées aux issues de ce projet
    const issueIds = new Set(issues.map((i) => i.id))
    const updates = allUpdates.filter((u) => {
      const metadata = u.metadata as Record<string, unknown> | null
      return metadata?.issueId && issueIds.has(metadata.issueId as string)
    })

    return { project, issues, updates }
  },
})

function ProjectDashboard() {
  const { project, issues, updates } = Route.useLoaderData()

  // Calculer les vraies statistiques du projet
  const projectStats = useMemo(() => {
    const typedIssues = issues as { status: string }[]
    const totalIssues = typedIssues.length
    const completedIssues = typedIssues.filter(
      (i) => i.status === 'done',
    ).length
    const inProgressIssues = typedIssues.filter(
      (i) => i.status === 'progress',
    ).length
    const blockedIssues = typedIssues.filter(
      (i) => i.status === 'warning',
    ).length
    const progress =
      totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0

    return {
      totalIssues,
      completedIssues,
      inProgressIssues,
      blockedIssues,
      progress,
      members: project?.members || 0,
      dueDate: project?.dueDate || 'Non définie',
    }
  }, [issues, project])

  // Activités récentes (10 dernières)
  const recentActivity = useMemo(() => {
    const typedUpdates = updates as {
      id: string
      type: string
      author: string
      content: string
      timestamp: string
      metadata: Record<string, unknown> | null
    }[]

    return typedUpdates.slice(0, 10).map((update) => {
      let action = update.content
      if (update.type === 'issue_created') {
        const issueTitle = update.metadata?.issueTitle as string
        action = `a créé "${issueTitle || 'une issue'}"`
      } else if (update.type === 'comment') {
        action = `a commenté`
      } else if (update.type === 'status_change') {
        action = `a changé le statut`
      }

      let time = update.timestamp
      try {
        time = formatDistanceToNow(new Date(update.timestamp), {
          addSuffix: true,
          locale: fr,
        })
      } catch {
        // Keep original timestamp
      }

      return {
        id: update.id,
        action,
        user: update.author,
        time,
      }
    })
  }, [updates])

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Issues totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projectStats.totalIssues}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {projectStats.completedIssues} terminées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                En cours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projectStats.inProgressIssues}
              </div>
              <p className="text-xs text-muted-foreground">
                Actuellement
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Bloquées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {projectStats.blockedIssues}
              </div>
              <p className="text-xs text-muted-foreground">
                Nécessitent attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Progression
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projectStats.progress}%
              </div>
              <Progress value={projectStats.progress} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Project Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Informations du projet</CardTitle>
              <CardDescription>
                Détails et métriques du projet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Membres</span>
                </div>
                <Badge variant="secondary">{projectStats.members}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Date limite</span>
                </div>
                <span className="text-sm font-medium">
                  {projectStats.dueDate}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-status-done" />
                  <span className="text-sm">Issues résolues</span>
                </div>
                <span className="text-sm font-medium">
                  {projectStats.completedIssues} /{' '}
                  {projectStats.totalIssues}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
              <CardDescription>
                Dernières actions sur le projet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Aucune activité récente
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Créez des issues pour voir l'activité ici
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.user} • {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
