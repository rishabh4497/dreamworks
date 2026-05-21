import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Gift } from "lucide-react";
import { useGames } from "@/hooks/use-games";
import { ROUTES } from "@/lib/routes";
import { formatDate } from "@/lib/utils";
import type { Game } from "@/lib/types";

/**
 * Decorative "free this week" banner inspired by Epic Games's weekly giveaway
 * slot. Picks a high-quality indie deterministically and links to its detail
 * page — there's no real claim flow.
 */
export function WeeklyFreeGame() {
  const { data: games } = useGames();

  const pick = useMemo<Game | undefined>(() => {
    if (!games || games.length === 0) return undefined;
    // Prefer high firstReviewers score (a quality signal we already surface on
    // the Hidden Gems shelf), falling back to a low-rank game.
    const goodIndies = games
      .filter((g) => (g.firstReviewersScore ?? 0) > 80)
      .sort((a, b) => (b.firstReviewersScore ?? 0) - (a.firstReviewersScore ?? 0));
    if (goodIndies.length > 0) return goodIndies[0];
    return games
      .slice()
      .sort((a, b) => b.salesRank - a.salesRank)[0];
  }, [games]);

  if (!pick) return null;

  const claimBy = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  return (
    <section className="mb-10">
      <Link
        to={ROUTES.gameDetail(pick.id)}
        className="group relative block h-48 overflow-hidden rounded-2xl border border-separator bg-card md:h-56"
      >
        <img
          src={pick.headerUrl}
          alt={pick.name}
          className="absolute inset-0 h-full w-full object-cover opacity-50 transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-acid/25 via-background/40 to-positive/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />

        <div className="relative flex h-full flex-col justify-between p-6 md:flex-row md:items-center md:p-8">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-acid">
              <Gift className="h-3.5 w-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-widest">
                Free this week
              </span>
            </div>
            <h2 className="text-[22px] font-bold leading-tight text-foreground md:text-[26px]">
              {pick.name}
            </h2>
            <p className="text-[12px] text-muted/70">
              Claim before {formatDate(claimBy)}
            </p>
          </div>

          <div className="mt-4 md:mt-0">
            <span className="inline-flex items-center gap-1 rounded-lg bg-acid px-4 py-2 text-[12px] font-semibold text-background transition-all group-hover:brightness-110">
              Get game →
            </span>
          </div>
        </div>
      </Link>
    </section>
  );
}
