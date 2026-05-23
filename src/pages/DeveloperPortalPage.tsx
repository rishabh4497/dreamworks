import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import {
  Package,
  Building,
  BarChart3,
  Megaphone,
  Globe2,
  ShieldAlert,
  Briefcase,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { migrateLegacyDeveloperData } from "@/lib/api/developer-portal-migrate";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: ROUTES.devApps, label: "Apps", icon: Package, matchPrefix: "/developer-portal/apps" },
  { to: ROUTES.devStudio, label: "Studio", icon: Building, matchPrefix: ROUTES.devStudio },
  { to: ROUTES.devPublisher, label: "Publisher", icon: Briefcase, matchPrefix: ROUTES.devPublisher },
  { to: ROUTES.devAnalytics, label: "Analytics", icon: BarChart3, matchPrefix: ROUTES.devAnalytics },
  { to: ROUTES.devMarketing, label: "Marketing", icon: Megaphone, matchPrefix: ROUTES.devMarketing },
  { to: ROUTES.devOps, label: "Live Ops", icon: Globe2, matchPrefix: ROUTES.devOps },
  { to: ROUTES.devModeration, label: "Moderation", icon: ShieldAlert, matchPrefix: ROUTES.devModeration },
] as const;

export function DeveloperPortalPage() {
  const { pathname } = useLocation();

  useEffect(() => {
    void migrateLegacyDeveloperData();
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <header>
        <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted/50">
          <Package className="h-3 w-3" />
          Developer Portal
        </p>
        <h1 className="text-[24px] font-semibold tracking-tight text-foreground">
          Steamworks-style admin
        </h1>
        <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-muted/65">
          Manage your studio, your publisher imprint, every game you ship, and the live-ops tooling
          that keeps them running.
        </p>
      </header>

      <nav className="flex flex-wrap items-center gap-1.5 rounded-xl bg-input p-1.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.matchPrefix);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-all",
                active
                  ? "bg-card-active text-foreground shadow-sm"
                  : "text-muted hover:text-foreground/80 hover:bg-card-hover/50",
              )}
            >
              <item.icon className="h-4 w-4 opacity-80" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <Outlet />
    </motion.div>
  );
}
