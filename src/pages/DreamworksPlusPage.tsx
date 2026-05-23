import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Cloud,
  Clock,
  Crown,
  Download,
  Gift,
  Headphones,
  Library,
  Play,
  Plus,
  Sparkles,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import type { Game } from "@/lib/types";
import { useGames } from "@/hooks/use-games";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { useAccentStore } from "@/stores/accent-store";
import { useLibraryStore } from "@/stores/library-store";
import { ROUTES } from "@/lib/routes";
import { cn, compactNumber, formatHours } from "@/lib/utils";
import { GameCard } from "@/components/store/GameCard";

const PLUS = "#a052ff";
const PICK_INTERVAL_MS = 9000;
const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

export function DreamworksPlusPage() {
  const { data: games } = useGames();
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const addToCart = useCartStore((s) => s.add);
  const setAccent = useAccentStore((s) => s.setAccent);
  const playMinutes = useLibraryStore((s) =>
    s.entries.reduce((acc, e) => acc + e.playMinutes, 0),
  );
  const isSubscribed = profile?.isSubscribed;
  const firstName = profile?.displayName ? profile.displayName.split(" ")[0] : "friend";

  // Lock the global app backdrop to Plus purple — gives the whole page a
  // single ambient identity, rather than the homepage's per-slide rotation.
  useEffect(() => {
    setAccent(PLUS);
    return () => setAccent(null);
  }, [setAccent]);

  const includedGames = useMemo(
    () => (games ?? []).filter((g) => g.includedInSubscription),
    [games],
  );

  const handleUpgrade = () => {
    addToCart("plus-sub");
    navigate(ROUTES.checkout);
  };

  if (includedGames.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex min-h-[60vh] items-center justify-center"
      >
        <div className="text-center">
          <Crown className="mx-auto h-10 w-10" style={{ color: PLUS }} />
          <p className="mt-3 text-[14px] text-muted/70">Loading your Plus catalog…</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn("space-y-10", !isSubscribed && "pb-24")}
    >
      <MembershipHeader
        firstName={firstName}
        isSubscribed={!!isSubscribed}
        gameCount={includedGames.length}
        playMinutes={playMinutes}
      />

      <TonightsPick games={includedGames} />

      <ValueLedger gameCount={includedGames.length} />

      <LeavingSoon games={includedGames} />

      <Collections games={includedGames} />

      <Vault games={includedGames} />

      <PerksScroller />

      {!isSubscribed && <StickyUpgradeChip onUpgrade={handleUpgrade} />}
    </motion.div>
  );
}

// ── 1. Membership header ────────────────────────────────────────────────────

interface MembershipHeaderProps {
  firstName: string;
  isSubscribed: boolean;
  gameCount: number;
  playMinutes: number;
}

function MembershipHeader({ firstName, isSubscribed, gameCount, playMinutes }: MembershipHeaderProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="relative overflow-hidden rounded-3xl border bg-card/60 p-5 backdrop-blur-sm sm:p-7"
      style={{ borderColor: `${PLUS}33`, boxShadow: `0 18px 50px -22px ${PLUS}66, 0 0 0 1px ${PLUS}22` }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${PLUS}55 0%, transparent 70%)` }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[260px] bg-gradient-to-r from-cyan/15 to-transparent" />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <motion.span
            animate={{ rotate: [0, -4, 4, -2, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-background"
            style={{ background: PLUS, boxShadow: `0 8px 26px ${PLUS}77` }}
          >
            <Crown className="h-5 w-5" />
          </motion.span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5" style={{ color: PLUS }}>
              <Sparkles className="h-2.5 w-2.5" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em]">
                {isSubscribed ? "Member" : "Try it free"}
              </span>
            </div>
            <h1 className="text-[24px] font-extrabold leading-tight tracking-tight text-foreground sm:text-[28px]">
              {isSubscribed ? `${firstName}, your vault is open.` : `${firstName}, peek inside the vault.`}
            </h1>
            <p className="mt-1 text-[12.5px] text-muted/75 sm:text-[13px]">
              {isSubscribed
                ? "Pick anything, play forever. No fine print."
                : "All-access pass to the catalog. Cancel anytime."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:flex sm:items-center sm:gap-5">
          <HeaderMetric icon={Library} label="In vault" value={`${gameCount}`} accent={PLUS} />
          <HeaderMetric
            icon={Clock}
            label="You've played"
            value={playMinutes > 0 ? formatHours(playMinutes) : "0h"}
            accent="var(--color-cyan)"
          />
          <HeaderMetric icon={Cloud} label="Cloud ready" value="All" accent="var(--color-green)" />
        </div>
      </div>
    </motion.section>
  );
}

function HeaderMetric({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Library;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)` }}
      >
        <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
      </span>
      <div>
        <p className="font-mono text-[15px] font-bold leading-none tabular-nums" style={{ color: accent }}>
          {value}
        </p>
        <p className="mt-1 text-[9.5px] uppercase tracking-widest text-muted/60">{label}</p>
      </div>
    </div>
  );
}

// ── 2. Tonight's pick (asymmetric, not a full-bleed hero) ───────────────────

function TonightsPick({ games }: { games: Game[] }) {
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  const picks = useMemo(
    () => [...games].sort((a, b) => a.salesRank - b.salesRank).slice(0, 4),
    [games],
  );

  useEffect(() => {
    if (picks.length < 2 || paused) return;
    const id = window.setInterval(() => setI((x) => (x + 1) % picks.length), PICK_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [picks.length, paused]);

  if (picks.length === 0) return null;
  const pick = picks[i];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5" style={{ color: PLUS }}>
            <Sparkles className="h-3 w-3" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em]">Tonight's pick</span>
          </span>
          <span className="text-[11px] text-muted/60">curated for tonight, swaps every few hours</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setI((x) => (x - 1 + picks.length) % picks.length)}
            aria-label="Previous pick"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-separator bg-card/70 text-muted/80 hover:text-foreground"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setI((x) => (x + 1) % picks.length)}
            aria-label="Next pick"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-separator bg-card/70 text-muted/80 hover:text-foreground"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-[1.15fr_1fr] md:gap-6">
        {/* Left column — copy, kicker, big quote, CTA. */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${pick.id}-text`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-card/60 p-7 backdrop-blur-sm md:p-9"
            style={{ borderColor: `${PLUS}22`, minHeight: 360 }}
          >
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -left-24 -bottom-24 h-[320px] w-[320px] rounded-full blur-3xl"
              style={{ background: `radial-gradient(circle, ${PLUS}66 0%, transparent 70%)` }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="relative">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-background"
                style={{ background: PLUS }}
              >
                <Crown className="h-2.5 w-2.5" />
                Free with Plus
              </span>
              <h2 className="mt-5 text-[40px] font-extrabold leading-[0.95] tracking-tight text-foreground md:text-[56px]">
                {pick.name}
              </h2>
              <p className="mt-3 max-w-md text-[13.5px] leading-relaxed text-muted/80">
                <span className="font-semibold text-foreground/90">{pick.developer}</span>
                {pick.genres[0] && <> · {pick.genres[0]}</>}
                {pick.reviewSummary && <> · {pick.reviewSummary.label}</>}
              </p>
              <blockquote className="mt-5 max-w-md border-l-2 pl-4 font-serif text-[14px] italic leading-relaxed text-foreground/85" style={{ borderColor: PLUS }}>
                {editorsNoteFor(pick)}
              </blockquote>
            </div>

            <div className="relative mt-7 flex flex-wrap items-center gap-3">
              <motion.button
                type="button"
                onClick={() => navigate(ROUTES.gameDetail(pick.id))}
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[13px] font-bold text-background"
                style={{
                  background: PLUS,
                  boxShadow: `0 8px 26px ${PLUS}77, 0 0 0 1px ${PLUS}aa inset`,
                }}
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Start playing
              </motion.button>
              <button
                type="button"
                onClick={() => navigate(ROUTES.gameDetail(pick.id))}
                className="inline-flex items-center gap-2 rounded-xl border border-separator bg-card/70 px-5 py-3 text-[13px] font-semibold text-foreground hover:bg-card-hover"
              >
                <Download className="h-3.5 w-3.5" />
                Add to library
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Right column — small tilted artwork card. */}
        <AnimatePresence mode="wait">
          <motion.button
            key={`${pick.id}-art`}
            type="button"
            onClick={() => navigate(ROUTES.gameDetail(pick.id))}
            initial={{ opacity: 0, rotate: 2, x: 16 }}
            animate={{ opacity: 1, rotate: 0, x: 0 }}
            exit={{ opacity: 0, rotate: -2, x: -16 }}
            transition={{ duration: 0.5, ease: EASE }}
            whileHover={{ y: -4, rotate: -0.5 }}
            className="group relative block overflow-hidden rounded-3xl border"
            style={{
              borderColor: `${PLUS}33`,
              boxShadow: `0 28px 70px -20px ${PLUS}66, 0 10px 30px -10px rgba(0,0,0,0.55)`,
              minHeight: 360,
            }}
          >
            <img
              src={pick.headerUrl || pick.coverUrl}
              alt={pick.name}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/85 via-background/15 to-transparent" />
            <div
              className="pointer-events-none absolute inset-0 mix-blend-soft-light"
              style={{ backgroundImage: `linear-gradient(165deg, ${PLUS}44 0%, transparent 50%)` }}
            />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full blur-3xl"
              style={{ background: `radial-gradient(circle, ${PLUS}88 0%, transparent 70%)` }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.55, 0.85, 0.55] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-left">
              <div className="flex flex-wrap gap-1.5">
                {pick.tags.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-foreground/85 backdrop-blur-md"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {picks.map((g, idx) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setI(idx);
                    }}
                    aria-label={`Pick ${idx + 1}`}
                    className={cn("h-1.5 rounded-full transition-all", idx === i ? "w-5" : "w-1.5 bg-foreground/30")}
                    style={idx === i ? { background: PLUS, boxShadow: `0 0 10px ${PLUS}aa` } : undefined}
                  />
                ))}
              </div>
            </div>
          </motion.button>
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

const NOTE_LIBRARY: Record<string, string> = {
  "elden-ring": "A world that won't hold your hand, and that's the point. Patience pays in gold.",
  "witcher-3": "Three full RPGs hidden inside one. Wear comfortable pants.",
  "baldurs-gate-3": "Try anything — it answers back. The best D&D adapter ever shipped.",
  "cyberpunk-2077": "Night City finally feels like the place its trailers promised.",
  "red-dead-redemption-2": "A slow western that earns every one of its hours.",
};

function editorsNoteFor(game: Game): string {
  return (
    NOTE_LIBRARY[game.id] ??
    `Tonight's pick from our editors. Drop in for an hour or vanish for the weekend — ${game.name} respects both.`
  );
}

// ── 3. Value ledger — animated counters ─────────────────────────────────────

function ValueLedger({ gameCount }: { gameCount: number }) {
  const ledger = [
    { icon: Wallet, label: "Catalog value", value: `$${(gameCount * 18).toLocaleString()}`, sub: "if bought individually", accent: PLUS },
    { icon: Library, label: "Games included", value: compactNumber(gameCount), sub: "growing every week", accent: "var(--color-cyan)" },
    { icon: Headphones, label: "Soundtracks", value: `${Math.round(gameCount * 0.6)}`, sub: "free to stream", accent: "var(--color-orange)" },
    { icon: Users, label: "Family seats", value: "5", sub: "share with your household", accent: "var(--color-green)" },
  ];

  return (
    <section>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {ledger.map((row, idx) => {
          const Icon = row.icon;
          return (
            <motion.div
              key={row.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * idx, ease: EASE }}
              className="relative overflow-hidden rounded-2xl border border-separator bg-card/60 p-4 backdrop-blur-sm"
            >
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl"
                style={{ background: `radial-gradient(circle, ${row.accent}44 0%, transparent 70%)` }}
              />
              <div className="relative flex items-center gap-3">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: `color-mix(in srgb, ${row.accent} 30%, transparent)`,
                    background: `color-mix(in srgb, ${row.accent} 12%, transparent)`,
                  }}
                >
                  <Icon className="h-4 w-4" style={{ color: row.accent }} />
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-[20px] font-extrabold leading-none tabular-nums" style={{ color: row.accent }}>
                    {row.value}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-foreground/85">
                    {row.label}
                  </p>
                  <p className="mt-0.5 truncate text-[10.5px] text-muted/65">{row.sub}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// ── 4. Leaving soon — urgency cards ─────────────────────────────────────────

function LeavingSoon({ games }: { games: Game[] }) {
  const picks = useMemo(() => {
    // Deterministic-looking "rotates out" pool — we don't have a real
    // "leaving" field, so we synthesize from low-end of the included set.
    const sorted = [...games].sort((a, b) => b.salesRank - a.salesRank);
    return sorted.slice(0, 3).map((g, i) => ({ game: g, daysLeft: [3, 7, 14][i] ?? 7 }));
  }, [games]);

  if (picks.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <div className="flex items-center gap-2 text-red">
          <Clock className="h-3 w-3" />
          <h2 className="text-[12px] font-bold uppercase tracking-[0.25em]">Leaving soon</h2>
        </div>
        <span className="text-[11px] text-muted/65">Finish these before they rotate out</span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {picks.map(({ game, daysLeft }, idx) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 * idx, ease: EASE }}
            whileHover={{ y: -3 }}
          >
            <Link
              to={ROUTES.gameDetail(game.id)}
              className="group relative flex h-[200px] flex-col justify-between overflow-hidden rounded-2xl border border-red/25 p-4"
              style={{ boxShadow: `0 0 0 1px color-mix(in srgb, var(--color-red) 18%, transparent)` }}
            >
              <img
                src={game.headerUrl || game.coverUrl}
                alt={game.name}
                className="absolute inset-0 h-full w-full object-cover opacity-45 transition-transform duration-500 group-hover:scale-110"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-red/55 via-orange/30 to-orange/10" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background/85 to-transparent" />
              <motion.div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl"
                style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--color-red) 60%, transparent) 0%, transparent 70%)" }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.55, 0.85, 0.55] }}
                transition={{ duration: 4 + idx, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="relative flex items-start justify-between">
                <motion.span
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-flex items-center gap-1 rounded-full bg-red px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-background"
                >
                  <Clock className="h-2.5 w-2.5" />
                  {daysLeft} days left
                </motion.span>
                <span className="text-[11px] font-semibold text-foreground/80 transition-all group-hover:translate-x-1">→</span>
              </div>

              <div className="relative space-y-1">
                <h3 className="text-[20px] font-extrabold leading-tight text-foreground drop-shadow">
                  {game.name}
                </h3>
                <p className="truncate text-[11.5px] text-foreground/75">{game.developer}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ── 5. Themed collections — stacked covers ──────────────────────────────────

interface Collection {
  title: string;
  subtitle: string;
  accent: string;
  filter: (g: Game) => boolean;
}

const COLLECTIONS: Collection[] = [
  {
    title: "Weekend co-op",
    subtitle: "Bring a friend, lose a Sunday",
    accent: "var(--color-green)",
    filter: (g) => g.tags.some((t) => ["coop", "multiplayer", "local-multiplayer"].includes(t)),
  },
  {
    title: "Late-night vibes",
    subtitle: "Slow-burn, headphones-on stories",
    accent: "var(--color-cyan)",
    filter: (g) => g.tags.some((t) => ["story-rich", "narrative", "atmospheric", "cozy"].includes(t)),
  },
  {
    title: "Brain teasers",
    subtitle: "For the puzzle-shaped brain",
    accent: "var(--color-orange)",
    filter: (g) => g.tags.some((t) => ["puzzle", "strategy", "deck-builder"].includes(t)),
  },
];

function Collections({ games }: { games: Game[] }) {
  const fallback = useMemo(() => [...games].sort((a, b) => a.salesRank - b.salesRank), [games]);

  const built = COLLECTIONS.map((c) => {
    const matches = games.filter(c.filter);
    const fill = matches.length >= 4 ? matches.slice(0, 4) : [...matches, ...fallback.slice(0, 4 - matches.length)];
    return { ...c, picks: fill };
  });

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <div className="flex items-center gap-2" style={{ color: PLUS }}>
            <Sparkles className="h-3 w-3" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em]">Editor collections</span>
          </div>
          <h2 className="mt-1 text-[18px] font-bold leading-tight text-foreground">
            Picked sets, not just shelves.
          </h2>
        </div>
        <Link to={ROUTES.storeSearch} className="text-[11px] font-semibold text-acid hover:underline">
          Browse all →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {built.map((c, idx) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 * idx, ease: EASE }}
            whileHover={{ y: -4 }}
          >
            <Link
              to={`${ROUTES.storeSearch}?tags=${encodeURIComponent(c.picks[0]?.tags[0] ?? "")}`}
              className="group relative block h-[280px] overflow-hidden rounded-3xl border bg-card/50 p-5"
              style={{ borderColor: `color-mix(in srgb, ${c.accent} 26%, transparent)`, boxShadow: `0 0 0 1px color-mix(in srgb, ${c.accent} 14%, transparent)` }}
            >
              <motion.div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl"
                style={{ background: `radial-gradient(circle, color-mix(in srgb, ${c.accent} 55%, transparent) 0%, transparent 70%)` }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.55, 0.85, 0.55] }}
                transition={{ duration: 5 + idx, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="relative">
                <h3 className="text-[22px] font-extrabold leading-tight text-foreground">{c.title}</h3>
                <p className="mt-0.5 text-[12px] text-muted/75">{c.subtitle}</p>
              </div>

              {/* Stacked, fanned cover art. */}
              <div className="absolute inset-x-5 bottom-5">
                <div className="relative h-[150px]">
                  {c.picks.slice(0, 4).map((g, i) => (
                    <motion.img
                      key={g.id}
                      src={g.capsuleUrl || g.coverUrl}
                      alt={g.name}
                      initial={false}
                      whileHover={{ y: -6 }}
                      className="absolute h-[150px] w-[112px] rounded-xl border border-white/15 object-cover shadow-2xl"
                      style={{
                        left: `${i * 18}%`,
                        transform: `rotate(${(i - 1.5) * 4}deg)`,
                        zIndex: i,
                      }}
                    />
                  ))}
                </div>
              </div>

              <span
                className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-background"
                style={{ background: c.accent }}
              >
                <Trophy className="h-2.5 w-2.5" />
                {c.picks.length} picks
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ── 6. The Vault ────────────────────────────────────────────────────────────

type VaultFilter = "all" | "cloud" | "local";

function Vault({ games }: { games: Game[] }) {
  const [filter, setFilter] = useState<VaultFilter>("all");
  const [open, setOpen] = useState(true);

  const displayed = useMemo(() => {
    if (filter === "cloud") return games.filter((g) => g.cloudPlayable);
    if (filter === "local") return games.filter((g) => !g.cloudPlayable);
    return games;
  }, [games, filter]);

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2" style={{ color: PLUS }}>
            <Library className="h-3 w-3" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em]">The vault</span>
          </div>
          <h2 className="mt-1 text-[20px] font-bold leading-tight text-foreground">
            {compactNumber(games.length)} games to dig through
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-1 rounded-full border border-separator bg-card/70 p-1 backdrop-blur-sm">
          <VaultTab active={filter === "all"} onClick={() => setFilter("all")} label="All" />
          <VaultTab active={filter === "cloud"} onClick={() => setFilter("cloud")} label="Cloud" />
          <VaultTab active={filter === "local"} onClick={() => setFilter("local")} label="Local" />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted/70 hover:text-foreground"
            aria-label={open ? "Collapse" : "Expand"}
          >
            {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {displayed.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.4), ease: EASE }}
            >
              <GameCard game={game} width="100%" />
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}

function VaultTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all",
        active ? "bg-foreground text-background shadow" : "text-muted hover:bg-card-active hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

// ── 7. Perks — horizontal scroller ──────────────────────────────────────────

interface Perk {
  icon: typeof Cloud;
  label: string;
  title: string;
  body: string;
  accent: string;
}

const PERKS: Perk[] = [
  {
    icon: Cloud,
    label: "Cloud",
    title: "Anywhere, no install",
    body: "Stream the full vault in 4K from any device on your network — no downloads, no patch waits.",
    accent: "var(--color-cyan)",
  },
  {
    icon: Users,
    label: "Family",
    title: "Five seats, one bill",
    body: "Share Plus with up to five members of your household. Separate saves, separate libraries.",
    accent: "var(--color-green)",
  },
  {
    icon: Gift,
    label: "Monthly",
    title: "A free thing every month",
    body: "Cosmetic packs, soundtracks, and the occasional indie picked by our editors. Members only.",
    accent: "var(--color-orange)",
  },
  {
    icon: Headphones,
    label: "Audio",
    title: "Streaming soundtracks",
    body: "Composer interviews, OST drops, and a curated radio station that swaps with the catalog.",
    accent: PLUS,
  },
  {
    icon: Trophy,
    label: "Tournaments",
    title: "Member-only ladders",
    body: "Weekly tournaments with cash prize pools. No entry fee for active Plus members.",
    accent: "var(--color-red)",
  },
];

function PerksScroller() {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <div className="flex items-center gap-2" style={{ color: PLUS }}>
            <Crown className="h-3 w-3" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em]">Why members stay</span>
          </div>
          <h2 className="mt-1 text-[18px] font-bold leading-tight text-foreground">
            The stuff that isn't on the box
          </h2>
        </div>
        <Check className="h-4 w-4" style={{ color: PLUS }} />
      </div>

      <div className="shelf-scroll -mx-2 flex gap-3 overflow-x-auto px-2 pb-2">
        {PERKS.map((p, idx) => {
          const Icon = p.icon;
          return (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.04 * idx, ease: EASE }}
              whileHover={{ y: -3 }}
              className="relative w-[260px] shrink-0 overflow-hidden rounded-2xl border bg-card/60 p-5 backdrop-blur-sm"
              style={{ borderColor: `color-mix(in srgb, ${p.accent} 24%, transparent)` }}
            >
              <div
                className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl"
                style={{ background: `radial-gradient(circle, color-mix(in srgb, ${p.accent} 55%, transparent) 0%, transparent 70%)` }}
              />
              <div className="relative">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border"
                    style={{
                      borderColor: `color-mix(in srgb, ${p.accent} 30%, transparent)`,
                      background: `color-mix(in srgb, ${p.accent} 12%, transparent)`,
                    }}
                  >
                    <Icon className="h-4 w-4" style={{ color: p.accent }} />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: p.accent }}>
                    {p.label}
                  </span>
                </div>
                <h3 className="mt-3 text-[15px] font-bold leading-tight text-foreground">{p.title}</h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-muted/80">{p.body}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// ── Sticky upgrade ──────────────────────────────────────────────────────────

function StickyUpgradeChip({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-[90%] max-w-[520px] -translate-x-1/2">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.3, type: "spring", bounce: 0.35 }}
        className="flex items-center justify-between gap-4 rounded-2xl border bg-card/95 p-2 pl-5 backdrop-blur-xl"
        style={{
          borderColor: `${PLUS}55`,
          boxShadow: `0 24px 48px -16px ${PLUS}66, 0 8px 24px -8px rgba(0,0,0,0.5)`,
        }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <motion.span
            animate={{ rotate: [0, -6, 6, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-background"
            style={{ background: PLUS, boxShadow: `0 6px 16px ${PLUS}55` }}
          >
            <Crown className="h-4 w-4" />
          </motion.span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-foreground">First month, half-off.</p>
            <p className="truncate text-[11px] text-muted/80">Cancel anytime. No fine print.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onUpgrade}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl px-5 text-[13px] font-bold text-background transition-all hover:brightness-110 active:scale-95"
          style={{ background: PLUS, boxShadow: `0 8px 24px ${PLUS}77` }}
        >
          <Plus className="h-3.5 w-3.5" />
          Join
        </button>
      </motion.div>
    </div>
  );
}
