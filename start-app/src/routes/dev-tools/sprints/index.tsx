import { createFileRoute, useRouter  } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Plus,
  Calendar,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  Database,
  RefreshCw,
} from 'lucide-react'
import { getMockSprints, getMockIssues } from '@/server/dev-tools-mocks'
import { toast } from 'sonner'

export const Route = createFileRoute('/dev-tools/sprints/')({
  loader: async () => {
    const [sprints, issues] = await Promise.all([
      getMockSprints(),
      getMockIssues(),
    ])
    return { sprints, issues }
  },
  component: Component,
})

const statusConfig = {
  planning: {
    label: 'Planification',
    color: 'bg-muted text-muted-foreground border-muted',
    icon: Clock,
  },
  active: {
    label: 'En cours',
    color:
      'bg-status-progress/10 text-status-progress border-status-progress/20',
    icon: Play,
  },
  completed: {
    label: 'Terminé',
    color: 'bg-status-done/10 text-status-done border-status-done/20',
    icon: CheckCircle2,
  },
  archived: {
    label: 'Archivé',
    color: 'bg-muted text-muted-foreground border-muted',
    icon: Pause,
  },
}

function Component() {
  const { sprints, issues } = Route.useLoaderData()
  const router = useRouter()

  const handleRefresh = () => {
    router.invalidate()
    toast.success('Données rafraîchies (mock)')
  }

  const getProgress = (sprint: (typeof sprints)[0]) => {
    const sprintIssues = issues.filter((i) => sprint.issues?.includes(i.id))
    if (sprintIssues.length === 0) return 0
    const doneCount = sprintIssues.filter((i) => i.status === 'done').length
    return Math.round((doneCount / sprintIssues.length) * 100)
  }

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diff = Math.ceil(
      (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    )
    return diff
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-500 border-blue-500/20"
          >
            <Database className="h-3 w-3 mr-1" />
            Mock Data
          </Badge>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sprints</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Données mockées ({sprints.length} sprints)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau sprint
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-custom">
        <div className="space-y-4">
          {sprints.map((sprint) => {
            const config =
              statusConfig[sprint.status] ||
              statusConfig.planning
            const StatusIcon = config.icon
            const progress = getProgress(sprint)
            const daysRemaining = getDaysRemaining(sprint.endDate)
            const sprintIssues = issues.filter((i) =>
              sprint.issues?.includes(i.id),
            )

            return (
              <Card
                key={sprint.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {sprint.name}
                          <Badge variant="outline" className={config.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </CardTitle>
                        <CardDescription>{sprint.goal}</CardDescription>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-muted-foreground">
                        {sprint.startDate} → {sprint.endDate}
                      </div>
                      {sprint.status === 'active' && (
                        <div
                          className={
                            daysRemaining < 3
                              ? 'text-destructive font-medium'
                              : 'text-muted-foreground'
                          }
                        >
                          {daysRemaining > 0
                            ? `${daysRemaining} jours restants`
                            : "Terminé aujourd'hui"}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">
                          {
                            sprintIssues.filter((i) => i.status === 'done')
                              .length
                          }{' '}
                          / {sprintIssues.length} issues
                        </span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Vélocité: {sprint.velocity || 0} pts</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Voir le backlog
                        </Button>
                        {sprint.status === 'planning' && (
                          <Button size="sm">
                            <Play className="h-4 w-4 mr-1" />
                            Démarrer
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
