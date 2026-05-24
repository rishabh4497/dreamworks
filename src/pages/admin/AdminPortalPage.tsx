import { NavLink, Outlet, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import {
  Boxes,
  Briefcase,
  Building,
  Inbox,
  Mail,
  Package,
  Radio,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { hasPermission, type PermissionKey } from "@/lib/permissions";

interface AdminNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  matchPrefix: string;
  exact?: boolean;
  /** Optional permission key — item hidden unless the user holds it. */
  requires?: PermissionKey;
}

const NAV_ITEMS: AdminNavItem[] = [
  { to: ROUTES.admin, label: "Dashboard", icon: ShieldCheck, matchPrefix: ROUTES.admin, exact: true, requires: "admin.dashboard.read" },
  { to: ROUTES.adminSubmissions, label: "Submissions", icon: Package, matchPrefix: ROUTES.adminSubmissions, requires: "admin.submissions.read" },
  { to: ROUTES.adminApplications, label: "Applications", icon: Inbox, matchPrefix: ROUTES.adminApplications, requires: "admin.creators.review" },
  { to: ROUTES.adminApps, label: "Apps", icon: Boxes, matchPrefix: ROUTES.adminApps, requires: "admin.apps.read" },
  { to: ROUTES.adminUsers, label: "Users", icon: User, matchPrefix: ROUTES.adminUsers, requires: "admin.users.read" },
  { to: ROUTES.adminTeam, label: "Team & Access", icon: Users, matchPrefix: ROUTES.adminTeam, requires: "admin.team.manage" },
  { to: ROUTES.adminInviteCreator, label: "Invite creator", icon: Mail, matchPrefix: ROUTES.adminInviteCreator, requires: "admin.creators.invite" },
  { to: ROUTES.adminContentModeration, label: "Content", icon: ShieldAlert, matchPrefix: ROUTES.adminContentModeration, requires: "admin.moderation.access" },
  { to: ROUTES.adminPublishers, label: "Publishers", icon: Briefcase, matchPrefix: ROUTES.adminPublishers, requires: "admin.creators.write" },
  { to: ROUTES.adminStudios, label: "Studios", icon: Building, matchPrefix: ROUTES.adminStudios, requires: "admin.creators.write" },
  { to: ROUTES.adminAuditLog, label: "Audit Log", icon: ScrollText, matchPrefix: ROUTES.adminAuditLog, requires: "admin.audit.read" },
  { to: ROUTES.adminCdn, label: "CDN", icon: Radio, matchPrefix: ROUTES.adminCdn, requires: "admin.cdn.manage" },
];

export function AdminPortalPage() {
  const { pathname } = useLocation();
  const profile = useAuthStore((s) => s.profile);
  const visible = NAV_ITEMS.filter((item) =>
    !item.requires || hasPermission(profile, item.requires),
  );

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
        {visible.map((item) => {
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
