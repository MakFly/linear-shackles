import { useState, useEffect, useMemo } from 'react'
import {
  KanbanBoard as ShadcnKanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from '@/components/ui/shadcn-io/kanban'
import type { Issue, IssueStatus } from '@/types/issue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CheckCircle2, AlertCircle, Circle } from 'lucide-react'

interface KanbanBoardProps {
  issues: Issue[]
  onIssueClick: (issue: Issue) => void
  onStatusChange: (issueId: string, newStatus: IssueStatus) => void
}

const statusConfig: Record<
  IssueStatus,
  { label: string; icon: any; color: string }
> = {
  backlog: { label: 'Backlog', icon: Circle, color: '#6B7280' },
  progress: { label: 'In Progress', icon: Circle, color: '#F59E0B' },
  warning: { label: 'Blocked', icon: AlertCircle, color: '#EF4444' },
  done: { label: 'Done', icon: CheckCircle2, color: '#10B981' },
}

type KanbanIssue = Issue & {
  column: string
  name: string
}

type KanbanColumn = {
  id: string
  name: string
  color: string
}

export const KanbanBoard = ({
  issues,
  onIssueClick,
  onStatusChange,
}: KanbanBoardProps) => {
  const columns: KanbanColumn[] = useMemo(
    () =>
      (['backlog', 'progress', 'warning', 'done'] as IssueStatus[]).map(
        (status) => ({
          id: status,
          name: statusConfig[status].label,
          color: statusConfig[status].color,
        }),
      ),
    [],
  )

  const [data, setData] = useState<KanbanIssue[]>([])

  // Sync data when issues change
  useEffect(() => {
    setData(
      issues.map((issue) => ({
        ...issue,
        column: issue.status,
        name: issue.title,
      })),
    )
  }, [issues])

  const handleDataChange = (newData: KanbanIssue[]) => {
    // Find issues that changed column before updating state
    const changedIssues: {
      id: string
      oldStatus: IssueStatus
      newStatus: IssueStatus
    }[] = []

    newData.forEach((item) => {
      const originalIssue = issues.find((i) => i.id === item.id)
      if (originalIssue && originalIssue.status !== item.column) {
        changedIssues.push({
          id: item.id,
          oldStatus: originalIssue.status,
          newStatus: item.column as IssueStatus,
        })
      }
    })

    // Update local state
    setData(newData)

    // Notify parent of status changes (parent handles toast)
    changedIssues.forEach(({ id, newStatus }) => {
      onStatusChange(id, newStatus)
    })
  }

  return (
    <div className="h-full w-full overflow-hidden p-4 flex flex-col">
      <KanbanProvider
        columns={columns}
        data={data}
        onDataChange={handleDataChange}
        className="flex-1 min-h-0"
      >
        {(column) => (
          <ShadcnKanbanBoard id={column.id} key={column.id} className="h-full">
            <KanbanHeader>
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
                <span>{column.name}</span>
                <span className="text-muted-foreground text-xs">
                  ({data.filter((item) => item.column === column.id).length})
                </span>
              </div>
            </KanbanHeader>
            <KanbanCards id={column.id} className="flex-1 min-h-0">
              {(issue: KanbanIssue) => (
                <KanbanCard
                  column={column.id}
                  id={issue.id}
                  key={issue.id}
                  name={issue.name}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <div
                    className="flex items-start justify-between gap-2"
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      onIssueClick(issue)
                    }}
                  >
                    <div className="flex flex-col gap-1 flex-1">
                      <p className="m-0 font-medium text-sm">{issue.name}</p>
                      {issue.priority && issue.priority !== 'none' && (
                        <span className="text-muted-foreground text-xs">
                          {issue.priority}
                        </span>
                      )}
                    </div>
                    {issue.assignees && issue.assignees.length > 0 && (
                      <Avatar className="h-6 w-6 shrink-0">
                        <AvatarFallback>
                          {issue.assignees[0]?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  {issue.labels && issue.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {issue.labels.slice(0, 2).map((label) => (
                        <span
                          key={label}
                          className="text-muted-foreground bg-muted px-1.5 py-0.5 rounded text-xs"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </KanbanCard>
              )}
            </KanbanCards>
          </ShadcnKanbanBoard>
        )}
      </KanbanProvider>
    </div>
  )
}
