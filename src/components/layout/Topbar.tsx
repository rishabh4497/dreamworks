import { ChevronLeft, ChevronRight, Clock, Gamepad2, Heart, Search, ShoppingCart, Users, WifiOff } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { isDesktop } from "@/lib/platform";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { useRecentSearchesStore } from "@/stores/recent-searches-store";
import { useGames } from "@/hooks/use-games";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import { useTranslation } from "@/lib/i18n";
import type { Game } from "@/lib/types";

export function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const cartCount = useCartStore((s) => s.items.length);
  const wishlistCount = useWishlistStore((s) => s.entries.length);
  const profile = useAuthStore((s) => s.profile);
  const settings = useUiStore((s) => s.settings);
  const updateSettings = useUiStore((s) => s.updateSettings);
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const bellRef = useRef<HTMLButtonElement>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const recentQueries = useRecentSearchesStore((s) => s.queries);
  const pushRecent = useRecentSearchesStore((s) => s.push);
  const clearRecent = useRecentSearchesStore((s) => s.clear);
  const { data: games } = useGames();

  const suggestions = useMemo<Game[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q || !games) return [];
    return games
      .filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          (g.tags ?? []).some((t) => t.toLowerCase().includes(q)) ||
          g.developer.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [query, games]);

  // The dropdown shows either suggestions (when typing) or recent queries (when empty).
  const showSuggestions = searchOpen && (query.trim().length > 0 || recentQueries.length > 0);
  const flatRowCount = query.trim() ? suggestions.length + 1 : recentQueries.length;

  useEffect(() => {
    setActiveIndex(0);
  }, [query, searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!searchWrapperRef.current?.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [searchOpen]);

  const submitQuery = (raw: string) => {
    const q = raw.trim();
    if (q) pushRecent(q);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    setSearchOpen(false);
    navigate(`${ROUTES.storeSearch}?${params.toString()}`);
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuery(query);
  };

  const onSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(flatRowCount - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      e.preventDefault();
      setSearchOpen(false);
    } else if (e.key === "Enter") {
      // Let the form handler run, but if a suggestion row is active, take that instead.
      if (query.trim()) {
        if (activeIndex === 0) {
          // "Search for …" row
          return;
        }
        const game = suggestions[activeIndex - 1];
        if (game) {
          e.preventDefault();
          setSearchOpen(false);
          pushRecent(query);
          navigate(ROUTES.gameDetail(game.id));
        }
      } else if (recentQueries[activeIndex]) {
        e.preventDefault();
        submitQuery(recentQueries[activeIndex]);
      }
    }
  };

  const isSearchPage = location.pathname === ROUTES.storeSearch;
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

      {isSearchPage ? <div /> : (
        <div ref={searchWrapperRef} className="relative w-[420px] max-w-full justify-self-center">
          <form onSubmit={onSearch}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/40" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={onSearchKeyDown}
                placeholder="Search games, tags, developers… (⌘K)"
                className="pl-9 h-9 bg-transparent"
              />
            </div>
          </form>
          {showSuggestions && (
            <div className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl border border-separator bg-card shadow-2xl">
              {query.trim() ? (
                <ul className="max-h-[60vh] overflow-y-auto p-1">
                  <SuggestionRow
                    active={activeIndex === 0}
                    onMouseEnter={() => setActiveIndex(0)}
                    onClick={() => submitQuery(query)}
                    icon={<Search className="h-3.5 w-3.5 text-muted/70" />}
                    label={`Search for “${query.trim()}”`}
                    hint="all results"
                  />
                  {suggestions.length > 0 && (
                    <li className="px-2.5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-muted/40">
                      Games
                    </li>
                  )}
                  {suggestions.map((game, i) => (
                    <SuggestionRow
                      key={game.id}
                      active={activeIndex === i + 1}
                      onMouseEnter={() => setActiveIndex(i + 1)}
                      onClick={() => {
                        pushRecent(query);
                        setSearchOpen(false);
                        navigate(ROUTES.gameDetail(game.id));
                      }}
                      icon={
                        <img
                          loading="lazy"
                          decoding="async"
                          src={game.capsuleUrl}
                          alt=""
                          className="h-6 w-10 rounded object-cover"
                        />
                      }
                      label={game.name}
                      hint={game.developer}
                    />
                  ))}
                </ul>
              ) : (
                <div className="p-1">
                  <div className="flex items-center justify-between px-2.5 pb-1 pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted/40">
                      Recent
                    </span>
                    <button
                      type="button"
                      onClick={() => clearRecent()}
                      className="text-[10px] text-muted/60 hover:text-foreground/80"
                    >
                      Clear
                    </button>
                  </div>
                  <ul>
                    {recentQueries.map((q, i) => (
                      <SuggestionRow
                        key={q}
                        active={activeIndex === i}
                        onMouseEnter={() => setActiveIndex(i)}
                        onClick={() => submitQuery(q)}
                        icon={<Clock className="h-3.5 w-3.5 text-muted/70" />}
                        label={q}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 justify-self-end">
        <button
          type="button"
          onClick={() => updateSettings({ offlineModeEnabled: !settings.offlineModeEnabled })}
          title={settings.offlineModeEnabled ? t("Offline mode is on") : t("Turn on offline mode")}
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
            {settings.offlineModeEnabled ? t("Offline") : t("Online")}
          </span>
        </button>
        {settings.handheldMode && isDesktop() && (
          <button
            type="button"
            title={t("Handheld mode active")}
            aria-label={t("Handheld mode active")}
            onClick={() => navigate(ROUTES.settings)}
            className={cn(
              "rounded-lg border border-separator/70 bg-transparent p-2 text-muted hover:bg-input hover:text-foreground/80",
              settings.largerFocusTargets && "p-3",
            )}
          >
            <Gamepad2 className="h-4 w-4" />
          </button>
        )}
        <IconLink label={t("Wishlist")} onClick={() => navigate(ROUTES.wishlist)} count={wishlistCount}>
          <Heart className="h-4 w-4" />
        </IconLink>
        <IconLink label={t("Friends")} onClick={() => navigate(ROUTES.friends)}>
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
        <IconLink label={t("Cart")} onClick={() => navigate(ROUTES.cart)} count={cartCount}>
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
              <img loading="lazy" decoding="async" src={profile.avatarUrl} className="h-6 w-6 rounded-full" alt="" />
            )}
            <span className="text-[12px] font-medium text-foreground/80 hidden sm:block">
              {profile.displayName.split(" ")[0]}
            </span>
          </button>
        )}
      </div>
    </header>
  );
}

interface SuggestionRowProps {
  active: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  hint?: string;
}

function SuggestionRow({ active, onMouseEnter, onClick, icon, label, hint }: SuggestionRowProps) {
  return (
    <li>
      <button
        type="button"
        onMouseEnter={onMouseEnter}
        onMouseDown={(e) => {
          // Use mousedown so the click registers before the input blur closes the dropdown.
          e.preventDefault();
          onClick();
        }}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors",
          active ? "bg-acid/15 text-foreground" : "text-foreground/85 hover:bg-card-active",
        )}
      >
        <span className="flex h-6 w-10 shrink-0 items-center justify-center">{icon}</span>
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {hint && <span className="shrink-0 text-[11px] text-muted/60">{hint}</span>}
      </button>
    </li>
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
