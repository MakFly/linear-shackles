import {
  createFileRoute,
  Outlet,
  Link,
  useRouterState,
  redirect,
} from '@tanstack/react-router'
import { useMemo, useEffect } from 'react'
import {
  FolderKanban,
  ListTodo,
  Github,
  Gitlab,
  BarChart3,
  Settings,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { getProjectByIdOrSlug } from '@/server/db'

export const Route = createFileRoute('/projects/$slugOrId')({
  component: ProjectLayout,
  pendingComponent: ProjectLayoutSkeleton,
  loader: async ({ params }) => {
    const project = await getProjectByIdOrSlug({ data: params.slugOrId })

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!project) {
      throw redirect({ to: '/projects' })
    }

    return { project }
  },
})

function ProjectLayout() {
  const { slugOrId } = Route.useParams()
  const { project } = Route.useLoaderData()
  const router = useRouterState()
  const currentPath = router.location.pathname

  // Use slug if available, otherwise fall back to slugOrId (for ID-based URLs)
  const projectIdentifier = project?.slug || slugOrId

  // Use provider columns directly
  const provider = project?.provider
  const providerInfo = project?.providerProjectId
  const providerUrl = project?.providerUrl

  // Client-side URL update without state loss
  // If accessed via ID, replace the URL with the slug
  useEffect(() => {
    if (project?.slug && slugOrId === project.id) {
      window.history.replaceState(null, '', `/projects/${project.slug}`)
    }
  }, [project?.slug, project?.id, slugOrId])

  const navItems = useMemo(() => {
    const items = [
      {
        title: "Vue d'ensemble",
        url: `/projects/${projectIdentifier}`,
        icon: FolderKanban,
      },
      { title: 'Issues', url: `/projects/${projectIdentifier}/issues`, icon: ListTodo },
    ]

    // Ajouter l'onglet du provider approprié (routes intégrées)
    if (provider === 'github' && providerInfo) {
      items.push({
        title: 'GitHub',
        url: `/projects/${projectIdentifier}/github`,
        icon: Github,
      })
    } else if (provider === 'gitlab' && providerInfo) {
      items.push({
        title: 'GitLab',
        url: `/projects/${projectIdentifier}/gitlab`,
        icon: Gitlab,
      })
    }

    items.push(
      {
        title: 'Analytics',
        url: `/projects/${projectIdentifier}/analytics`,
        icon: BarChart3,
      },
      {
        title: 'Paramètres',
        url: `/projects/${projectIdentifier}/settings`,
        icon: Settings,
      },
    )

    return items
  }, [projectIdentifier, provider, providerInfo])

  const isActive = (path: string) =>
    currentPath === path ||
    (path !== `/projects/${projectIdentifier}` && currentPath.startsWith(path))

  return (
    <div className="flex flex-col h-full relative -left-[calc(1rem+1px)] -lg:-left-[calc(1.5rem+1px)]">
      {/* Project Header */}
      <div className="border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          {/* Bouton retour compact */}
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link to="/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          {/* Provider icon */}
          {provider === 'github' && (
            <Github className="h-5 w-5 text-muted-foreground shrink-0" />
          )}
          {provider === 'gitlab' && (
            <Gitlab className="h-5 w-5 text-muted-foreground shrink-0" />
          )}

          {/* Titre avec provider info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold truncate">
                {project?.name || slugOrId}
              </h1>
              {providerUrl && (
                <a
                  href={providerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground shrink-0"
                  title="Ouvrir sur GitHub/GitLab"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
            {providerInfo ? (
              <p className="text-xs text-muted-foreground truncate">
                {provider === 'github' ? 'GitHub' : 'GitLab'}: {providerInfo}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Projet local
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Project Navigation */}
      <div className="border-b border-border">
        <nav className="flex gap-1 -mb-px px-6">
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

      {/* Project Content - Outlet pour les routes enfants */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}

function ProjectLayoutSkeleton() {
  return (
    <div className="flex flex-col h-full relative -left-[calc(1rem+1px)] -lg:-left-[calc(1.5rem+1px)]">
      {/* Project Header Skeleton */}
      <div className="border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 shrink-0" />
          <Skeleton className="h-5 w-5 shrink-0" />
          <div className="flex-1 min-w-0 space-y-1">
            <Skeleton className="h-5 w-48 max-w-full" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </div>

      {/* Navigation Skeleton */}
      <div className="border-b border-border">
        <nav className="flex gap-1 -mb-px px-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-3 border-b-2 border-transparent"
            >
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </nav>
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border rounded-md p-6 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-12" />
              </div>
            ))}
          </div>

          {/* Tab Content Skeleton */}
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border rounded-md p-6 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                  <Skeleton className="h-9 w-9 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
