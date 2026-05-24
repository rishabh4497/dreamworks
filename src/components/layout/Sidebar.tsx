import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Globe,
  Home,
  Library,
  LineChart,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
  Store,
  Tag,
  TrendingUp,
  Puzzle,
  Download,
  Package,
  Play,
  Sparkles,
} from "lucide-react";
const logoSrc = "/internal-logo.png";
import { cn } from "@/lib/utils";
import { ROUTES, DESKTOP_ONLY_ROUTES } from "@/lib/routes";
import { useAuthStore } from "@/stores/auth-store";
import { hasPermission } from "@/lib/permissions";
import { useLibraryStore } from "@/stores/library-store";
import { useUiStore } from "@/stores/ui-store";
import { usePlatform } from "@/hooks/use-platform";
import { useTranslation } from "@/lib/i18n";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import { DownloadsQueue } from "./DownloadsQueue";
import { useDownloadStore } from "@/stores/download-store";
import { useStartDownload } from "@/hooks/use-start-download";
import { toast } from "@/stores/toast-store";

type NavItem = {
  to: string;
  label: string;
  icon: typeof Home;
  badge?: number;
};

const GROUP_LABEL = "text-[10px] font-semibold uppercase tracking-widest text-muted/35 px-3 mt-4 mb-1.5";

export function Sidebar() {
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const installedCount = useLibraryStore((s) =>
    s.entries.filter((e) => e.installed).length,
  );
  const compactMode = useUiStore((s) => s.settings.compactMode);
  const location = useLocation();
  const { isDesktop } = usePlatform();
  const { t } = useTranslation();

  const storeNav: NavItem[] = [
    { to: ROUTES.store, label: t("Home"), icon: Home },
    { to: ROUTES.storeSearch, label: t("Search"), icon: Search },
    { to: ROUTES.plus, label: t("Dreamworks+"), icon: Sparkles },
    { to: ROUTES.workshop, label: t("Workshop"), icon: Puzzle },
    { to: ROUTES.feed, label: t("Feed"), icon: Globe },
  ];

  const role = profile?.role;
  // Creators (external studios + publishers) and admins see the developer portal.
  // Internal `developer` (employees) do NOT — that role is for app maintainers.
  const isCreator =
    role === "creator-developer" ||
    role === "creator-publisher" ||
    role === "admin";
  const isUserOnly = role === "user";
  const devNav: NavItem[] = isCreator
    ? [{ to: ROUTES.developerPortal, label: t("Developer Portal"), icon: Package }]
    : [];

  const canSeeAdmin = hasPermission(profile, "admin.access");
  const canSeeConsole = hasPermission(profile, "console.access");
  const adminNav: NavItem[] = [];
  if (canSeeAdmin) adminNav.push({ to: ROUTES.admin, label: t("Admin Panel"), icon: ShieldCheck });
  if (canSeeConsole) adminNav.push({ to: ROUTES.console, label: t("Console"), icon: LineChart });

  // Library lives in the sidebar (desktop-only); downloads/wishlist/cart/profile
  // are reached from the top header.
  const libraryNav: NavItem[] = filterByPlatform(
    [{ to: ROUTES.library, label: t("Library"), icon: Library, badge: installedCount }],
    isDesktop,
  );

  // Calendar and My Analytics are tabs inside the DB Overview page.
  const dbNav: NavItem[] = [
    { to: ROUTES.db, label: t("Overview"), icon: BarChart3 },
    { to: ROUTES.dbChart("top-played"), label: t("Top Charts"), icon: TrendingUp },
    { to: ROUTES.dbSales, label: t("Sales Tracker"), icon: Tag },
  ];

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col bg-transparent transition-[width] duration-200",
        compactMode ? "w-16" : "w-56",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2.5",
          compactMode ? "justify-center px-2 pt-6 pb-5" : "px-5 pt-6 pb-5",
        )}
      >
        <img loading="lazy" decoding="async" src={logoSrc} alt="Dreamworks" className="h-7 w-7 rounded-lg" />
        {!compactMode && (
          <span className="text-[13px] font-semibold text-foreground/90 tracking-tight">
            Dreamworks
          </span>
        )}
      </div>

      <nav className={cn("flex-1 overflow-y-auto pb-3", compactMode ? "px-2" : "px-3")}>
        {!compactMode && <p className={GROUP_LABEL}>{t("Store")}</p>}
        {compactMode && <div className="mt-4 mb-1.5" />}
        <NavGroup items={storeNav} currentPath={location.pathname} compactMode={compactMode} />

        {libraryNav.length > 0 && (
          <>
            <div className="mt-4 mb-1.5" />
            <NavGroup items={libraryNav} currentPath={location.pathname} compactMode={compactMode} />
          </>
        )}

        {!compactMode && <p className={GROUP_LABEL}>{t("Analytics")}</p>}
        {compactMode && <div className="mt-4 mb-1.5" />}
        <NavGroup
          items={dbNav}
          currentPath={location.pathname}
          matchPrefix="/db"
          compactMode={compactMode}
        />

        {adminNav.length > 0 && (
          <>
            {!compactMode && <p className={GROUP_LABEL}>{t("Admin")}</p>}
            {compactMode && <div className="mt-4 mb-1.5" />}
            <NavGroup
              items={adminNav}
              currentPath={location.pathname}
              matchPrefix="/admin"
              compactMode={compactMode}
            />
          </>
        )}

        {devNav.length > 0 && (
          <>
            {!compactMode && <p className={GROUP_LABEL}>{t("Developer")}</p>}
            {compactMode && <div className="mt-4 mb-1.5" />}
            <NavGroup items={devNav} currentPath={location.pathname} compactMode={compactMode} />
          </>
        )}

        {isUserOnly && (
          <>
            {!compactMode && <p className={GROUP_LABEL}>{t("More")}</p>}
            {compactMode && <div className="mt-4 mb-1.5" />}
            <NavGroup
              items={[
                { to: ROUTES.applyCreator, label: t("Sell on Dreamworks"), icon: Store },
              ]}
              currentPath={location.pathname}
              compactMode={compactMode}
            />
          </>
        )}

        {isDesktop && (
          <div className="mt-4 pt-3">
            <NavGroup
              items={[
                { to: ROUTES.diagnostics, label: t("Diagnostics"), icon: Activity },
                { to: ROUTES.settings, label: t("Settings"), icon: Settings },
              ]}
              currentPath={location.pathname}
              compactMode={compactMode}
            />
          </div>
        )}
      </nav>

      {isDesktop && (
        <div className={cn("pb-3 pt-3", compactMode ? "px-2" : "px-3")}>
          <DreamsEngineWidget compactMode={compactMode} />
        </div>
      )}

      {isDesktop && <DownloadsQueue />}

      {profile && (
        <div className={cn("py-3", compactMode ? "px-2" : "px-3")}>
          <div
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2 py-1.5",
              compactMode && "justify-center px-1",
            )}
          >
            {profile.avatarOptions ? (
              <UserAvatar
                options={profile.avatarOptions}
                size={28}
                className="rounded-full bg-card-active"
              />
            ) : (
              <img
                src={profile.avatarUrl}
                alt=""
                className="h-7 w-7 rounded-full bg-card-active object-cover"
              />
            )}
            {!compactMode && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[12px] font-medium text-foreground/80">
                    {profile.displayName}
                  </p>
                  <p className="truncate text-[11px] text-muted/70">{profile.email}</p>
                </div>
                <button
                  onClick={() => void signOut()}
                  className="rounded-md p-1 text-muted/50 hover:bg-input hover:text-foreground/60 transition-all"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}

function filterByPlatform(items: NavItem[], isDesktop: boolean): NavItem[] {
  if (isDesktop) return items;
  return items.filter((item) => !DESKTOP_ONLY_ROUTES.has(item.to));
}

function NavGroup({
  items,
  currentPath,
  matchPrefix,
  compactMode,
}: {
  items: NavItem[];
  currentPath: string;
  matchPrefix?: string;
  compactMode?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item) => {
        let isActive: boolean;
        if (matchPrefix === "/db" && item.to.startsWith("/db/charts")) {
          isActive = currentPath.startsWith("/db/charts");
        } else if (matchPrefix && item.to !== matchPrefix && item.to.startsWith(matchPrefix)) {
          isActive = currentPath === item.to || currentPath.startsWith(`${item.to}/`);
        } else {
          isActive = currentPath === item.to;
        }
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/store" || item.to === "/db" || item.to === "/profile"}
            title={compactMode ? item.label : undefined}
            className={({ isActive: rrIsActive }) =>
              cn(
                "flex items-center rounded-lg text-[13px] font-medium transition-all duration-150",
                compactMode ? "justify-center px-2 py-2" : "gap-2.5 px-3 py-[7px]",
                rrIsActive || isActive
                  ? "bg-card-active text-foreground shadow-[inset_0_0.5px_0_rgba(255,255,255,0.06)]"
                  : "text-muted hover:bg-input hover:text-foreground/80",
              )
            }
          >
            <item.icon className="h-[15px] w-[15px] opacity-70" />
            {!compactMode && (
              <>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-card-active px-1 text-[10px] font-bold text-foreground/80">
                    {item.badge}
                  </span>
                )}
              </>
            )}
            {compactMode && item.badge !== undefined && item.badge > 0 && (
              <span className="ml-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-acid" aria-hidden />
            )}
          </NavLink>
        );
      })}
    </div>
  );
}

function DreamsEngineWidget({ compactMode }: { compactMode?: boolean }) {
  const navigate = useNavigate();
  const startDownload = useStartDownload();
  const tasks = useDownloadStore((s) => s.tasks);

  const engineTask = tasks.find((t) => t.gameId === "Dreams Engine");

  const handleAction = () => {
    if (!engineTask || engineTask.status === "cancelled" || engineTask.status === "error") {
      startDownload("Dreams Engine", 4_500_000_000, { silent: true });
      toast.success("Starting Dreams Engine download...");
      navigate(ROUTES.downloads);
    } else if (engineTask.status === "complete") {
      toast.success("Launching Dreams Engine...");
    } else {
      navigate(ROUTES.downloads);
    }
  };

  const isDownloading = engineTask && ["downloading", "verifying", "extracting", "queued"].includes(engineTask.status);
  const isComplete = engineTask && engineTask.status === "complete";
  const progress = engineTask ? Math.round(engineTask.progress * 100) : 0;

  return (
    <button
      onClick={handleAction}
      title={compactMode ? "Dreams Engine" : undefined}
      className={cn(
        "relative flex items-center justify-center font-bold transition-all shadow-md overflow-hidden",
        compactMode
          ? "h-9 w-9 mx-auto rounded-full"
          : "w-full gap-2 rounded-full h-9 text-[12.5px]",
        isComplete
          ? "bg-gradient-to-b from-price to-price/85 text-background shadow-price/20 hover:brightness-110 active:brightness-95 cursor-pointer"
          : isDownloading
          ? "bg-card-active text-muted cursor-pointer hover:bg-card-hover"
          : "bg-gradient-to-b from-cyan to-cyan/85 text-background shadow-cyan/20 hover:brightness-110 active:brightness-95 cursor-pointer"
      )}
    >
      {isDownloading && !compactMode && (
        <div
          className="absolute inset-y-0 left-0 bg-cyan/15 transition-all duration-300 pointer-events-none"
          style={{ width: `${progress}%` }}
        />
      )}
      <div className="relative z-10 flex items-center gap-1.5 justify-center">
        {isComplete ? (
          <>
            <Play className="h-3.5 w-3.5" fill="currentColor" />
            {!compactMode && <span>Dreams Engine</span>}
          </>
        ) : isDownloading ? (
          <>
            <div className="h-3 w-3 rounded-full border-2 border-muted/30 border-t-muted animate-spin" />
            {!compactMode && <span>Dreams Engine ({progress}%)</span>}
          </>
        ) : (
          <>
            <Download className="h-3.5 w-3.5" />
            {!compactMode && <span>Dreams Engine</span>}
          </>
        )}
      </div>
    </button>
  );
}
