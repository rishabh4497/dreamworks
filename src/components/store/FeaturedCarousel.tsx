import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Game } from "@/lib/types";
import { PriceTag } from "@/components/ui/price-tag";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface FeaturedCarouselProps {
  games: Game[] | undefined;
}

export function FeaturedCarousel({ games }: FeaturedCarouselProps) {
  const list = (games ?? []).slice(0, 5);
  const [i, setI] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (list.length < 2) return;
    const id = setInterval(() => setI((x) => (x + 1) % list.length), 6000);
    return () => clearInterval(id);
  }, [list.length]);

  if (list.length === 0) {
    return <div className="h-[340px] rounded-2xl bg-card-active/40 animate-pulse" />;
  }

  const current = list[i];

  return (
    <div className="relative mb-10 overflow-hidden rounded-2xl border border-separator bg-card">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="relative cursor-pointer"
          onClick={() => navigate(ROUTES.gameDetail(current.id))}
        >
          <div className="aspect-[1600/520] w-full overflow-hidden">
            <img
              src={current.headerUrl}
              alt={current.name}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute left-8 right-8 bottom-6 flex items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {current.tags.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-card-active/80 backdrop-blur-sm px-2 py-[2px] text-[10px] font-medium text-foreground/80"
                  >
                    {t}
                  </span>
                ))}
                {current.comingSoon && <Badge variant="soon">Coming Soon</Badge>}
              </div>
              <h2 className="text-[28px] font-semibold tracking-tight text-foreground drop-shadow-md">
                {current.name}
              </h2>
              <p className="max-w-xl text-[13px] text-foreground/70 line-clamp-2">
                {current.developer}
              </p>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-2 rounded-xl border border-separator bg-bg/70 backdrop-blur-md px-4 py-3">
              <PriceTag price={current.price} size="lg" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(ROUTES.gameDetail(current.id));
                }}
                className="rounded-lg bg-acid px-4 py-1.5 text-[12px] font-semibold text-background hover:brightness-110"
              >
                View store page
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute left-1/2 bottom-3 -translate-x-1/2 flex gap-1.5">
        {list.map((g, idx) => (
          <button
            key={g.id}
            onClick={() => setI(idx)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              idx === i ? "w-6 bg-acid" : "w-1.5 bg-foreground/30 hover:bg-foreground/60",
            )}
          />
        ))}
      </div>
    </div>
  );
}
