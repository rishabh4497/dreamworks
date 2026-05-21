import { useParams } from "react-router-dom";
import { motion } from "motion/react";
import { useCategoryGames } from "@/hooks/use-games";
import { useCategories } from "@/hooks/use-categories";
import { GameCard } from "@/components/store/GameCard";
import { Skeleton } from "@/components/ui/skeleton";

export function CategoryPage() {
  const { slug = "" } = useParams();
  const { data: games, isLoading } = useCategoryGames(slug);
  const cats = useCategories();
  const category = (cats.data ?? []).find((c) => c.slug === slug);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <header className="mb-6">
        <p className="text-[11px] uppercase tracking-widest text-muted/50">Category</p>
        <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
          {category?.name ?? slug}
        </h1>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[210px]" />)
          : (games ?? []).map((g) => <GameCard key={g.id} game={g} width={340} />)}
      </div>
    </motion.div>
  );
}
