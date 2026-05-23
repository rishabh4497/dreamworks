import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useChart } from "@/hooks/use-charts";
import { useGames } from "@/hooks/use-games";
import type { ChartType } from "@/lib/types";
import { ROUTES } from "@/lib/routes";
import { compactNumber } from "@/lib/utils";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { cn } from "@/lib/utils";

const TABS: { type: ChartType; label: string }[] = [
  { type: "top-played", label: "Top Played" },
  { type: "top-wishlisted", label: "Top Wishlisted" },
  { type: "trending", label: "Trending" },
  { type: "recently-updated", label: "Recently Updated" },
  { type: "free", label: "Free Promotions" },
];

export function TopChartsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const current = (TABS.find((t) => location.pathname.endsWith(t.type))?.type ??
    "top-played") as ChartType;
  const { data, isLoading } = useChart(current);
  const games = useGames();

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <header className="mb-5">
        <p className="text-[11px] uppercase tracking-widest text-muted/50">Charts</p>
        <h1 className="text-[22px] font-semibold tracking-tight text-foreground">Top {current.replace(/-/g, " ")}</h1>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.type}
            onClick={() => navigate(ROUTES.dbChart(t.type))}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors",
              current === t.type
                ? "bg-card-active text-foreground"
                : "border border-separator bg-card text-muted hover:bg-card-active hover:text-foreground/80",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="overflow-hidden rounded-xl border border-separator bg-card">
          <table className="w-full text-[12px]">
            <thead className="border-b border-separator text-left text-muted/60">
              <tr>
                <th className="px-4 py-2 font-medium w-12">#</th>
                <th className="px-4 py-2 font-medium">Game</th>
                <th className="px-4 py-2 font-medium text-right">Value</th>
                <th className="px-4 py-2 font-medium text-right w-24">Δ</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((entry) => {
                const g = (games.data ?? []).find((x) => x.id === entry.gameId);
                if (!g) return null;
                const delta = entry.deltaFromYesterday;
                return (
                  <tr key={entry.gameId} className="border-b border-separator last:border-0 hover:bg-card-hover">
                    <td className="px-4 py-2 text-muted/60 font-mono">{entry.rank}</td>
                    <td className="px-4 py-2">
                      <Link to={ROUTES.gameDetail(g.id)} className="flex items-center gap-3 hover:underline">
                        <img loading="lazy" decoding="async" src={g.capsuleUrl} alt="" className="h-8 w-16 rounded object-cover" />
                        <span className="text-foreground/85">{g.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-foreground/80 tabular-nums">
                      {compactNumber(entry.metric)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5",
                          delta > 0 ? "text-green" : delta < 0 ? "text-red" : "text-muted/40",
                        )}
                      >
                        {delta > 0 ? <TrendingUp className="h-3 w-3" /> : delta < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                        {Math.abs(delta)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
