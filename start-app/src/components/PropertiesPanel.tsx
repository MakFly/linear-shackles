import { Plus, ChevronDown } from "lucide-react";

interface PropertyRowProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

const PropertyRow = ({ label, value, icon }: PropertyRowProps) => (
  <div className="flex items-center justify-between py-3 border-b border-border">
    <span className="text-sm text-muted-foreground">{label}</span>
    <div className="flex items-center gap-2 text-sm">
      {icon}
      {value}
    </div>
  </div>
);

export const PropertiesPanel = () => {
  return (
    <div className="w-80 border-l border-border bg-background overflow-y-auto">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Properties</h3>
          <button className="text-muted-foreground hover:text-foreground">
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
        <button className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
          <Plus className="h-3 w-3" />
          Add property
        </button>
      </div>

      <div className="p-4">
        <PropertyRow
          label="Status"
          value={
            <span className="px-2 py-1 rounded text-xs bg-secondary">
              🔵 Backlog
            </span>
          }
        />
        
        <PropertyRow
          label="Priority"
          value={
            <span className="px-2 py-1 rounded text-xs bg-priority-urgent/20 text-priority-urgent">
              🔴 Urgent
            </span>
          }
        />
        
        <PropertyRow
          label="Lead"
          value={
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                P
              </span>
              <span className="text-foreground">pauldemarécaux</span>
            </div>
          }
        />
        
        <PropertyRow
          label="Members"
          value={
            <button className="text-muted-foreground hover:text-foreground text-xs">
              👥 Add members
            </button>
          }
        />
        
        <PropertyRow
          label="Start date"
          value={
            <button className="text-muted-foreground hover:text-foreground">
              📅
            </button>
          }
        />
        
        <PropertyRow
          label="Target date"
          value={
            <span className="px-2 py-1 rounded text-xs bg-destructive/20 text-destructive">
              📅 Nov 17
            </span>
          }
        />
        
        <PropertyRow
          label="Teams"
          value={
            <span className="px-2 py-1 rounded text-xs bg-destructive/20 text-destructive">
              🔺 Powl
            </span>
          }
        />
        
        <PropertyRow
          label="Initiatives"
          value={
            <button className="text-muted-foreground hover:text-foreground text-xs">
              🎯 No initiative
            </button>
          }
        />
        
        <PropertyRow
          label="Labels"
          value={
            <button className="text-muted-foreground hover:text-foreground text-xs">
              🏷️ Add label
            </button>
          }
        />
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Milestones</h3>
          <button className="text-muted-foreground hover:text-foreground">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Add milestones to organize work within your project and break it into more granular stages.
        </p>
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Progress</h3>
          <button className="text-muted-foreground hover:text-foreground">
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">⬜ Scope</span>
              <span className="text-foreground">31</span>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-primary">🟦 Completed</span>
              <span className="text-foreground">23 • 74%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex gap-4 mb-4">
          <button className="flex-1 text-sm pb-2 border-b-2 border-primary text-foreground">
            Assignees
          </button>
          <button className="flex-1 text-sm pb-2 border-b-2 border-transparent text-muted-foreground hover:text-foreground">
            Labels
          </button>
        </div>
        
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-muted-foreground">👤 No assignee</span>
          <span className="text-sm text-foreground">23</span>
        </div>
      </div>
    </div>
  );
};
