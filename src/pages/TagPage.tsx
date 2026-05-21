import { Link, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Tag } from "lucide-react";
import { useGamesByTag } from "@/hooks/use-games";
import { useTags } from "@/hooks/use-categories";
import { GameCard } from "@/components/store/GameCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/routes";
import { compactNumber } from "@/lib/utils";

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((part) => (part.length === 0 ? part : part[0].toUpperCase() + part.slice(1)))
    .join(" ");
}

export function TagPage() {
  const { slug = "" } = useParams();
  const { data: games, isLoading } = useGamesByTag(slug);
  const tags = useTags();
  const tag = (tags.data ?? []).find((t) => t.slug === slug);

  const name = tag?.name ?? titleCase(slug);
  const count = games?.length ?? 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Link
        to={ROUTES.store}
        className="inline-flex items-center gap-1.5 text-[12px] text-muted/60 hover:text-foreground/80 mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to store
      </Link>
      <header className="mb-6">
        <p className="text-[11px] uppercase tracking-widest text-muted/50">Tag</p>
        <h1 className="text-[22px] font-semibold tracking-tight text-foreground">{name}</h1>
        <p className="mt-1 text-[12px] text-muted/60">
          Tagged <span className="text-foreground/80">{name}</span> · {count} {count === 1 ? "game" : "games"}
          {tag?.voteCount != null && (
            <> · {compactNumber(tag.voteCount)} community votes</>
          )}
        </p>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[210px] w-full" />
          ))}
        </div>
      ) : count === 0 ? (
        <EmptyState
          icon={Tag}
          title="No games match this tag yet"
          description={`We couldn't find any games tagged "${name}".`}
          action={
            <Link
              to={ROUTES.store}
              className="text-[12px] text-acid hover:underline"
            >
              Browse the store
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(games ?? []).map((g) => (
            <GameCard key={g.id} game={g} width={340} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
