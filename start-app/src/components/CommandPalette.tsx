import { useEffect, useState } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { CheckCircle2, Circle, AlertCircle, Search, Hash } from "lucide-react";

interface Issue {
  id: string;
  title: string;
  status: "done" | "warning" | "backlog" | "progress";
}

interface CommandPaletteProps {
  issues: Issue[];
  onSelectIssue: (issueId: string) => void;
  onChangeStatus: (issueId: string, status: string) => void;
}

const statusIcons = {
  done: CheckCircle2,
  warning: AlertCircle,
  backlog: Circle,
  progress: Circle,
};

export const CommandPalette = ({ issues, onSelectIssue, onChangeStatus }: CommandPaletteProps) => {
  const [open, setOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (callback: () => void) => {
    callback();
    setOpen(false);
    setSelectedIssue(null);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {!selectedIssue ? (
          <>
            <CommandGroup heading="Issues">
              {issues.map((issue) => {
                const StatusIcon = statusIcons[issue.status];
                return (
                  <CommandItem
                    key={issue.id}
                    onSelect={() => handleSelect(() => onSelectIssue(issue.id))}
                  >
                    <StatusIcon className="mr-2 h-4 w-4" />
                    <span className="font-mono text-xs text-muted-foreground mr-2">
                      {issue.id}
                    </span>
                    <span>{issue.title}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Actions">
              <CommandItem onSelect={() => setSelectedIssue("change-status")}>
                <Circle className="mr-2 h-4 w-4" />
                <span>Change status...</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect(() => console.log("Create issue"))}>
                <Hash className="mr-2 h-4 w-4" />
                <span>Create new issue</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect(() => console.log("Search"))}>
                <Search className="mr-2 h-4 w-4" />
                <span>Search issues...</span>
              </CommandItem>
            </CommandGroup>
          </>
        ) : (
          <>
            <CommandGroup heading="Change Status">
              <CommandItem
                onSelect={() =>
                  handleSelect(() => onChangeStatus(issues[0].id, "backlog"))
                }
              >
                <Circle className="mr-2 h-4 w-4 text-status-backlog" />
                <span>Backlog</span>
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  handleSelect(() => onChangeStatus(issues[0].id, "progress"))
                }
              >
                <Circle className="mr-2 h-4 w-4 text-status-progress" />
                <span>In Progress</span>
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  handleSelect(() => onChangeStatus(issues[0].id, "done"))
                }
              >
                <CheckCircle2 className="mr-2 h-4 w-4 text-status-done" />
                <span>Done</span>
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  handleSelect(() => onChangeStatus(issues[0].id, "warning"))
                }
              >
                <AlertCircle className="mr-2 h-4 w-4 text-status-warning" />
                <span>Warning</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};
