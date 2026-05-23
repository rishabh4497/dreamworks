import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Calendar,
  Globe,
  Heart,
  Home,
  Library,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Tag,
  TrendingUp,
  User,
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
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useLibraryStore } from "@/stores/library-store";
import { usePlatform } from "@/hooks/use-platform";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import { DownloadsQueue } from "./DownloadsQueue";
import { useDownloadStore } from "@/stores/download-store";
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
  const cartCount = useCartStore((s) => s.items.length);
  const wishlistCount = useWishlistStore((s) => s.entries.length);
  const activeDownloads = useDownloadStore((s) => s.activeCount);
  const installedCount = useLibraryStore((s) =>
    s.entries.filter((e) => e.installed).length,
  );
  const location = useLocation();
  const { isDesktop } = usePlatform();

  const storeNav: NavItem[] = [
    { to: ROUTES.store, label: "Home", icon: Home },
    { to: ROUTES.storeSearch, label: "Search", icon: Search },
    { to: ROUTES.plus, label: "Dreamworks+", icon: Sparkles },
    { to: ROUTES.feed, label: "Feed", icon: Globe },
    { to: ROUTES.workshop, label: "Workshop", icon: Puzzle },
  ];

  const devNav: NavItem[] = [
    { to: ROUTES.developerPortal, label: "Developer Portal", icon: Package },
  ];

  const isAdmin = profile?.role === "admin";
  const adminNav: NavItem[] = [
    { to: ROUTES.admin, label: "Admin Panel", icon: ShieldCheck },
  ];

  // Steam parity: the full Library experience and download queue are
  // desktop-only. Web users still have wishlist, cart, and profile.
  const youNav: NavItem[] = filterByPlatform(
    [
      { to: ROUTES.library, label: "Library", icon: Library, badge: installedCount },
      { to: ROUTES.downloads, label: "Downloads", icon: Download, badge: activeDownloads },
      { to: ROUTES.wishlist, label: "Wishlist", icon: Heart, badge: wishlistCount },
      { to: ROUTES.cart, label: "Cart", icon: ShoppingCart, badge: cartCount },
      { to: ROUTES.profile, label: "Profile", icon: User },
    ],
    isDesktop,
  );

  const dbNav: NavItem[] = [
    { to: ROUTES.db, label: "Overview", icon: BarChart3 },
    { to: ROUTES.dbChart("top-played"), label: "Top Charts", icon: TrendingUp },
    { to: ROUTES.dbSales, label: "Sales Tracker", icon: Tag },
    { to: ROUTES.dbCalendar, label: "Calendar", icon: Calendar },
    { to: ROUTES.dbAccount, label: "My Analytics", icon: Activity },
  ];

  return (
    <aside className="flex w-56 shrink-0 flex-col bg-transparent">
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-5">
        <img src={logoSrc} alt="Dreamworks" className="h-7 w-7 rounded-lg" />
        <span className="text-[13px] font-semibold text-foreground/90 tracking-tight">
          Dreamworks
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-3">
        <p className={GROUP_LABEL}>Store</p>
        <NavGroup items={storeNav} currentPath={location.pathname} />

        <p className={GROUP_LABEL}>You</p>
        <NavGroup items={youNav} currentPath={location.pathname} />

        <p className={GROUP_LABEL}>Analytics</p>
        <NavGroup items={dbNav} currentPath={location.pathname} matchPrefix="/db" />

        {isAdmin && (
          <>
            <p className={GROUP_LABEL}>Admin</p>
            <NavGroup items={adminNav} currentPath={location.pathname} matchPrefix="/admin" />
          </>
        )}

        <p className={GROUP_LABEL}>Developer</p>
        <NavGroup items={devNav} currentPath={location.pathname} />

        {isDesktop && (
          <div className="mt-4 pt-3">
            <NavGroup
              items={[
                { to: ROUTES.diagnostics, label: "Diagnostics", icon: Activity },
                { to: ROUTES.settings, label: "Settings", icon: Settings },
              ]}
              currentPath={location.pathname}
            />
          </div>
        )}
      </nav>

      {isDesktop && (
        <div className="px-3 pb-3 pt-3">
          <DreamsEngineWidget />
        </div>
      )}

      {isDesktop && <DownloadsQueue />}

      {profile && (
        <div className="px-3 py-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
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
}: {
  items: NavItem[];
  currentPath: string;
  matchPrefix?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item) => {
        let isActive: boolean;
        if (matchPrefix === "/db" && item.label === "Top Charts") {
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
            className={({ isActive: rrIsActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13px] font-medium transition-all duration-150",
                rrIsActive || isActive
                  ? "bg-card-active text-foreground shadow-[inset_0_0.5px_0_rgba(255,255,255,0.06)]"
                  : "text-muted hover:bg-input hover:text-foreground/80",
              )
            }
          >
            <item.icon className="h-[15px] w-[15px] opacity-70" />
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-card-active px-1 text-[10px] font-bold text-foreground/80">
                {item.badge}
              </span>
            )}
          </NavLink>
        );
      })}
    </div>
  );
}

function DreamsEngineWidget() {
  const navigate = useNavigate();
  const startDownload = useDownloadStore((s) => s.start);
  const tasks = useDownloadStore((s) => s.tasks);
  
  const engineTask = tasks.find((t) => t.gameId === "Dreams Engine");
  
  const handleAction = () => {
    if (!engineTask || engineTask.status === "cancelled" || engineTask.status === "error") {
      startDownload("Dreams Engine", 4_500_000_000);
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
      className={cn(
        "relative w-full flex items-center justify-center gap-2 rounded-full h-9 text-[12.5px] font-bold transition-all shadow-md overflow-hidden",
        isComplete
          ? "bg-gradient-to-b from-price to-price/85 text-background shadow-price/20 hover:brightness-110 active:brightness-95 cursor-pointer"
          : isDownloading
          ? "bg-card-active text-muted cursor-pointer hover:bg-card-hover"
          : "bg-gradient-to-b from-cyan to-cyan/85 text-background shadow-cyan/20 hover:brightness-110 active:brightness-95 cursor-pointer"
      )}
    >
      {isDownloading && (
        <div
          className="absolute inset-y-0 left-0 bg-cyan/15 transition-all duration-300 pointer-events-none"
          style={{ width: `${progress}%` }}
        />
      )}
      <div className="relative z-10 flex items-center gap-1.5 justify-center">
        {isComplete ? (
          <>
            <Play className="h-3.5 w-3.5" fill="currentColor" />
            <span>Dreams Engine</span>
          </>
        ) : isDownloading ? (
          <>
            <div className="h-3 w-3 rounded-full border-2 border-muted/30 border-t-muted animate-spin" />
            <span>Dreams Engine ({progress}%)</span>
          </>
        ) : (
          <>
            <Download className="h-3.5 w-3.5" />
            <span>Dreams Engine</span>
          </>
        )}
      </div>
    </button>
  );
}
