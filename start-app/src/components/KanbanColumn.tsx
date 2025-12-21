import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  id: string;
  title: string;
  icon: any;
  color: string;
  count: number;
  children: React.ReactNode;
}

export const KanbanColumn = ({ id, title, icon: Icon, color, count, children }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col min-w-[300px] max-w-[300px] bg-muted/20 rounded-lg transition-colors",
        isOver && "bg-accent/30 ring-2 ring-primary/50"
      )}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Icon className={cn("h-4 w-4", color)} />
        <span className="font-medium text-sm">{title}</span>
        <span className="ml-auto text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
          {count}
        </span>
      </div>
      
      <div className="flex-1 p-3 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};
