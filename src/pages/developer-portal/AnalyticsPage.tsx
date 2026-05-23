import { motion } from "motion/react";
import { BarChart3, Coins, Heart, Star, Users } from "lucide-react";
import { PortfolioTabLayout } from "./_shared/PortfolioTabLayout";
import { KpiCard, PortfolioKpiStrip } from "./_shared/PortfolioKpiStrip";
import { PlayerActivityCard } from "@/components/developer-portal/analytics/PlayerActivityCard";
import { WishlistTrendCard } from "@/components/developer-portal/analytics/WishlistTrendCard";
import { RevenueCard } from "@/components/developer-portal/analytics/RevenueCard";
import { ReviewBreakdownCard } from "@/components/developer-portal/analytics/ReviewBreakdownCard";
import { AchievementCompletionCard } from "@/components/developer-portal/analytics/AchievementCompletionCard";
import { TelemetryScaffoldCard } from "@/components/developer-portal/analytics/TelemetryScaffoldCard";
import { useAppAnalytics, usePortfolioKpis } from "@/hooks/use-analytics";
import { compactNumber, formatPrice } from "@/lib/utils";

function PortfolioStrip() {
  const { kpis } = usePortfolioKpis();
  return (
    <PortfolioKpiStrip>
      <KpiCard
        label="Apps"
        value={String(kpis.totalApps)}
        icon={BarChart3}
        accent="acid"
      />
      <KpiCard
        label="Wishlists"
        value={compactNumber(kpis.totalWishlists)}
        icon={Heart}
        accent="acid"
      />
      <KpiCard
        label="Revenue"
        value={formatPrice(kpis.totalRevenueCents)}
        caption="Lifetime, net of refunds"
        icon={Coins}
        accent="green"
      />
      <KpiCard
        label="Current players"
        value={compactNumber(kpis.totalCurrentPlayers)}
        icon={Users}
        accent="green"
      />
      <KpiCard
        label="Avg review score"
        value={kpis.avgReviewScore ? `${kpis.avgReviewScore}%` : "—"}
        icon={Star}
        accent="cyan"
      />
    </PortfolioKpiStrip>
  );
}

function PerApp({ appId }: { appId: string }) {
  const a = useAppAnalytics(appId);
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <PlayerActivityCard detail={a.detail} />
      <WishlistTrendCard data={a.wishlistTrend} />
      <RevenueCard data={a.revenueTrend} totalCents={a.totalRevenueCents} />
      <ReviewBreakdownCard rows={a.reviewBreakdown} />
      <div className="lg:col-span-2">
        <AchievementCompletionCard rows={a.achievementRows} />
      </div>
      <div className="lg:col-span-2">
        <TelemetryScaffoldCard />
      </div>
    </div>
  );
}

export function AnalyticsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <PortfolioTabLayout
        title="Analytics"
        description="Wishlist, player, revenue, and review health across your portfolio and per app."
        portfolio={<PortfolioStrip />}
        renderApp={(id) => <PerApp appId={id} />}
      />
    </motion.div>
  );
}
