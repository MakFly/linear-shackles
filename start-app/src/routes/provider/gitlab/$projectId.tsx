import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useGitLab } from "@/hooks/useGitLab";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { findOrCreateProjectByProvider } from "@/server/db";
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
  ArrowLeft,
} from "lucide-react";
import type {
  GitLabIssue,
  GitLabMergeRequest,
  GitLabBranch,
  GitLabPipeline,
} from "@/types/gitlab";

export const Route = createFileRoute("/provider/gitlab/$projectId")({
  component: Component,
});

function Component() {
  const { projectId } = Route.useParams();
  const gitlab = useGitLab();
  const { toast } = useToast();
  const router = useRouter();

  // Connecter automatiquement si pas déjà connecté ou si le projet a changé
  useEffect(() => {
    if (gitlab.token && (!gitlab.isConnected || gitlab.projectId !== projectId)) {
      gitlab.connect(gitlab.token, projectId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, gitlab.token, gitlab.isConnected, gitlab.projectId]);

  const { isConnected, projectId: currentProjectId, getIssues, getMergeRequests, getBranches, getPipelines, createIssue } = gitlab;

  const [issues, setIssues] = useState<GitLabIssue[]>([]);
  const [mergeRequests, setMergeRequests] = useState<GitLabMergeRequest[]>([]);
  const [branches, setBranches] = useState<GitLabBranch[]>([]);
  const [pipelines, setPipelines] = useState<GitLabPipeline[]>([]);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("issues");

  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState("");
  const [newIssueBody, setNewIssueBody] = useState("");
  const [newIssueLabels, setNewIssueLabels] = useState("");
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    if (!isConnected) return;

    setLoading(true);
    try {
      const [issuesData, mrsData, branchesData, pipelinesData] = await Promise.all([
        getIssues("all"),
        getMergeRequests("all"),
        getBranches(),
        getPipelines(),
      ]);

      setIssues(issuesData);
      setMergeRequests(mrsData);
      setBranches(branchesData);
      setPipelines(pipelinesData);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && currentProjectId === projectId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, currentProjectId, projectId]);

  const handleCreateIssue = async () => {
    if (!newIssueTitle.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre est requis",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const labels = newIssueLabels
        .split(",")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      // Créer ou trouver le projet associé à ce projet GitLab
      const project = await findOrCreateProjectByProvider({
        provider: "gitlab",
        providerId: projectId,
        name: projectId.split("/").pop() || projectId,
        description: `Projet GitLab: ${projectId}`,
      });

      // Créer l'issue sur GitLab
      await createIssue(newIssueTitle, newIssueBody || undefined, labels.length > 0 ? labels : undefined);

      toast({
        title: "Issue créée",
        description: `L'issue a été créée avec succès sur GitLab. Projet "${project.name}" créé/mis à jour.`,
      });

      setNewIssueTitle("");
      setNewIssueBody("");
      setNewIssueLabels("");
      setShowCreateIssue(false);

      await loadData();
      
      // Rediriger vers le projet créé
      router.navigate({ to: `/projects/${project.id}` });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const getStatusIcon = (state: string, merged?: boolean) => {
    if (merged) return <GitMerge className="h-4 w-4 text-purple-500" />;
    if (state === "opened" || state === "open") return <CircleDot className="h-4 w-4 text-green-500" />;
    if (state === "closed") return <XCircle className="h-4 w-4 text-red-500" />;
    return <CircleDot className="h-4 w-4" />;
  };

  const getPipelineIcon = (status: string) => {
    if (status === "running") return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    if (status === "pending" || status === "waiting_for_resource" || status === "preparing") return <PlayCircle className="h-4 w-4 text-gray-500" />;
    if (status === "success") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === "failed") return <XCircle className="h-4 w-4 text-red-500" />;
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  if (!isConnected || currentProjectId !== projectId) {
    return (
      <div className="flex-1 p-8 overflow-auto">
        <Card>
          <CardHeader>
            <CardTitle>Connexion requise</CardTitle>
            <CardDescription>
              Vous devez être connecté à GitLab pour voir ce projet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/provider/gitlab">Aller à la configuration GitLab</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/provider/gitlab">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux projets
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">GitLab Integration</h1>
              <p className="text-muted-foreground mt-1">
                Projet: <span className="font-mono">{projectId}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Issues Ouvertes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {issues.filter((i) => i.state === "opened").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Merge Requests Ouvertes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mergeRequests.filter((mr) => mr.state === "opened").length}
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
                {pipelines.filter((p) => p.status === "running").length} actifs
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="mrs">Merge Requests</TabsTrigger>
            <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
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
                    <DialogTitle>Créer une issue GitLab</DialogTitle>
                    <DialogDescription>
                      Créez une nouvelle issue qui sera synchronisée avec votre projet GitLab
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
                    <Button variant="outline" onClick={() => setShowCreateIssue(false)} disabled={creating}>
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

            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))
            ) : (
              issues.map((issue) => (
                <Card key={issue.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(issue.state)}
                          <h3 className="font-semibold">
                            #{issue.iid} {issue.title}
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {issue.labels.map((label) => (
                            <Badge
                              key={label.id}
                              style={{ backgroundColor: `#${label.color}`, color: label.text_color }}
                            >
                              {label.title}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Par {issue.author.name} •{" "}
                          {new Date(issue.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <a href={issue.web_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="mrs" className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))
            ) : (
              mergeRequests.map((mr) => (
                <Card key={mr.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(mr.state, mr.state === "merged")}
                          <h3 className="font-semibold">
                            !{mr.iid} {mr.title}
                          </h3>
                          {mr.draft && <Badge variant="secondary">Draft</Badge>}
                          {mr.work_in_progress && <Badge variant="secondary">WIP</Badge>}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            {mr.source_branch} → {mr.target_branch}
                          </span>
                          <span>{mr.commits_count} commits</span>
                          <span>{mr.changes_count} changements</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Par {mr.author.name} • {new Date(mr.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <a href={mr.web_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="pipelines" className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))
            ) : (
              pipelines.map((pipeline) => (
                <Card key={pipeline.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {getPipelineIcon(pipeline.status)}
                          <h3 className="font-semibold">{pipeline.name || `Pipeline #${pipeline.iid}`}</h3>
                          <Badge variant="outline">{pipeline.status}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <GitBranch className="h-3 w-3" />
                            {pipeline.ref}
                          </span>
                          <span>{pipeline.source}</span>
                          <span>{new Date(pipeline.created_at).toLocaleDateString("fr-FR")}</span>
                          {pipeline.duration && <span>{Math.round(pipeline.duration)}s</span>}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <a href={pipeline.web_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="branches" className="space-y-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-5 w-2/3" />
                  </CardContent>
                </Card>
              ))
            ) : (
              branches.map((branch) => (
                <Card key={branch.name} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <GitBranch className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono font-medium">{branch.name}</span>
                        {branch.protected && <Badge variant="secondary">Protected</Badge>}
                        {branch.default && <Badge variant="outline">Default</Badge>}
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
  );
}
