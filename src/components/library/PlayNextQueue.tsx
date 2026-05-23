import { useMemo, useState } from "react";
import { Clock, PlayCircle, Sparkles, Wand2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useLibraryStore } from "@/stores/library-store";
import { useGames } from "@/hooks/use-games";
import { useAIPlayNext } from "@/hooks/use-ai";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { toast } from "@/stores/toast-store";
import type { GameDetail } from "@/lib/types";
import type { PlayNextPayload } from "@/lib/ai/payload-types";
import type { PlayNextPick } from "@/lib/ai/response-types";

const QUICK_MOODS: { label: string; hint: string; minutes: number }[] = [
  { label: "30 min after work", hint: "relaxing, easy to drop", minutes: 30 },
  { label: "Long weekend deep-dive", hint: "story-rich, immersive", minutes: 240 },
  { label: "Couch co-op tonight", hint: "two-player local, light", minutes: 90 },
  { label: "Comfort replay", hint: "familiar, low-stress", minutes: 60 },
];

export function PlayNextQueue() {
  const entries = useLibraryStore((s) => s.entries);
  const { data: games } = useGames();
  const strategist = useAIPlayNext();
  const [moodInput, setMoodInput] = useState("");
  const [moodMinutes, setMoodMinutes] = useState<number | undefined>(undefined);

  const gameById = useMemo(() => {
    const map = new Map<string, GameDetail>();
    (games ?? []).forEach((g) => map.set(g.id, g as GameDetail));
    return map;
  }, [games]);

  const heuristicBacklog = useMemo(() => {
    if (!games || entries.length === 0) return [];
    return entries
      .filter((e) => e.playMinutes < 60)
      .map((e) => gameById.get(e.gameId))
      .filter((g): g is GameDetail => Boolean(g))
      .sort((a, b) => (b.metaScore ?? 0) - (a.metaScore ?? 0))
      .slice(0, 3);
  }, [entries, games, gameById]);

  const buildPayload = (moodHint?: string, availableMinutes?: number): PlayNextPayload | null => {
    if (entries.length === 0 || !games) return null;
    return {
      ownedGames: entries
        .map((e) => {
          const g = gameById.get(e.gameId);
          if (!g) return null;
          return {
            id: e.gameId,
            name: g.name,
            genres: g.genres ?? [],
            tags: (g.tags ?? []).slice(0, 5),
            playMinutes: e.playMinutes,
            completionPct: e.completionPct,
            lastPlayed: e.lastPlayed,
            metaScore: g.metaScore ?? undefined,
            mainHours: g.playtime?.mainHours,
          };
        })
        .filter((g): g is NonNullable<typeof g> => g !== null),
      moodHint,
      availableMinutes,
    };
  };

  const askAI = (moodHint?: string, availableMinutes?: number) => {
    const payload = buildPayload(moodHint, availableMinutes);
    if (!payload) return;
    strategist.mutate(payload, {
      onError: () => toast.error("Strategist offline — showing heuristic picks"),
    });
  };

  if (!games || entries.length === 0) return null;

  const aiPicks = strategist.data;
  const showAI = aiPicks && aiPicks.picks.length > 0;
  const heuristicVisible = !showAI && heuristicBacklog.length > 0;

  if (!showAI && heuristicBacklog.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Clock className="h-5 w-5 text-acid" />
        <h2 className="text-[18px] font-semibold text-foreground">Play Next</h2>
        <span className="rounded-full bg-acid/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-acid">
          {showAI ? "AI Strategist" : "Smart Queue"}
        </span>
        {showAI && aiPicks?.encouragement && (
          <span className="text-[11px] text-muted/70">· {aiPicks.encouragement}</span>
        )}
      </div>

      <div className="mb-4 flex flex-col gap-2 rounded-xl border border-separator bg-card-active/40 p-3 sm:flex-row sm:items-center">
        <Sparkles className="h-4 w-4 shrink-0 text-acid" />
        <input
          value={moodInput}
          onChange={(e) => setMoodInput(e.target.value)}
          placeholder="Tell the strategist what you want: 'something chill for 30 min'"
          className="flex-1 rounded-lg border border-separator bg-input/60 px-3 py-1.5 text-[12px] text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-acid/40"
        />
        <button
          type="button"
          onClick={() => askAI(moodInput.trim() || undefined, moodMinutes)}
          disabled={strategist.isPending}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-acid px-3 py-1.5 text-[12px] font-semibold text-background hover:brightness-110 disabled:opacity-50"
        >
          {strategist.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Wand2 className="h-3.5 w-3.5" />
          )}
          Pick for me
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {QUICK_MOODS.map((m) => (
          <button
            key={m.label}
            type="button"
            onClick={() => {
              setMoodInput(m.hint);
              setMoodMinutes(m.minutes);
              askAI(m.hint, m.minutes);
            }}
            disabled={strategist.isPending}
            className="rounded-full border border-separator bg-card-active/50 px-2.5 py-1 text-[11px] text-foreground/85 transition-colors hover:border-acid/30 hover:bg-acid/5 hover:text-acid disabled:opacity-50"
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {showAI
          ? aiPicks!.picks.map((pick) => (
              <AIPickCard
                key={pick.gameId}
                pick={pick}
                game={gameById.get(pick.gameId)}
                isTop={pick.gameId === aiPicks!.topPickGameId}
              />
            ))
          : heuristicVisible &&
            heuristicBacklog.map((game) => (
              <HeuristicCard key={game.id} game={game} />
            ))}
      </div>
    </section>
  );
}

function AIPickCard({
  pick,
  game,
  isTop,
}: {
  pick: PlayNextPick;
  game?: GameDetail;
  isTop: boolean;
}) {
  if (!game) return null;
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg",
        isTop ? "border-acid/40 shadow-acid/10" : "border-separator hover:border-acid/30",
      )}
    >
      <img
        loading="lazy"
        decoding="async"
        src={game.capsuleUrl}
        alt=""
        className="aspect-[460/215] w-full object-cover transition-transform duration-500 group-hover:scale-105 group-hover:opacity-60"
      />

      {isTop && (
        <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-acid px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-background">
          <Sparkles className="h-2.5 w-2.5" />
          Top pick
        </div>
      )}

      <div className="absolute inset-0 flex flex-col justify-between p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-t from-background/95 via-background/50 to-transparent">
        <div className="flex justify-end">
          <span className="rounded-md bg-card-active/80 px-2 py-1 text-[10px] font-semibold text-foreground backdrop-blur-sm">
            {pick.sessionMinutes < 60
              ? `${pick.sessionMinutes} min`
              : `${Math.round(pick.sessionMinutes / 60)}h`}
          </span>
        </div>
        <div className="flex justify-center">
          <Link to={ROUTES.libraryGame(game.id)}>
            <Button className="rounded-full bg-acid text-background shadow-xl hover:scale-105 hover:bg-acid">
              <PlayCircle className="mr-2 h-4 w-4" /> Start
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-3">
        <p className="truncate text-[13px] font-semibold text-foreground transition-colors group-hover:text-acid">
          {game.name}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[11px] text-muted/80">{pick.reason}</p>
        <p className="mt-1 text-[10px] uppercase tracking-widest text-acid/80">{pick.vibe}</p>
      </div>
    </div>
  );
}

function HeuristicCard({ game }: { game: GameDetail }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-separator bg-card transition-all hover:border-acid/30 hover:shadow-lg hover:shadow-acid/5">
      <img
        loading="lazy"
        decoding="async"
        src={game.capsuleUrl}
        alt=""
        className="aspect-[460/215] w-full object-cover transition-transform duration-500 group-hover:scale-105 group-hover:opacity-60"
      />

      <div className="absolute inset-0 flex flex-col justify-between p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-t from-background/90 via-background/50 to-transparent">
        <div className="flex justify-end">
          <span className="rounded-md bg-card-active/80 px-2 py-1 text-[10px] font-semibold text-foreground backdrop-blur-sm">
            Est: {game.playtime?.mainHours ?? "12"} hrs
          </span>
        </div>
        <div className="flex justify-center">
          <Link to={ROUTES.libraryGame(game.id)}>
            <Button className="rounded-full bg-acid text-background shadow-xl hover:scale-105 hover:bg-acid">
              <PlayCircle className="mr-2 h-4 w-4" /> Start
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-3">
        <p className="truncate text-[13px] font-semibold text-foreground transition-colors group-hover:text-acid">
          {game.name}
        </p>
        <p className="text-[11px] text-muted/60">Because you like {game.genres[0]}</p>
      </div>
    </div>
  );
}
