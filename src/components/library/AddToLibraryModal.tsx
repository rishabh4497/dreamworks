import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useSearch } from "@/hooks/use-games";
import { useLibraryStore } from "@/stores/library-store";
import { toast } from "@/stores/toast-store";
import { cn } from "@/lib/utils";

interface AddToLibraryModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddToLibraryModal({ open, onClose }: AddToLibraryModalProps) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const entries = useLibraryStore((s) => s.entries);
  const ownedIds = useMemo(
    () => new Set(entries.map((e) => e.gameId)),
    [entries],
  );

  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebounced("");
      return;
    }
    const id = window.setTimeout(() => setDebounced(query.trim()), 150);
    return () => window.clearTimeout(id);
  }, [query, open]);

  const { data: results, isFetching } = useSearch({ q: debounced });
  const topResults = (results ?? []).slice(0, 5);

  const handlePick = (gameId: string, name: string) => {
    if (ownedIds.has(gameId)) {
      toast.info(`"${name}" is already in your library`);
      return;
    }
    useLibraryStore.getState().addExternal(gameId, "manual", { installed: false });
    toast.success(`Added "${name}" to library`);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add to library">
      <div className="space-y-4">
        <p className="text-[12px] text-muted/70">
          Search the Dreamworks catalog and add a game to your library manually.
        </p>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/50" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name (e.g. Elden)"
            className="pl-9"
          />
        </div>

        <div className="min-h-[160px]">
          {debounced.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-muted/60">
              Start typing to search the catalog.
            </p>
          ) : isFetching && topResults.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-muted/60">
              Searching…
            </p>
          ) : topResults.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-muted/60">
              No matches in the catalog.
            </p>
          ) : (
            <ul className="space-y-1">
              {topResults.map((game) => {
                const owned = ownedIds.has(game.id);
                return (
                  <li key={game.id}>
                    <button
                      type="button"
                      onClick={() => handlePick(game.id, game.name)}
                      disabled={owned}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border border-separator bg-card p-2 text-left transition-colors",
                        owned
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-card-active",
                      )}
                    >
                      <img
                        src={game.capsuleUrl}
                        alt=""
                        className="h-10 w-24 rounded-md object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-foreground">
                          {game.name}
                        </p>
                        <p className="truncate text-[11px] text-muted/60">
                          {game.developer}
                        </p>
                      </div>
                      {owned ? (
                        <span className="text-[11px] text-muted/60">In library</span>
                      ) : (
                        <Plus className="h-4 w-4 text-acid" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-separator bg-card px-4 py-2 text-[13px] font-medium text-foreground/80 hover:bg-card-active"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
