import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  Activity,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Tag,
  TrendingUp,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { cn, formatPrice } from "@/lib/utils";
import { useGames } from "@/hooks/use-games";
import { useCompletionStats, useHoursHeatmap, useLibraryValue } from "@/hooks/use-account";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  DeadGamePredictor, TwitchImpactOverlay, DiscountEfficiencyMatrix,
  HistoricalPlayerCountReplays, RegionalPopularityGlobe, RefundReasonAnalytics,
  CompletionRateVsLength, GenreSaturationIndex, LowestPricePredictor,
  DlcAttachRateTracker
} from "@/components/features/DbFeatures";

type DbTab = "overview" | "calendar" | "account";

const TABS: Array<{ id: DbTab; label: string; icon: typeof LayoutGrid }> = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "account", label: "My Analytics", icon: Activity },
];

const TILES = [
  { to: ROUTES.dbChart("top-played"), icon: TrendingUp, title: "Top Played", desc: "Most-played games right now." },
  { to: ROUTES.dbChart("top-wishlisted"), icon: TrendingUp, title: "Top Wishlisted", desc: "What everyone wants." },
  { to: ROUTES.dbChart("trending"), icon: TrendingUp, title: "Trending", desc: "Hot this week." },
  { to: ROUTES.dbChart("recently-updated"), icon: BarChart3, title: "Recently Updated", desc: "Active development." },
  { to: ROUTES.dbChart("free"), icon: Tag, title: "Free Promotions", desc: "Free-for-a-limited-time deals." },
  { to: ROUTES.dbSales, title: "Sales Tracker", icon: Tag, desc: "Biggest current discounts." },
];

function isDbTab(value: string | null): value is DbTab {
  return value === "overview" || value === "calendar" || value === "account";
}

export function DbHomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const activeTab: DbTab = isDbTab(rawTab) ? rawTab : "overview";

  const handleTabChange = (next: DbTab) => {
    if (next === "overview") {
      setSearchParams({});
    } else {
      setSearchParams({ tab: next });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <header>
        <p className="text-[11px] uppercase tracking-widest text-muted/50 flex items-center gap-1.5">
          <BarChart3 className="h-3 w-3" /> Dreamworks DB
        </p>
        <h1 className="text-[24px] font-semibold tracking-tight text-foreground">Database</h1>
        <p className="text-[13px] text-muted/60">
          Tracking prices, player counts, depots, and patches across the catalog.
        </p>
      </header>

      <nav className="flex flex-wrap items-center gap-1.5 rounded-xl bg-input p-1.5">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-all",
                active
                  ? "bg-card-active text-foreground shadow-sm"
                  : "text-muted hover:bg-card-hover/50 hover:text-foreground/80",
              )}
            >
              <tab.icon className="h-4 w-4 opacity-80" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "calendar" && <CalendarTab />}
        {activeTab === "account" && <MyAnalyticsTab />}
      </motion.div>
    </motion.div>
  );
}

function OverviewTab() {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TILES.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="group rounded-xl border border-separator bg-card hover:bg-card-hover p-5 transition-colors"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-card-active group-hover:bg-acid/10 transition-colors">
              <t.icon className="h-4 w-4 text-foreground/70 group-hover:text-acid" />
            </div>
            <p className="text-[14px] font-semibold text-foreground">{t.title}</p>
            <p className="mt-1 text-[12px] text-muted/60">{t.desc}</p>
          </Link>
        ))}
      </div>

      <div className="mt-12 mb-6 border-t border-separator pt-8">
        <h2 className="text-[18px] font-semibold text-foreground mb-4">Advanced Analytics Hub</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <DeadGamePredictor />
          <TwitchImpactOverlay />
          <DiscountEfficiencyMatrix />
          <HistoricalPlayerCountReplays />
          <RegionalPopularityGlobe />
          <RefundReasonAnalytics />
          <CompletionRateVsLength />
          <GenreSaturationIndex />
          <LowestPricePredictor />
          <DlcAttachRateTracker />
        </div>
      </div>
    </>
  );
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function CalendarTab() {
  const [cursor, setCursor] = useState(() => new Date());
  const { data: games } = useGames();

  const events = useMemo(() => {
    const releases = (games ?? []).map((g) => ({
      type: "release" as const,
      date: new Date(g.releaseDate),
      label: g.name,
      gameId: g.id,
    }));
    const sales = (games ?? [])
      .filter((g) => g.price.discountEndsAt)
      .map((g) => ({
        type: "sale" as const,
        date: new Date(g.price.discountEndsAt!),
        label: `${g.name} sale ends`,
        gameId: g.id,
      }));
    return [...releases, ...sales].filter(
      (e) => e.date.getFullYear() === cursor.getFullYear() && e.date.getMonth() === cursor.getMonth(),
    );
  }, [games, cursor]);

  const offsetStart = startOfMonth(cursor).getDay();
  const total = daysInMonth(cursor);
  const cells: (number | null)[] = [
    ...Array.from({ length: offsetStart }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];

  const eventsByDay = new Map<number, typeof events>();
  for (const e of events) {
    const d = e.date.getDate();
    if (!eventsByDay.has(d)) eventsByDay.set(d, []);
    eventsByDay.get(d)!.push(e);
  }

  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[20px] font-semibold tracking-tight text-foreground">{monthLabel}</h2>
        <div className="flex gap-1">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="rounded-md border border-separator bg-card p-2 text-muted hover:bg-card-active"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="rounded-md border border-separator bg-card p-2 text-muted hover:bg-card-active"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-separator bg-card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-separator">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="px-2 py-2 text-[10px] uppercase tracking-widest text-muted/50">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, idx) => (
            <div
              key={idx}
              className={cn(
                "min-h-[88px] border-b border-r border-separator p-2",
                idx % 7 === 6 && "border-r-0",
              )}
            >
              {d && (
                <>
                  <p className="text-[11px] font-mono text-muted/60">{d}</p>
                  <div className="mt-1 space-y-1">
                    {(eventsByDay.get(d) ?? []).slice(0, 2).map((e, i) => (
                      <Link
                        key={i}
                        to={ROUTES.gameDetail(e.gameId)}
                        className={cn(
                          "block truncate rounded-md px-1.5 py-[2px] text-[10px] font-medium",
                          e.type === "release"
                            ? "bg-positive/15 text-positive"
                            : "bg-discount-bg/40 text-discount-fg",
                        )}
                      >
                        {e.label}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MyAnalyticsTab() {
  const value = useLibraryValue();
  const heatmap = useHoursHeatmap();
  const stats = useCompletionStats();

  if (value.isLoading || heatmap.isLoading || stats.isLoading) return <LoadingSpinner />;

  return (
    <div>
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
    </div>
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
