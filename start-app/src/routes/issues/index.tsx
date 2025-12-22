import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import {
  Star,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  Bell,
  Link2,
  LayoutGrid,
  Keyboard,
  List,
  Columns,
  Calendar,
  Table2,
} from 'lucide-react'
import { DraggableIssueRow } from '@/features/issues/components/DraggableIssueRow'
import { CommandPalette } from '@/components/CommandPalette'
import { IssuesTableV2 } from '@/features/issues/components/IssuesTableV2'
import { IssueDetailModal } from '@/features/issues/components/IssueDetailModal'
import { KeyboardShortcutsDialog } from '@/components/KeyboardShortcutsDialog'
import { KanbanBoard } from '@/features/issues/components/KanbanBoard'
import { FilterPanel } from '@/features/issues/components/FilterPanel'
import { TemplateManager } from '@/features/issues/components/TemplateManager'
import { AutomationManager } from '@/features/issues/components/AutomationManager'
import { SprintManager } from '@/features/sprints/components/SprintManager'
import { Button } from '@/components/ui/button'
import {
  Issue,
  IssueTemplate,
  FilterConfig,
  IssueStatus,
  Automation,
  Sprint,
} from '@/types/issue'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { toast } from 'sonner'

export const Route = createFileRoute('/issues/')({
  component: Component,
})

const initialIssues: Issue[] = [] // Empty - DB is empty, only dev-tools has mock data

function Component() {
  const [issues, setIssues] = useState<Issue[]>(initialIssues)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [selectedIssue, setSelectedIssue] = useState<string | null>('POWL-101')
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailIssue, setDetailIssue] = useState<Issue | null>(null)
  const [viewMode, setViewMode] = useState<
    'list' | 'board' | 'sprint' | 'table'
  >('list')
  const [templates, setTemplates] = useState<IssueTemplate[]>([])
  const [automations, setAutomations] = useState<Automation[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [currentFilter, setCurrentFilter] = useState<FilterConfig>({
    id: 'default',
    name: 'Tous les issues',
  })
  const [savedViews, setSavedViews] = useState<FilterConfig[]>([
    { id: 'default', name: 'Tous les issues' },
  ])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      setIssues((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        const newItems = arrayMove(items, oldIndex, newIndex)

        toast.success('Issue réorganisée', {
          description: `${active.id} déplacée avec succès`,
        })

        return newItems
      })
    }
  }

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleIssueClick = (issue: Issue) => {
    setSelectedIssue(issue.id)
    setDetailIssue(issue)
    setDetailModalOpen(true)
  }

  const handleSelectIssue = (issueId: string) => {
    const issue = issues.find((i) => i.id === issueId)
    if (issue) {
      handleIssueClick(issue)
    }
  }

  const handleChangeStatus = (issueId: string, newStatus: string) => {
    setIssues((items) =>
      items.map((item) =>
        item.id === issueId
          ? { ...item, status: newStatus as IssueStatus }
          : item,
      ),
    )

    // Check automations
    const issue = issues.find((i) => i.id === issueId)
    if (issue) {
      automations.forEach((automation) => {
        if (
          automation.enabled &&
          automation.trigger.type === 'status_change' &&
          automation.trigger.condition?.status === newStatus
        ) {
          toast.info(`Automation: ${automation.name}`, {
            description: `Action: ${automation.action.type}`,
          })
        }
      })
    }

    toast.success('Statut mis à jour', {
      description: `${issueId} → ${newStatus}`,
    })
  }

  const handleUpdateIssue = (updatedIssue: Issue) => {
    setIssues((items) =>
      items.map((item) => (item.id === updatedIssue.id ? updatedIssue : item)),
    )
    setDetailIssue(updatedIssue)
  }

  // Sprint management functions
  const handleCreateSprint = (
    sprint: Omit<Sprint, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    const newSprint: Sprint = {
      ...sprint,
      id: `SPRINT-${sprints.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setSprints([...sprints, newSprint])
  }

  const handleUpdateSprint = (id: string, updates: Partial<Sprint>) => {
    setSprints((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item,
      ),
    )
  }

  const handleDeleteSprint = (id: string) => {
    setSprints((items) => items.filter((item) => item.id !== id))
  }

  const handleAddReview = (
    sprintId: string,
    review: Omit<Sprint['reviews'][0], 'id'>,
  ) => {
    setSprints((items) =>
      items.map((item) => {
        if (item.id === sprintId) {
          const newReview = {
            ...review,
            id: `REVIEW-${(item.reviews?.length || 0) + 1}`,
          }
          return {
            ...item,
            reviews: [...(item.reviews || []), newReview],
            updatedAt: new Date().toISOString(),
          }
        }
        return item
      }),
    )
  }

  // Filter issues based on current filter
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      // Search filter
      if (currentFilter.search) {
        const searchLower = currentFilter.search.toLowerCase()
        const matchesSearch =
          issue.title.toLowerCase().includes(searchLower) ||
          issue.id.toLowerCase().includes(searchLower) ||
          issue.description?.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Status filter
      if (currentFilter.status && currentFilter.status.length > 0) {
        if (!currentFilter.status.includes(issue.status)) return false
      }

      // Priority filter
      if (currentFilter.priority && currentFilter.priority.length > 0) {
        if (!currentFilter.priority.includes(issue.priority)) return false
      }

      // Labels filter
      if (currentFilter.labels && currentFilter.labels.length > 0) {
        const hasMatchingLabel = currentFilter.labels.some((label) =>
          issue.labels?.includes(label),
        )
        if (!hasMatchingLabel) return false
      }

      // Assignees filter
      if (currentFilter.assignees && currentFilter.assignees.length > 0) {
        const hasMatchingAssignee = currentFilter.assignees.some((assignee) =>
          issue.assignees?.includes(assignee),
        )
        if (!hasMatchingAssignee) return false
      }

      return true
    })
  }, [issues, currentFilter])

  return (
    <>
      {/* Command Palette */}
      <CommandPalette
        issues={issues}
        onSelectIssue={handleSelectIssue}
        onChangeStatus={handleChangeStatus}
      />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog />

      {/* Issue Detail Modal */}
      <IssueDetailModal
        issue={detailIssue}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onUpdateIssue={handleUpdateIssue}
        allIssues={issues}
        sprints={sprints}
        onAssignToSprint={(issueId, sprintId) => {
          setSprints((items) =>
            items.map((sprint) => {
              if (sprint.id === sprintId) {
                return {
                  ...sprint,
                  issues: sprint.issues.includes(issueId)
                    ? sprint.issues
                    : [...sprint.issues, issueId],
                  updatedAt: new Date().toISOString(),
                }
              }
              return sprint
            }),
          )
          toast.success('Issue assigné au sprint')
        }}
        onUnassignFromSprint={(issueId, sprintId) => {
          setSprints((items) =>
            items.map((sprint) => {
              if (sprint.id === sprintId) {
                return {
                  ...sprint,
                  issues: sprint.issues.filter((id) => id !== issueId),
                  updatedAt: new Date().toISOString(),
                }
              }
              return sprint
            }),
          )
          toast.success('Issue retiré du sprint')
        }}
      />

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <FilterPanel
                currentFilter={currentFilter}
                savedViews={savedViews}
                onFilterChange={setCurrentFilter}
                onSaveView={(view) => setSavedViews([...savedViews, view])}
                onDeleteView={(id) =>
                  setSavedViews(savedViews.filter((v) => v.id !== id))
                }
                onLoadView={setCurrentFilter}
              />
              <TemplateManager
                templates={templates}
                onCreateTemplate={(t) => setTemplates([...templates, t])}
                onUpdateTemplate={(t) =>
                  setTemplates(
                    templates.map((tmpl) => (tmpl.id === t.id ? t : tmpl)),
                  )
                }
                onDeleteTemplate={(id) =>
                  setTemplates(templates.filter((t) => t.id !== id))
                }
                onUseTemplate={(template) => {
                  console.log('Using template:', template)
                }}
              />
              <AutomationManager
                automations={automations}
                onCreateAutomation={(a) => setAutomations([...automations, a])}
                onUpdateAutomation={(a) =>
                  setAutomations(
                    automations.map((auto) => (auto.id === a.id ? a : auto)),
                  )
                }
                onDeleteAutomation={(id) =>
                  setAutomations(automations.filter((a) => a.id !== id))
                }
              />
            </div>
            <div className="flex items-center gap-1 rounded-full border border-border/80 bg-muted/40 p-1">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                title="Liste"
                className="rounded-full"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                title="Tableau v2"
                className="rounded-full"
              >
                <Table2 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'board' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('board')}
                title="Kanban"
                className="rounded-full"
              >
                <Columns className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'sprint' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('sprint')}
                title="Sprints"
                className="rounded-full"
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-2 shadow-sm">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <button className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted">
                <SlidersHorizontal className="h-4 w-4" />
                Display
              </button>
              <span className="text-xs">
                {filteredIssues.length} issue
                {filteredIssues.length > 1 ? 's' : ''}
                {filteredIssues.length !== issues.length &&
                  ` (filtrés sur ${issues.length})`}
              </span>
            </div>
            {(viewMode === 'list' || viewMode === 'table') && (
              <span className="text-xs text-muted-foreground">
                {viewMode === 'list'
                  ? 'Glissez-déposez pour réorganiser'
                  : 'Cliquez sur une issue pour voir les détails'}
              </span>
            )}
          </div>

          {viewMode === 'list' ? (
            <div className="flex-1 overflow-hidden rounded-lg border bg-card shadow-sm">
              <div className="h-full overflow-y-auto scrollbar-custom">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={filteredIssues.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="divide-y divide-border/80">
                      {filteredIssues.map((issue) => {
                        const getChildIssues = (parentId: string): Issue[] => {
                          const parent = issues.find((i) => i.id === parentId)
                          if (!parent?.relationships) return []
                          const childIds = parent.relationships
                            .filter((r) => r.type === 'parent')
                            .map((r) => r.targetIssueId)
                          return issues.filter((i) => childIds.includes(i.id))
                        }

                        const children = getChildIssues(issue.id)
                        const isExpanded = expandedGroups.has(issue.id)

                        return (
                          <div key={issue.id} className="bg-card">
                            <DraggableIssueRow
                              id={issue.id}
                              title={issue.title}
                              status={issue.status}
                              date={issue.date}
                              hasChildren={
                                !!issue.childrenCount || children.length > 0
                              }
                              childrenCount={
                                issue.childrenCount || children.length
                              }
                              isExpanded={isExpanded}
                              onToggle={() => toggleGroup(issue.id)}
                              onClick={() => handleIssueClick(issue)}
                            />
                            {isExpanded && children.length > 0 && (
                              <div className="pl-8 border-l-2 border-primary/20 ml-6 space-y-1 py-1">
                                {children.map((child) => (
                                  <DraggableIssueRow
                                    key={child.id}
                                    id={child.id}
                                    title={child.title}
                                    status={child.status}
                                    date={child.date}
                                    hasChildren={false}
                                    onClick={() => handleIssueClick(child)}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </SortableContext>
                  <DragOverlay>
                    {activeId
                      ? (() => {
                          const issue = filteredIssues.find(
                            (i) => i.id === activeId,
                          )
                          if (!issue) return null
                          return (
                            <DraggableIssueRow
                              id={issue.id}
                              title={issue.title}
                              status={issue.status}
                              date={issue.date}
                              hasChildren={!!issue.childrenCount}
                              childrenCount={issue.childrenCount}
                              isDragOverlay
                            />
                          )
                        })()
                      : null}
                  </DragOverlay>
                </DndContext>
              </div>
            </div>
          ) : viewMode === 'table' ? (
            <div className="flex-1 overflow-hidden rounded-lg border bg-card shadow-sm">
              <IssuesTableV2
                issues={filteredIssues}
                allIssues={issues}
                onUpdateIssue={handleUpdateIssue}
                onReorderIssues={setIssues}
              />
            </div>
          ) : viewMode === 'board' ? (
            <div className="flex-1 overflow-hidden rounded-lg border bg-card shadow-sm h-full min-h-0">
              <KanbanBoard
                issues={filteredIssues}
                onIssueClick={handleIssueClick}
                onStatusChange={handleChangeStatus}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-hidden rounded-lg border bg-card shadow-sm">
              <div className="h-full overflow-y-auto p-6 scrollbar-custom">
                <SprintManager
                  sprints={sprints}
                  issues={issues}
                  onCreateSprint={handleCreateSprint}
                  onUpdateSprint={handleUpdateSprint}
                  onDeleteSprint={handleDeleteSprint}
                  onAddReview={handleAddReview}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
