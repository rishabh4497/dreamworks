import { ChevronLeft, ChevronRight, Gamepad2, Heart, Search, ShoppingCart, Users, WifiOff } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useRef, useState } from "react";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { UserAvatar } from "@/components/avatar/UserAvatar";

export function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const cartCount = useCartStore((s) => s.items.length);
  const wishlistCount = useWishlistStore((s) => s.entries.length);
  const profile = useAuthStore((s) => s.profile);
  const settings = useUiStore((s) => s.settings);
  const updateSettings = useUiStore((s) => s.updateSettings);
  const [query, setQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    navigate(`${ROUTES.storeSearch}?${params.toString()}`);
  };

  const canBack = location.key !== "default";

  return (
    <header className="sticky top-0 z-20 grid grid-cols-[1fr_auto_1fr] items-center gap-4 bg-transparent px-6 py-3">
      <div className="flex items-center gap-1 justify-self-start">
        <button
          onClick={() => navigate(-1)}
          disabled={!canBack}
          className="rounded-md p-1.5 text-muted/60 hover:bg-input hover:text-foreground/80 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => navigate(1)}
          className="rounded-md p-1.5 text-muted/60 hover:bg-input hover:text-foreground/80"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={onSearch} className="w-[420px] max-w-full justify-self-center">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/40" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search games, tags, developers…"
            className="pl-9 h-9 bg-transparent"
          />
        </div>
      </form>

      <div className="flex items-center gap-1.5 justify-self-end">
        <button
          type="button"
          onClick={() => updateSettings({ offlineModeEnabled: !settings.offlineModeEnabled })}
          title={settings.offlineModeEnabled ? "Offline mode is on" : "Turn on offline mode"}
          aria-pressed={settings.offlineModeEnabled}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition-colors",
            settings.largerFocusTargets && "px-3 py-2",
            settings.offlineModeEnabled
              ? "border-cyan/35 bg-cyan/10 text-cyan hover:bg-cyan/15"
              : "border-separator/70 bg-transparent text-muted hover:bg-input hover:text-foreground/80",
          )}
        >
          <WifiOff className="h-4 w-4" />
          <span className="hidden lg:inline">
            {settings.offlineModeEnabled ? "Offline" : "Online"}
          </span>
        </button>
        {settings.handheldMode && (
          <button
            type="button"
            title="Handheld mode active"
            aria-label="Handheld mode active"
            onClick={() => navigate(ROUTES.settings)}
            className={cn(
              "rounded-lg border border-separator/70 bg-transparent p-2 text-muted hover:bg-input hover:text-foreground/80",
              settings.largerFocusTargets && "p-3",
            )}
          >
            <Gamepad2 className="h-4 w-4" />
          </button>
        )}
        <IconLink label="Wishlist" onClick={() => navigate(ROUTES.wishlist)} count={wishlistCount}>
          <Heart className="h-4 w-4" />
        </IconLink>
        <IconLink label="Friends" onClick={() => navigate(ROUTES.friends)}>
          <Users className="h-4 w-4" />
        </IconLink>
        <div className="relative">
          <NotificationBell
            ref={bellRef}
            open={notificationsOpen}
            onToggle={() => setNotificationsOpen((v) => !v)}
          />
          <NotificationPanel
            open={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
            anchorRef={bellRef}
          />
        </div>
        <IconLink label="Cart" onClick={() => navigate(ROUTES.cart)} count={cartCount}>
          <ShoppingCart className="h-4 w-4" />
        </IconLink>
        {profile && (
          <button
            onClick={() => navigate(ROUTES.profile)}
            className="ml-1.5 flex items-center gap-2 rounded-lg border border-separator/70 bg-transparent px-2 py-1 hover:bg-input transition-colors"
          >
            {profile.avatarOptions ? (
              <UserAvatar
                options={profile.avatarOptions}
                size={24}
                className="rounded-full"
              />
            ) : (
              <img src={profile.avatarUrl} className="h-6 w-6 rounded-full" alt="" />
            )}
            <span className="text-[12px] font-medium text-foreground/80 hidden sm:block">
              {profile.displayName}
            </span>
          </button>
        )}
      </div>
    </header>
  );
}

function IconLink({
  children,
  count,
  label,
  onClick,
}: {
  children: React.ReactNode;
  count?: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="relative rounded-lg p-2 text-muted hover:bg-input hover:text-foreground/80"
    >
      {children}
      {count !== undefined && count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-acid px-1 text-[9px] font-bold text-background">
          {count}
        </span>
      )}
    </button>
  );
}
