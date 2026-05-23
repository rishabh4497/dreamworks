import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronRight, ChevronLeft, Share2, Sparkles, Trophy, Clock, Gamepad2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useLibraryStore } from "@/stores/library-store";
import { useGames } from "@/hooks/use-games";
import { useCompletionStats } from "@/hooks/use-account";
import { formatHours, compactNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";


interface DreamworksWrappedProps {
  open: boolean;
  onClose: () => void;
}

export function DreamworksWrapped({ open, onClose }: DreamworksWrappedProps) {
  const profile = useAuthStore((s) => s.profile);
  const library = useLibraryStore((s) => s.entries);
  const { data: games } = useGames();
  const { data: stats } = useCompletionStats();
  
  const [currentSlide, setCurrentSlide] = useState(0);

  // Compute stats
  const totalMinutes = useMemo(() => library.reduce((acc, e) => acc + e.playMinutes, 0), [library]);
  
  const topGame = useMemo(() => {
    if (!games) return null;
    const sorted = [...library].sort((a, b) => b.playMinutes - a.playMinutes);
    if (!sorted.length) return null;
    return games.find((g) => g.id === sorted[0].gameId);
  }, [library, games]);

  const topGenres = useMemo(() => {
    if (!games) return [];
    const byId = new Map(games.map((g) => [g.id, g]));
    const totals = new Map<string, number>();
    for (const entry of library) {
      const g = byId.get(entry.gameId);
      if (!g || entry.playMinutes <= 0) continue;
      for (const genre of g.genres) {
        totals.set(genre, (totals.get(genre) ?? 0) + entry.playMinutes);
      }
    }
    return [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [library, games]);

  if (!open || !profile || !games) return null;

  const slides = [
    // Slide 1: Intro
    <div key="slide-1" className="flex h-full flex-col items-center justify-center p-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="mb-8 rounded-full bg-acid/20 p-6 shadow-[0_0_60px_-15px_rgba(var(--color-acid-rgb),0.5)]"
      >
        <Sparkles className="h-16 w-16 text-acid" />
      </motion.div>
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-[32px] font-bold tracking-tight text-foreground"
      >
        Your Year in Gaming
      </motion.h2>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-4 text-[16px] text-muted/80 max-w-sm"
      >
        Ready to see how you spent your time across the Dreamworks multiverse, {profile.displayName}?
      </motion.p>
    </div>,

    // Slide 2: Time Played
    <div key="slide-2" className="flex h-full flex-col items-center justify-center p-8 text-center">
      <Clock className="mb-6 h-12 w-12 text-blue" />
      <h3 className="text-[18px] uppercase tracking-widest text-muted/60">Total Playtime</h3>
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="mt-4 text-[72px] font-black tabular-nums leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-blue to-acid"
      >
        {formatHours(totalMinutes).replace(' hrs', '')}
      </motion.div>
      <p className="mt-2 text-[20px] font-semibold text-foreground/80">Hours</p>
    </div>,

    // Slide 3: Top Game
    <div key="slide-3" className="flex h-full flex-col items-center justify-center p-8 text-center">
      <Gamepad2 className="mb-6 h-12 w-12 text-orange" />
      <h3 className="text-[18px] uppercase tracking-widest text-muted/60">Your Obsession</h3>
      {topGame && (
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mt-8 flex flex-col items-center"
        >
          <img loading="lazy" decoding="async" loading="lazy" decoding="async" src={topGame.capsuleUrl} alt={topGame.name} className="w-48 rounded-xl shadow-2xl shadow-orange/20" />
          <h4 className="mt-6 text-[28px] font-bold text-foreground">{topGame.name}</h4>
          <p className="mt-2 text-[16px] text-orange font-medium">
            {formatHours(library.find(e => e.gameId === topGame.id)?.playMinutes ?? 0)} logged
          </p>
        </motion.div>
      )}
    </div>,

    // Slide 4: Genres
    <div key="slide-4" className="flex h-full flex-col items-center justify-center p-8 text-center">
      <h3 className="mb-8 text-[18px] uppercase tracking-widest text-muted/60">Your Vibe</h3>
      <div className="flex flex-col gap-6 w-full max-w-sm">
        {topGenres.map((genre, i) => (
          <motion.div
            key={genre[0]}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.15 }}
            className="flex items-center gap-4 w-full"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card border border-separator text-[16px] font-bold text-foreground">
              #{i + 1}
            </div>
            <div className="flex-1 text-left">
              <p className="text-[20px] font-bold text-foreground">{genre[0]}</p>
            </div>
            <p className="text-[14px] font-medium text-acid">{formatHours(genre[1])}</p>
          </motion.div>
        ))}
      </div>
    </div>,

    // Slide 5: Achievements & Outro
    <div key="slide-5" className="flex h-full flex-col items-center justify-center p-8 text-center">
      <Trophy className="mb-6 h-12 w-12 text-positive" />
      <h3 className="text-[18px] uppercase tracking-widest text-muted/60">Trophy Hunter</h3>
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="mt-4 text-[64px] font-black tabular-nums leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-positive to-green"
      >
        {stats ? compactNumber(stats.achievementsUnlocked) : 0}
      </motion.div>
      <p className="mt-2 text-[20px] font-semibold text-foreground/80">Achievements Unlocked</p>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 flex gap-3 pointer-events-auto"
      >
        <Button className="bg-acid text-background" onClick={onClose}>
          Done
        </Button>
        <Button variant="secondary" onClick={() => {}}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </motion.div>
    </div>
  ];

  const nextSlide = () => setCurrentSlide((p) => Math.min(p + 1, slides.length - 1));
  const prevSlide = () => setCurrentSlide((p) => Math.max(p - 1, 0));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md"
      >
        <button
          onClick={onClose}
          className="absolute right-6 top-6 rounded-full bg-card p-2 text-muted hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative h-[80vh] max-h-[800px] w-full max-w-[400px] overflow-hidden rounded-[2rem] border border-separator bg-card-active shadow-2xl">
          {/* Progress Bars */}
          <div className="absolute left-4 right-4 top-4 z-10 flex gap-1.5">
            {slides.map((_, i) => (
              <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-black/20">
                <motion.div
                  className="h-full bg-acid"
                  initial={{ width: i < currentSlide ? "100%" : "0%" }}
                  animate={{ width: i <= currentSlide ? "100%" : "0%" }}
                  transition={{ duration: i === currentSlide ? 0.3 : 0 }}
                />
              </div>
            ))}
          </div>

          {/* Tap Zones */}
          <div className="absolute inset-y-0 left-0 w-1/3 cursor-pointer" onClick={prevSlide} />
          <div className="absolute inset-y-0 right-0 w-2/3 cursor-pointer" onClick={nextSlide} />

          {/* Slide Content */}
          <div className="relative h-full w-full pointer-events-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                {slides[currentSlide]}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-between px-6 pointer-events-none">
            <button
              onClick={(e) => { e.stopPropagation(); prevSlide(); }}
              disabled={currentSlide === 0}
              className="pointer-events-auto rounded-full bg-black/40 p-2 text-white disabled:opacity-0 transition-opacity backdrop-blur-sm"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextSlide(); }}
              disabled={currentSlide === slides.length - 1}
              className="pointer-events-auto rounded-full bg-black/40 p-2 text-white disabled:opacity-0 transition-opacity backdrop-blur-sm"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
