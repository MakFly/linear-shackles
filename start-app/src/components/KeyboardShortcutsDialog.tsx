import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const shortcuts = [
  { keys: ["⌘", "K"], description: "Ouvrir la palette de commandes" },
  { keys: ["J"], description: "Issue suivante" },
  { keys: ["K"], description: "Issue précédente" },
  { keys: ["X"], description: "Sélectionner l'issue" },
  { keys: ["E"], description: "Éditer l'issue" },
  { keys: ["C"], description: "Créer une nouvelle issue" },
  { keys: ["?"], description: "Afficher les raccourcis clavier" },
  { keys: ["ESC"], description: "Fermer les modales" },
];

export const KeyboardShortcutsDialog = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Raccourcis clavier</DialogTitle>
          <DialogDescription>
            Utilisez ces raccourcis pour naviguer plus rapidement
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 mt-4">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <span className="text-sm text-foreground">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <kbd
                    key={keyIndex}
                    className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-accent/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            💡 Astuce : Appuyez sur <kbd className="px-1.5 py-0.5 text-xs bg-muted border border-border rounded">?</kbd> à tout moment pour afficher cette aide
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
