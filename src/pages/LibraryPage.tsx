import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Grid3x3,
  LayoutList,
  Library as LibraryIcon,
  MoreHorizontal,
  Play,
  Plus,
  Search,
} from "lucide-react";
import { useGames } from "@/hooks/use-games";
import { useLibraryStore } from "@/stores/library-store";
import { useStartDownload } from "@/hooks/use-start-download";
import { toast } from "@/stores/toast-store";
import { ROUTES } from "@/lib/routes";
import { cn, formatHours, relativeDate } from "@/lib/utils";
import { isRefundEligible } from "@/lib/refund";
import { getCollections } from "@/lib/api/user";
import type { Collection, Game, LauncherSource, LibraryEntry } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SaveRollback } from "@/components/library/SaveRollback";
import { WishlistSync } from "@/components/library/WishlistSync";
import { ModManager } from "@/components/library/ModManager";
import { PlayRandomButton } from "@/components/library/PlayRandomButton";
import { CloudSaveConflict } from "@/components/library/CloudSaveConflict";
import { RefundBadge } from "@/components/library/RefundBadge";
import { AddToLibraryModal } from "@/components/library/AddToLibraryModal";
import { AutoScanModal } from "@/components/library/AutoScanModal";
import { SyncModal } from "@/components/library/SyncModal";
import { usePlatform } from "@/hooks/use-platform";
import { launchGameNative } from "@/lib/native-launcher";
import { UniversalPhotoGallery, LocalCoopMatchmaker, InteractiveDigitalManuals, AutomatedModProfiles } from "@/components/features/UserFeatures";
import { AiDynamicPatchNotes } from "@/components/features/AiFeatures";
import { LibraryAutoOrganizer } from "@/components/library/LibraryAutoOrganizer";
import { CrossLauncherSearch } from "@/components/library/CrossLauncherSearch";
import { LazyMount } from "@/components/common/LazyMount";

const LAUNCHER_LABEL: Record<LauncherSource, string> = {
  dreamworks: "Dreamworks",
  manual: "Manual",
  steam: "Steam",
  epic: "Epic",
  gog: "GOG",
  ubisoft: "Ubisoft",
  "ea-app": "EA App",
  "xbox-pc": "Xbox",
  rockstar: "Rockstar",
  battlenet: "Battle.net",
  amazon: "Amazon",
};

type ViewMode = "grid" | "list";

type FilterKey = "installed" | "not-installed" | "on-sale" | "refundable";

const FILTER_OPTIONS: Array<{ key: FilterKey; label: string }> = [
  { key: "installed", label: "Installed" },
  { key: "not-installed", label: "Not installed" },
  { key: "on-sale", label: "On sale" },
  { key: "refundable", label: "Refundable" },
];

function useCollections() {
  return useQuery({ queryKey: ["library", "collections"], queryFn: getCollections });
}

export function LibraryPage() {
  const entries = useLibraryStore((s) => s.entries);
  const { data: games } = useGames();
  const { data: collections } = useCollections();
  const toggleInstalled = useLibraryStore((s) => s.toggleInstalled);
  const startDownload = useStartDownload();
  const navigate = useNavigate();
  const { isDesktop } = usePlatform();

  const [addOpen, setAddOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set());
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [aiCollectionIds, setAiCollectionIds] = useState<string[] | null>(null);
  const [aiCollectionName, setAiCollectionName] = useState<string | null>(null);

  // ─── Derived data ──────────────────────────────────────────────────────
  const gameById = useMemo(() => {
    const map = new Map<string, Game>();
    (games ?? []).forEach((g) => map.set(g.id, g));
    return map;
  }, [games]);

  const totalMinutes = useMemo(
    () => entries.reduce((sum, e) => sum + e.playMinutes, 0),
    [entries],
  );
  const installedCount = useMemo(
    () => entries.filter((e) => e.installed).length,
    [entries],
  );
  const mostRecentLastPlayed = useMemo(() => {
    const dates = entries
      .map((e) => e.lastPlayed)
      .filter((d): d is string => !!d)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    return dates[0] ?? null;
  }, [entries]);

  const continuePlaying = useMemo(() => {
    return entries
      .filter((e) => e.lastPlayed)
      .sort(
        (a, b) =>
          new Date(b.lastPlayed!).getTime() - new Date(a.lastPlayed!).getTime(),
      )
      .slice(0, 5);
  }, [entries]);

  const collectionEntries = useMemo(() => {
    if (!collections) return [] as Array<Collection & { count: number }>;
    return collections.map((c) => ({
      ...c,
      count: c.gameIds.filter((id) => entries.some((e) => e.gameId === id)).length,
    }));
  }, [collections, entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const game = gameById.get(e.gameId);
      if (!game) return false;
      if (
        search.trim() &&
        !game.name.toLowerCase().includes(search.trim().toLowerCase())
      ) {
        return false;
      }
      if (aiCollectionIds && !aiCollectionIds.includes(e.gameId)) return false;
      if (activeCollection) {
        const col = collections?.find((c) => c.id === activeCollection);
        if (!col || !col.gameIds.includes(e.gameId)) return false;
      }
      if (activeFilters.has("installed") && !e.installed) return false;
      if (activeFilters.has("not-installed") && e.installed) return false;
      if (activeFilters.has("on-sale") && !game.isOnSale) return false;
      if (
        activeFilters.has("refundable") &&
        !isRefundEligible(e.refundWindow, e.playMinutes)
      ) {
        return false;
      }
      return true;
    });
  }, [entries, gameById, search, activeFilters, activeCollection, collections, aiCollectionIds]);

  // ─── Handlers ──────────────────────────────────────────────────────────
  const toggleFilter = (key: FilterKey) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handlePlay = async (e: LibraryEntry, external?: boolean) => {
    const result = await launchGameNative({
      gameId: e.gameId,
      sourceLauncher: e.sourceLauncher,
      launchCommand: e.launchCommand,
      executablePath:
        e.launchCommand && !e.launchCommand.includes("://")
          ? e.launchCommand
          : undefined,
      workingDir: e.installPath,
    });
    if (result.ok) {
      toast.success(
        external && e.sourceLauncher
          ? `Launching via ${LAUNCHER_LABEL[e.sourceLauncher]}`
          : "Launching from Dreamworks",
      );
      return;
    }
    toast.info(
      external && e.sourceLauncher
        ? `Launch route is not configured yet for ${LAUNCHER_LABEL[e.sourceLauncher]}`
        : result.error.message,
    );
  };

  const handleInstallToggle = (e: LibraryEntry) => {
    toggleInstalled(e.gameId);
    if (!e.installed) {
      startDownload(e.gameId, 8_000_000_000, { silent: true });
      toast.success("Install started");
    } else {
      toast.info("Uninstalled (mock)");
    }
  };

  // ─── Empty state ───────────────────────────────────────────────────────
  if (entries.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex min-h-[460px] flex-col items-center justify-center gap-5 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-acid/10 ring-1 ring-acid/20">
            <LibraryIcon className="h-12 w-12 text-acid" />
          </div>
          <div className="max-w-[440px] space-y-1.5">
            <h2 className="text-[20px] font-semibold text-foreground">
              Your library is empty
            </h2>
            <p className="text-[13px] text-muted/70">
              Browse the store to start collecting games.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to={ROUTES.store}>
              <Button variant="primary" size="md">
                Open store
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add manually
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setSyncOpen(true)}
            >
              Sync Accounts
            </Button>
          </div>
        </div>
        <AddToLibraryModal open={addOpen} onClose={() => setAddOpen(false)} />
        <AutoScanModal open={scanOpen} onClose={() => setScanOpen(false)} />
        <SyncModal open={syncOpen} onClose={() => setSyncOpen(false)} />
      </motion.div>
    );
  }

  // ─── Main page ─────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <CloudSaveConflict />
      <LazyMount placeholderHeight={200}>
        <section className="grid gap-6 md:grid-cols-2">
          <SaveRollback />
          <ModManager />
        </section>
      </LazyMount>
      <LazyMount placeholderHeight={140}>
        <WishlistSync />
      </LazyMount>
      <LazyMount placeholderHeight={200}>
        <CrossLauncherSearch />
      </LazyMount>
      <LazyMount placeholderHeight={260}>
        <LibraryAutoOrganizer
          onPickCollection={(ids, name) => {
            setAiCollectionIds(ids);
            setAiCollectionName(name);
            setActiveCollection(null);
          }}
        />
      </LazyMount>
      {aiCollectionIds && aiCollectionName && (
        <section className="flex items-center justify-between rounded-xl border border-acid/30 bg-acid/5 px-3 py-2">
          <p className="text-[12px] text-foreground/85">
            Filtering by AI collection ·{" "}
            <span className="font-semibold text-acid">{aiCollectionName}</span> · {aiCollectionIds.length} games
          </p>
          <button
            type="button"
            onClick={() => {
              setAiCollectionIds(null);
              setAiCollectionName(null);
            }}
            className="text-[11px] text-muted/80 underline-offset-2 hover:text-foreground/80 hover:underline"
          >
            Clear
          </button>
        </section>
      )}
      <LazyMount placeholderHeight={320}>
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <UniversalPhotoGallery />
          <LocalCoopMatchmaker />
          <InteractiveDigitalManuals />
          <AutomatedModProfiles />
          <AiDynamicPatchNotes />
        </section>
      </LazyMount>

      {/* 1. Greeting + portfolio hero band */}
      <section
        className={cn(
          "relative overflow-hidden rounded-2xl border border-separator bg-card",
          "bg-gradient-to-br from-acid/10 via-positive/5 to-transparent",
          "px-5 py-5 md:px-7 md:py-6",
        )}
      >
        <div className="flex items-center justify-between gap-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
              Your library, rishav
            </h1>
            <p className="mt-1.5 text-[13px] text-muted/70">
              <span className="tabular-nums">{entries.length}</span> games ·{" "}
              <span className="tabular-nums">{formatHours(totalMinutes)}</span> played ·{" "}
              <span className="tabular-nums">{installedCount}</span> installed
              {mostRecentLastPlayed && (
                <> · last played {relativeDate(mostRecentLastPlayed)}</>
              )}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add to library
              </Button>
              {isDesktop && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setScanOpen(true)}
                >
                  Auto-add from launchers
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSyncOpen(true)}
              >
                Sync Accounts
              </Button>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            {[
              { value: entries.length.toString(), label: "Games" },
              { value: formatHours(totalMinutes), label: "Played" },
              { value: installedCount.toString(), label: "Installed" },
            ].map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  "flex h-20 w-20 flex-col items-center justify-center gap-0.5",
                  "rounded-xl border border-separator bg-card-active/40 backdrop-blur",
                )}
              >
                <span className="text-[15px] font-semibold tabular-nums text-foreground">
                  {stat.value}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted/60">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Continue playing rail */}
      {continuePlaying.length > 0 && (
        <section>
          <header className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[14px] font-semibold text-foreground">
              Continue playing
            </h2>
            <span className="text-[11px] text-muted/60">
              {continuePlaying.length} recent
            </span>
          </header>
          <div className="flex gap-3 overflow-x-auto shelf-scroll pb-1">
            {continuePlaying.map((e) => {
              const game = gameById.get(e.gameId);
              if (!game) return null;
              const external =
                e.sourceLauncher && e.sourceLauncher !== "dreamworks";
              return (
                <button
                  key={e.gameId}
                  onClick={() => navigate(ROUTES.libraryGame(e.gameId))}
                  className={cn(
                    "group relative shrink-0 overflow-hidden rounded-xl border border-separator",
                    "h-[140px] w-[280px] text-left transition-all hover:border-acid/30",
                  )}
                >
                  <img
                    src={game.headerUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-foreground">
                        {game.name}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted/70">
                        Last played {relativeDate(e.lastPlayed!)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        void handlePlay(e, external);
                      }}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md bg-green/90 px-2 py-1",
                        "text-[10px] font-semibold text-white hover:bg-green",
                      )}
                    >
                      <Play className="h-3 w-3" />
                      Play
                    </button>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Toolbar + view-mode toggle */}
      <section className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 max-w-[360px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted/50" />
          <Input
            value={search}
            onChange={(ev) => setSearch(ev.target.value)}
            placeholder="Search your library"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip
            label="All"
            active={activeFilters.size === 0}
            onClick={() => setActiveFilters(new Set())}
          />
          {FILTER_OPTIONS.map((f) => (
            <FilterChip
              key={f.key}
              label={f.label}
              active={activeFilters.has(f.key)}
              onClick={() => toggleFilter(f.key)}
            />
          ))}
        </div>
        <div className="ml-auto inline-flex overflow-hidden rounded-xl border border-separator bg-card">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={cn(
              "flex h-8 w-9 items-center justify-center text-muted transition-colors",
              view === "grid"
                ? "bg-card-active text-foreground"
                : "hover:text-foreground/80",
            )}
            aria-label="Grid view"
          >
            <Grid3x3 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "flex h-8 w-9 items-center justify-center text-muted transition-colors",
              view === "list"
                ? "bg-card-active text-foreground"
                : "hover:text-foreground/80",
            )}
            aria-label="List view"
          >
            <LayoutList className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      {/* 4. Collections strip */}
      {collectionEntries.length > 0 && (
        <section className="flex flex-wrap items-center gap-1.5">
          <CollectionChip
            label="All games"
            count={entries.length}
            active={activeCollection === null}
            onClick={() => setActiveCollection(null)}
          />
          {collectionEntries.map((c) => (
            <CollectionChip
              key={c.id}
              label={c.name}
              count={c.count}
              active={activeCollection === c.id}
              onClick={() =>
                setActiveCollection((prev) => (prev === c.id ? null : c.id))
              }
            />
          ))}
          <button
            type="button"
            onClick={() => toast.info("Collections coming soon")}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border border-dashed border-separator",
              "bg-transparent px-2.5 py-1 text-[11px] font-medium text-muted/70",
              "hover:border-acid/40 hover:text-acid",
            )}
          >
            <Plus className="h-3 w-3" />
            New collection
          </button>
        </section>
      )}

      {/* 5. Main library grid / list */}
      {filteredEntries.length === 0 ? (
        <div className="rounded-2xl border border-separator bg-card p-10 text-center">
          <p className="text-[13px] text-muted/70">
            No games match the current filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setActiveFilters(new Set());
              setActiveCollection(null);
            }}
            className="mt-2 text-[12px] font-medium text-acid hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : view === "grid" ? (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <PlayRandomButton />
          {filteredEntries.map((e) => {
            const game = gameById.get(e.gameId);
            if (!game) return null;
            const refundable = isRefundEligible(e.refundWindow, e.playMinutes);
            const external =
              e.sourceLauncher && e.sourceLauncher !== "dreamworks";
            return (
              <article
                key={e.gameId}
                onClick={() => navigate(ROUTES.libraryGame(e.gameId))}
                className={cn(
                  "group relative cursor-pointer overflow-hidden rounded-xl border border-separator",
                  "bg-card transition-all hover:bg-card-hover hover:border-acid/20",
                )}
              >
                <div className="relative aspect-[460/215] w-full overflow-hidden">
                  <img
                    src={game.headerUrl}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  {e.sourceLauncher && (
                    <div className="absolute right-2 top-2">
                      <Badge variant="default">
                        {LAUNCHER_LABEL[e.sourceLauncher]}
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-[14px] font-semibold text-foreground">
                      {game.name}
                    </p>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-muted/60">
                    {formatHours(e.playMinutes)} played
                    {e.lastPlayed && ` · ${relativeDate(e.lastPlayed)}`}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-[2px] text-[10px] font-semibold",
                        e.installed
                          ? "bg-price/15 text-price"
                          : "bg-input text-muted",
                      )}
                    >
                      {e.installed ? "Installed" : "Not installed"}
                    </span>
                    {refundable && <RefundBadge entry={e} />}
                  </div>
                  <div
                    className="mt-3 flex items-center gap-1.5"
                    onClick={(ev) => ev.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => void handlePlay(e, external)}
                      className={cn(
                        "inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg",
                        "bg-gradient-to-b from-price to-price/85 text-[12px] font-bold text-background",
                        "shadow-sm shadow-price/30 hover:brightness-110 active:brightness-95 transition-all",
                      )}
                    >
                      <Play className="h-3 w-3" fill="currentColor" />
                      Play
                    </button>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenu((prev) =>
                            prev === e.gameId ? null : e.gameId,
                          )
                        }
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg",
                          "border border-separator bg-card text-muted",
                          "hover:bg-card-active hover:text-foreground",
                        )}
                        aria-label="More actions"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                      {openMenu === e.gameId && (
                        <RowMenu
                          entry={e}
                          onClose={() => setOpenMenu(null)}
                          onInstallToggle={() => handleInstallToggle(e)}
                          onViewStore={() =>
                            navigate(ROUTES.gameDetail(e.gameId))
                          }
                        />
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border border-separator bg-card">
          <ul className="divide-y divide-separator">
            {filteredEntries.map((e) => {
              const game = gameById.get(e.gameId);
              if (!game) return null;
              const refundable = isRefundEligible(e.refundWindow, e.playMinutes);
              const external =
                e.sourceLauncher && e.sourceLauncher !== "dreamworks";
              return (
                <li
                  key={e.gameId}
                  onClick={() => navigate(ROUTES.libraryGame(e.gameId))}
                  className="flex cursor-pointer items-center gap-4 p-3 transition-colors hover:bg-card-hover"
                >
                  <img
                    src={game.capsuleUrl}
                    alt=""
                    className="h-14 w-28 shrink-0 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13px] font-semibold text-foreground">
                        {game.name}
                      </p>
                      {e.sourceLauncher && (
                        <Badge variant="default">
                          {LAUNCHER_LABEL[e.sourceLauncher]}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted/60">
                      {formatHours(e.playMinutes)} played
                      {e.lastPlayed && ` · last played ${relativeDate(e.lastPlayed)}`}
                      {" · "}
                      {e.completionPct}% complete
                    </p>
                  </div>
                  <div className="hidden items-center gap-2 sm:flex">
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-[2px] text-[10px] font-semibold",
                        e.installed
                          ? "bg-price/15 text-price"
                          : "bg-input text-muted",
                      )}
                    >
                      {e.installed ? "Installed" : "Not installed"}
                    </span>
                    {refundable && <RefundBadge entry={e} />}
                  </div>
                  <div
                    className="flex items-center gap-1.5"
                    onClick={(ev) => ev.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => void handlePlay(e, external)}
                      className={cn(
                        "inline-flex h-8 items-center gap-1.5 rounded-lg px-3",
                        "bg-acid text-[12px] font-semibold text-background hover:brightness-110",
                      )}
                    >
                      <Play className="h-3 w-3" />
                      Play
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <AddToLibraryModal open={addOpen} onClose={() => setAddOpen(false)} />
      <AutoScanModal open={scanOpen} onClose={() => setScanOpen(false)} />
      <SyncModal open={syncOpen} onClose={() => setSyncOpen(false)} />
    </motion.div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
        active
          ? "border-acid/40 bg-acid/10 text-acid"
          : "border-separator bg-card text-muted/80 hover:bg-card-active hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

interface CollectionChipProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

function CollectionChip({ label, count, active, onClick }: CollectionChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
        active
          ? "border-acid/40 bg-acid/10 text-acid"
          : "border-separator bg-card text-foreground/80 hover:bg-card-active",
      )}
    >
      <span>{label}</span>
      <span className="tabular-nums text-muted/60">·</span>
      <span className="tabular-nums text-muted/70">{count}</span>
    </button>
  );
}

interface RowMenuProps {
  entry: LibraryEntry;
  onClose: () => void;
  onInstallToggle: () => void;
  onViewStore: () => void;
}

function RowMenu({ entry, onClose, onInstallToggle, onViewStore }: RowMenuProps) {
  return (
    <div
      className={cn(
        "absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl border border-separator",
        "bg-card shadow-xl",
      )}
      onMouseLeave={onClose}
    >
      <MenuItem
        label="View store page"
        onClick={() => {
          onClose();
          onViewStore();
        }}
      />
      <MenuItem
        label={entry.installed ? "Uninstall" : "Install"}
        onClick={() => {
          onClose();
          onInstallToggle();
        }}
      />
      <MenuItem
        label="Manage"
        onClick={() => {
          onClose();
          toast.info("Manage panel coming soon");
        }}
      />
      <MenuItem
        label="Hide from library"
        onClick={() => {
          onClose();
          toast.info("Hidden (mock)");
        }}
      />
    </div>
  );
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full px-3 py-2 text-left text-[12px] text-foreground/85 hover:bg-card-active"
    >
      {label}
    </button>
  );
}
