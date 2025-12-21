import { CheckCircle2, AlertCircle, Circle, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type IssueStatus = "done" | "warning" | "backlog" | "progress";

interface IssueRowProps {
  id: string;
  title: string;
  status: IssueStatus;
  date?: string;
  hasChildren?: boolean;
  childrenCount?: number;
  isExpanded?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
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

export const IssueRow = ({
  id,
  title,
  status,
  date,
  hasChildren,
  childrenCount,
  isExpanded,
  onToggle,
  onClick,
}: IssueRowProps) => {
  const StatusIcon = statusIcons[status];

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-4 py-2 border-b border-border hover:bg-accent/50 cursor-pointer transition-colors",
        "text-sm"
      )}
      onClick={onClick}
    >
      {hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
          className="hover:bg-secondary rounded p-0.5 transition-colors"
        >
          <ChevronRight
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isExpanded && "rotate-90"
            )}
          />
        </button>
      )}
      
      <StatusIcon className={cn("h-4 w-4", statusColors[status])} />
      
      <span className="text-muted-foreground font-mono text-xs">{id}</span>
      
      <span className="flex-1 text-foreground">{title}</span>
      
      {childrenCount && (
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
  );
};
