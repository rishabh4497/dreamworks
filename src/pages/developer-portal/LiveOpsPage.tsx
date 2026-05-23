import { useMemo } from "react";
import { motion } from "motion/react";
import { Calendar, Megaphone, Wrench } from "lucide-react";
import { PortfolioTabLayout } from "./_shared/PortfolioTabLayout";
import { KpiCard, PortfolioKpiStrip } from "./_shared/PortfolioKpiStrip";
import { AnnouncementsCard } from "@/components/developer-portal/live-ops/AnnouncementsCard";
import { LiveEventsCard } from "@/components/developer-portal/live-ops/LiveEventsCard";
import { MaintenanceWindowCard } from "@/components/developer-portal/live-ops/MaintenanceWindowCard";
import { BranchManagerCard } from "@/components/developer-portal/live-ops/BranchManagerCard";
import { EmergencyRollbackCard } from "@/components/developer-portal/live-ops/EmergencyRollbackCard";
import { useMyApps } from "@/hooks/use-apps";
import { useAnnouncementsByApps } from "@/hooks/use-announcements";
import { useLiveEventsByApps } from "@/hooks/use-live-events";
import { isActive, isUpcoming } from "@/lib/api/live-events";

function PortfolioStrip() {
  const apps = useMyApps().data ?? [];
  const ids = useMemo(() => apps.map((a) => a.id), [apps]);
  const annQ = useAnnouncementsByApps(ids);
  const evtQ = useLiveEventsByApps(ids);

  const events = evtQ.data ?? [];
  const upcoming = events.filter((e) => isUpcoming(e)).length;
  const live = events.filter((e) => isActive(e)).length;
  const pinned = (annQ.data ?? []).filter(
    (a) => a.pinnedUntil && new Date(a.pinnedUntil).getTime() > Date.now(),
  ).length;

  return (
    <PortfolioKpiStrip>
      <KpiCard
        label="Live events"
        value={String(live)}
        caption={`${upcoming} more upcoming`}
        icon={Calendar}
        accent="green"
      />
      <KpiCard
        label="Pinned announcements"
        value={String(pinned)}
        caption={`${(annQ.data ?? []).length} total posts`}
        icon={Megaphone}
        accent="acid"
      />
      <KpiCard
        label="Maintenance windows"
        value="—"
        caption="Per-app"
        icon={Wrench}
        accent="orange"
      />
    </PortfolioKpiStrip>
  );
}

function PerApp({ appId }: { appId: string }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <AnnouncementsCard appId={appId} />
      </div>
      <LiveEventsCard appId={appId} />
      <MaintenanceWindowCard appId={appId} />
      <BranchManagerCard appId={appId} />
      <EmergencyRollbackCard appId={appId} />
    </div>
  );
}

export function LiveOpsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <PortfolioTabLayout
        title="Live Ops"
        description="Announcements, events, maintenance, branches, and one-click rollback."
        portfolio={<PortfolioStrip />}
        renderApp={(id) => <PerApp appId={id} />}
      />
    </motion.div>
  );
}
