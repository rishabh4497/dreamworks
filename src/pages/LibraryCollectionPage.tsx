import { Link, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { useGames } from "@/hooks/use-games";
import { useCollections } from "@/hooks/use-collections";
import { GameCard } from "@/components/store/GameCard";
import { ROUTES } from "@/lib/routes";
import { EmptyState } from "@/components/common/EmptyState";

export function LibraryCollectionPage() {
  const { collectionId = "" } = useParams();
  const { data: collections, isLoading } = useCollections();
  const collection = collections?.find((c) => c.id === collectionId);
  const { data: games } = useGames();
  const list = (games ?? []).filter((g) => collection?.gameIds.includes(g.id));

  if (!collection && !isLoading) {
    return (
      <EmptyState
        title="Collection not found"
        action={
          <Link to={ROUTES.library} className="text-acid underline">
            Back to library
          </Link>
        }
      />
    );
  }

  if (!collection) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <header className="mb-6">
        <p className="text-[11px] uppercase tracking-widest text-muted/50">Collection</p>
        <h1 className="text-[22px] font-semibold tracking-tight text-foreground">{collection.name}</h1>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {list.map((g) => (
          <GameCard key={g.id} game={g} width={340} />
        ))}
      </div>
    </motion.div>
  );
}
