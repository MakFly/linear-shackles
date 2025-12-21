import { createFileRoute, Outlet, useParams, Link, useRouterState } from "@tanstack/react-router";
import { FolderKanban, ListTodo, Github, BarChart3, Settings, ArrowLeft, Users, Calendar, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/projects/$projectId")({
  component: ProjectLayout,
});

function ProjectLayout() {
  const { projectId } = useParams({ from: "/projects/$projectId" });
  const router = useRouterState();
  const currentPath = router.location.pathname;
  const isIndexRoute = currentPath === `/projects/${projectId}`;

  const navItems = [
    { title: "Vue d'ensemble", url: `/projects/${projectId}`, icon: FolderKanban },
    { title: "Issues", url: `/projects/${projectId}/issues`, icon: ListTodo },
    { title: "GitHub", url: `/projects/${projectId}/github`, icon: Github },
    { title: "Analytics", url: `/projects/${projectId}/analytics`, icon: BarChart3 },
    { title: "Paramètres", url: `/projects/${projectId}/settings`, icon: Settings },
  ];

  const isActive = (path: string) => currentPath === path || (path !== `/projects/${projectId}` && currentPath.startsWith(path));

  // Empty - DB is empty, only dev-tools has mock data
  const projectStats = {
    totalIssues: 0,
    completedIssues: 0,
    inProgressIssues: 0,
    blockedIssues: 0,
    progress: 0,
    members: 0,
    dueDate: "",
  };

  const recentActivity: { id: number; action: string; user: string; time: string }[] = [];

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
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projet: {projectId}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez les issues, intégrations et paramètres de ce projet
          </p>
        </div>
      </div>

      {/* Project Navigation */}
      <div className="border-b border-border px-6">
        <nav className="flex gap-1 -mb-px">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.url);
            return (
              <Link
                key={item.url}
                to={item.url}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Project Content */}
      <div className="flex-1 overflow-hidden">
        {isIndexRoute ? (
          <div className="flex-1 overflow-y-auto p-6 scrollbar-custom">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Issues totales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{projectStats.totalIssues}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {projectStats.completedIssues} terminées
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">En cours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{projectStats.inProgressIssues}</div>
                    <p className="text-xs text-muted-foreground mt-1">Actuellement</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Bloquées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">{projectStats.blockedIssues}</div>
                    <p className="text-xs text-muted-foreground mt-1">Nécessitent attention</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Progression</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{projectStats.progress}%</div>
                    <Progress value={projectStats.progress} className="mt-2" />
                  </CardContent>
                </Card>
              </div>

              {/* Project Info */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Informations du projet</CardTitle>
                    <CardDescription>Détails et métriques du projet {projectId}</CardDescription>
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
                      <span className="text-sm font-medium">{projectStats.dueDate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-status-done" />
                        <span className="text-sm">Issues résolues</span>
                      </div>
                      <span className="text-sm font-medium">
                        {projectStats.completedIssues} / {projectStats.totalIssues}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Activité récente</CardTitle>
                    <CardDescription>Dernières actions sur le projet</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3">
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
  );
}
