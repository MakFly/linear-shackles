import { useState } from "react";
import { X, Plus, Save, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FilterConfig, IssueStatus, IssuePriority } from "@/types/issue";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface FilterPanelProps {
  currentFilter: FilterConfig;
  savedViews: FilterConfig[];
  onFilterChange: (filter: FilterConfig) => void;
  onSaveView: (view: FilterConfig) => void;
  onDeleteView: (viewId: string) => void;
  onLoadView: (view: FilterConfig) => void;
}

const statusOptions: { value: IssueStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "progress", label: "In Progress" },
  { value: "warning", label: "Blocked" },
  { value: "done", label: "Done" },
];

const priorityOptions: { value: IssuePriority; label: string }[] = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "none", label: "None" },
];

export const FilterPanel = ({
  currentFilter,
  savedViews,
  onFilterChange,
  onSaveView,
  onDeleteView,
  onLoadView,
}: FilterPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewName, setViewName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleStatusToggle = (status: IssueStatus) => {
    const current = currentFilter.status || [];
    const updated = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    
    onFilterChange({ ...currentFilter, status: updated.length > 0 ? updated : undefined });
  };

  const handlePriorityToggle = (priority: IssuePriority) => {
    const current = currentFilter.priority || [];
    const updated = current.includes(priority)
      ? current.filter((p) => p !== priority)
      : [...current, priority];
    
    onFilterChange({ ...currentFilter, priority: updated.length > 0 ? updated : undefined });
  };

  const handleSaveView = () => {
    if (!viewName.trim()) {
      toast.error("Veuillez entrer un nom pour la vue");
      return;
    }

    const newView: FilterConfig = {
      ...currentFilter,
      id: Date.now().toString(),
      name: viewName,
    };

    onSaveView(newView);
    setViewName("");
    setShowSaveDialog(false);
    toast.success("Vue enregistrée", {
      description: `Vue "${newView.name}" créée avec succès`,
    });
  };

  const handleClearFilters = () => {
    onFilterChange({
      id: "default",
      name: "Tous les issues",
    });
    toast.success("Filtres réinitialisés");
  };

  const activeFiltersCount = [
    currentFilter.status?.length || 0,
    currentFilter.priority?.length || 0,
    currentFilter.labels?.length || 0,
    currentFilter.assignees?.length || 0,
    currentFilter.search ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          Filtres
          {activeFiltersCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Filtres avancés</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-4">
          <div className="space-y-6">
            {/* Saved Views */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Vues enregistrées</Label>
              <Select
                value={currentFilter.id}
                onValueChange={(id) => {
                  const view = savedViews.find((v) => v.id === id);
                  if (view) onLoadView(view);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une vue" />
                </SelectTrigger>
                <SelectContent>
                  {savedViews.map((view) => (
                    <SelectItem key={view.id} value={view.id}>
                      {view.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {showSaveDialog ? (
                <div className="mt-3 space-y-2">
                  <Input
                    placeholder="Nom de la vue"
                    value={viewName}
                    onChange={(e) => setViewName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveView}>
                      <Save className="h-3 w-3 mr-1" />
                      Enregistrer
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowSaveDialog(false)}>
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() => setShowSaveDialog(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Enregistrer la vue actuelle
                </Button>
              )}
            </div>

            {/* Search */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Recherche</Label>
              <Input
                placeholder="Rechercher des issues..."
                value={currentFilter.search || ""}
                onChange={(e) =>
                  onFilterChange({ ...currentFilter, search: e.target.value || undefined })
                }
              />
            </div>

            {/* Status Filter */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Statut</Label>
              <div className="space-y-2">
                {statusOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${option.value}`}
                      checked={currentFilter.status?.includes(option.value)}
                      onCheckedChange={() => handleStatusToggle(option.value)}
                    />
                    <label
                      htmlFor={`status-${option.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Priorité</Label>
              <div className="space-y-2">
                {priorityOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`priority-${option.value}`}
                      checked={currentFilter.priority?.includes(option.value)}
                      onCheckedChange={() => handlePriorityToggle(option.value)}
                    />
                    <label
                      htmlFor={`priority-${option.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleClearFilters}
            >
              <X className="h-4 w-4 mr-2" />
              Réinitialiser les filtres
            </Button>

            {/* Manage Saved Views */}
            {savedViews.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Gérer les vues</Label>
                <div className="space-y-2">
                  {savedViews.map((view) => (
                    <div
                      key={view.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-accent"
                    >
                      <span className="text-sm">{view.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          onDeleteView(view.id);
                          toast.success("Vue supprimée");
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
