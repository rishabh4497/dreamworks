import { useMemo, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, Network, Play, Search, Sparkles, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLibraryStore } from "@/stores/library-store";
import { useGames } from "@/hooks/use-games";
import { useAILauncherUnifier } from "@/hooks/use-ai";
import { launchGameNative } from "@/lib/native-launcher";
import { toast } from "@/stores/toast-store";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { LauncherSource, LibraryEntry } from "@/lib/types";
import type { LauncherUnifierPayload } from "@/lib/ai/payload-types";

const LAUNCHER_LABEL: Record<LauncherSource, string> = {
  dreamworks: "Dreamworks",
  manual: "Manual",
  steam: "Steam",
  epic: "Epic",
  gog: "GOG",
  ubisoft: "Ubisoft",
  "ea-app": "EA App",
  "xbox-pc": "Xbox",
  rockstar: "Rockstar",
  battlenet: "Battle.net",
  amazon: "Amazon",
};

const SAMPLE_QUERIES = [
  "Launch Hollow Knight",
  "Where's Cyberpunk installed",
  "Compare price for Hades",
];

export function CrossLauncherSearch() {
  const entries = useLibraryStore((s) => s.entries);
  const { data: games } = useGames();
  const unifier = useAILauncherUnifier();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const entryById = useMemo(() => {
    const map = new Map<string, LibraryEntry>();
    entries.forEach((e) => map.set(e.gameId, e));
    return map;
  }, [entries]);

  const gameNameById = useMemo(() => {
    const map = new Map<string, string>();
    (games ?? []).forEach((g) => map.set(g.id, g.name));
    return map;
  }, [games]);

  const libraryByLauncher = useMemo(() => {
    if (!games || entries.length === 0) return [];
    const buckets = new Map<string, { id: string; name: string; installed: boolean }[]>();
    for (const entry of entries) {
      const name = gameNameById.get(entry.gameId);
      if (!name) continue;
      const launchers = [entry.sourceLauncher, ...(entry.sources ?? []).map((s) => s.sourceLauncher)]
        .filter((l): l is LauncherSource => Boolean(l));
      for (const l of new Set(launchers)) {
        if (!buckets.has(l)) buckets.set(l, []);
        buckets.get(l)!.push({ id: entry.gameId, name, installed: entry.installed });
      }
    }
    return [...buckets.entries()].map(([launcher, list]) => ({ launcher, games: list }));
  }, [entries, games, gameNameById]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || libraryByLauncher.length === 0) return;
    const payload: LauncherUnifierPayload = { query: q, libraryByLauncher };
    unifier.mutate(payload, {
      onError: () => toast.error("Cross-launcher router offline"),
    });
  };

  const handleLaunch = async (gameId: string, launcher: string) => {
    const entry = entryById.get(gameId);
    if (!entry) return;
    const result = await launchGameNative({
      gameId,
      sourceLauncher: launcher as LauncherSource,
      launchCommand: entry.launchCommand,
      executablePath:
        entry.launchCommand && !entry.launchCommand.includes("://") ? entry.launchCommand : undefined,
      workingDir: entry.installPath,
    });
    if (result.ok) {
      toast.success(`Launching via ${LAUNCHER_LABEL[launcher as LauncherSource] ?? launcher}`);
    } else {
      toast.info(result.error.message);
    }
  };

  if (entries.length === 0) return null;

  const data = unifier.data;

  return (
    <section className="rounded-2xl border border-separator bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Network className="h-4 w-4 text-acid" />
        <h2 className="text-[14px] font-semibold text-foreground">Cross-Launcher Search</h2>
        <span className="rounded-full bg-acid/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-acid">
          Beta
        </span>
      </div>
      <p className="mb-4 text-[12px] text-muted/80">
        One search bar across Steam, Epic, GOG, EA, Ubisoft, Xbox, Battle.net & more. Type naturally —
        the router picks the right launcher.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted/50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='e.g. "launch Hollow Knight" or "where is Cyberpunk"'
            className="w-full rounded-lg border border-separator bg-input/60 pl-9 pr-3 py-2 text-[12px] text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-acid/40"
          />
        </div>
        <button
          type="submit"
          disabled={unifier.isPending || !query.trim()}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-acid px-4 py-2 text-[12px] font-semibold text-background hover:brightness-110 disabled:opacity-50"
        >
          {unifier.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          Find
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {SAMPLE_QUERIES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setQuery(s)}
            className="rounded-full border border-separator bg-card-active/40 px-2.5 py-1 text-[10px] text-muted/80 hover:border-acid/30 hover:text-acid"
          >
            {s}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {data && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="mt-4 rounded-xl border border-separator bg-card-active/40 p-3"
          >
            <p className="text-[11px] uppercase tracking-widest text-muted/60">
              {data.intent.replace("-", " ")}
            </p>
            <p className="mt-1 text-[13px] text-foreground/90">{data.reply}</p>

            {data.matchedGameId && data.matchedLauncher && (
              <div
                className={cn(
                  "mt-3 flex items-center justify-between gap-3 rounded-lg border p-2.5",
                  "border-acid/40 bg-acid/5",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-foreground">
                    {data.matchedGameName ?? gameNameById.get(data.matchedGameId) ?? data.matchedGameId}
                  </p>
                  <p className="text-[11px] text-muted/70">
                    On{" "}
                    <span className="text-acid">
                      {LAUNCHER_LABEL[data.matchedLauncher as LauncherSource] ?? data.matchedLauncher}
                    </span>
                    {entryById.get(data.matchedGameId)?.installed ? " · installed" : " · not installed"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {data.intent === "launch" || data.intent === "install" ? (
                    <button
                      type="button"
                      onClick={() => void handleLaunch(data.matchedGameId!, data.matchedLauncher!)}
                      className="inline-flex items-center gap-1 rounded-md bg-acid px-2 py-1 text-[11px] font-semibold text-background hover:brightness-110"
                    >
                      <Play className="h-3 w-3" />
                      Launch
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        entryById.has(data.matchedGameId!)
                          ? ROUTES.libraryGame(data.matchedGameId!)
                          : ROUTES.gameDetail(data.matchedGameId!),
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-md border border-separator bg-card px-2 py-1 text-[11px] text-foreground/85 hover:bg-card-active"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open
                  </button>
                </div>
              </div>
            )}

            {data.alternatives.length > 0 && (
              <>
                <p className="mt-3 text-[10px] uppercase tracking-widest text-muted/60">
                  Other versions in your library
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {data.alternatives.map((alt) => (
                    <button
                      key={`${alt.gameId}-${alt.launcher}`}
                      type="button"
                      onClick={() => void handleLaunch(alt.gameId, alt.launcher)}
                      title={alt.note}
                      className="inline-flex items-center gap-1.5 rounded-md border border-separator bg-card px-2 py-1 text-[11px] text-foreground/85 hover:border-acid/30 hover:text-acid"
                    >
                      <Network className="h-3 w-3" />
                      {alt.name} · {LAUNCHER_LABEL[alt.launcher as LauncherSource] ?? alt.launcher}
                    </button>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
