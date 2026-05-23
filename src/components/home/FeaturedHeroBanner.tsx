import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Heart, Play, Sparkles, Star } from "lucide-react";
import type { Game } from "@/lib/types";
import { useGames } from "@/hooks/use-games";
import { ROUTES } from "@/lib/routes";
import { gameAccent } from "@/lib/game-accents";
import { useWishlistStore } from "@/stores/wishlist-store";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

const SLIDE_INTERVAL_MS = 6500;
const MAX_SLIDES = 5;
const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

/**
 * Cinematic, festival-energy hero. Full-bleed image with a strong
 * per-game accent wash, slow ken-burns, animated colored orbs, floating
 * sparkles, side-stacked "up next" previews, and a glowing CTA tinted in
 * the game's brand color so the page feels alive the moment it opens.
 */
export function FeaturedHeroBanner() {
  const { data: games, isLoading } = useGames();
  const navigate = useNavigate();
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.has);

  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

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
      setI((x) => (x + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [slides.length, paused]);

  useEffect(() => {
    if (slides.length > 0 && i >= slides.length) setI(0);
  }, [slides.length, i]);

  if (isLoading || slides.length === 0) {
    return (
      <section className="mb-6">
        <div
          className={cn(
            "relative h-[420px] overflow-hidden rounded-3xl border border-separator md:h-[520px] lg:h-[580px]",
            isLoading ? "animate-pulse bg-card-active/40" : "bg-card",
          )}
        >
          {!isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
              <div className="inline-flex items-center gap-1.5 text-acid">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em]">
                  Dreamworks
                </span>
              </div>
              <h1 className="text-[40px] font-bold text-foreground md:text-[56px]">
                Welcome to Dreamworks
              </h1>
            </div>
          )}
        </div>
      </section>
    );
  }

  const current = slides[i];
  const accent = gameAccent(current.id) ?? "var(--color-positive)";

  const handlePrev = () => setI((x) => (x - 1 + slides.length) % slides.length);
  const handleNext = () => setI((x) => (x + 1) % slides.length);

  return (
    <section
      className="relative mb-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative h-[460px] overflow-hidden rounded-3xl border border-separator bg-card md:h-[540px] lg:h-[600px]">
        {/* Crossfading hero image with slow ken-burns. */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="absolute inset-0"
          >
            <motion.img
              src={current.headerUrl || current.coverUrl}
              alt={current.name}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1.18 }}
              transition={{ duration: SLIDE_INTERVAL_MS / 1000 + 4, ease: "linear" }}
              className="h-full w-full object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* Animated colored orbs — drifting like festival lights. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${accent}55 0%, transparent 70%)` }}
          animate={{ x: [0, 60, 0], y: [0, 30, 0], opacity: [0.55, 0.85, 0.55] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 right-1/4 h-[360px] w-[360px] rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${accent}44 0%, transparent 70%)` }}
          animate={{ x: [0, -50, 0], y: [0, -20, 0], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute top-1/3 right-0 h-[300px] w-[300px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--color-cyan) 35%, transparent) 0%, transparent 70%)" }}
          animate={{ x: [0, -30, 0], y: [0, 40, 0], opacity: [0.3, 0.55, 0.3] }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Floating sparkle particles. */}
        <FloatingSparkles accent={accent} />

        {/* Cinematic vignette + bottom fade. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background/75 via-background/15 to-transparent" />
        <div
          className="pointer-events-none absolute inset-0 mix-blend-soft-light"
          style={{ backgroundImage: `linear-gradient(135deg, ${accent}66 0%, transparent 55%)` }}
        />

        {/* Foreground content. */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 lg:p-14">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${current.id}-fg`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
              className="max-w-2xl"
            >
              {/* Glowing pill row. */}
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <motion.span
                  animate={{ boxShadow: [`0 0 0 0 ${accent}66`, `0 0 0 8px ${accent}00`] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-background"
                  style={{ background: accent }}
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  Featured today
                </motion.span>
                {current.tags.slice(0, 2).map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-widest text-foreground/90 backdrop-blur-md"
                  >
                    {t}
                  </span>
                ))}
                {current.reviewSummary && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10.5px] font-semibold text-foreground/90 backdrop-blur-md">
                    <Star className="h-2.5 w-2.5 fill-current text-orange" />
                    {current.reviewSummary.scorePct}%
                  </span>
                )}
              </div>

              {/* Cinematic title with colored stroke shadow. */}
              <h1
                className="text-[44px] font-extrabold leading-[0.95] tracking-tight text-foreground drop-shadow-2xl sm:text-[60px] md:text-[72px] lg:text-[84px]"
                style={{ textShadow: `0 6px 32px ${accent}55, 0 2px 8px rgba(0,0,0,0.5)` }}
              >
                {current.name}
              </h1>

              <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-foreground/80 md:text-[15px]">
                <span className="font-semibold text-foreground">{current.developer}</span>
                {current.genres[0] && (
                  <>
                    {" · "}
                    <span>{current.genres[0]}</span>
                  </>
                )}
                {current.releaseDate && (
                  <>
                    {" · "}
                    <span>{new Date(current.releaseDate).getFullYear()}</span>
                  </>
                )}
              </p>

              {/* CTA cluster — glowing primary button. */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <motion.button
                  type="button"
                  onClick={() => navigate(ROUTES.gameDetail(current.id))}
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-bold text-background transition-all"
                  style={{
                    background: accent,
                    boxShadow: `0 8px 32px ${accent}66, 0 0 0 1px ${accent}aa inset`,
                  }}
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  View store
                </motion.button>

                <button
                  type="button"
                  onClick={() => toggleWishlist(current.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-[13px] font-semibold text-foreground backdrop-blur-md transition-all hover:bg-white/15",
                    isWishlisted(current.id) && "text-red",
                  )}
                >
                  <Heart
                    className={cn("h-3.5 w-3.5", isWishlisted(current.id) && "fill-current")}
                  />
                  {isWishlisted(current.id) ? "Wishlisted" : "Wishlist"}
                </button>

                <div className="ml-1 flex items-baseline gap-2 rounded-xl border border-white/15 bg-background/40 px-4 py-2.5 backdrop-blur-md">
                  {current.price.discountPct > 0 && (
                    <span className="rounded-md bg-discount-bg px-1.5 py-0.5 text-[11px] font-bold text-discount-fg">
                      -{current.price.discountPct}%
                    </span>
                  )}
                  <span className="text-[16px] font-bold text-foreground">
                    {current.price.isFree
                      ? "Free"
                      : formatPrice(current.price.final, current.price.currency)}
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Arrow navigation + dot indicators. */}
        <div className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-3 md:bottom-6">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous slide"
            className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-background/40 text-foreground/80 backdrop-blur-md transition-all hover:bg-background/60"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1.5">
            {slides.map((g, idx) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setI(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  idx === i ? "w-8" : "w-1.5 bg-foreground/30 hover:bg-foreground/60",
                )}
                style={idx === i ? { background: accent, boxShadow: `0 0 12px ${accent}aa` } : undefined}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next slide"
            className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-background/40 text-foreground/80 backdrop-blur-md transition-all hover:bg-background/60"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * Drifting sparkles overlay — a handful of small motion-blurred dots
 * floating up the frame to give the banner a tiny dose of life.
 */
function FloatingSparkles({ accent }: { accent: string }) {
  // Deterministic positions so they don't reshuffle on every render.
  const dots = useRef(
    Array.from({ length: 14 }, (_, idx) => ({
      left: (idx * 37) % 100,
      delay: (idx * 0.4) % 6,
      duration: 6 + ((idx * 1.7) % 5),
      size: 2 + (idx % 3),
    })),
  ).current;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((d, idx) => (
        <motion.span
          key={idx}
          className="absolute bottom-0 rounded-full"
          style={{
            left: `${d.left}%`,
            width: d.size,
            height: d.size,
            background: idx % 2 === 0 ? accent : "var(--color-cyan)",
            boxShadow: `0 0 8px ${idx % 2 === 0 ? accent : "var(--color-cyan)"}`,
          }}
          animate={{ y: [0, -680], opacity: [0, 0.9, 0] }}
          transition={{
            duration: d.duration,
            delay: d.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
