import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { useGameDetail } from "@/hooks/use-games";
import {
  useAchievements,
  useDepots,
  useHistoricalLows,
  usePatchNotes,
  usePlayerCounts,
  usePriceHistory,
  useRegionalPrices,
  useStoreTagBreakdown,
} from "@/hooks/use-game-db";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PriceHistoryChart } from "@/components/db/PriceHistoryChart";
import { PlayerCountChart } from "@/components/db/PlayerCountChart";
import { HistoricalLowsTable } from "@/components/db/HistoricalLowsTable";
import { RegionalPricingTable } from "@/components/db/RegionalPricingTable";
import { DepotsTable } from "@/components/db/DepotsTable";
import { PatchNotesTimeline } from "@/components/db/PatchNotesTimeline";
import { AchievementRarityList } from "@/components/db/AchievementRarityList";
import { StoreTagBreakdown } from "@/components/db/StoreTagBreakdown";
import { ROUTES } from "@/lib/routes";
import { compactNumber } from "@/lib/utils";

type Range = "7d" | "30d" | "all";

export function GameDbPage() {
  const { gameId = "" } = useParams();
  const { data: detail, isLoading } = useGameDetail(gameId);
  const { data: priceHistory } = usePriceHistory(gameId);
  const { data: lows } = useHistoricalLows(gameId);
  const { data: regional } = useRegionalPrices(gameId);
  const { data: depots } = useDepots(gameId);
  const { data: patches } = usePatchNotes(gameId);
  const { data: achievements } = useAchievements(gameId);
  const { data: tagBreakdown } = useStoreTagBreakdown(gameId);
  const [range, setRange] = useState<Range>("30d");
  const { data: players } = usePlayerCounts(gameId, range);

  if (isLoading || !detail) return <LoadingSpinner label="Loading analytics…" />;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link
          to={ROUTES.gameDetail(detail.id)}
          className="rounded-md p-1.5 text-muted/60 hover:bg-input hover:text-foreground/80"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <p className="text-[11px] uppercase tracking-widest text-muted/50 flex items-center gap-1.5">
            <BarChart3 className="h-3 w-3" /> Dreamworks DB
          </p>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
            {detail.name}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Stat label="Current players" value={compactNumber(detail.currentPlayers)} />
        <Stat label="Peak 24h" value={compactNumber(detail.peakPlayers24h)} />
        <Stat label="Peak all-time" value={compactNumber(detail.peakPlayersAllTime)} />
        <Stat label="Reviews" value={`${detail.reviewSummary.scorePct}%`} sub={detail.reviewSummary.label} />
      </div>

      <Section title="Price history" subtitle="Last 365 days · USD">
        {priceHistory && <PriceHistoryChart data={priceHistory} />}
      </Section>

      {lows && (
        <Section title="Historical lows">
          <HistoricalLowsTable lows={lows} />
        </Section>
      )}

      <Section
        title="Concurrent players"
        subtitle="Peak (filled) · average (line)"
        rightSlot={
          <div className="flex items-center gap-1 rounded-lg border border-separator bg-card p-0.5">
            {(["7d", "30d", "all"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  range === r
                    ? "bg-card-active text-foreground"
                    : "text-muted/70 hover:text-foreground/80"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        }
      >
        {players && <PlayerCountChart data={players} />}
      </Section>

      {regional && (
        <Section title="Regional pricing">
          <RegionalPricingTable prices={regional} />
        </Section>
      )}

      {tagBreakdown && tagBreakdown.length > 0 && (
        <Section title="Tag breakdown">
          <StoreTagBreakdown tags={tagBreakdown} />
        </Section>
      )}

      {depots && (
        <Section title="Depots & builds">
          <DepotsTable depots={depots} />
        </Section>
      )}

      {patches && (
        <Section title="Patch notes">
          <PatchNotesTimeline notes={patches} />
        </Section>
      )}

      {achievements && (
        <Section title={`Achievements (${achievements.length})`}>
          <AchievementRarityList achievements={achievements} />
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
  rightSlot,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <header className="mb-3 flex items-baseline justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="text-[12px] text-muted/60">{subtitle}</p>}
        </div>
        {rightSlot}
      </header>
      {children}
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-separator bg-card p-3.5">
      <p className="text-[10px] uppercase tracking-widest text-muted/50">{label}</p>
      <p className="mt-1 text-[18px] font-semibold text-foreground tabular-nums">{value}</p>
      {sub && <p className="text-[11px] text-muted/60">{sub}</p>}
    </div>
  );
}
