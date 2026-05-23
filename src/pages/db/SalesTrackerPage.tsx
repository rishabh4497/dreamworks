import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useCurrentDiscounts } from "@/hooks/use-charts";
import { useGames } from "@/hooks/use-games";
import { ROUTES } from "@/lib/routes";
import { formatDate, formatPrice, relativeDate } from "@/lib/utils";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { cn } from "@/lib/utils";

export function SalesTrackerPage() {
  const [sort, setSort] = useState<"discount" | "ending">("discount");
  const { data, isLoading } = useCurrentDiscounts(sort);
  const games = useGames();

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <header className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted/50">DB · Sales</p>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">Sales Tracker</h1>
        </div>
        <div className="rounded-lg border border-separator bg-card p-0.5 flex">
          {(["discount", "ending"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors",
                sort === s
                  ? "bg-card-active text-foreground"
                  : "text-muted hover:text-foreground/80",
              )}
            >
              {s === "discount" ? "Biggest drops" : "Ending soon"}
            </button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="overflow-hidden rounded-xl border border-separator bg-card">
          <table className="w-full text-[12px]">
            <thead className="border-b border-separator text-left text-muted/60">
              <tr>
                <th className="px-4 py-2 font-medium">Game</th>
                <th className="px-4 py-2 font-medium text-right">Discount</th>
                <th className="px-4 py-2 font-medium text-right">Price</th>
                <th className="px-4 py-2 font-medium text-right">Ends</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((row) => {
                const g = (games.data ?? []).find((x) => x.id === row.gameId);
                if (!g) return null;
                return (
                  <tr key={row.gameId} className="border-b border-separator last:border-0 hover:bg-card-hover">
                    <td className="px-4 py-2">
                      <Link to={ROUTES.gameDetail(g.id)} className="flex items-center gap-3 hover:underline">
                        <img loading="lazy" decoding="async" src={g.capsuleUrl} alt="" className="h-8 w-16 rounded object-cover" />
                        <span className="text-foreground/85">{g.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span className="rounded-md bg-discount-bg px-1.5 py-[2px] text-[10px] font-bold text-discount-fg">
                        -{row.discountPct}%
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span className="text-muted/50 line-through mr-1.5">
                        {formatPrice(row.baseCents)}
                      </span>
                      <span className="text-foreground/85 font-semibold">{formatPrice(row.finalCents)}</span>
                    </td>
                    <td className="px-4 py-2 text-right text-muted/70" title={formatDate(row.endsAt)}>
                      in {relativeDate(row.endsAt).replace(" ago", "").replace("Today", "today")}
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
