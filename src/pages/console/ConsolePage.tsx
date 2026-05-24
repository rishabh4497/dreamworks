import { motion } from "motion/react";
import {
  Activity,
  Building,
  DollarSign,
  FileBarChart2,
  LayoutDashboard,
  ShieldAlert,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConsoleTab } from "@/hooks/use-console";
import { useAuthStore } from "@/stores/auth-store";
import { hasPermission, type PermissionKey } from "@/lib/permissions";
import { ConsoleRangeSelector } from "@/components/console/ConsoleRangeSelector";
import { ConsoleCompareToggle } from "@/components/console/ConsoleCompareToggle";
import { ConsoleOverviewTab } from "./ConsoleOverviewTab";
import { ConsolePeopleTab } from "./ConsolePeopleTab";
import { ConsoleCreatorsTab } from "./ConsoleCreatorsTab";
import { ConsoleMoneyTab } from "./ConsoleMoneyTab";
import { ConsoleHealthTab } from "./ConsoleHealthTab";
import { ConsoleReportsTab } from "./ConsoleReportsTab";

interface TabDef {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Permission required to see the tab. Owner always passes. */
  requires: PermissionKey;
}

const TABS: TabDef[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, requires: "console.overview.read" },
  { id: "people", label: "People", icon: Users, requires: "console.people.users.read" },
  { id: "creators", label: "Creators", icon: Building, requires: "console.creators.studios.read" },
  { id: "money", label: "Money", icon: DollarSign, requires: "console.money.read" },
  { id: "health", label: "Health", icon: ShieldAlert, requires: "console.health.performance.read" },
  { id: "reports", label: "Reports", icon: FileBarChart2, requires: "console.reports.read" },
];

export function ConsolePage() {
  const [tab, setTab] = useConsoleTab();
  const profile = useAuthStore((s) => s.profile);
  const visibleTabs = TABS.filter((t) => hasPermission(profile, t.requires));
  // Auto-redirect off forbidden tab into first allowed.
  const allowedIds = visibleTabs.map((t) => t.id);
  if (!allowedIds.includes(tab) && visibleTabs.length > 0) {
    setTab(visibleTabs[0].id);
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="space-y-6"
    >
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted/50">
            <Activity className="h-3 w-3" />
            Admin Console
          </p>
          <h1 className="text-[24px] font-semibold tracking-tight text-foreground">
            Product observability
          </h1>
          <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-muted/65">
            God view of usage, performance, and reliability across the storefront,
            developer portal, and admin tools — captured in-house from every signed-in client.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ConsoleCompareToggle />
          <ConsoleRangeSelector />
        </div>
      </header>

      <nav className="flex flex-wrap items-center gap-1.5 rounded-xl bg-input p-1.5">
        {visibleTabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3.5 py-2 text-[12.5px] font-medium transition-all",
                active
                  ? "bg-card-active text-foreground shadow-sm"
                  : "text-muted hover:text-foreground/80 hover:bg-card-hover/50",
              )}
            >
              <t.icon className="h-3.5 w-3.5 opacity-80" />
              {t.label}
            </button>
          );
        })}
      </nav>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {tab === "overview" && <ConsoleOverviewTab />}
        {tab === "people" && <ConsolePeopleTab />}
        {tab === "creators" && <ConsoleCreatorsTab />}
        {tab === "money" && <ConsoleMoneyTab />}
        {tab === "health" && <ConsoleHealthTab />}
        {tab === "reports" && <ConsoleReportsTab />}
        {/* Legacy tab IDs from earlier URLs still routable */}
        {(tab === "users" || tab === "devices") && <ConsolePeopleTab />}
        {(tab === "studios" || tab === "publishers") && <ConsoleCreatorsTab />}
        {(tab === "performance" || tab === "errors" || tab === "quality" || tab === "features" || tab === "liveops") && (
          <ConsoleHealthTab />
        )}
      </motion.div>
    </motion.div>
  );
}
