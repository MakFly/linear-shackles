import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { findOrCreateProjectByProvider } from '@/server/db'
import {
  GitBranch,
  GitPullRequest,
  CircleDot,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Settings,
  RefreshCw,
  GitMerge,
  PlayCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react'
import type {
  GitHubIssue,
  GitHubPullRequest,
  GitHubBranch,
  GitHubWorkflowRun,
} from '@/types/github'

export const Route = createFileRoute('/provider/github/$owner/$repo')({
  component: Component,
})

function Component() {
  const { owner, repo: repoName } = Route.useParams()
  const fullRepo = `${owner}/${repoName}`
  const github = useGitHub()
  const { toast } = useToast()
  const router = useRouter()

  // Connecter automatiquement si pas déjà connecté ou si le repo a changé
  useEffect(() => {
    if (github.token && (!github.isConnected || github.repo !== fullRepo)) {
      github.connect(github.token, fullRepo)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullRepo, github.token, github.isConnected, github.repo])

  const {
    isConnected,
    repo,
    getIssues,
    getPullRequests,
    getBranches,
    getWorkflowRuns,
    createIssue,
  } = github

  const [issues, setIssues] = useState<GitHubIssue[]>([])
  const [prs, setPrs] = useState<GitHubPullRequest[]>([])
  const [branches, setBranches] = useState<GitHubBranch[]>([])
  const [workflows, setWorkflows] = useState<GitHubWorkflowRun[]>([])

  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('issues')

  const [showCreateIssue, setShowCreateIssue] = useState(false)
  const [newIssueTitle, setNewIssueTitle] = useState('')
  const [newIssueBody, setNewIssueBody] = useState('')
  const [newIssueLabels, setNewIssueLabels] = useState('')
  const [creating, setCreating] = useState(false)

  const loadData = async () => {
    if (!isConnected) return

    setLoading(true)
    try {
      const [issuesData, prsData, branchesData, workflowsData] =
        await Promise.all([
          getIssues('all'),
          getPullRequests('all'),
          getBranches(),
          getWorkflowRuns(),
        ])

      setIssues(issuesData)
      setPrs(prsData)
      setBranches(branchesData)
      setWorkflows(workflowsData)
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isConnected && repo === fullRepo) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, repo, fullRepo])

  // Surveiller les changements d'état des workflows
  useGitHubWorkflowMonitor(workflows, getWorkflowRuns, {
    enabled: isConnected,
    interval: 30000,
  })

  const handleCreateIssue = async () => {
    if (!newIssueTitle.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le titre est requis',
        variant: 'destructive',
      })
      return
    }

    setCreating(true)
    try {
      const labels = newIssueLabels
        .split(',')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)

      // Créer ou trouver le projet associé à ce repo GitHub
      const project = await findOrCreateProjectByProvider({
        data: {
          provider: 'github',
          providerId: fullRepo,
          name: repoName,
          description: `Projet GitHub: ${fullRepo}`,
        },
      })

      // Créer l'issue sur GitHub
      await createIssue(
        newIssueTitle,
        newIssueBody || undefined,
        labels.length > 0 ? labels : undefined,
      )

      toast({
        title: 'Issue créée',
        description: `L'issue a été créée avec succès sur GitHub. Projet "${project.name}" créé/mis à jour.`,
      })

      setNewIssueTitle('')
      setNewIssueBody('')
      setNewIssueLabels('')
      setShowCreateIssue(false)

      await loadData()

      // Rediriger vers le projet créé
      router.navigate({ to: `/projects/${project.id}` })
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

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

  if (!isConnected || repo !== fullRepo) {
    return (
      <div className="flex-1 p-8 overflow-auto">
        <Card>
          <CardHeader>
            <CardTitle>Connexion requise</CardTitle>
            <CardDescription>
              Vous devez être connecté à GitHub pour voir ce repository.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/provider/github">Aller à la configuration GitHub</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/provider/github">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux repositories
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">GitHub Integration</h1>
              <p className="text-muted-foreground mt-1">
                Repository: <span className="font-mono">{repo}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={loadData}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
            </Button>
            <Button variant="outline" size="icon" asChild>
              <a
                href={`https://github.com/${repo}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
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
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="prs">Pull Requests</TabsTrigger>
            <TabsTrigger value="cicd">CI/CD</TabsTrigger>
            <TabsTrigger value="branches">Branches</TabsTrigger>
          </TabsList>

          <TabsContent value="issues" className="space-y-4">
            <div className="flex justify-end mb-4">
              <Dialog open={showCreateIssue} onOpenChange={setShowCreateIssue}>
                <DialogTrigger asChild>
                  <Button>
                    <CircleDot className="h-4 w-4 mr-2" />
                    Créer une issue
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Créer une issue GitHub</DialogTitle>
                    <DialogDescription>
                      Créez une nouvelle issue qui sera synchronisée avec votre
                      repository GitHub
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="issue-title">Titre *</Label>
                      <Input
                        id="issue-title"
                        placeholder="Titre de l'issue"
                        value={newIssueTitle}
                        onChange={(e) => setNewIssueTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="issue-body">Description</Label>
                      <Textarea
                        id="issue-body"
                        placeholder="Description détaillée de l'issue"
                        value={newIssueBody}
                        onChange={(e) => setNewIssueBody(e.target.value)}
                        rows={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="issue-labels">Labels</Label>
                      <Input
                        id="issue-labels"
                        placeholder="bug, enhancement, documentation (séparés par des virgules)"
                        value={newIssueLabels}
                        onChange={(e) => setNewIssueLabels(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateIssue(false)}
                      disabled={creating}
                    >
                      Annuler
                    </Button>
                    <Button onClick={handleCreateIssue} disabled={creating}>
                      {creating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Création...
                        </>
                      ) : (
                        "Créer l'issue"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))
              : issues.map((issue) => (
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
                            Ouvert par {issue.user.login} •{' '}
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
                ))}
          </TabsContent>

          <TabsContent value="prs" className="space-y-4">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))
              : prs.map((pr) => (
                  <Card
                    key={pr.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(pr.state, !!pr.merged_at)}
                            <h3 className="font-semibold">
                              #{pr.number} {pr.title}
                            </h3>
                            {pr.draft && (
                              <Badge variant="secondary">Draft</Badge>
                            )}
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
                            {new Date(pr.created_at).toLocaleDateString(
                              'fr-FR',
                            )}
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
                ))}
          </TabsContent>

          <TabsContent value="cicd" className="space-y-4">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))
              : workflows.map((workflow) => (
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
                              {new Date(workflow.created_at).toLocaleDateString(
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
                ))}
          </TabsContent>

          <TabsContent value="branches" className="space-y-4">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-2/3" />
                    </CardContent>
                  </Card>
                ))
              : branches.map((branch) => (
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
                ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
