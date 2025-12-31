import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from 'react'
import { useGitHub } from '@/hooks/useGitHub'
import { useGitHubWorkflowMonitor } from '@/hooks/useGitHubWorkflowMonitor'
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
import { toast } from 'sonner'
import { getProjectByIdOrSlug } from '@/server/db'
import {
  GitBranch,
  CircleDot,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  GitMerge,
  PlayCircle,
  Loader2,
} from 'lucide-react'
import type {
  GitHubIssue,
  GitHubPullRequest,
  GitHubBranch,
  GitHubWorkflowRun,
} from '@/types/github'

export const Route = createFileRoute('/projects/$slugOrId/github/')({
  component: ProjectGitHub,
  loader: async ({ params }) => {
    const project = await getProjectByIdOrSlug({ data: params.slugOrId })
    return { project }
  },
})

function ProjectGitHub() {
  const { project } = Route.useLoaderData()
  const github = useGitHub({ mode: 'project', projectId: project?.id })

  // Extraire les infos GitHub depuis les colonnes provider du projet
  const providerInfo = useMemo(() => {
    // Vérifier que c'est un projet GitHub et retourner l'identifiant du repo
    if (project?.provider === 'github' && project?.providerProjectId) {
      return project.providerProjectId
    }
    return null
  }, [project?.provider, project?.providerProjectId])

  const {
    isConnected,
    repo,
    getIssues,
    getPullRequests,
    getBranches,
    getWorkflowRuns,
    loading: credentialsLoading,
    token,
  } = github

  const [issues, setIssues] = useState<GitHubIssue[]>([])
  const [prs, setPrs] = useState<GitHubPullRequest[]>([])
  const [branches, setBranches] = useState<GitHubBranch[]>([])
  const [workflows, setWorkflows] = useState<GitHubWorkflowRun[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('issues')

  // Debug log
  console.log('ProjectGitHub state:', {
    projectId: project?.id,
    projectProvider: project?.provider,
    projectProviderId: project?.providerProjectId,
    providerInfo,
    isConnected,
    repo,
    credentialsLoading,
    hasToken: !!token,
  })

  const loadData = async () => {
    if (!isConnected) return
    setDataLoading(true)
    setError(null)
    try {
      console.log('Loading data from GitHub...', { repo })
      const [issuesData, prsData, branchesData, workflowsData] =
        await Promise.all([
          getIssues('all'),
          getPullRequests('all'),
          getBranches(),
          getWorkflowRuns(),
        ])
      console.log('Data loaded:', {
        issues: issuesData.length,
        prs: prsData.length,
        branches: branchesData.length,
        workflows: workflowsData.length,
      })
      // Filter out pull requests from issues (GitHub API includes both)
      setIssues(issuesData.filter((issue) => !issue.pull_request))
      setPrs(prsData)
      setBranches(branchesData)
      setWorkflows(workflowsData)
    } catch (error: unknown) {
      const errorMsg = (error as Error).message
      console.error('Error loading data:', errorMsg)
      setError(errorMsg)
      toast.error(`Erreur: ${errorMsg}`)
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    if (isConnected && repo === providerInfo) {
      loadData()
    }
  }, [isConnected, repo, providerInfo])

  useGitHubWorkflowMonitor(workflows, getWorkflowRuns, {
    enabled: isConnected,
    interval: 30000,
  })

  const getStatusIcon = (state: string, merged?: boolean) => {
    if (merged) return <GitMerge className="h-4 w-4 text-purple-500" />
    if (state === 'open')
      return <CircleDot className="h-4 w-4 text-green-500" />
    if (state === 'closed') return <XCircle className="h-4 w-4 text-red-500" />
    return <CircleDot className="h-4 w-4" />
  }

  const getWorkflowIcon = (status: string, conclusion?: string) => {
    if (status === 'in_progress')
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    if (status === 'queued')
      return <PlayCircle className="h-4 w-4 text-gray-500" />
    if (conclusion === 'success')
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    if (conclusion === 'failure')
      return <XCircle className="h-4 w-4 text-red-500" />
    return <AlertCircle className="h-4 w-4 text-yellow-500" />
  }

  if (!providerInfo) {
    return (
      <div className="p-6">
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle>Aucun repository GitHub lié</CardTitle>
            <CardDescription>
              Ce projet n'est pas lié à un repository GitHub.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Show loading skeleton while credentials are loading OR repo not yet loaded
  if (credentialsLoading || !repo) {
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

  if (!isConnected || repo !== providerInfo) {
    return (
      <div className="p-6">
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle>Connexion GitHub requise</CardTitle>
            <CardDescription>
              Configurez votre token GitHub pour accéder au repository{' '}
              <span className="font-mono">{providerInfo}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/provider/github">Configurer GitHub</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="space-y-6">
        {error && (
          <div className="bg-destructive/15 border border-destructive/50 text-destructive px-4 py-3 rounded-lg">
            <p className="font-medium">Erreur de chargement</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Repository: <span className="font-mono">{repo}</span>
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
                href={`https://github.com/${repo}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ouvrir sur GitHub
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
                  <Skeleton className="h-4 w-24" />
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
                    {issues.filter((i) => i.state === 'open').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    PRs Ouvertes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {prs.filter((pr) => pr.state === 'open').length}
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
                  <CardTitle className="text-sm font-medium">Workflows</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {workflows.filter((w) => w.status === 'in_progress').length}{' '}
                    actifs
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="prs">Pull Requests</TabsTrigger>
            <TabsTrigger value="cicd">CI/CD</TabsTrigger>
            <TabsTrigger value="branches">Branches</TabsTrigger>
          </TabsList>

          <TabsContent value="issues" className="space-y-4 mt-4">
            {dataLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <Skeleton className="h-6 w-48" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Skeleton className="h-5 w-16 rounded-full" />
                          <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-40" />
                      </div>
                      <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : issues.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Aucune issue
                </CardContent>
              </Card>
            ) : (
              issues.map((issue) => (
                <Card
                  key={issue.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(issue.state)}
                          <h3 className="font-semibold">
                            #{issue.number} {issue.title}
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {issue.labels.map((label) => (
                            <Badge
                              key={label.id}
                              style={{ backgroundColor: `#${label.color}` }}
                              className="text-white"
                            >
                              {label.name}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Par {issue.user.login} •{' '}
                          {new Date(issue.created_at).toLocaleDateString(
                            'fr-FR',
                          )}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <a
                          href={issue.html_url}
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

          <TabsContent value="prs" className="space-y-4 mt-4">
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
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <Skeleton className="h-4 w-48" />
                      </div>
                      <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : prs.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Aucune PR
                </CardContent>
              </Card>
            ) : (
              prs.map((pr) => (
                <Card key={pr.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(pr.state, !!pr.merged_at)}
                          <h3 className="font-semibold">
                            #{pr.number} {pr.title}
                          </h3>
                          {pr.draft && <Badge variant="secondary">Draft</Badge>}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            {pr.head.ref} → {pr.base.ref}
                          </span>
                          <span>
                            +{pr.additions} -{pr.deletions}
                          </span>
                          <span>{pr.commits} commits</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Par {pr.user.login} •{' '}
                          {new Date(pr.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <a
                          href={pr.html_url}
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

          <TabsContent value="cicd" className="space-y-4 mt-4">
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
                          <Skeleton className="h-5 w-16 rounded-md" />
                        </div>
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                      <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : workflows.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Aucun workflow
                </CardContent>
              </Card>
            ) : (
              workflows.map((workflow) => (
                <Card
                  key={workflow.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {getWorkflowIcon(
                            workflow.status,
                            workflow.conclusion,
                          )}
                          <h3 className="font-semibold">{workflow.name}</h3>
                          <Badge variant="outline">{workflow.status}</Badge>
                          {workflow.conclusion && (
                            <Badge
                              variant={
                                workflow.conclusion === 'success'
                                  ? 'default'
                                  : 'destructive'
                              }
                            >
                              {workflow.conclusion}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <GitBranch className="h-3 w-3" />
                            {workflow.head_branch}
                          </span>
                          <span>{workflow.event}</span>
                          <span>
                            {new Date(workflow.created_at).toLocaleString(
                              'fr-FR',
                            )}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <a
                          href={workflow.html_url}
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
                      </div>
                      <code className="text-xs text-muted-foreground">
                        {branch.commit.sha.substring(0, 7)}
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
