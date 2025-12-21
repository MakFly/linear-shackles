import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  AlertCircle,
  Circle,
  TrendingUp,
  Target,
  Calendar,
  Activity,
  Clock,
  ArrowUp,
  Database,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getMockIssues, getMockSprints, getMockAnalyticsData } from "@/server/dev-tools-mocks";

export const Route = createFileRoute("/dev-tools/")({
  loader: async () => {
    const [issues, sprints, analytics] = await Promise.all([
      getMockIssues(),
      getMockSprints(),
      getMockAnalyticsData(),
    ]);
    return { issues, sprints, analytics };
  },
  component: Component,
});

function Component() {
  const { issues, sprints, analytics } = Route.useLoaderData();

  const { issuesByStatus, issuesByPriority, activeSprint } = analytics;

  const totalIssues = issues.length;
  const doneIssues = issuesByStatus.done;
  const progressIssues = issuesByStatus.progress;
  const warningIssues = issuesByStatus.warning;
  const backlogIssues = issuesByStatus.backlog;
  const completionRate = totalIssues > 0 ? Math.round((doneIssues / totalIssues) * 100) : 0;

  const urgentIssues = issuesByPriority.urgent;
  const highIssues = issuesByPriority.high;

  const activeSprintIssues = activeSprint
    ? issues.filter((i) => activeSprint.issues?.includes(i.id))
    : [];
  const activeSprintProgress = activeSprint && activeSprintIssues.length > 0
    ? Math.round(
        (activeSprintIssues.filter((i) => i.status === "done").length /
          activeSprintIssues.length) *
          100
      )
    : 0;

  const velocity = activeSprint
    ? activeSprintIssues.filter((i) => i.status === "done").length
    : 0;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6 scrollbar-custom">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
          <Database className="h-5 w-5 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dev Tools - Overview</h1>
          <p className="text-muted-foreground mt-1">
            Données mockées pour le développement (DB vide ailleurs)
          </p>
        </div>
      </div>

      {/* DB Status Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
          <Database className="h-3 w-3 mr-1" />
          Mock Data
        </Badge>
        <Badge variant="outline" className="text-muted-foreground">
          {totalIssues} issues in database
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              Total Issues
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {totalIssues}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <ArrowUp className="h-3 w-3 text-[hsl(var(--status-done))] mr-1" />
              <span className="text-[hsl(var(--status-done))]">
                {completionRate}% terminé
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              En cours
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {progressIssues + warningIssues}
            </div>
            <div className="flex gap-2 mt-1">
              <Badge
                variant="outline"
                className="text-xs bg-[hsl(var(--status-progress))]/10 text-[hsl(var(--status-progress))] border-[hsl(var(--status-progress))]/20"
              >
                {progressIssues} progress
              </Badge>
              <Badge
                variant="outline"
                className="text-xs bg-[hsl(var(--status-warning))]/10 text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning))]/20"
              >
                {warningIssues} warning
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              Priorité élevée
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-[hsl(var(--priority-urgent))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {urgentIssues + highIssues}
            </div>
            <div className="flex gap-2 mt-1">
              <Badge
                variant="outline"
                className="text-xs bg-[hsl(var(--priority-urgent))]/10 text-[hsl(var(--priority-urgent))] border-[hsl(var(--priority-urgent))]/20"
              >
                {urgentIssues} urgent
              </Badge>
              <Badge
                variant="outline"
                className="text-xs bg-[hsl(var(--priority-high))]/10 text-[hsl(var(--priority-high))] border-[hsl(var(--priority-high))]/20"
              >
                {highIssues} high
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              Vélocité
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {velocity}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              issues/sprint actuel
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sprint actif */}
      {activeSprint && (
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-card-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {activeSprint.name}
                </CardTitle>
                <CardDescription className="mt-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  {activeSprint.goal}
                </CardDescription>
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/20">
                Sprint actif
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {format(new Date(activeSprint.startDate), "dd MMM", { locale: fr })} -{" "}
                {format(new Date(activeSprint.endDate), "dd MMM yyyy", { locale: fr })}
              </span>
              <span className="font-medium text-foreground">
                {activeSprintIssues.filter((i) => i.status === "done").length} / {activeSprintIssues.length} issues
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progression</span>
                <span className="font-medium text-foreground">{activeSprintProgress}%</span>
              </div>
              <Progress value={activeSprintProgress} className="h-2" />
            </div>

            {/* Sprint Issues */}
            <div className="space-y-2 pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-card-foreground">
                Issues du sprint
              </h4>
              <div className="space-y-2">
                {activeSprintIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-background hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {issue.status === "done" ? (
                        <CheckCircle2 className="h-4 w-4 text-[hsl(var(--status-done))]" />
                      ) : issue.status === "warning" ? (
                        <AlertCircle className="h-4 w-4 text-[hsl(var(--status-warning))]" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">{issue.title}</p>
                        <p className="text-xs text-muted-foreground">{issue.id}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        issue.priority === "urgent"
                          ? "bg-[hsl(var(--priority-urgent))]/10 text-[hsl(var(--priority-urgent))] border-[hsl(var(--priority-urgent))]/20"
                          : issue.priority === "high"
                            ? "bg-[hsl(var(--priority-high))]/10 text-[hsl(var(--priority-high))] border-[hsl(var(--priority-high))]/20"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {issue.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statuts et Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Distribution par statut</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                { label: "Terminé", count: doneIssues, color: "--status-done", icon: CheckCircle2 },
                { label: "En cours", count: progressIssues, color: "--status-progress", icon: Circle },
                { label: "Bloqué", count: warningIssues, color: "--status-warning", icon: AlertCircle },
                { label: "Backlog", count: backlogIssues, color: "--status-backlog", icon: Circle },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <item.icon className={`h-4 w-4 text-[hsl(var(${item.color}))]`} />
                    <span className="text-sm text-foreground">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{item.count}</span>
                    <div className="w-32 bg-secondary rounded-full h-2">
                      <div
                        className={`bg-[hsl(var(${item.color}))] h-2 rounded-full transition-all`}
                        style={{ width: `${totalIssues > 0 ? (item.count / totalIssues) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Tous les sprints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sprints.map((sprint) => {
              const sprintIssues = issues.filter((i) => sprint.issues?.includes(i.id));
              const sprintProgress =
                sprintIssues.length > 0
                  ? Math.round(
                      (sprintIssues.filter((i) => i.status === "done").length / sprintIssues.length) * 100
                    )
                  : 0;

              return (
                <div key={sprint.id} className="p-3 rounded-lg border border-border bg-background">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{sprint.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(sprint.startDate), "dd MMM", { locale: fr })} -{" "}
                        {format(new Date(sprint.endDate), "dd MMM", { locale: fr })}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        sprint.status === "active"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : sprint.status === "completed"
                            ? "bg-[hsl(var(--status-done))]/10 text-[hsl(var(--status-done))] border-[hsl(var(--status-done))]/20"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {sprint.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {sprintIssues.filter((i) => i.status === "done").length} / {sprintIssues.length} issues
                      </span>
                      <span className="font-medium text-foreground">{sprintProgress}%</span>
                    </div>
                    <Progress value={sprintProgress} className="h-1" />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
