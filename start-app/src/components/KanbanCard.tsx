import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CheckCircle2, AlertCircle, Circle, Link2 } from "lucide-react";
import { Issue } from "@/types/issue";
import { cn } from "@/lib/utils";

interface KanbanCardProps {
  issue: Issue;
  onClick?: () => void;
  isDragging?: boolean;
}

const statusIcons = {
  done: CheckCircle2,
  warning: AlertCircle,
  backlog: Circle,
  progress: Circle,
};

const statusColors = {
  done: "text-status-done",
  warning: "text-status-warning",
  backlog: "text-status-backlog",
  progress: "text-status-progress",
};

const priorityColors = {
  urgent: "bg-priority-urgent/20 text-priority-urgent",
  high: "bg-priority-high/20 text-priority-high",
  medium: "bg-priority-medium/20 text-priority-medium",
  low: "bg-priority-low/20 text-priority-low",
  none: "bg-muted text-muted-foreground",
};

export const KanbanCard = ({ issue, onClick, isDragging }: KanbanCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: issue.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const StatusIcon = statusIcons[issue.status];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "bg-card border border-border rounded-lg p-3 cursor-pointer hover:shadow-md transition-all group",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-start gap-2 mb-2">
        <StatusIcon className={cn("h-4 w-4 mt-0.5", statusColors[issue.status])} />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm mb-1 line-clamp-2">{issue.title}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{issue.id}</span>
            {issue.priority !== "none" && (
              <>
                <span>•</span>
                <span className={cn("px-1.5 py-0.5 rounded text-xs", priorityColors[issue.priority])}>
                  {issue.priority}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {issue.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {issue.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {issue.labels?.slice(0, 2).map((label) => (
            <span
              key={label}
              className="px-1.5 py-0.5 bg-secondary text-xs rounded"
            >
              {label}
            </span>
          ))}
          {issue.labels && issue.labels.length > 2 && (
            <span className="text-xs text-muted-foreground">
              +{issue.labels.length - 2}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {issue.relationships && issue.relationships.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Link2 className="h-3 w-3" />
              <span>{issue.relationships.length}</span>
            </div>
          )}
          {issue.assignees && issue.assignees.length > 0 && (
            <div className="flex -space-x-2">
              {issue.assignees.slice(0, 3).map((assignee, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center text-xs"
                >
                  {assignee[0].toUpperCase()}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
