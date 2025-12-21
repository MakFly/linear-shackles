import { useState } from "react";
import { CheckCircle2, AlertCircle, Circle, ChevronRight, GripVertical, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Issue, IssueStatus } from "@/types/issue";
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
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface IssuesTableV2Props {
  issues: Issue[];
  allIssues: Issue[];
  onUpdateIssue: (issue: Issue) => void;
  onReorderIssues?: (issues: Issue[]) => void;
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
  urgent: "bg-priority-urgent/10 text-priority-urgent border-priority-urgent/20",
  high: "bg-priority-high/10 text-priority-high border-priority-high/20",
  medium: "bg-priority-medium/10 text-priority-medium border-priority-medium/20",
  low: "bg-priority-low/10 text-priority-low border-priority-low/20",
};

interface DraggableRowProps {
  issue: Issue;
  isChild?: boolean;
  isExpanded?: boolean;
  hasChildren?: boolean;
  onToggle?: () => void;
  onClick: () => void;
}

function DraggableTableRow({ issue, isChild, isExpanded, hasChildren, onToggle, onClick }: DraggableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: issue.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms cubic-bezier(0.25, 1, 0.5, 1)",
  };

  const StatusIcon = statusIcons[issue.status];

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-pointer hover:bg-accent/50 transition-all duration-200 group",
        isChild && "bg-muted/30",
        isDragging && "opacity-40 bg-muted/50"
      )}
      onClick={onClick}
    >
      <TableCell className="w-10">
        <button
          className={cn(
            "cursor-grab active:cursor-grabbing hover:bg-secondary rounded p-1 transition-all duration-150",
            "opacity-40 group-hover:opacity-100 hover:scale-110"
          )}
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell className="w-10">
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle?.();
            }}
            className="hover:bg-secondary rounded p-0.5 transition-colors"
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                isExpanded && "rotate-90"
              )}
            />
          </button>
        ) : (
          <div className="w-4" />
        )}
      </TableCell>
      <TableCell className="w-10">
        <StatusIcon className={cn("h-4 w-4", statusColors[issue.status])} />
      </TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground w-24">
        {issue.id}
      </TableCell>
      <TableCell className={cn("flex-1", isChild && "pl-6")}>
        {issue.title}
      </TableCell>
      <TableCell className="w-20 text-right">
        {issue.childrenCount && issue.childrenCount > 0 && (
          <span className="text-muted-foreground text-xs bg-secondary px-2 py-0.5 rounded">
            {issue.childrenCount}
          </span>
        )}
      </TableCell>
      <TableCell className="w-24 text-right">
        {issue.date && (
          <span className="text-muted-foreground text-xs flex items-center gap-1.5 justify-end">
            <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px]">
              👤
            </span>
            {issue.date}
          </span>
        )}
      </TableCell>
      <TableCell className="w-10">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 opacity-0 group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function DragOverlayRow({ issue }: { issue: Issue }) {
  const StatusIcon = statusIcons[issue.status];

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-card border border-primary/50 rounded-lg shadow-2xl">
      <GripVertical className="h-4 w-4 text-primary" />
      <StatusIcon className={cn("h-4 w-4", statusColors[issue.status])} />
      <span className="font-mono text-xs text-muted-foreground">{issue.id}</span>
      <span className="flex-1 font-medium">{issue.title}</span>
    </div>
  );
}

export function IssuesTableV2({ issues, allIssues, onUpdateIssue, onReorderIssues }: IssuesTableV2Props) {
  const [localIssues, setLocalIssues] = useState(issues);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setLocalIssues((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        toast.success("Issue réorganisée", {
          description: `${active.id} déplacée avec succès`,
        });

        onReorderIssues?.(newItems);
        return newItems;
      });
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRowClick = (issue: Issue) => {
    setSelectedIssue(issue);
    setEditedTitle(issue.title);
    setSheetOpen(true);
  };

  const getChildIssues = (parentId: string): Issue[] => {
    const parent = allIssues.find((i) => i.id === parentId);
    if (!parent?.relationships) return [];
    
    const childIds = parent.relationships
      .filter((r) => r.type === "parent")
      .map((r) => r.targetIssueId);
    
    return allIssues.filter((i) => childIds.includes(i.id));
  };

  const handleSaveTitle = () => {
    if (selectedIssue && editedTitle.trim()) {
      onUpdateIssue({ ...selectedIssue, title: editedTitle.trim() });
      setSelectedIssue({ ...selectedIssue, title: editedTitle.trim() });
      setIsEditingTitle(false);
    }
  };

  const activeIssue = activeId ? localIssues.find((i) => i.id === activeId) : null;

  // Sync local issues with props
  if (issues !== localIssues && !activeId) {
    setLocalIssues(issues);
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto scrollbar-custom">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10"></TableHead>
                <TableHead className="w-10"></TableHead>
                <TableHead className="w-10">Status</TableHead>
                <TableHead className="w-24">ID</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead className="w-20 text-right">Enfants</TableHead>
                <TableHead className="w-24 text-right">Date</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <SortableContext items={localIssues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <TableBody>
                {localIssues.map((issue) => {
                  const isExpanded = expandedRows.has(issue.id);
                  const hasChildren = !!issue.childrenCount && issue.childrenCount > 0;
                  const children = hasChildren ? getChildIssues(issue.id) : [];

                  return (
                    <DraggableTableRow
                      key={issue.id}
                      issue={issue}
                      isExpanded={isExpanded}
                      hasChildren={hasChildren || children.length > 0}
                      onToggle={() => toggleExpand(issue.id)}
                      onClick={() => handleRowClick(issue)}
                    />
                  );
                })}
              </TableBody>
            </SortableContext>
          </Table>
          <DragOverlay>
            {activeIssue ? <DragOverlayRow issue={activeIssue} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          {selectedIssue && (
            <>
              <SheetHeader className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono">{selectedIssue.id}</span>
                  <span>•</span>
                  <span>Créé le {selectedIssue.createdAt}</span>
                </div>
                
                {isEditingTitle ? (
                  <div className="flex gap-2">
                    <Input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="text-xl font-semibold"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveTitle();
                        if (e.key === "Escape") setIsEditingTitle(false);
                      }}
                      autoFocus
                    />
                    <Button size="sm" onClick={handleSaveTitle}>Sauvegarder</Button>
                  </div>
                ) : (
                  <SheetTitle
                    className="text-xl cursor-pointer hover:text-primary transition-colors"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    {selectedIssue.title}
                  </SheetTitle>
                )}

                <SheetDescription className="text-muted-foreground">
                  {selectedIssue.description || "Aucune description"}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Status & Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider">Statut</label>
                    <div className="mt-1 flex items-center gap-2">
                      {(() => {
                        const Icon = statusIcons[selectedIssue.status];
                        return <Icon className={cn("h-4 w-4", statusColors[selectedIssue.status])} />;
                      })()}
                      <span className="capitalize">{selectedIssue.status}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider">Priorité</label>
                    <div className="mt-1">
                      <Badge variant="outline" className={cn("capitalize", priorityColors[selectedIssue.priority])}>
                        {selectedIssue.priority}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Labels */}
                {selectedIssue.labels && selectedIssue.labels.length > 0 && (
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider">Labels</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedIssue.labels.map((label) => (
                        <Badge key={label} variant="secondary">{label}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assignees */}
                {selectedIssue.assignees && selectedIssue.assignees.length > 0 && (
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider">Assignés</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedIssue.assignees.map((assignee) => (
                        <div key={assignee} className="flex items-center gap-2 bg-secondary px-2 py-1 rounded-full text-sm">
                          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">
                            {assignee.charAt(0).toUpperCase()}
                          </div>
                          {assignee}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Relationships */}
                {selectedIssue.relationships && selectedIssue.relationships.length > 0 && (
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider">Relations</label>
                    <div className="mt-2 space-y-2">
                      {selectedIssue.relationships.map((rel) => {
                        const relatedIssue = allIssues.find((i) => i.id === rel.targetIssueId);
                        return (
                          <div key={rel.id} className="flex items-center gap-2 text-sm p-2 bg-secondary/50 rounded">
                            <Badge variant="outline" className="text-xs">{rel.type}</Badge>
                            <span className="font-mono text-muted-foreground">{rel.targetIssueId}</span>
                            {relatedIssue && <span className="text-muted-foreground">- {relatedIssue.title}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tabs */}
                <Tabs defaultValue="comments" className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="comments" className="flex-1">Commentaires</TabsTrigger>
                    <TabsTrigger value="activity" className="flex-1">Activité</TabsTrigger>
                  </TabsList>
                  <TabsContent value="comments" className="mt-4 space-y-4">
                    <div className="space-y-4">
                      <div className="p-3 bg-secondary/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20" />
                          <span className="text-sm font-medium">Paul de Marécaux</span>
                          <span className="text-xs text-muted-foreground">il y a 2h</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Ceci est un exemple de commentaire sur cette issue.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Ajouter un commentaire..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>
                    <Button className="w-full" disabled={!newComment.trim()}>
                      Envoyer
                    </Button>
                  </TabsContent>
                  <TabsContent value="activity" className="mt-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        <div>
                          <span className="font-medium">Paul de Marécaux</span>
                          <span className="text-muted-foreground"> a créé cette issue</span>
                          <div className="text-xs text-muted-foreground mt-1">{selectedIssue.createdAt}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-status-warning mt-2" />
                        <div>
                          <span className="font-medium">Système</span>
                          <span className="text-muted-foreground"> a changé le statut en </span>
                          <Badge variant="outline" className="text-xs">{selectedIssue.status}</Badge>
                          <div className="text-xs text-muted-foreground mt-1">{selectedIssue.updatedAt}</div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}