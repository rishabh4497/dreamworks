import { useMemo } from "react";
import { motion } from "motion/react";
import { KeyRound, MessageCircle, Tag } from "lucide-react";
import { PortfolioTabLayout } from "./_shared/PortfolioTabLayout";
import { KpiCard, PortfolioKpiStrip } from "./_shared/PortfolioKpiStrip";
import { PromoCampaignsCard } from "@/components/developer-portal/marketing/PromoCampaignsCard";
import { PromoKeysCard } from "@/components/developer-portal/marketing/PromoKeysCard";
import { PressKitCard } from "@/components/developer-portal/marketing/PressKitCard";
import { SocialDraftsCard } from "@/components/developer-portal/marketing/SocialDraftsCard";
import { WishlistFunnelCard } from "@/components/developer-portal/marketing/WishlistFunnelCard";
import { useMyApps } from "@/hooks/use-apps";
import { usePromoCampaignsByApps } from "@/hooks/use-promo-campaigns";
import { usePromoKeysByApps } from "@/hooks/use-promo-keys";

function PortfolioStrip() {
  const apps = useMyApps().data ?? [];
  const ids = useMemo(() => apps.map((a) => a.id), [apps]);
  const campaigns = usePromoCampaignsByApps(ids);
  const keys = usePromoKeysByApps(ids);

  const activeCampaigns = (campaigns.data ?? []).filter((c) => c.status === "active").length;
  const totalKeys = (keys.data ?? []).length;
  const issuedKeys = (keys.data ?? []).filter((k) => k.status === "issued").length;

  return (
    <PortfolioKpiStrip>
      <KpiCard
        label="Active campaigns"
        value={String(activeCampaigns)}
        caption={`${(campaigns.data ?? []).length} total across portfolio`}
        icon={Tag}
        accent="green"
      />
      <KpiCard
        label="Keys outstanding"
        value={String(issuedKeys)}
        caption={`${totalKeys} issued lifetime`}
        icon={KeyRound}
        accent="orange"
      />
      <KpiCard
        label="Drafts"
        value="—"
        caption="Per-app social drafts"
        icon={MessageCircle}
        accent="cyan"
      />
    </PortfolioKpiStrip>
  );
}

function PerApp({ appId }: { appId: string }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <PromoCampaignsCard appId={appId} />
      <WishlistFunnelCard appId={appId} />
      <div className="lg:col-span-2">
        <PromoKeysCard appId={appId} />
      </div>
      <SocialDraftsCard appId={appId} />
      <PressKitCard appId={appId} />
    </div>
  );
}

export function MarketingPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <PortfolioTabLayout
        title="Marketing"
        description="Promos, keys, social posts, and press assets for every app you ship."
        portfolio={<PortfolioStrip />}
        renderApp={(id) => <PerApp appId={id} />}
      />
    </motion.div>
  );
}
