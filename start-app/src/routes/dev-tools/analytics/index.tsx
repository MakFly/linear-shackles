import { createFileRoute, useRouter  } from '@tanstack/react-router'
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
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Target,
  Database,
  RefreshCw,
} from 'lucide-react'
import {
  getMockAnalyticsData,
  getMockIssues,
  getMockSprints,
} from '@/server/dev-tools-mocks'
import { toast } from 'sonner'

export const Route = createFileRoute('/dev-tools/analytics/')({
  loader: async () => {
    const [analytics, issues, sprints] = await Promise.all([
      getMockAnalyticsData(),
      getMockIssues(),
      getMockSprints(),
    ])
    return { analytics, issues, sprints }
  },
  component: Component,
})

function Component() {
  const { analytics, issues, sprints } = Route.useLoaderData()
  const router = useRouter()

  const handleRefresh = () => {
    router.invalidate()
    toast.success('Données rafraîchies depuis la DB')
  }

  const { issuesByStatus, issuesByPriority, totalIssues } = analytics

  const issuesByStatusData = [
    {
      name: 'Terminé',
      value: issuesByStatus.done,
      color: 'hsl(var(--status-done))',
    },
    {
      name: 'En cours',
      value: issuesByStatus.progress,
      color: 'hsl(var(--status-progress))',
    },
    {
      name: 'En attente',
      value: issuesByStatus.warning,
      color: 'hsl(var(--status-warning))',
    },
    {
      name: 'Backlog',
      value: issuesByStatus.backlog,
      color: 'hsl(var(--status-backlog))',
    },
  ]

  // Generate velocity data from sprints
  const velocityData = sprints
    .slice(0, 5)
    .map((sprint, i) => {
      const sprintIssues = issues.filter((issue) =>
        sprint.issues?.includes(issue.id),
      )
      const completed = sprintIssues.filter((i) => i.status === 'done').length
      return {
        sprint: sprint.name.split(' ')[0] + ' ' + sprint.name.split(' ')[1],
        planned: sprintIssues.length,
        completed,
      }
    })
    .reverse()

  // Generate trend data (mock based on real data)
  const issuesTrend = [
    {
      date: 'Lun',
      created: Math.floor(totalIssues * 0.1),
      resolved: Math.floor(issuesByStatus.done * 0.15),
    },
    {
      date: 'Mar',
      created: Math.floor(totalIssues * 0.15),
      resolved: Math.floor(issuesByStatus.done * 0.2),
    },
    {
      date: 'Mer',
      created: Math.floor(totalIssues * 0.08),
      resolved: Math.floor(issuesByStatus.done * 0.25),
    },
    {
      date: 'Jeu',
      created: Math.floor(totalIssues * 0.12),
      resolved: Math.floor(issuesByStatus.done * 0.18),
    },
    {
      date: 'Ven',
      created: Math.floor(totalIssues * 0.06),
      resolved: Math.floor(issuesByStatus.done * 0.22),
    },
  ]

  const stats = [
    {
      title: 'Issues résolues',
      value: String(issuesByStatus.done),
      change: '+12%',
      trend: 'up',
      icon: CheckCircle2,
      description: 'total depuis le début',
    },
    {
      title: 'En cours',
      value: String(issuesByStatus.progress + issuesByStatus.warning),
      change: String(issuesByStatus.warning),
      trend: issuesByStatus.warning < 5 ? 'up' : 'down',
      icon: Clock,
      description: 'issues actives',
    },
    {
      title: 'Issues critiques',
      value: String(issuesByPriority.urgent),
      change: String(issuesByPriority.high),
      trend: issuesByPriority.urgent < 3 ? 'up' : 'down',
      icon: AlertTriangle,
      description: `+ ${issuesByPriority.high} high priority`,
    },
    {
      title: 'Total issues',
      value: String(totalIssues),
      change: `${Math.round((issuesByStatus.done / totalIssues) * 100)}%`,
      trend: 'up',
      icon: Target,
      description: 'completion rate',
    },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
          >
            <Database className="h-3 w-3 mr-1" />
            Dev Tools
          </Badge>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Métriques calculées depuis SQLite ({totalIssues} issues)
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-custom">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => {
            const Icon = stat.icon
            const isPositive = stat.trend === 'up'
            return (
              <Card key={stat.title}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {isPositive ? (
                          <TrendingUp className="h-4 w-4 text-status-done" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                        <span
                          className={
                            isPositive
                              ? 'text-status-done text-sm'
                              : 'text-destructive text-sm'
                          }
                        >
                          {stat.change}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {stat.description}
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
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
                  <CardDescription>
                    Répartition actuelle des issues (DB)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={issuesByStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {issuesByStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activité hebdomadaire</CardTitle>
                  <CardDescription>
                    Issues créées vs résolues (estimé)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={issuesTrend}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="date"
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
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
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="velocity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vélocité par sprint</CardTitle>
                <CardDescription>
                  Points planifiés vs complétés (données réelles)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={velocityData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="sprint"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tendance des issues</CardTitle>
                <CardDescription>
                  Évolution sur la semaine (estimé)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={issuesTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="created"
                      stroke="hsl(var(--primary))"
                      name="Créées"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="resolved"
                      stroke="hsl(var(--status-done))"
                      name="Résolues"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--status-done))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
