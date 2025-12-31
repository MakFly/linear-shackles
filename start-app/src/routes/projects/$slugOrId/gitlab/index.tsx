import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { useGitLab } from '@/hooks/useGitLab'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable } from '@/components/ui/data-table'
import { toast } from 'sonner'
import { getProjectByIdOrSlug } from '@/server/db'
import {
  GitBranch,
  GitMerge,
  CircleDot,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  PlayCircle,
  Loader2,
} from 'lucide-react'
import type {
  GitLabIssue,
  GitLabMergeRequest,
  GitLabBranch,
  GitLabPipeline,
} from '@/types/gitlab'

export const Route = createFileRoute('/projects/$slugOrId/gitlab/')({
  component: ProjectGitLab,
  loader: async ({ params }) => {
    const project = await getProjectByIdOrSlug({ data: params.slugOrId })
    return { project }
  },
})

function ProjectGitLab() {
  const { project } = Route.useLoaderData()
  const gitlab = useGitLab({ mode: 'project', projectId: project?.id })

  // Extraire les infos GitLab depuis les colonnes provider du projet
  const providerInfo = useMemo(() => {
    // Vérifier que c'est un projet GitLab et retourner l'identifiant du projet
    if (project?.provider === 'gitlab' && project?.providerProjectId) {
      return project.providerProjectId
    }
    return null
  }, [project?.provider, project?.providerProjectId])

  const {
    isConnected,
    projectId: currentProjectId,
    getIssues,
    getMergeRequests,
    getBranches,
    getPipelines,
    loading: credentialsLoading,
  } = gitlab

  const [issues, setIssues] = useState<GitLabIssue[]>([])
  const [mergeRequests, setMergeRequests] = useState<GitLabMergeRequest[]>(
    [],
  )
  const [branches, setBranches] = useState<GitLabBranch[]>([])
  const [pipelines, setPipelines] = useState<GitLabPipeline[]>([])
  const [pipelinesUnavailable, setPipelinesUnavailable] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('issues')

  const loadData = async () => {
    if (!isConnected) return
    setDataLoading(true)
    setPipelinesUnavailable(false)

    const results = await Promise.allSettled([
      getIssues('all'),
      getMergeRequests('all'),
      getBranches(),
      getPipelines(),
    ])

    if (results[0].status === 'fulfilled') setIssues(results[0].value)
    if (results[1].status === 'fulfilled') setMergeRequests(results[1].value)
    if (results[2].status === 'fulfilled') setBranches(results[2].value)
    if (results[3].status === 'fulfilled') {
      setPipelines(results[3].value)
    } else {
      setPipelinesUnavailable(true)
    }

    setDataLoading(false)
  }

  useEffect(() => {
    if (isConnected && currentProjectId === providerInfo) {
      loadData()
    }
  }, [isConnected, currentProjectId, providerInfo])

  const getStatusIcon = (state: string) => {
    if (state === 'opened')
      return <CircleDot className="h-4 w-4 text-green-500" />
    if (state === 'closed') return <XCircle className="h-4 w-4 text-red-500" />
    if (state === 'merged')
      return <GitMerge className="h-4 w-4 text-purple-500" />
    return <CircleDot className="h-4 w-4" />
  }

  const getPipelineIcon = (status: string) => {
    if (status === 'running')
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    if (status === 'pending')
      return <PlayCircle className="h-4 w-4 text-gray-500" />
    if (status === 'success')
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    if (status === 'failed') return <XCircle className="h-4 w-4 text-red-500" />
    return <AlertCircle className="h-4 w-4 text-yellow-500" />
  }

  const issueColumns: ColumnDef<GitLabIssue>[] = [
    {
      accessorKey: 'iid',
      header: '#',
      cell: ({ row }) => (
        <span className="font-mono font-medium">#{row.original.iid}</span>
      ),
    },
    {
      accessorKey: 'title',
      header: 'Titre',
      cell: ({ row }) => {
        const issue = row.original
        return (
          <div className="flex items-center gap-2">
            {getStatusIcon(issue.state)}
            <span className="font-medium">{issue.title}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'labels',
      header: 'Labels',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.labels.length > 0 ? (
            row.original.labels.map((label, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {label.title || label}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">Aucun</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'author',
      header: 'Auteur',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.author.username}</span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Créé le',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.created_at).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" asChild>
          <a
            href={row.original.web_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      ),
    },
  ]

  if (!providerInfo) {
    return (
      <div className="p-6">
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle>Aucun projet GitLab lié</CardTitle>
            <CardDescription>
              Ce projet n'est pas lié à un projet GitLab.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Show loading skeleton while credentials are loading OR project not yet loaded
  if (credentialsLoading || !currentProjectId) {
    return (
      <div className="flex-1 p-6 overflow-auto">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-64" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-40" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-8 w-12" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!isConnected || currentProjectId !== providerInfo) {
    return (
      <div className="p-6">
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle>Connexion GitLab requise</CardTitle>
            <CardDescription>
              Configurez votre token GitLab pour accéder au projet{' '}
              <span className="font-mono">{providerInfo}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/provider/gitlab">Configurer GitLab</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Projet: <span className="font-mono">{currentProjectId}</span>
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={dataLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${dataLoading ? 'animate-spin' : ''}`}
              />
              Actualiser
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://gitlab.com/${currentProjectId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ouvrir sur GitLab
              </a>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {dataLoading ? (
            <>
              <Card>
                <CardContent className="p-6 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-8 w-12" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-12" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-12" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Issues Ouvertes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {issues.filter((i) => i.state === 'opened').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Merge Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {mergeRequests.filter((mr) => mr.state === 'opened').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Branches</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{branches.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Pipelines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {pipelines.filter((p) => p.status === 'running').length} actifs
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="mrs">Merge Requests</TabsTrigger>
            <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
            <TabsTrigger value="branches">Branches</TabsTrigger>
          </TabsList>

          <TabsContent value="issues" className="mt-4">
            <DataTable
              columns={issueColumns}
              data={issues}
              searchKey="title"
              searchPlaceholder="Rechercher une issue..."
              loading={dataLoading}
              onRowClick={(issue) => window.open(issue.web_url, '_blank')}
            />
          </TabsContent>

          <TabsContent value="mrs" className="space-y-4 mt-4">
            {dataLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <Skeleton className="h-6 w-40" />
                          <Skeleton className="h-5 w-14 rounded-md" />
                        </div>
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-28" />
                        </div>
                        <Skeleton className="h-4 w-48" />
                      </div>
                      <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : mergeRequests.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Aucune MR
                </CardContent>
              </Card>
            ) : (
              mergeRequests.map((mr) => (
                <Card key={mr.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(mr.state)}
                          <h3 className="font-semibold">
                            !{mr.iid} {mr.title}
                          </h3>
                          {mr.draft && <Badge variant="secondary">Draft</Badge>}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            {mr.source_branch} → {mr.target_branch}
                          </span>
                          {mr.changes_count && (
                            <span>{mr.changes_count} changements</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Par {mr.author.username} •{' '}
                          {new Date(mr.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <a
                          href={mr.web_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="pipelines" className="space-y-4 mt-4">
            {dataLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <Skeleton className="h-6 w-36" />
                          <Skeleton className="h-5 w-16 rounded-md" />
                        </div>
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </div>
                      <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : pipelinesUnavailable ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Pipelines non disponibles
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Les pipelines CI/CD ne sont pas accessibles pour ce projet.
                  </p>
                </CardContent>
              </Card>
            ) : pipelines.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <PlayCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun pipeline</h3>
                  <p className="text-sm text-muted-foreground">
                    Aucun pipeline n'a encore été exécuté sur ce projet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              pipelines.map((pipeline) => (
                <Card
                  key={pipeline.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {getPipelineIcon(pipeline.status)}
                          <h3 className="font-semibold">
                            Pipeline #{pipeline.id}
                          </h3>
                          <Badge variant="outline">{pipeline.status}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <GitBranch className="h-3 w-3" />
                            {pipeline.ref}
                          </span>
                          <span>{pipeline.source}</span>
                          {pipeline.duration && (
                            <span>{Math.round(pipeline.duration / 60)}min</span>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <a
                          href={pipeline.web_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="branches" className="space-y-4 mt-4">
            {dataLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-5 w-32 font-mono" />
                        <Skeleton className="h-5 w-16 rounded-md" />
                      </div>
                      <Skeleton className="h-4 w-12 font-mono text-xs" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : branches.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Aucune branche
                </CardContent>
              </Card>
            ) : (
              branches.map((branch) => (
                <Card
                  key={branch.name}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <GitBranch className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono font-medium">
                          {branch.name}
                        </span>
                        {branch.protected && (
                          <Badge variant="secondary">Protected</Badge>
                        )}
                        {branch.default && <Badge>Default</Badge>}
                      </div>
                      <code className="text-xs text-muted-foreground">
                        {branch.commit.short_id}
                      </code>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
