import {
  createFileRoute,
  Outlet,
  useParams,
  Link,
  useRouterState,
} from '@tanstack/react-router'
import {
  FolderKanban,
  ListTodo,
  Github,
  Gitlab,
  BarChart3,
  Settings,
  ArrowLeft,
  Users,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { getProjectById, getIssues, getUpdates } from '@/server/db'
import { useMemo } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export const Route = createFileRoute('/projects/$projectId')({
  component: ProjectLayout,
  loader: async ({ params }) => {
    const [project, allIssues, allUpdates] = await Promise.all([
      getProjectById({ data: params.projectId }),
      getIssues(),
      getUpdates(),
    ])
    // Filtrer les issues de ce projet
    const issues = allIssues.filter((i) => i.projectId === params.projectId)
    // Filtrer les updates liées aux issues de ce projet
    const issueIds = new Set(issues.map((i) => i.id))
    const updates = allUpdates.filter((u) => {
      const metadata = u.metadata as Record<string, unknown> | null
      return metadata?.issueId && issueIds.has(metadata.issueId as string)
    })
    return { project, issues, updates }
  },
})

function ProjectLayout() {
  const { projectId } = useParams({ from: '/projects/$projectId' })
  const { project, issues, updates } = Route.useLoaderData()
  const router = useRouterState()
  const currentPath = router.location.pathname
  const isIndexRoute = currentPath === `/projects/${projectId}`

  // Détecter le provider depuis la description du projet
  const provider = useMemo(() => {
    if (!project?.description) return null
    if (project.description.includes('provider:github:')) return 'github'
    if (project.description.includes('provider:gitlab:')) return 'gitlab'
    return null
  }, [project?.description])

  // Extraire l'identifiant du provider (owner/repo ou projectId)
  const providerInfo = useMemo(() => {
    if (!project?.description || !provider) return null
    const match = project.description.match(
      /provider:(github|gitlab):([^\s\n]+)/,
    )
    return match ? match[2] : null
  }, [project?.description, provider])

  const navItems = useMemo(() => {
    const items = [
      {
        title: "Vue d'ensemble",
        url: `/projects/${projectId}`,
        icon: FolderKanban,
      },
      { title: 'Issues', url: `/projects/${projectId}/issues`, icon: ListTodo },
    ]

    // Ajouter l'onglet du provider approprié (routes intégrées)
    if (provider === 'github' && providerInfo) {
      items.push({
        title: 'GitHub',
        url: `/projects/${projectId}/github`,
        icon: Github,
      })
    } else if (provider === 'gitlab' && providerInfo) {
      items.push({
        title: 'GitLab',
        url: `/projects/${projectId}/gitlab`,
        icon: Gitlab,
      })
    }

    items.push(
      {
        title: 'Analytics',
        url: `/projects/${projectId}/analytics`,
        icon: BarChart3,
      },
      {
        title: 'Paramètres',
        url: `/projects/${projectId}/settings`,
        icon: Settings,
      },
    )

    return items
  }, [projectId, provider, providerInfo])

  const isActive = (path: string) =>
    currentPath === path ||
    (path !== `/projects/${projectId}` && currentPath.startsWith(path))

  // Calculer les vraies statistiques du projet
  const projectStats = useMemo(() => {
    const typedIssues = issues as Array<{ status: string }>
    const totalIssues = typedIssues.length
    const completedIssues = typedIssues.filter((i) => i.status === 'done').length
    const inProgressIssues = typedIssues.filter((i) => i.status === 'progress').length
    const blockedIssues = typedIssues.filter((i) => i.status === 'warning').length
    const progress = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0

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
    const typedUpdates = updates as Array<{
      id: string
      type: string
      author: string
      content: string
      timestamp: string
      metadata: Record<string, unknown> | null
    }>

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
    <div className="flex flex-col h-full">
      {/* Project Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/projects">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux projets
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-3">
          {provider === 'github' && (
            <Github className="h-6 w-6 text-muted-foreground" />
          )}
          {provider === 'gitlab' && (
            <Gitlab className="h-6 w-6 text-muted-foreground" />
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {project?.name || projectId}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {providerInfo
                ? `${provider === 'github' ? 'GitHub' : 'GitLab'}: ${providerInfo}`
                : 'Gérez les issues, intégrations et paramètres de ce projet'}
            </p>
          </div>
        </div>
      </div>

      {/* Project Navigation */}
      <div className="border-b border-border px-6">
        <nav className="flex gap-1 -mb-px">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.url)
            return (
              <Link
                key={item.url}
                to={item.url}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Project Content */}
      <div className="flex-1 overflow-hidden">
        {isIndexRoute ? (
          <div className="flex-1 overflow-y-auto p-6 scrollbar-custom">
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
                    <p className="text-xs text-muted-foreground mt-1">
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
                    <p className="text-xs text-muted-foreground mt-1">
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
                      Détails et métriques du projet {projectId}
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
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  )
}
