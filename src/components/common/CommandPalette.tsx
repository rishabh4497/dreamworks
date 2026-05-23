import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChartBar,
  Cog,
  Compass,
  Download,
  GalleryThumbnails,
  Gamepad2,
  Heart,
  Library,
  Network,
  Search,
  ShoppingCart,
  Sparkles,
  Sun,
  Users,
  WifiOff,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { useGames } from "@/hooks/use-games";
import { useThemeStore } from "@/stores/theme-store";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { toast } from "@/stores/toast-store";

type Action = {
  id: string;
  label: string;
  hint?: string;
  group: "Navigate" | "Games" | "Commands";
  icon: ReactNode;
  keywords?: string[];
  run: () => void;
};

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const ICON_CLS = "h-4 w-4 text-muted/70";

function rankScore(query: string, label: string, keywords: string[] = []): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const hay = [label, ...keywords].join(" ").toLowerCase();
  if (hay === q) return 1000;
  if (label.toLowerCase().startsWith(q)) return 500;
  if (hay.startsWith(q)) return 300;
  if (hay.includes(q)) return 100;
  // fuzzy: every char of q appears in hay in order
  let i = 0;
  for (const c of hay) {
    if (i < q.length && c === q[i]) i++;
    if (i === q.length) return 30;
  }
  return 0;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { data: games } = useGames();
  const setTheme = useThemeStore((s) => s.setTheme);
  const updateSettings = useUiStore((s) => s.updateSettings);
  const settings = useUiStore((s) => s.settings);

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // ── Build the action list ─────────────────────────────────────────────
  const baseActions = useMemo<Action[]>(() => {
    const navs: Action[] = [
      { id: "nav-store", label: "Go to Store", group: "Navigate", icon: <Compass className={ICON_CLS} />, run: () => navigate(ROUTES.store) },
      { id: "nav-library", label: "Open Library", group: "Navigate", icon: <Library className={ICON_CLS} />, run: () => navigate(ROUTES.library) },
      { id: "nav-wishlist", label: "Open Wishlist", group: "Navigate", icon: <Heart className={ICON_CLS} />, run: () => navigate(ROUTES.wishlist) },
      { id: "nav-cart", label: "Open Cart", group: "Navigate", icon: <ShoppingCart className={ICON_CLS} />, run: () => navigate(ROUTES.cart) },
      { id: "nav-downloads", label: "Open Downloads", group: "Navigate", icon: <Download className={ICON_CLS} />, run: () => navigate(ROUTES.downloads) },
      { id: "nav-friends", label: "Open Friends", group: "Navigate", icon: <Users className={ICON_CLS} />, run: () => navigate(ROUTES.friends) },
      { id: "nav-feed", label: "Open Feed", group: "Navigate", icon: <GalleryThumbnails className={ICON_CLS} />, run: () => navigate(ROUTES.feed) },
      { id: "nav-db", label: "Open Dreamworks DB", group: "Navigate", icon: <ChartBar className={ICON_CLS} />, run: () => navigate(ROUTES.db) },
      { id: "nav-workshop", label: "Open Workshop", group: "Navigate", icon: <Gamepad2 className={ICON_CLS} />, run: () => navigate(ROUTES.workshop) },
      { id: "nav-settings", label: "Open Settings", group: "Navigate", icon: <Cog className={ICON_CLS} />, run: () => navigate(ROUTES.settings) },
      { id: "nav-plus", label: "Dreamworks+", group: "Navigate", icon: <Sparkles className={ICON_CLS} />, run: () => navigate(ROUTES.plus) },
    ];
    const commands: Action[] = [
      {
        id: "cmd-theme-light",
        label: "Switch to Light theme",
        keywords: ["light mode", "appearance"],
        group: "Commands",
        icon: <Sun className={ICON_CLS} />,
        run: () => setTheme("light"),
      },
      {
        id: "cmd-theme-dark",
        label: "Switch to Dark theme",
        keywords: ["dark mode", "appearance"],
        group: "Commands",
        icon: <Sun className={ICON_CLS} />,
        run: () => setTheme("dark"),
      },
      {
        id: "cmd-toggle-offline",
        label: settings.offlineModeEnabled ? "Turn offline mode OFF" : "Turn offline mode ON",
        keywords: ["network", "airplane"],
        group: "Commands",
        icon: <WifiOff className={ICON_CLS} />,
        run: () => updateSettings({ offlineModeEnabled: !settings.offlineModeEnabled }),
      },
      {
        id: "cmd-toggle-handheld",
        label: settings.handheldMode ? "Disable handheld mode" : "Enable handheld mode",
        keywords: ["steam deck", "controller"],
        group: "Commands",
        icon: <Gamepad2 className={ICON_CLS} />,
        run: () => updateSettings({ handheldMode: !settings.handheldMode }),
      },
      {
        id: "cmd-copy-link",
        label: "Copy current page link",
        keywords: ["share", "url"],
        group: "Commands",
        icon: <Network className={ICON_CLS} />,
        run: () => {
          void navigator.clipboard.writeText(window.location.href);
          toast.success("Link copied to clipboard");
        },
      },
      {
        id: "cmd-notifications",
        label: "Show notifications",
        keywords: ["alerts", "bell"],
        group: "Commands",
        icon: <Bell className={ICON_CLS} />,
        run: () => {
          // open notification panel via UI store hook (existing pattern handles itself)
          toast.info("Open the bell in the topbar");
        },
      },
    ];
    return [...navs, ...commands];
  }, [navigate, setTheme, settings.offlineModeEnabled, settings.handheldMode, updateSettings]);

  const gameActions = useMemo<Action[]>(() => {
    if (!games || query.trim().length < 1) return [];
    return games.slice(0, 200).map((g) => ({
      id: `game-${g.id}`,
      label: g.name,
      group: "Games" as const,
      icon: (
        <img
          loading="lazy"
          decoding="async"
          src={g.capsuleUrl}
          alt=""
          className="h-5 w-9 rounded object-cover"
        />
      ),
      keywords: [...(g.genres ?? []), ...(g.tags ?? []).slice(0, 4), g.developer],
      run: () => navigate(ROUTES.gameDetail(g.id)),
    }));
  }, [games, query, navigate]);

  // ── Filter + rank ─────────────────────────────────────────────────────
  const ranked = useMemo(() => {
    const pool = [...baseActions, ...gameActions];
    const scored = pool
      .map((a) => ({ a, s: rankScore(query.trim(), a.label, a.keywords) }))
      .filter((x) => x.s > 0)
      .sort((x, y) => y.s - x.s);
    return scored.slice(0, 30).map((x) => x.a);
  }, [baseActions, gameActions, query]);

  // ── Reset and focus when opening ──────────────────────────────────────
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      // Defer focus so the input is mounted
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // ── Keep active row scrolled into view ────────────────────────────────
  useLayoutEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (!list) return;
    const el = list.querySelector<HTMLElement>(`[data-cmdk-row="${activeIndex}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const runActive = useCallback(() => {
    const action = ranked[activeIndex];
    if (!action) return;
    onClose();
    // Defer until after close to avoid focus/route-change races
    requestAnimationFrame(() => action.run());
  }, [ranked, activeIndex, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        aria-hidden
      />

      <div
        className="relative z-10 w-[640px] max-w-[92vw] overflow-hidden rounded-2xl border border-separator bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-separator px-4 py-3">
          <Search className="h-4 w-4 text-muted/60" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, ranked.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                runActive();
              } else if (e.key === "Escape") {
                e.preventDefault();
                onClose();
              }
            }}
            placeholder="Search games, navigate, run a command…"
            className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted/50 focus:outline-none"
          />
          <kbd className="rounded border border-separator bg-card-active px-1.5 py-0.5 font-mono text-[10px] text-muted">
            esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[58vh] overflow-y-auto p-1">
          {ranked.length === 0 ? (
            <p className="px-3 py-6 text-center text-[12px] text-muted/60">No matches.</p>
          ) : (
            renderGrouped(ranked, activeIndex, (i) => setActiveIndex(i), runActive)
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-separator bg-card-active/40 px-3 py-1.5 text-[10px] text-muted/60">
          <span>
            <kbd className="font-mono">↑↓</kbd> navigate · <kbd className="font-mono">↵</kbd> select
          </span>
          <span>
            <kbd className="font-mono">⌘K</kbd> to toggle
          </span>
        </footer>
      </div>
    </div>
  );
}

function renderGrouped(
  actions: Action[],
  activeIndex: number,
  setActive: (i: number) => void,
  runActive: () => void,
) {
  const groups = new Map<string, { action: Action; index: number }[]>();
  actions.forEach((action, index) => {
    if (!groups.has(action.group)) groups.set(action.group, []);
    groups.get(action.group)!.push({ action, index });
  });
  const order: Action["group"][] = ["Games", "Navigate", "Commands"];
  return order
    .filter((g) => groups.has(g))
    .map((g) => {
      const rows = groups.get(g)!;
      return (
        <div key={g} className="px-1 py-1">
          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted/40">
            {g}
          </p>
          {rows.map(({ action, index }) => (
            <button
              key={action.id}
              data-cmdk-row={index}
              type="button"
              onMouseEnter={() => setActive(index)}
              onClick={() => {
                setActive(index);
                runActive();
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors",
                index === activeIndex
                  ? "bg-acid/15 text-foreground"
                  : "text-foreground/85 hover:bg-card-active",
              )}
            >
              <span className="flex h-6 w-9 shrink-0 items-center justify-center">
                {action.icon}
              </span>
              <span className="min-w-0 flex-1 truncate">{action.label}</span>
              {action.hint && (
                <span className="text-[11px] text-muted/60">{action.hint}</span>
              )}
            </button>
          ))}
        </div>
      );
    });
}
