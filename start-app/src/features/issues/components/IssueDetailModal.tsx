import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  CheckCircle2,
  AlertCircle,
  Circle,
  Send,
  Paperclip,
  MoreHorizontal,
  Trash2,
  ExternalLink,
  Calendar,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { Issue, IssueRelationship, RelationType, Sprint } from '@/types/issue'
import { Link2, Plus } from 'lucide-react'
import { CustomFieldEditor } from '@/features/issues/components/CustomFieldEditor'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getUpdatesByIssueId, createUpdate } from '@/server/db'
import type { Update } from '@/db/schema'

interface IssueDetailModalProps {
  issue: Issue | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateIssue?: (issue: Issue) => void
  allIssues?: Issue[]
  sprints?: Sprint[]
  onAssignToSprint?: (issueId: string, sprintId: string) => void
  onUnassignFromSprint?: (issueId: string, sprintId: string) => void
}

const statusIcons = {
  done: CheckCircle2,
  warning: AlertCircle,
  backlog: Circle,
  progress: Circle,
}

const statusColors = {
  done: 'text-status-done',
  warning: 'text-status-warning',
  backlog: 'text-status-backlog',
  progress: 'text-status-progress',
}

const formatTimestamp = (timestamp: string) => {
  try {
    const date = new Date(timestamp)
    return formatDistanceToNow(date, { addSuffix: true, locale: fr })
  } catch {
    return timestamp
  }
}

export const IssueDetailModal = ({
  issue,
  open,
  onOpenChange,
  onUpdateIssue,
  allIssues = [],
  sprints = [],
  onAssignToSprint,
  onUnassignFromSprint,
}: IssueDetailModalProps) => {
  const [comment, setComment] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [title, setTitle] = useState(issue?.title || '')
  const [activeTab, setActiveTab] = useState<
    'comments' | 'activity' | 'relationships' | 'fields' | 'sprint'
  >('comments')
  const [showAddRelationship, setShowAddRelationship] = useState(false)
  const [newRelationType, setNewRelationType] =
    useState<RelationType>('relates_to')
  const [newRelationTarget, setNewRelationTarget] = useState('')

  const queryClient = useQueryClient()

  // Fetch real updates for this issue
  const { data: updates = [], isLoading: updatesLoading } = useQuery({
    queryKey: ['updates', issue?.id],
    queryFn: () => getUpdatesByIssueId({ data: issue!.id }),
    enabled: !!issue?.id,
  })

  // Separate comments from activities
  const typedUpdates = updates as Array<Update>
  const comments = typedUpdates.filter((u) => u.type === 'comment')
  const activities = typedUpdates.filter((u) => u.type !== 'comment')

  // Mutation for creating comments
  const createCommentMutation = useMutation({
    mutationFn: (content: string) =>
      createUpdate({
        data: {
          id: `update-${Date.now()}`,
          type: 'comment',
          author: 'Utilisateur',
          content,
          timestamp: new Date().toISOString(),
          metadata: { issueId: issue!.id, issueTitle: issue!.title },
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['updates', issue?.id] })
      setComment('')
    },
  })

  if (!issue) return null

  const StatusIcon = statusIcons[issue.status]

  const handleSendComment = () => {
    if (comment.trim()) {
      createCommentMutation.mutate(comment)
    }
  }

  const relationTypeLabels: Record<RelationType, string> = {
    blocks: 'Bloque',
    blocked_by: 'Bloqué par',
    relates_to: 'Lié à',
    duplicates: 'Duplique',
    parent: 'Parent de',
    child: 'Enfant de',
  }

  const handleAddRelationship = () => {
    if (newRelationTarget.trim() && issue && onUpdateIssue) {
      const newRelationship: IssueRelationship = {
        id: Date.now().toString(),
        type: newRelationType,
        targetIssueId: newRelationTarget,
      }

      const updatedIssue = {
        ...issue,
        relationships: [...(issue.relationships || []), newRelationship],
      }

      onUpdateIssue(updatedIssue)
      setShowAddRelationship(false)
      setNewRelationTarget('')
    }
  }

  const handleRemoveRelationship = (relationshipId: string) => {
    if (issue && onUpdateIssue) {
      const updatedIssue = {
        ...issue,
        relationships: (issue.relationships || []).filter(
          (r) => r.id !== relationshipId,
        ),
      }
      onUpdateIssue(updatedIssue)
    }
  }

  const getRelatedIssue = (issueId: string) => {
    return allIssues.find((i) => i.id === issueId)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-start gap-3">
            <StatusIcon
              className={cn('h-5 w-5 mt-1', statusColors[issue.status])}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xs text-muted-foreground">
                  {issue.id}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  Créé le {issue.date || 'Nov 14'}
                </span>
              </div>
              {isEditingTitle ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setIsEditingTitle(false)
                  }}
                  className="text-xl font-semibold"
                  autoFocus
                />
              ) : (
                <DialogTitle
                  className="text-xl font-semibold cursor-pointer hover:text-primary transition-colors"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {title}
                </DialogTitle>
              )}
            </div>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">Description</h3>
            <Textarea
              placeholder="Ajouter une description..."
              className="min-h-[100px] bg-accent/50 border-border"
              defaultValue={
                issue.description ||
                'Aller à la police de Saint Jean de Luz pour déclarer le vol et obtenir un récépissé officiel. Apporter tous les documents nécessaires.'
              }
            />
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex gap-4 mb-4">
              <button
                className={cn(
                  'text-sm pb-2 border-b-2 transition-colors',
                  activeTab === 'comments'
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
                onClick={() => setActiveTab('comments')}
              >
                Commentaires ({comments.length})
              </button>
              <button
                className={cn(
                  'text-sm pb-2 border-b-2 transition-colors',
                  activeTab === 'activity'
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
                onClick={() => setActiveTab('activity')}
              >
                Activité ({activities.length})
              </button>
              <button
                className={cn(
                  'text-sm pb-2 border-b-2 transition-colors',
                  activeTab === 'relationships'
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
                onClick={() => setActiveTab('relationships')}
              >
                Relations ({issue.relationships?.length || 0})
              </button>
              <button
                className={cn(
                  'text-sm pb-2 border-b-2 transition-colors',
                  activeTab === 'fields'
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
                onClick={() => setActiveTab('fields')}
              >
                Champs ({issue.customFields?.length || 0})
              </button>
              <button
                className={cn(
                  'text-sm pb-2 border-b-2 transition-colors',
                  activeTab === 'sprint'
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
                onClick={() => setActiveTab('sprint')}
              >
                Sprint
              </button>
            </div>

            {activeTab === 'comments' ? (
              <div className="space-y-4">
                {updatesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun commentaire
                  </p>
                ) : (
                  comments.map((update: Update) => (
                    <div key={update.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium">
                          {update.author.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {update.author}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(update.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/90">
                          {update.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}

                <div className="flex gap-3 mt-6">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium">P</span>
                  </div>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Ajouter un commentaire..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[80px] mb-2"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          handleSendComment()
                        }
                      }}
                    />
                    <div className="flex items-center justify-between">
                      <Button variant="ghost" size="sm">
                        <Paperclip className="h-4 w-4 mr-2" />
                        Joindre
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSendComment}
                        disabled={!comment.trim() || createCommentMutation.isPending}
                      >
                        {createCommentMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Envoyer
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'activity' ? (
              <div className="space-y-3">
                {updatesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : activities.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune activité
                  </p>
                ) : (
                  activities.map((update: Update) => (
                    <div key={update.id} className="flex gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-xs">
                          {update.author.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-foreground/90">
                          <span className="font-medium">{update.author}</span>{' '}
                          <span className="text-muted-foreground">
                            {update.content}
                          </span>
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(update.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : activeTab === 'relationships' ? (
              <div className="space-y-3">
                {issue.relationships && issue.relationships.length > 0 ? (
                  <>
                    {issue.relationships.map((relationship) => {
                      const relatedIssue = getRelatedIssue(
                        relationship.targetIssueId,
                      )
                      return (
                        <div
                          key={relationship.id}
                          className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <Link2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">
                                {relationTypeLabels[relationship.type]}
                              </div>
                              {relatedIssue ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span className="font-mono">
                                    {relatedIssue.id}
                                  </span>
                                  <span>•</span>
                                  <span>{relatedIssue.title}</span>
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground">
                                  {relationship.targetIssueId}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {relatedIssue && (
                              <Button size="sm" variant="ghost" asChild>
                                <a href={`#${relatedIssue.id}`}>
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleRemoveRelationship(relationship.id)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune relation définie
                  </p>
                )}

                {showAddRelationship ? (
                  <div className="p-3 border border-border rounded-lg space-y-3">
                    <Select
                      value={newRelationType}
                      onValueChange={(value: RelationType) =>
                        setNewRelationType(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(relationTypeLabels).map(
                          ([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="ID de l'issue (ex: POWL-100)"
                      value={newRelationTarget}
                      onChange={(e) => setNewRelationTarget(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddRelationship}>
                        Ajouter
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowAddRelationship(false)
                          setNewRelationTarget('')
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddRelationship(true)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une relation
                  </Button>
                )}
              </div>
            ) : activeTab === 'fields' ? (
              <div>
                <CustomFieldEditor
                  fields={issue.customFields || []}
                  onChange={(fields) => {
                    if (onUpdateIssue) {
                      onUpdateIssue({ ...issue, customFields: fields })
                    }
                  }}
                  editMode={false}
                />
                {(!issue.customFields || issue.customFields.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun champ personnalisé
                  </p>
                )}
              </div>
            ) : activeTab === 'sprint' ? (
              <div className="space-y-4">
                {sprints.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucun sprint créé. Créez un sprint depuis la vue Sprints.
                  </p>
                ) : (
                  <>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground">
                        Sprints assignés
                      </h4>
                      {sprints
                        .filter((sprint) => sprint.issues.includes(issue.id))
                        .map((sprint) => (
                          <div
                            key={sprint.id}
                            className="flex items-center justify-between p-3 border border-border rounded-lg bg-card"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium text-card-foreground">
                                  {sprint.name}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-xs',
                                    sprint.status === 'active' &&
                                      'bg-primary/10 text-primary border-primary/20',
                                    sprint.status === 'completed' &&
                                      'bg-[hsl(var(--status-done))] text-background',
                                    sprint.status === 'planning' &&
                                      'bg-muted text-muted-foreground',
                                  )}
                                >
                                  {sprint.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(sprint.startDate), 'dd MMM')} -{' '}
                                {format(
                                  new Date(sprint.endDate),
                                  'dd MMM yyyy',
                                )}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (onUnassignFromSprint) {
                                  onUnassignFromSprint(issue.id, sprint.id)
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      {sprints.filter((sprint) =>
                        sprint.issues.includes(issue.id),
                      ).length === 0 && (
                        <p className="text-sm text-muted-foreground py-2">
                          Non assigné à un sprint
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground">
                        Assigner à un sprint
                      </h4>
                      <div className="space-y-2">
                        {sprints
                          .filter((sprint) => !sprint.issues.includes(issue.id))
                          .map((sprint) => (
                            <div
                              key={sprint.id}
                              className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                              onClick={() => {
                                if (onAssignToSprint) {
                                  onAssignToSprint(issue.id, sprint.id)
                                }
                              }}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-foreground">
                                    {sprint.name}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'text-xs',
                                      sprint.status === 'active' &&
                                        'bg-primary/10 text-primary border-primary/20',
                                      sprint.status === 'completed' &&
                                        'bg-[hsl(var(--status-done))] text-background',
                                      sprint.status === 'planning' &&
                                        'bg-muted text-muted-foreground',
                                    )}
                                  >
                                    {sprint.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(sprint.startDate), 'dd MMM')}{' '}
                                  -{' '}
                                  {format(
                                    new Date(sprint.endDate),
                                    'dd MMM yyyy',
                                  )}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (onAssignToSprint) {
                                    onAssignToSprint(issue.id, sprint.id)
                                  }
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        {sprints.filter(
                          (sprint) => !sprint.issues.includes(issue.id),
                        ).length === 0 && (
                          <p className="text-sm text-muted-foreground py-2">
                            Déjà assigné à tous les sprints disponibles
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
