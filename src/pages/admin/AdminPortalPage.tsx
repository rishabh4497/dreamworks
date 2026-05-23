import { NavLink, Outlet, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import {
  Briefcase,
  Building,
  Package,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  User,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface AdminNavItem {
  to: string;
  label: string;
  icon: typeof ShieldCheck;
  matchPrefix: string;
  exact?: boolean;
}

const NAV_ITEMS: AdminNavItem[] = [
  { to: ROUTES.admin, label: "Dashboard", icon: ShieldCheck, matchPrefix: ROUTES.admin, exact: true },
  { to: ROUTES.adminSubmissions, label: "Submissions", icon: Package, matchPrefix: ROUTES.adminSubmissions },
  { to: ROUTES.adminUsers, label: "Users", icon: User, matchPrefix: ROUTES.adminUsers },
  { to: ROUTES.adminContentModeration, label: "Content", icon: ShieldAlert, matchPrefix: ROUTES.adminContentModeration },
  { to: ROUTES.adminPublishers, label: "Publishers", icon: Briefcase, matchPrefix: ROUTES.adminPublishers },
  { to: ROUTES.adminStudios, label: "Studios", icon: Building, matchPrefix: ROUTES.adminStudios },
  { to: ROUTES.adminAuditLog, label: "Audit Log", icon: ScrollText, matchPrefix: ROUTES.adminAuditLog },
];

export function AdminPortalPage() {
  const { pathname } = useLocation();

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <header>
        <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted/50">
          <ShieldCheck className="h-3 w-3" />
          Admin Console
        </p>
        <h1 className="text-[24px] font-semibold tracking-tight text-foreground">
          Trust & operations
        </h1>
        <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-muted/65">
          Review pending submissions, manage users and creator profiles, moderate community
          content, and audit every administrative action.
        </p>
      </header>

      <nav className="flex flex-wrap items-center gap-1.5 rounded-xl bg-input p-1.5">
        {NAV_ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.matchPrefix
            : pathname === item.matchPrefix || pathname.startsWith(`${item.matchPrefix}/`);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
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
