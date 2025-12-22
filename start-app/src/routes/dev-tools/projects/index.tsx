import { createFileRoute, Link } from '@tanstack/react-router'
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
  FolderKanban,
  MoreHorizontal,
  Users,
  Calendar,
  Database,
  RefreshCw,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getMockProjects } from '@/server/dev-tools-mocks'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'

export const Route = createFileRoute('/dev-tools/projects/')({
  loader: async () => {
    const projects = await getMockProjects()
    return { projects }
  },
  component: Component,
})

const statusColors = {
  active:
    'bg-status-progress/10 text-status-progress border-status-progress/20',
  completed: 'bg-status-done/10 text-status-done border-status-done/20',
  paused: 'bg-status-backlog/10 text-status-backlog border-status-backlog/20',
}

const statusLabels = {
  active: 'Actif',
  completed: 'Terminé',
  paused: 'En pause',
}

function Component() {
  const { projects } = Route.useLoaderData()
  const router = useRouter()

  const handleRefresh = () => {
    router.invalidate()
    toast.success('Données rafraîchies (mock)')
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
            <h1 className="text-2xl font-bold text-foreground">Projets</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Données mockées ({projects.length} projets)
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
            Nouveau projet
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Link
                    to={`/projects/${project.id}`}
                    className="flex items-center gap-3 flex-1"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FolderKanban className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base hover:text-primary transition-colors">
                        {project.name}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={
                          statusColors[
                            project.status as keyof typeof statusColors
                          ]
                        }
                      >
                        {
                          statusLabels[
                            project.status as keyof typeof statusLabels
                          ]
                        }
                      </Badge>
                    </div>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/projects/${project.id}`}>
                          Voir le projet
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>Modifier</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="mt-2">
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progression</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress || 0} className="h-2" />
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {project.members}
                      </span>
                      <span>{project.issuesCount} issues</span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {project.dueDate}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
