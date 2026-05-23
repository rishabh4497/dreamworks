import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Wand2, Loader2, RefreshCcw } from "lucide-react";
import { useLibraryStore } from "@/stores/library-store";
import { useGames } from "@/hooks/use-games";
import { useAILibraryOrganizer } from "@/hooks/use-ai";
import { toast } from "@/stores/toast-store";
import { cn } from "@/lib/utils";
import type { LibraryOrganizerPayload } from "@/lib/ai/payload-types";
import type { OrganizerCollection } from "@/lib/ai/response-types";
import type { Game } from "@/lib/types";

interface LibraryAutoOrganizerProps {
  onPickCollection?: (gameIds: string[], name: string) => void;
}

export function LibraryAutoOrganizer({ onPickCollection }: LibraryAutoOrganizerProps) {
  const entries = useLibraryStore((s) => s.entries);
  const { data: games } = useGames();
  const organize = useAILibraryOrganizer();
  const [prompt, setPrompt] = useState("");
  const [active, setActive] = useState<OrganizerCollection | null>(null);

  const gamesById = useMemo(() => {
    const map = new Map<string, Game>();
    (games ?? []).forEach((g) => map.set(g.id, g));
    return map;
  }, [games]);

  const payload = useMemo<LibraryOrganizerPayload | null>(() => {
    if (entries.length === 0) return null;
    return {
      games: entries
        .map((e) => {
          const g = gamesById.get(e.gameId);
          if (!g) return null;
          return {
            id: e.gameId,
            name: g.name,
            genres: g.genres ?? [],
            tags: (g.tags ?? []).slice(0, 6),
            playMinutes: e.playMinutes,
            completionPct: e.completionPct,
            lastPlayed: e.lastPlayed,
          };
        })
        .filter((g): g is NonNullable<typeof g> => g !== null),
      userPrompt: prompt.trim() || undefined,
    };
  }, [entries, gamesById, prompt]);

  const handleOrganize = () => {
    if (!payload) return;
    organize.mutate(payload, {
      onSuccess: () => toast.success("Smart collections ready"),
      onError: () => toast.error("Organizer is offline — try again"),
    });
  };

  if (entries.length === 0) return null;

  return (
    <section className="rounded-2xl border border-separator bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-acid" />
        <h2 className="text-[14px] font-semibold text-foreground">AI Library Organizer</h2>
        <span className="rounded-full bg-acid/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-acid">
          Beta
        </span>
      </div>
      <p className="mb-4 text-[12px] text-muted/80">
        One click groups your {entries.length} games into vibe-based collections — cozy night-in, comfort
        replays, co-op chaos, and more. Add a hint to steer it.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='Optional hint: "weekend co-op only" or "calm games for late-night"'
          className={cn(
            "flex-1 rounded-lg border border-separator bg-input/60 px-3 py-2 text-[12px] text-foreground",
            "placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-acid/40",
          )}
        />
        <button
          type="button"
          onClick={handleOrganize}
          disabled={organize.isPending}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-lg bg-acid px-4 py-2 text-[12px] font-semibold text-background",
            "hover:brightness-110 disabled:opacity-50",
          )}
        >
          {organize.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Wand2 className="h-3.5 w-3.5" />
          )}
          {organize.data ? "Re-organize" : "Organize"}
        </button>
        {organize.data && (
          <button
            type="button"
            onClick={() => {
              organize.reset();
              setPrompt("");
              setActive(null);
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-separator bg-card-active/60 px-3 py-2 text-[12px] text-muted hover:text-foreground/80"
            title="Clear"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {organize.data && (
        <>
          <p className="mt-4 text-[11px] text-muted/70">{organize.data.rationale}</p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {organize.data.collections.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => {
                  setActive(c);
                  onPickCollection?.(c.gameIds, c.name);
                }}
                className={cn(
                  "group rounded-xl border p-3 text-left transition-all",
                  active?.name === c.name
                    ? "border-acid/50 bg-acid/5"
                    : "border-separator bg-card-active/40 hover:border-acid/30 hover:bg-card-active",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[20px] leading-none">{c.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-foreground">{c.name}</p>
                    <p className="text-[10px] uppercase tracking-widest text-muted/60">{c.mood}</p>
                  </div>
                  <span className="rounded-full bg-card px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-muted">
                    {c.gameIds.length}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-[11px] text-muted/80">{c.description}</p>
              </button>
            ))}
          </div>

          <AnimatePresence>
            {active && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="mt-4 rounded-xl border border-separator bg-card-active/40 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[12px] font-semibold text-foreground">
                    {active.emoji} {active.name} · {active.gameIds.length} games
                  </p>
                  <button
                    type="button"
                    onClick={() => setActive(null)}
                    className="text-[11px] text-muted/70 hover:text-foreground/80"
                  >
                    Close
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {active.gameIds.map((id) => {
                    const g = gamesById.get(id);
                    if (!g) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 rounded-md border border-separator bg-card px-2 py-1 text-[11px] text-foreground/85"
                      >
                        {g.name}
                      </span>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </section>
  );
}
