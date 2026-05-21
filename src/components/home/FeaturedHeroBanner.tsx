import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Heart, Sparkles } from "lucide-react";
import type { Game } from "@/lib/types";
import { useGames } from "@/hooks/use-games";
import { PriceTag } from "@/components/ui/price-tag";
import { ROUTES } from "@/lib/routes";
import { gameAccent } from "@/lib/game-accents";
import { useWishlistStore } from "@/stores/wishlist-store";
import { cn } from "@/lib/utils";

const SLIDE_INTERVAL_MS = 7000;
const MAX_SLIDES = 3;
const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

/**
 * Cinematic, full-bleed hero banner. Pulls the top featured/top-sellers
 * (up to 3), crossfades between them on a 7s timer with Ken-Burns zoom,
 * and stamps each slide with the game's hand-curated accent color so the
 * background subtly tints to match. Hovering pauses auto-advance; clicking
 * a dot indicator jumps + resets the rotation timer.
 */
export function FeaturedHeroBanner() {
  const { data: games, isLoading } = useGames();
  const navigate = useNavigate();
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.has);

  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const tickRef = useRef(0);

  // Featured first, then top-sellers as a fallback so we always have 3 hero slots.
  const slides = useMemo<Game[]>(() => {
    if (!games) return [];
    const featured = games.filter((g) => g.isFeatured);
    const ranked = [...games].sort((a, b) => a.salesRank - b.salesRank);
    const merged: Game[] = [];
    const seen = new Set<string>();
    for (const g of [...featured, ...ranked]) {
      if (seen.has(g.id)) continue;
      seen.add(g.id);
      merged.push(g);
      if (merged.length >= MAX_SLIDES) break;
    }
    return merged;
  }, [games]);

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    const id = window.setInterval(() => {
      tickRef.current += 1;
      setI((x) => (x + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [slides.length, paused]);

  // Clamp the active index if the slide pool shrinks (e.g. data refetch).
  useEffect(() => {
    if (slides.length > 0 && i >= slides.length) setI(0);
  }, [slides.length, i]);

  // Loading & empty-state fallback — soft acid gradient with welcome copy.
  if (isLoading || slides.length === 0) {
    return (
      <section className="mb-10">
        <div
          className={cn(
            "relative h-[280px] overflow-hidden rounded-2xl border border-separator",
            "md:h-[360px] lg:h-[480px]",
            isLoading ? "animate-pulse bg-card-active/40" : "bg-card",
          )}
        >
          {!isLoading && (
            <>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-acid/30 via-positive/15 to-transparent" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-8 text-center">
                <div className="inline-flex items-center gap-1.5 text-acid">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest">
                    Dreamworks
                  </span>
                </div>
                <h1 className="text-[32px] font-bold text-foreground md:text-[40px]">
                  Welcome to Dreamworks
                </h1>
                <p className="text-[13px] text-muted/80">
                  Storefront and analytics, in one place.
                </p>
              </div>
            </>
          )}
        </div>
      </section>
    );
  }

  const current = slides[i];
  const bg = current.headerUrl || current.coverUrl;
  const accent = gameAccent(current.id) ?? "var(--color-acid)";
  const firstTag = current.tags[0];
  const genreLine = [current.developer, current.genres[0]].filter(Boolean).join(" · ");

  const handleDotClick = (idx: number) => {
    setI(idx);
    tickRef.current += 1; // Force the interval re-fire (cleanup + remount via deps).
  };

  return (
    <section
      className="relative mb-10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative h-[280px] overflow-hidden rounded-2xl border border-separator bg-card md:h-[360px] lg:h-[480px]">
        {/* Image stack — crossfade slides with a slow Ken-Burns zoom. */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="absolute inset-0"
          >
            <motion.img
              src={bg}
              alt={current.name}
              initial={{ scale: 1.02 }}
              animate={{ scale: 1.08 }}
              transition={{ duration: SLIDE_INTERVAL_MS / 1000, ease: "linear" }}
              className="h-full w-full object-cover brightness-90"
            />
          </motion.div>
        </AnimatePresence>

        {/* Accent wash — top-left to bottom-right tint plus a bottom darkness. */}
        <div
          className="pointer-events-none absolute inset-0 mix-blend-soft-light"
          style={{
            backgroundImage: `linear-gradient(135deg, ${accent}66 0%, transparent 55%)`,
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(135deg, ${accent}33 0%, transparent 40%, transparent 60%, ${accent}1a 100%)`,
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background/55 via-transparent to-transparent" />

        {/* Foreground glass card, bottom-left. */}
        <div className="absolute inset-x-0 bottom-0 px-5 pb-14 md:px-8 md:pb-16 lg:px-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${current.id}-fg`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.05 }}
              className="max-w-xl rounded-2xl border border-white/10 bg-background/40 p-5 backdrop-blur-md md:p-6"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-acid px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-background">
                  <Sparkles className="h-2.5 w-2.5" />
                  Featured
                </span>
                {firstTag && (
                  <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-widest text-foreground/80">
                    {firstTag}
                  </span>
                )}
              </div>

              <h1
                className={cn(
                  "text-[36px] font-bold leading-tight tracking-tight text-foreground drop-shadow",
                  "sm:text-[44px]",
                )}
              >
                {current.name}
              </h1>

              {genreLine && (
                <p className="mt-2 text-[13px] text-foreground/70">{genreLine}</p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div className="rounded-lg border border-white/10 bg-background/60 px-3 py-1.5 backdrop-blur-md">
                  <PriceTag price={current.price} size="lg" />
                </div>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.gameDetail(current.id))}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-acid px-4 py-2 text-[13px] font-semibold text-background transition-all hover:brightness-110"
                >
                  View store →
                </button>
                <button
                  type="button"
                  onClick={() => toggleWishlist(current.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-[13px] font-semibold text-foreground/90 transition-all hover:bg-white/10",
                    isWishlisted(current.id) && "text-acid",
                  )}
                >
                  <Heart
                    className={cn(
                      "h-3.5 w-3.5",
                      isWishlisted(current.id) && "fill-current",
                    )}
                  />
                  {isWishlisted(current.id) ? "Wishlisted" : "Add to wishlist"}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Slide indicators, bottom-right. */}
        {slides.length > 1 && (
          <div className="absolute bottom-5 right-5 flex items-center gap-1.5">
            {slides.map((g, idx) => (
              <button
                key={g.id}
                type="button"
                onClick={() => handleDotClick(idx)}
                aria-label={`Show slide ${idx + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  idx === i
                    ? "w-6 bg-acid"
                    : "w-1.5 bg-foreground/30 hover:bg-foreground/60",
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
