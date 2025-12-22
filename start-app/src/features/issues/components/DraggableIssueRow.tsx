import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  CheckCircle2,
  AlertCircle,
  Circle,
  ChevronRight,
  GripVertical,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type IssueStatus = 'done' | 'warning' | 'backlog' | 'progress'

interface DraggableIssueRowProps {
  id: string
  title: string
  status: IssueStatus
  date?: string
  hasChildren?: boolean
  childrenCount?: number
  isExpanded?: boolean
  onToggle?: () => void
  onClick?: () => void
  isDragOverlay?: boolean
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

export const DraggableIssueRow = ({
  id,
  title,
  status,
  date,
  hasChildren,
  childrenCount,
  isExpanded,
  onToggle,
  onClick,
  isDragOverlay = false,
}: DraggableIssueRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isDragOverlay })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
  }

  const StatusIcon = statusIcons[status]

  if (isDragOverlay) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-2 border border-primary/50 bg-card rounded-lg shadow-2xl',
          'text-sm cursor-grabbing',
        )}
      >
        <GripVertical className="h-4 w-4 text-primary" />
        {hasChildren && (
          <ChevronRight
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              isExpanded && 'rotate-90',
            )}
          />
        )}
        <StatusIcon className={cn('h-4 w-4', statusColors[status])} />
        <span className="text-muted-foreground font-mono text-xs">{id}</span>
        <span className="flex-1 text-foreground font-medium">{title}</span>
        {childrenCount && (
          <span className="text-muted-foreground text-xs bg-secondary px-2 py-0.5 rounded">
            {childrenCount}
          </span>
        )}
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-3 px-4 py-2.5 border-b border-border hover:bg-accent/50 cursor-pointer',
        'text-sm transition-all duration-200',
        isDragging && 'opacity-40 bg-muted/50 border-dashed border-primary/30',
      )}
      onClick={onClick}
    >
      <button
        className={cn(
          'cursor-grab active:cursor-grabbing hover:bg-secondary rounded p-1 transition-all duration-150',
          'opacity-40 group-hover:opacity-100 hover:scale-110',
        )}
        style={{ touchAction: 'none' }}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      {hasChildren ? (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggle?.()
          }}
          className="hover:bg-secondary rounded p-0.5 transition-colors"
        >
          <ChevronRight
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform duration-200',
              isExpanded && 'rotate-90',
            )}
          />
        </button>
      ) : (
        <div className="w-5" />
      )}

      <StatusIcon className={cn('h-4 w-4', statusColors[status])} />

      <span className="text-muted-foreground font-mono text-xs">{id}</span>

      <span className="flex-1 text-foreground">{title}</span>

      {childrenCount && childrenCount > 0 && (
        <span className="text-muted-foreground text-xs bg-secondary px-2 py-0.5 rounded">
          {childrenCount}
        </span>
      )}

      {date && (
        <span className="text-muted-foreground text-xs flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px]">
            👤
          </span>
          {date}
        </span>
      )}

      <button className="opacity-0 group-hover:opacity-100 hover:bg-secondary rounded p-1 transition-opacity">
        <span className="text-muted-foreground text-lg leading-none">+</span>
      </button>
    </div>
  )
}
