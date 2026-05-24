import { motion } from "motion/react";
import {
  Activity,
  AlertOctagon,
  Briefcase,
  Building,
  DollarSign,
  FileBarChart2,
  Gauge,
  LayoutDashboard,
  Monitor,
  MousePointerClick,
  Radio,
  ShieldAlert,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConsoleTab } from "@/hooks/use-console";
import { ConsoleRangeSelector } from "@/components/console/ConsoleRangeSelector";
import { ConsoleCompareToggle } from "@/components/console/ConsoleCompareToggle";
import { ConsoleOverviewTab } from "./ConsoleOverviewTab";
import { ConsoleUsersTab } from "./ConsoleUsersTab";
import { ConsoleStudiosTab } from "./ConsoleStudiosTab";
import { ConsolePublishersTab } from "./ConsolePublishersTab";
import { ConsoleDevicesTab } from "./ConsoleDevicesTab";
import { ConsolePerformanceTab } from "./ConsolePerformanceTab";
import { ConsoleFeaturesTab } from "./ConsoleFeaturesTab";
import { ConsoleErrorsTab } from "./ConsoleErrorsTab";
import { ConsoleMoneyTab } from "./ConsoleMoneyTab";
import { ConsoleQualityTab } from "./ConsoleQualityTab";
import { ConsoleLiveOpsTab } from "./ConsoleLiveOpsTab";
import { ConsoleReportsTab } from "./ConsoleReportsTab";

interface TabDef {
  id: string;
  label: string;
  icon: LucideIcon;
}

const TABS: TabDef[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "studios", label: "Studios", icon: Building },
  { id: "publishers", label: "Publishers", icon: Briefcase },
  { id: "money", label: "Money", icon: DollarSign },
  { id: "devices", label: "Devices & rigs", icon: Monitor },
  { id: "performance", label: "Performance", icon: Gauge },
  { id: "features", label: "Features", icon: MousePointerClick },
  { id: "quality", label: "Quality", icon: ShieldAlert },
  { id: "errors", label: "Errors", icon: AlertOctagon },
  { id: "liveops", label: "Live ops", icon: Radio },
  { id: "reports", label: "Reports", icon: FileBarChart2 },
];

export function ConsolePage() {
  const [tab, setTab] = useConsoleTab();
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
        {TABS.map((t) => {
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
        {tab === "users" && <ConsoleUsersTab />}
        {tab === "studios" && <ConsoleStudiosTab />}
        {tab === "publishers" && <ConsolePublishersTab />}
        {tab === "money" && <ConsoleMoneyTab />}
        {tab === "devices" && <ConsoleDevicesTab />}
        {tab === "performance" && <ConsolePerformanceTab />}
        {tab === "features" && <ConsoleFeaturesTab />}
        {tab === "quality" && <ConsoleQualityTab />}
        {tab === "errors" && <ConsoleErrorsTab />}
        {tab === "liveops" && <ConsoleLiveOpsTab />}
        {tab === "reports" && <ConsoleReportsTab />}
      </motion.div>
    </motion.div>
  );
}
