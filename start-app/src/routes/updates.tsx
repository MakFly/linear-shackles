import { createFileRoute } from '@tanstack/react-router'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CheckCircle2,
  AlertCircle,
  Circle,
  MessageSquare,
  ArrowRight,
  Calendar,
  Target,
  Plus,
  Link2,
  FileText,
  Search,
  Filter,
  TrendingUp,
  Activity,
  Users,
  Zap,
} from 'lucide-react'
import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  isThisWeek,
  parseISO,
} from 'date-fns'
import { fr } from 'date-fns/locale'

export const Route = createFileRoute('/updates')({
  component: Component,
})

interface Update {
  id: string
  type:
    | 'status_change'
    | 'sprint_created'
    | 'issue_created'
    | 'comment'
    | 'relationship'
    | 'review'
  author: string
  content: string
  timestamp: string
  metadata?: {
    issueId?: string
    issueTitle?: string
    oldStatus?: string
    newStatus?: string
    sprintName?: string
    priority?: string
  }
}

const mockUpdates: Update[] = [] // Empty - DB is empty, only dev-tools has mock data

function Component() {
  const [updates] = useState<Update[]>(mockUpdates)
  const [showNewUpdate, setShowNewUpdate] = useState(false)
  const [newUpdate, setNewUpdate] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const getUpdateIcon = (type: Update['type']) => {
    switch (type) {
      case 'status_change':
        return CheckCircle2
      case 'sprint_created':
        return Calendar
      case 'issue_created':
        return Plus
      case 'comment':
        return MessageSquare
      case 'relationship':
        return Link2
      case 'review':
        return FileText
      default:
        return Circle
    }
  }

  const getUpdateColor = (type: Update['type']) => {
    switch (type) {
      case 'status_change':
        return 'text-[hsl(var(--status-done))] bg-[hsl(var(--status-done))]/10 border-[hsl(var(--status-done))]/20'
      case 'sprint_created':
        return 'text-primary bg-primary/10 border-primary/20'
      case 'issue_created':
        return 'text-[hsl(var(--status-progress))] bg-[hsl(var(--status-progress))]/10 border-[hsl(var(--status-progress))]/20'
      case 'comment':
        return 'text-[hsl(var(--status-warning))] bg-[hsl(var(--status-warning))]/10 border-[hsl(var(--status-warning))]/20'
      case 'relationship':
        return 'text-accent-foreground bg-accent/50 border-accent'
      case 'review':
        return 'text-primary bg-primary/10 border-primary/20'
      default:
        return 'text-muted-foreground bg-muted border-border'
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'done':
        return 'bg-[hsl(var(--status-done))]/10 text-[hsl(var(--status-done))] border-[hsl(var(--status-done))]/20'
      case 'progress':
        return 'bg-[hsl(var(--status-progress))]/10 text-[hsl(var(--status-progress))] border-[hsl(var(--status-progress))]/20'
      case 'warning':
        return 'bg-[hsl(var(--status-warning))]/10 text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning))]/20'
      case 'backlog':
        return 'bg-muted text-muted-foreground border-muted'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getUpdateTypeLabel = (type: Update['type']) => {
    switch (type) {
      case 'status_change':
        return 'Changement statut'
      case 'sprint_created':
        return 'Sprint créé'
      case 'issue_created':
        return 'Issue créée'
      case 'comment':
        return 'Commentaire'
      case 'relationship':
        return 'Relation'
      case 'review':
        return 'Revue'
      default:
        return type
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = parseISO(timestamp)
    return formatDistanceToNow(date, { addSuffix: true, locale: fr })
  }

  const groupUpdatesByDate = (updates: Update[]) => {
    const groups: { [key: string]: Update[] } = {
      "Aujourd'hui": [],
      Hier: [],
      'Cette semaine': [],
      'Plus ancien': [],
    }

    updates.forEach((update) => {
      const date = parseISO(update.timestamp)
      if (isToday(date)) {
        groups["Aujourd'hui"].push(update)
      } else if (isYesterday(date)) {
        groups['Hier'].push(update)
      } else if (isThisWeek(date, { weekStartsOn: 1 })) {
        groups['Cette semaine'].push(update)
      } else {
        groups['Plus ancien'].push(update)
      }
    })

    return Object.entries(groups).filter(([_, items]) => items.length > 0)
  }

  const filteredUpdates = useMemo(() => {
    let filtered = updates

    if (filterType !== 'all') {
      filtered = filtered.filter((update) => update.type === filterType)
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (update) =>
          update.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          update.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
          update.metadata?.issueTitle
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          update.metadata?.sprintName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()),
      )
    }

    return filtered
  }, [updates, filterType, searchQuery])

  const stats = useMemo(() => {
    const today = updates.filter((u) => isToday(parseISO(u.timestamp))).length
    const statusChanges = updates.filter(
      (u) => u.type === 'status_change',
    ).length
    const comments = updates.filter((u) => u.type === 'comment').length
    return { today, statusChanges, comments }
  }, [updates])

  const groupedUpdates = groupUpdatesByDate(filteredUpdates)

  return (
    <div className="flex-1 overflow-auto scrollbar-custom">
      <div className="p-6 space-y-6">
        {/* Header with Stats */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Activité du projet
              </h1>
              <p className="text-muted-foreground mt-1">
                Suivez toutes les mises à jour en temps réel
              </p>
            </div>
            <Button
              onClick={() => setShowNewUpdate(!showNewUpdate)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Publier
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border bg-card/50 backdrop-blur">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.today}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Mises à jour aujourd'hui
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card/50 backdrop-blur">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[hsl(var(--status-done))]/10 text-[hsl(var(--status-done))]">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.statusChanges}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Changements de statut
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card/50 backdrop-blur">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[hsl(var(--status-warning))]/10 text-[hsl(var(--status-warning))]">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.comments}
                  </p>
                  <p className="text-xs text-muted-foreground">Commentaires</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* New Update Form */}
        {showNewUpdate && (
          <Card className="border-border bg-card animate-fade-in">
            <CardHeader>
              <CardTitle className="text-card-foreground">
                Publier une mise à jour
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Quoi de neuf sur le projet ?"
                value={newUpdate}
                onChange={(e) => setNewUpdate(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewUpdate(false)
                    setNewUpdate('')
                  }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    console.log('Publishing update:', newUpdate)
                    setNewUpdate('')
                    setShowNewUpdate(false)
                  }}
                >
                  Publier
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters & Search */}
        <Card className="border-border bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher dans les mises à jour..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Tabs
                value={filterType}
                onValueChange={setFilterType}
                className="w-full md:w-auto"
              >
                <TabsList className="grid grid-cols-3 md:grid-cols-7 w-full">
                  <TabsTrigger value="all" className="text-xs">
                    Tous
                  </TabsTrigger>
                  <TabsTrigger value="status_change" className="text-xs">
                    Statuts
                  </TabsTrigger>
                  <TabsTrigger value="sprint_created" className="text-xs">
                    Sprints
                  </TabsTrigger>
                  <TabsTrigger value="issue_created" className="text-xs">
                    Issues
                  </TabsTrigger>
                  <TabsTrigger value="comment" className="text-xs">
                    Comments
                  </TabsTrigger>
                  <TabsTrigger value="relationship" className="text-xs">
                    Relations
                  </TabsTrigger>
                  <TabsTrigger value="review" className="text-xs">
                    Revues
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <div className="space-y-8">
          {groupedUpdates.length === 0 ? (
            <Card className="border-border bg-card/50">
              <CardContent className="p-12 text-center">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  Aucune mise à jour trouvée
                </p>
              </CardContent>
            </Card>
          ) : (
            groupedUpdates.map(([dateGroup, groupUpdates]) => (
              <div key={dateGroup} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {dateGroup}
                  </h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                </div>

                <div className="space-y-3">
                  {groupUpdates.map((update, index) => {
                    const Icon = getUpdateIcon(update.type)
                    return (
                      <Card
                        key={update.id}
                        className="border-border bg-card hover:bg-accent/30 transition-all duration-200 animate-fade-in hover:shadow-lg group"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            {/* Avatar with Timeline */}
                            <div className="flex flex-col items-center">
                              <div
                                className={`p-2 rounded-lg border ${getUpdateColor(update.type)} transition-transform group-hover:scale-110`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              {index < groupUpdates.length - 1 && (
                                <div className="w-px flex-1 bg-gradient-to-b from-border to-transparent mt-2" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="bg-primary/20 text-primary font-medium text-xs">
                                      {update.author.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-sm text-foreground">
                                    {update.author}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {getUpdateTypeLabel(update.type)}
                                  </Badge>
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatTimestamp(update.timestamp)}
                                </span>
                              </div>

                              {/* Status Change */}
                              {update.type === 'status_change' &&
                                update.metadata && (
                                  <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">
                                      {update.content}{' '}
                                      <span className="font-medium text-foreground">
                                        {update.metadata.issueTitle}
                                      </span>
                                    </p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge
                                        variant="outline"
                                        className={`${getStatusColor(update.metadata.oldStatus)} text-xs`}
                                      >
                                        {update.metadata.oldStatus}
                                      </Badge>
                                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                      <Badge
                                        variant="outline"
                                        className={`${getStatusColor(update.metadata.newStatus)} text-xs`}
                                      >
                                        {update.metadata.newStatus}
                                      </Badge>
                                    </div>
                                    {update.metadata.issueId && (
                                      <p className="text-xs text-muted-foreground font-mono">
                                        {update.metadata.issueId}
                                      </p>
                                    )}
                                  </div>
                                )}

                              {/* Sprint Created */}
                              {update.type === 'sprint_created' &&
                                update.metadata && (
                                  <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">
                                      {update.content}
                                    </p>
                                    <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg border border-primary/10">
                                      <Calendar className="h-4 w-4 text-primary" />
                                      <span className="text-sm font-medium text-foreground">
                                        {update.metadata.sprintName}
                                      </span>
                                    </div>
                                  </div>
                                )}

                              {/* Issue Created */}
                              {update.type === 'issue_created' &&
                                update.metadata && (
                                  <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">
                                      {update.content}
                                    </p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-medium text-foreground">
                                        {update.metadata.issueTitle}
                                      </span>
                                      {update.metadata.priority && (
                                        <Badge
                                          variant="outline"
                                          className={`text-xs ${
                                            update.metadata.priority ===
                                            'urgent'
                                              ? 'bg-[hsl(var(--priority-urgent))]/10 text-[hsl(var(--priority-urgent))] border-[hsl(var(--priority-urgent))]/20'
                                              : 'bg-muted text-muted-foreground'
                                          }`}
                                        >
                                          {update.metadata.priority}
                                        </Badge>
                                      )}
                                    </div>
                                    {update.metadata.issueId && (
                                      <p className="text-xs text-muted-foreground font-mono">
                                        {update.metadata.issueId}
                                      </p>
                                    )}
                                  </div>
                                )}

                              {/* Comment */}
                              {update.type === 'comment' && update.metadata && (
                                <div className="space-y-2">
                                  <p className="text-sm text-muted-foreground">
                                    a commenté sur{' '}
                                    <span className="font-medium text-foreground">
                                      {update.metadata.issueTitle}
                                    </span>
                                  </p>
                                  <div className="p-3 bg-muted/50 rounded-lg border border-border">
                                    <p className="text-sm text-foreground italic">
                                      {update.content}
                                    </p>
                                  </div>
                                  {update.metadata.issueId && (
                                    <p className="text-xs text-muted-foreground font-mono">
                                      {update.metadata.issueId}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Relationship */}
                              {update.type === 'relationship' &&
                                update.metadata && (
                                  <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">
                                      {update.content}{' '}
                                      <span className="font-medium text-foreground">
                                        {update.metadata.issueTitle}
                                      </span>
                                    </p>
                                    {update.metadata.issueId && (
                                      <p className="text-xs text-muted-foreground font-mono">
                                        {update.metadata.issueId}
                                      </p>
                                    )}
                                  </div>
                                )}

                              {/* Review */}
                              {update.type === 'review' && update.metadata && (
                                <div className="space-y-2">
                                  <p className="text-sm text-muted-foreground">
                                    {update.content}
                                  </p>
                                  <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg border border-primary/10">
                                    <FileText className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-medium text-foreground">
                                      {update.metadata.sprintName}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
