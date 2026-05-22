import { Clock, PlayCircle } from "lucide-react";
import { useLibraryStore } from "@/stores/library-store";
import { useGames } from "@/hooks/use-games";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { type GameDetail } from "@/lib/types";

export function PlayNextQueue() {
  const entries = useLibraryStore((s) => s.entries);
  const { data: games } = useGames();

  if (!games || entries.length === 0) return null;

  // Simple heuristic: Unplayed or barely played games, sorted by high meta score
  const backlog = entries
    .filter(e => e.playMinutes < 60)
    .map(e => games.find(g => g.id === e.gameId) as GameDetail | undefined)
    .filter((g): g is GameDetail => Boolean(g))
    .sort((a, b) => (b.metaScore ?? 0) - (a.metaScore ?? 0))
    .slice(0, 3);

  if (backlog.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-acid" />
        <h2 className="text-[18px] font-semibold text-foreground">Play Next</h2>
        <span className="rounded-full bg-acid/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-acid">Smart Queue</span>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {backlog.map((game) => (
          <div key={game.id} className="group relative overflow-hidden rounded-xl border border-separator bg-card transition-all hover:border-acid/30 hover:shadow-lg hover:shadow-acid/5">
            <img src={game.capsuleUrl} alt="" className="aspect-[460/215] w-full object-cover transition-transform duration-500 group-hover:scale-105 group-hover:opacity-60" />
            
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
              <p className="truncate text-[13px] font-semibold text-foreground group-hover:text-acid transition-colors">{game.name}</p>
              <p className="text-[11px] text-muted/60">Because you like {game.genres[0]}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
