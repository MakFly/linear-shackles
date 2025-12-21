import { useEffect } from "react";

interface Shortcut {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  callback: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: Shortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const metaMatch = shortcut.metaKey ? event.metaKey || event.ctrlKey : true;
        const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey : true;
        const shiftMatch = shortcut.shiftKey ? event.shiftKey : true;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (metaMatch && ctrlMatch && shiftMatch && keyMatch) {
          event.preventDefault();
          shortcut.callback();
        }
      });
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
};

export const KEYBOARD_SHORTCUTS = {
  COMMAND_PALETTE: { key: "k", metaKey: true, description: "Open command palette" },
  NEXT_ISSUE: { key: "j", description: "Next issue" },
  PREV_ISSUE: { key: "k", description: "Previous issue" },
  SELECT: { key: "x", description: "Select issue" },
  EDIT: { key: "e", description: "Edit issue" },
  NEW_ISSUE: { key: "c", description: "Create new issue" },
};
