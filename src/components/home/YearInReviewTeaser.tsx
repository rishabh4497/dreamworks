import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useLibraryStore } from "@/stores/library-store";
import { useLibraryValue } from "@/hooks/use-account";
import { ROUTES } from "@/lib/routes";
import { formatPrice } from "@/lib/utils";

/**
 * Spotify Wrapped-style yearly recap tile that lives inside BentoGrid. Pulls
 * total playtime from `useLibraryStore` and total spent + games-owned from
 * `useLibraryValue`. Clicking jumps to the profile where the full Spend
 * & Hours dashboard lives.
 */
export function YearInReviewTeaser() {
  const entries = useLibraryStore((s) => s.entries);
  const { data: value } = useLibraryValue();

  const totalHours = useMemo(() => {
    const minutes = entries.reduce((acc, e) => acc + (e.playMinutes ?? 0), 0);
    return Math.round(minutes / 60);
  }, [entries]);

  const spentLabel = value
    ? formatPrice(value.totalSpentCents, "INR")
    : null;
  const ownedCount = value?.gamesOwned ?? entries.length;
  const year = new Date().getFullYear();

  return (
    <Link
      to={ROUTES.profile}
      className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-separator bg-gradient-to-br from-acid via-positive to-cyan p-5 text-background transition-all hover:brightness-110"
    >
      {/* Decorative Wrapped-style blur blobs. */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-10 h-44 w-44 rounded-full bg-background/30 blur-3xl" />

      <div className="relative flex items-start justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-background/80">
          Your {year} in games
        </span>
        <Sparkles className="h-4 w-4 text-background/90" />
      </div>

      <div className="relative mt-2 flex flex-col gap-1">
        <p className="text-[40px] font-bold leading-none tracking-tight">
          {totalHours.toLocaleString()} hrs
        </p>
        <p className="text-[12px] font-medium text-background/85">
          {spentLabel ? `${spentLabel} spent` : "Library activity"} ·{" "}
          {ownedCount} {ownedCount === 1 ? "game" : "games"}
        </p>
        <p className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-background/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-background transition-all group-hover:bg-background/30">
          See your year →
        </p>
      </div>
    </Link>
  );
}
