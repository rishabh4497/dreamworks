import { useEffect, useRef } from "react";
import { useLibraryStore } from "@/stores/library-store";
import { useNotificationsStore } from "@/stores/notifications-store";
import { notificationPrefEnabled } from "@/stores/ui-store";

/**
 * Watches the library store and pushes a "library-import" notification any
 * time the entry count jumps upward (a purchase add, a scanner import, etc.).
 * Mounting decoupled from the scanner hook so this stays robust whether the
 * scanner (Agent 1's surface area) has shipped yet or not.
 *
 * Should be mounted exactly once at AppLayout.
 */
export function useLibraryImportNotifier(): void {
  // Track previous count via ref so we don't fire a notification on the very
  // first mount (when the seeded library "appears" from the user's POV).
  const prevCountRef = useRef<number | null>(null);

  useEffect(() => {
    // Prime the ref with the current count synchronously.
    prevCountRef.current = useLibraryStore.getState().entries.length;

    const unsub = useLibraryStore.subscribe((state) => {
      const next = state.entries.length;
      const prev = prevCountRef.current ?? next;
      prevCountRef.current = next;
      if (next <= prev) return;
      const delta = next - prev;
      if (!notificationPrefEnabled("library-import")) return;
      useNotificationsStore.getState().push({
        kind: "library-import",
        title: delta === 1 ? "Imported 1 game" : `Imported ${delta} games`,
        body:
          delta === 1
            ? "A new title was added to your library."
            : `${delta} titles were added to your library.`,
      });
    });
    return () => unsub();
  }, []);
}
