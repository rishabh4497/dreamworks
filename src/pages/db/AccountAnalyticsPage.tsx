import { motion } from "motion/react";
import { useCompletionStats, useHoursHeatmap, useLibraryValue } from "@/hooks/use-account";
import { formatPrice } from "@/lib/utils";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export function AccountAnalyticsPage() {
  const value = useLibraryValue();
  const heatmap = useHoursHeatmap();
  const stats = useCompletionStats();

  if (value.isLoading || heatmap.isLoading || stats.isLoading) return <LoadingSpinner />;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <header className="mb-6">
        <p className="text-[11px] uppercase tracking-widest text-muted/50">DB · You</p>
        <h1 className="text-[22px] font-semibold tracking-tight text-foreground">My Analytics</h1>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Stat label="Library value" value={value.data ? formatPrice(value.data.currentRetailCents) : "—"} />
        <Stat
          label="Total spent"
          value={value.data ? formatPrice(value.data.totalSpentCents) : "—"}
        />
        <Stat
          label="Games owned"
          value={value.data ? value.data.gamesOwned.toString() : "—"}
        />
        <Stat
          label="Unplayed"
          value={value.data ? `${value.data.unplayedCount} · ${formatPrice(value.data.unplayedValueCents)}` : "—"}
        />
      </div>

      <section className="mb-8">
        <h2 className="text-[16px] font-semibold text-foreground mb-3">Hours heatmap (last 12 months)</h2>
        <Heatmap />
      </section>

      <section>
        <h2 className="text-[16px] font-semibold text-foreground mb-3">Completion</h2>
        <div className="rounded-xl border border-separator bg-card p-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted/50">Achievements</p>
            <p className="text-[20px] font-semibold text-foreground">
              {stats.data?.achievementsUnlocked} / {stats.data?.achievementsTotal}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted/50">Perfect games</p>
            <p className="text-[20px] font-semibold text-foreground">{stats.data?.perfectGames}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted/50">Avg completion</p>
            <p className="text-[20px] font-semibold text-foreground">
              {stats.data?.averageCompletionPct}%
            </p>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-separator bg-card p-4">
      <p className="text-[10px] uppercase tracking-widest text-muted/50">{label}</p>
      <p className="mt-1 text-[18px] font-semibold text-foreground tabular-nums">{value}</p>
    </div>
  );
}

function Heatmap() {
  const heatmap = useHoursHeatmap();
  if (!heatmap.data) return null;
  // Bucket into 52 weeks x 7 days
  const weeks: { date: string; minutesPlayed: number }[][] = [];
  for (let i = 0; i < heatmap.data.length; i += 7) {
    weeks.push(heatmap.data.slice(i, i + 7));
  }
  const max = Math.max(...heatmap.data.map((c) => c.minutesPlayed), 1);
  return (
    <div className="rounded-xl border border-separator bg-card p-4 overflow-x-auto">
      <div className="flex gap-[3px]">
        {weeks.map((w, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {w.map((c) => {
              const level = c.minutesPlayed === 0 ? 0 : Math.min(4, Math.ceil((c.minutesPlayed / max) * 4));
              const opacity = level === 0 ? 0.04 : 0.15 + level * 0.18;
              return (
                <div
                  key={c.date}
                  title={`${c.date} · ${c.minutesPlayed}m`}
                  className="h-[12px] w-[12px] rounded-[2px]"
                  style={{ background: `rgba(102, 192, 244, ${opacity})` }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
