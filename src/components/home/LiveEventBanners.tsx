import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Flame, Gift, Sparkles, Tag, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useGames, useTopSellers } from "@/hooks/use-games";
import { ROUTES } from "@/lib/routes";
import { gameAccent } from "@/lib/game-accents";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

interface BannerProps {
  to: string;
  kicker: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  art: string | undefined;
  /** Solid accent tone — text/CTA color. */
  accent: string;
  /** Gradient classes for the colored wash behind the image. */
  gradient: string;
  index: number;
}

/**
 * Steam-style festival row — four full-stretched colorful banners that
 * promote events / sales / freebies. Each banner uses bold gradients and
 * a vivid accent so the top of the home page reads as a season opener,
 * not a database.
 */
export function LiveEventBanners() {
  const { data: games } = useGames();
  const { data: topSellers } = useTopSellers();

  const picks = useMemo(() => {
    const sale = games?.find((g) => g.price.discountPct >= 50)
      ?? games?.find((g) => g.price.discountPct > 0);
    const free = games?.find((g) => g.firstReviewersScore && g.firstReviewersScore > 80)
      ?? games?.find((g) => g.hasDemo);
    const topPick = topSellers?.[0] ?? games?.[0];
    const freshPick = games?.find((g) => {
      if (!g.releaseDate) return false;
      const ms = Date.now() - new Date(g.releaseDate).getTime();
      return ms > 0 && ms < 1000 * 60 * 60 * 24 * 120;
    }) ?? topSellers?.[1];

    return { sale, free, topPick, freshPick };
  }, [games, topSellers]);

  if (!picks.sale && !picks.free && !picks.topPick && !picks.freshPick) {
    return null;
  }

  return (
    <section className="mb-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {picks.sale && (
          <Banner
            index={0}
            to={ROUTES.dbSales}
            kicker="Big sale"
            title={`-${picks.sale.price.discountPct}% off`}
            subtitle={picks.sale.name}
            icon={Flame}
            art={picks.sale.capsuleUrl || picks.sale.headerUrl}
            accent="var(--color-red)"
            gradient="from-red/65 via-orange/40 to-orange/10"
          />
        )}
        {picks.free && (
          <Banner
            index={1}
            to={ROUTES.gameDetail(picks.free.id)}
            kicker="Free this week"
            title="Yours to keep"
            subtitle={picks.free.name}
            icon={Gift}
            art={picks.free.capsuleUrl || picks.free.headerUrl}
            accent="var(--color-green)"
            gradient="from-green/65 via-positive/40 to-cyan/15"
          />
        )}
        {picks.topPick && (
          <Banner
            index={2}
            to={ROUTES.gameDetail(picks.topPick.id)}
            kicker="#1 worldwide"
            title="What everyone's playing"
            subtitle={picks.topPick.name}
            icon={Zap}
            art={picks.topPick.capsuleUrl || picks.topPick.headerUrl}
            accent={gameAccent(picks.topPick.id) ?? "var(--color-positive)"}
            gradient="from-positive/65 via-cyan/40 to-cyan/15"
          />
        )}
        {picks.freshPick && (
          <Banner
            index={3}
            to={ROUTES.gameDetail(picks.freshPick.id)}
            kicker="Just dropped"
            title="New this season"
            subtitle={picks.freshPick.name}
            icon={Sparkles}
            art={picks.freshPick.capsuleUrl || picks.freshPick.headerUrl}
            accent="var(--color-orange)"
            gradient="from-orange/65 via-red/35 to-red/15"
          />
        )}
      </div>
    </section>
  );
}

function Banner({ to, kicker, title, subtitle, icon: Icon, art, accent, gradient, index }: BannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE, delay: 0.05 * index }}
      whileHover={{ y: -3 }}
      className="relative"
    >
      <Link
        to={to}
        className="group relative flex h-[180px] flex-col justify-between overflow-hidden rounded-2xl border border-white/10 p-4 transition-shadow hover:shadow-2xl"
        style={{ boxShadow: `0 0 0 1px ${accent}33` }}
      >
        {art && (
          <img
            src={art}
            alt={subtitle}
            className="absolute inset-0 h-full w-full object-cover opacity-55 transition-transform duration-500 group-hover:scale-110"
          />
        )}
        <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", gradient)} />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${accent}77 0%, transparent 70%)` }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 4 + index, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/85 to-transparent" />

        <div className="relative flex items-center justify-between">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-background"
            style={{ background: accent }}
          >
            <Icon className="h-2.5 w-2.5" />
            {kicker}
          </span>
          <span className="inline-flex items-center text-[11px] font-semibold text-foreground/80 transition-all group-hover:translate-x-1">
            →
          </span>
        </div>

        <div className="relative space-y-1">
          <h3 className="text-[22px] font-extrabold leading-tight text-foreground drop-shadow">
            {title}
          </h3>
          <p className="truncate text-[12px] font-medium text-foreground/85">
            {subtitle}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

/** Tiny inline icon kept for tree-shake safety — re-exported for callers. */
export const _BannerIcons = { Flame, Gift, Sparkles, Tag, Zap };
