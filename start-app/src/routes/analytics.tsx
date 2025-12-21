import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, CheckCircle2, Clock, AlertTriangle, Target } from "lucide-react";
import { getAnalyticsData } from "@/server/db";

export const Route = createFileRoute("/analytics")({
  loader: async () => {
    const data = await getAnalyticsData();
    return { data };
  },
  component: Component,
});

const COLORS = [
  "hsl(var(--status-done))",
  "hsl(var(--status-progress))",
  "hsl(var(--status-warning))",
  "hsl(var(--status-backlog))",
];

function Component() {
  const { data } = Route.useLoaderData();

  const issuesByStatus = [
    { name: "Terminées", value: data.issuesByStatus.done, color: COLORS[0] },
    { name: "En cours", value: data.issuesByStatus.progress, color: COLORS[1] },
    { name: "Attention", value: data.issuesByStatus.warning, color: COLORS[2] },
    { name: "Backlog", value: data.issuesByStatus.backlog, color: COLORS[3] },
  ].filter((item) => item.value > 0);

  const velocityData = data.sprints
    .filter((s) => s.status === "completed")
    .map((sprint) => ({
      sprint: sprint.name,
      planned: sprint.velocity || 0,
      completed: sprint.velocity || 0,
    }));

  // Pas de données de tendance mockées - utiliser les vraies données si disponibles
  const issuesTrend: Array<{ date: string; created: number; resolved: number }> = [];

  const stats = [
    {
      title: "Total Issues",
      value: data.totalIssues.toString(),
      change: "",
      trend: "up" as const,
      icon: Target,
      description: "",
    },
    {
      title: "Issues Terminées",
      value: data.issuesByStatus.done.toString(),
      change: "",
      trend: "up" as const,
      icon: CheckCircle2,
      description: "",
    },
    {
      title: "En Cours",
      value: data.issuesByStatus.progress.toString(),
      change: "",
      trend: "up" as const,
      icon: Clock,
      description: "",
    },
    {
      title: "Sprint Actif",
      value: data.activeSprint ? "1" : "0",
      change: data.activeSprint ? "Actif" : "Aucun",
      trend: data.activeSprint ? ("up" as const) : ("down" as const),
      icon: AlertTriangle,
      description: data.activeSprint ? data.activeSprint.name : "",
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visualisez les métriques et tendances de vos projets
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-custom">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const isPositive = stat.trend === "up";
            return (
              <Card key={stat.title}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                      {stat.change && (
                        <div className="flex items-center gap-1 mt-1">
                          {isPositive ? (
                            <TrendingUp className="h-4 w-4 text-status-done" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-destructive" />
                          )}
                          <span
                            className={
                              isPositive ? "text-status-done text-sm" : "text-destructive text-sm"
                            }
                          >
                            {stat.change}
                          </span>
                          {stat.description && (
                            <span className="text-muted-foreground text-sm">{stat.description}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="velocity">Vélocité</TabsTrigger>
            <TabsTrigger value="trends">Tendances</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Issues par statut</CardTitle>
                  <CardDescription>Répartition actuelle des issues</CardDescription>
                </CardHeader>
                <CardContent>
                  {issuesByStatus.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={issuesByStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {issuesByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      Aucune donnée disponible
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activité hebdomadaire</CardTitle>
                  <CardDescription>Issues créées vs résolues</CardDescription>
                </CardHeader>
                <CardContent>
                  {issuesTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={issuesTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                          }}
                        />
                        <Bar
                          dataKey="created"
                          fill="hsl(var(--primary))"
                          name="Créées"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="resolved"
                          fill="hsl(var(--status-done))"
                          name="Résolues"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      Aucune donnée disponible
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="velocity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vélocité par sprint</CardTitle>
                <CardDescription>Points planifiés vs complétés</CardDescription>
              </CardHeader>
              <CardContent>
                {velocityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={velocityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="sprint" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="planned"
                        fill="hsl(var(--muted))"
                        name="Planifiés"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="completed"
                        fill="hsl(var(--primary))"
                        name="Complétés"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                    Aucun sprint terminé pour afficher la vélocité
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tendance des issues</CardTitle>
                <CardDescription>Évolution sur la semaine</CardDescription>
              </CardHeader>
              <CardContent>
                {issuesTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={issuesTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="created"
                        stroke="hsl(var(--primary))"
                        name="Créées"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="resolved"
                        stroke="hsl(var(--status-done))"
                        name="Résolues"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--status-done))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                    Aucune donnée disponible
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
