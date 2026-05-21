import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Game, ShelfGame } from "@/lib/types";
import { GameCard } from "./GameCard";
import { Skeleton } from "@/components/ui/skeleton";

interface GameShelfProps {
  title: string;
  subtitle?: string;
  games?: Game[];
  entries?: ShelfGame[];
  isLoading?: boolean;
  action?: { label: string; onClick: () => void };
}

export function GameShelf({
  title,
  subtitle,
  games,
  entries,
  isLoading,
  action,
}: GameShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.85), behavior: "smooth" });
  };

  const renderCards = () => {
    if (entries) {
      return entries.map((e) => (
        <GameCard key={e.game.id} game={e.game} reason={e.reason} />
      ));
    }
    return games?.map((g) => <GameCard key={g.id} game={g} />);
  };

  return (
    <section className="mb-10">
      <header className="mb-3 flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-semibold tracking-tight text-foreground">{title}</h2>
          {subtitle && <p className="text-[12px] text-muted/60">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1">
          {action && (
            <button
              onClick={action.onClick}
              className="text-[12px] text-muted/70 hover:text-foreground/80 transition-colors mr-1.5"
            >
              {action.label} →
            </button>
          )}
          <button
            onClick={() => scroll(-1)}
            className="rounded-md p-1.5 text-muted/50 hover:bg-input hover:text-foreground/80"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll(1)}
            className="rounded-md p-1.5 text-muted/50 hover:bg-input hover:text-foreground/80"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="shelf-scroll flex gap-3 overflow-x-auto pb-2"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[178px] w-[240px] shrink-0" />
            ))
          : renderCards()}
      </div>
    </section>
  );
}
