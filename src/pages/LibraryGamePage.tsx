import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowRight,
  ChevronDown,
  Clock,
  FolderOpen,
  Newspaper,
  Play,
  Settings2,
  Trophy,
} from "lucide-react";
import { useGameDetail } from "@/hooks/use-games";
import { useCloudSaveSlots, useResolveCloudSaveConflict } from "@/hooks/use-cloud-saves";
import { useLibraryStore } from "@/stores/library-store";
import { useStartDownload } from "@/hooks/use-start-download";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { toast } from "@/stores/toast-store";
import {
  installGameNative,
  launchGameNative,
  openInstallFolderNative,
  uninstallGameNative,
  verifyInstallNative,
} from "@/lib/native-launcher";
import {
  markInstallVerified,
  removeInstallManifest,
  upsertInstallManifest,
} from "@/lib/api/install-manifests";
import { installPathForGame } from "@/lib/api/storage";
import { ROUTES } from "@/lib/routes";
import { cn, formatHours, relativeDate } from "@/lib/utils";
import type { CloudSaveResolution, CloudSaveSlot, LibraryEntry } from "@/lib/types";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FriendsWhoOwn } from "@/components/store/FriendsWhoOwn";
import { ReviewPollModal } from "@/components/store/ReviewPollModal";
import { CloudSaveConflictResolver } from "@/components/library/CloudSaveConflictResolver";
import { CloudSaves } from "@/components/library/CloudSaves";
import { AutoTuner } from "@/components/library/AutoTuner";
import { ModCompatibility } from "@/components/workshop/ModCompatibility";
import { CompatibilityPanel } from "@/components/store/CompatibilityPanel";

interface SessionRow {
  date: Date;
  minutes: number;
}

function buildRecentSessions(entry: LibraryEntry): SessionRow[] {
  if (!entry.lastPlayed) return [];
  const last = new Date(entry.lastPlayed);
  const baseMinutes = Math.max(40, Math.round(entry.playMinutes * 0.04));
  return [
    { date: last, minutes: baseMinutes + 24 },
    {
      date: new Date(last.getTime() - 2 * 24 * 60 * 60 * 1000),
      minutes: baseMinutes + 9,
    },
    {
      date: new Date(last.getTime() - 6 * 24 * 60 * 60 * 1000),
      minutes: Math.max(20, Math.round(baseMinutes * 0.6)),
    },
  ];
}

function formatSessionDate(d: Date): string {
  return relativeDate(d.toISOString());
}

function formatSessionMinutes(m: number): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h === 0) return `${mm}m`;
  if (mm === 0) return `${h}h`;
  return `${h}h ${mm}m`;
}

export function LibraryGamePage() {
  const { gameId = "" } = useParams();
  const navigate = useNavigate();
  const { data: detail, isLoading } = useGameDetail(gameId);
  const entry = useLibraryStore((s) =>
    s.entries.find((e) => e.gameId === gameId),
  );
  const userId = useAuthStore((s) => s.profile?.uid);
  const toggleInstalled = useLibraryStore((s) => s.toggleInstalled);
  const moveInstallPath = useLibraryStore((s) => s.moveInstallPath);
  const startDownload = useStartDownload();
  const settings = useUiStore((s) => s.settings);
  const { data: cloudSaveSlots = [] } = useCloudSaveSlots(userId, gameId);
  const resolveCloudSaveConflict = useResolveCloudSaveConflict(userId, gameId);
  const [manageOpen, setManageOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pollOpen, setPollOpen] = useState(false);

  // Redirect home if game isn't in the library.
  useEffect(() => {
    if (!isLoading && (!entry || !detail)) {
      // Detail may take a tick to load; only bounce if entry is missing.
      if (!entry) navigate(ROUTES.library, { replace: true });
    }
  }, [entry, detail, isLoading, navigate]);

  const recentSessions = useMemo(() => {
    if (!entry) return [] as SessionRow[];
    return buildRecentSessions(entry);
  }, [entry]);

  const last2WeeksMinutes = useMemo(() => {
    if (!entry) return 0;
    return Math.round(entry.playMinutes * 0.15);
  }, [entry]);

  const conflictSlots = useMemo(
    () => cloudSaveSlots.filter((slot) => slot.status === "conflict"),
    [cloudSaveSlots],
  );

  if (isLoading || !detail || !entry) {
    return <LoadingSpinner label="Loading game…" />;
  }

  const achievementPct = detail.achievementCount
    ? Math.round((entry.achievementsUnlocked / detail.achievementCount) * 100)
    : 0;

  const handlePlay = async () => {
    if (settings.offlineModeEnabled && (!entry.installed || entry.canLaunchOffline !== true)) {
      toast.info(
        entry.installed
          ? `${detail.name} requires an online launcher check. Turn off offline mode to play.`
          : `${detail.name} is not cached locally for offline play.`,
      );
      return;
    }

    const result = await launchGameNative({
      gameId: entry.gameId,
      sourceLauncher: entry.sourceLauncher,
      launchCommand: entry.launchCommand,
      executablePath:
        entry.launchCommand && !entry.launchCommand.includes("://")
          ? entry.launchCommand
          : undefined,
      workingDir: entry.installPath,
    });
    if (result.ok) {
      setIsPlaying(true);
      toast.success(`Launching ${detail.name}...`);
      void import("@/lib/telemetry").then((m) =>
        m.track("library_launch", {
          gameId: entry.gameId,
          sourceLauncher: entry.sourceLauncher,
        }),
      );
      return;
    }
    toast.info(result.error.message);
  };

  const handleStop = () => {
    setIsPlaying(false);
    // For demo purposes, we trigger the review poll 100% of the time.
    setPollOpen(true);
  };

  const handleInstallToggle = async () => {
    const installPath = installPathForGame(
      entry.gameId,
      entry.installPath,
      settings.installPath,
    );
    if (!entry.installed) {
      const native = await installGameNative({
        gameId: entry.gameId,
        sourceLauncher: entry.sourceLauncher,
        installPath,
        sizeBytes: detail.estimatedSizeBytes,
      });
      const resolvedPath = native.ok ? native.data.installPath ?? installPath : installPath;
      moveInstallPath(entry.gameId, resolvedPath);
      await upsertInstallManifest({
        gameId: entry.gameId,
        sourceLauncher: entry.sourceLauncher,
        externalId: entry.externalId,
        installPath: resolvedPath,
        launchCommand: entry.launchCommand,
        sizeBytes: detail.estimatedSizeBytes,
        canLaunchOffline: entry.canLaunchOffline,
        drmType: entry.drmType,
      });
      startDownload(entry.gameId, detail.estimatedSizeBytes, {
        installPath: resolvedPath,
        sourceLauncher: entry.sourceLauncher,
        silent: true,
      });
      toast.success(native.ok ? "Install started" : "Install queued in local manifest");
    } else {
      const native = await uninstallGameNative({ gameId: entry.gameId, installPath });
      await removeInstallManifest(entry.gameId);
      toggleInstalled(entry.gameId);
      toast.info(native.ok ? "Uninstalled" : "Removed from local manifest");
    }
  };

  const handleOpenLocalFiles = async () => {
    const installPath = installPathForGame(
      entry.gameId,
      entry.installPath,
      settings.installPath,
    );
    if (!installPath) {
      toast.info("No install folder is recorded for this game yet.");
      return;
    }
    const result = await openInstallFolderNative({ installPath });
    if (result.ok) toast.success("Opening install folder");
    else toast.info(result.error.message);
  };

  const handleVerifyInstall = async () => {
    const installPath = installPathForGame(
      entry.gameId,
      entry.installPath,
      settings.installPath,
    );
    if (!installPath) {
      toast.info("No install folder is recorded for this game yet.");
      return;
    }
    const result = await verifyInstallNative({
      gameId: entry.gameId,
      installPath,
    });
    if (result.ok) {
      await markInstallVerified(entry.gameId);
      toast.info(result.data.exists ? "Install verified" : "Install folder is missing");
    } else if (result.error.code === "not_desktop") {
      await upsertInstallManifest({
        gameId: entry.gameId,
        sourceLauncher: entry.sourceLauncher,
        externalId: entry.externalId,
        installPath,
        launchCommand: entry.launchCommand,
        sizeBytes: entry.sizeBytes || detail.estimatedSizeBytes,
        canLaunchOffline: entry.canLaunchOffline,
        drmType: entry.drmType,
        lastVerifiedAt: new Date().toISOString(),
      });
      toast.info("Install manifest verified locally");
    } else {
      toast.info(result.error.message);
    }
  };

  const handleResolveCloudSave = async (
    slot: CloudSaveSlot,
    resolution: CloudSaveResolution,
  ) => {
    try {
      await resolveCloudSaveConflict.mutateAsync({
        slotId: slot.id,
        resolution,
      });
      toast.success(
        resolution === "local"
          ? "Cloud save updated from local progress"
          : "Local save updated from cloud progress",
      );
    } catch (error) {
      toast.info(error instanceof Error ? error.message : "Could not resolve cloud save");
    }
  };

  const releaseYear = new Date(detail.releaseDate).getFullYear();
  const cloudSaveStatus =
    conflictSlots.length > 0
      ? "conflict"
      : cloudSaveSlots[0]?.status ?? entry.cloudSaveStatus ?? "unsupported";
  const offlineLaunchBlocked =
    settings.offlineModeEnabled && (!entry.installed || entry.canLaunchOffline !== true);
  const offlineLaunchStatus = !settings.offlineModeEnabled
    ? "Online mode"
    : entry.installed && entry.canLaunchOffline === true
      ? "Offline ready"
      : entry.installed
        ? "Online required"
        : "Not cached";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* ─── Hero band ─────────────────────────────────────────────────── */}
      <section className="relative -mx-8 -mt-7 h-[360px] sm:h-[400px] overflow-hidden md:h-[420px]">
        <img
          src={detail.headerUrl}
          alt=""
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: "brightness(0.55) saturate(1.15)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />

        {/* Top-right actions */}
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(ROUTES.gameDetail(detail.id))}
          >
            View Store Page
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setManageOpen((v) => !v)}
            >
              <Settings2 className="h-3.5 w-3.5" />
              Manage
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
            {manageOpen && (
              <div
                className="absolute right-0 top-9 z-20 w-52 overflow-hidden rounded-xl border border-separator bg-card shadow-xl"
                onMouseLeave={() => setManageOpen(false)}
              >
                <ManageItem
                  label="Add to collection"
                  onClick={() => {
                    setManageOpen(false);
                    toast.info("Collections coming soon");
                  }}
                />
                <ManageItem
                  label="Hide from library"
                  onClick={() => {
                    setManageOpen(false);
                    toast.info("Hidden (mock)");
                  }}
                />
                <ManageItem
                  label="Remove from library"
                  onClick={() => {
                    setManageOpen(false);
                    toast.info("Remove flow coming soon");
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Centered title + play */}
        <div className="absolute inset-x-0 bottom-0 z-[1] flex flex-col items-center px-6 pb-8 text-center">
          <h1 className="text-[44px] font-bold tracking-tight text-foreground sm:text-[52px]">
            {detail.name}
          </h1>
          <p className="mt-2 text-[12px] text-muted/80">
            <span className="tabular-nums">{releaseYear}</span>
            {detail.genres.length > 0 && (
              <> · {detail.genres.slice(0, 3).join(" · ")}</>
            )}
            <> · {detail.developer}</>
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {isPlaying ? (
              <button
                type="button"
                onClick={handleStop}
                className={cn(
                  "inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-b from-red to-red/85 px-10 text-[16px] font-bold text-background shadow-lg shadow-red/30 transition-all hover:brightness-110 active:brightness-95",
                  settings.largerFocusTargets && "h-14 px-12",
                )}
              >
                Stop Playing
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handlePlay()}
                aria-disabled={offlineLaunchBlocked}
                className={cn(
                  "inline-flex h-12 items-center gap-2 rounded-xl px-10 text-[16px] font-bold text-background shadow-lg transition-all active:brightness-95",
                  offlineLaunchBlocked
                    ? "bg-gradient-to-b from-red to-red/85 shadow-red/25 hover:brightness-105"
                    : "bg-gradient-to-b from-price to-price/85 shadow-price/30 hover:brightness-110",
                  settings.largerFocusTargets && "h-14 px-12",
                )}
              >
                <Play className="h-4 w-4" fill="currentColor" />
                {offlineLaunchBlocked ? "Offline Unavailable" : "Play"}
              </button>
            )}
            <button
              type="button"
              onClick={handleInstallToggle}
              className={cn(
                "inline-flex h-12 items-center gap-2 rounded-xl border px-5 text-[13px] font-semibold transition-all",
                entry.installed
                  ? "border-separator bg-card text-foreground/75 hover:bg-card-active"
                  : "border-acid/40 bg-acid/15 text-acid hover:bg-acid/25",
              )}
            >
              {entry.installed ? "Uninstall" : "Install"}
            </button>
          </div>

          {settings.controllerHints && (
            <div className="mt-3 flex flex-wrap justify-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/70">
              <span className="rounded-md border border-separator bg-background/40 px-2 py-1">
                A {offlineLaunchBlocked ? "Blocked" : "Play"}
              </span>
              <span className="rounded-md border border-separator bg-background/40 px-2 py-1">
                B Back
              </span>
              <span className="rounded-md border border-separator bg-background/40 px-2 py-1">
                Menu Manage
              </span>
            </div>
          )}

          <div className="mt-3 flex items-center gap-3 text-[11px] text-muted/70">
            {settings.offlineModeEnabled && (
              <>
                <span
                  className={cn(
                    "font-semibold",
                    offlineLaunchBlocked ? "text-red" : "text-green",
                  )}
                >
                  {offlineLaunchBlocked
                    ? entry.installed
                      ? "Online-only while offline mode is on"
                      : "Install required for offline play"
                    : "Cached and ready for offline play"}
                </span>
                <span className="text-muted/30">·</span>
              </>
            )}
            <button
              type="button"
              onClick={() => void handleOpenLocalFiles()}
              className="hover:text-foreground"
            >
              Browse local files
            </button>
            <span className="text-muted/30">·</span>
            <button
              type="button"
              onClick={() => void handleVerifyInstall()}
              className="hover:text-foreground"
            >
              Verify install
            </button>
          </div>
        </div>
      </section>

      {/* ─── Stats row ─────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          value={formatHours(entry.playMinutes)}
          subLabel="Total"
          label="Hours played"
        />
        <StatTile
          value={formatHours(last2WeeksMinutes)}
          subLabel="Past 14 days"
          label="Last 2 weeks"
        />
        <Card className="p-4">
          <p className="text-[11px] uppercase tracking-widest text-muted/60">
            Achievements
          </p>
          <p className="mt-1 text-[18px] font-semibold tabular-nums text-foreground">
            {entry.achievementsUnlocked}
            <span className="text-[12px] font-normal text-muted/60">
              {" "}
              / {detail.achievementCount}
            </span>
          </p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-input">
            <div
              className="h-full rounded-full bg-acid transition-all"
              style={{ width: `${achievementPct}%` }}
            />
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] uppercase tracking-widest text-muted/60">
            Completion
          </p>
          <div className="mt-1 flex items-center gap-3">
            <p className="text-[18px] font-semibold tabular-nums text-foreground">
              {entry.completionPct}%
            </p>
            <CompletionCircle pct={entry.completionPct} />
          </div>
        </Card>
      </section>

      {/* ─── Main content grid ─────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <CloudSaveConflictResolver
            gameName={detail.name}
            slots={conflictSlots}
            resolving={resolveCloudSaveConflict.isPending}
            onResolve={(slot, resolution) => void handleResolveCloudSave(slot, resolution)}
          />

          {/* Recent activity */}
          <Card className="p-5">
            <header className="mb-3 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted/60" />
              <h2 className="text-[14px] font-semibold text-foreground">
                Recent activity
              </h2>
            </header>
            {recentSessions.length === 0 ? (
              <p className="text-[12px] text-muted/60">
                No sessions logged yet. Start the game to track your playtime.
              </p>
            ) : (
              <ul className="divide-y divide-separator/60">
                {recentSessions.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between py-2.5 text-[12px]"
                  >
                    <span className="text-foreground/80">
                      {formatSessionDate(s.date)}
                    </span>
                    <span className="font-medium tabular-nums text-foreground">
                      {formatSessionMinutes(s.minutes)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Achievements */}
          <Card className="p-5">
            <header className="mb-3 flex items-baseline justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-3.5 w-3.5 text-muted/60" />
                <h2 className="text-[14px] font-semibold text-foreground">
                  Achievements
                </h2>
              </div>
              <button
                type="button"
                onClick={() => toast.info("Achievements panel coming soon")}
                className="text-[11px] text-muted/70 hover:text-foreground"
              >
                View all {detail.achievementCount} →
              </button>
            </header>
            <ul className="space-y-2.5">
              {detail.achievements.slice(0, 4).map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-3 rounded-lg bg-card-active/50 p-2.5"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-input">
                    {a.iconUrl ? (
                      <img
                        src={a.iconUrl}
                        alt=""
                        className="h-9 w-9 rounded-md object-cover"
                      />
                    ) : (
                      <Trophy className="h-4 w-4 text-acid" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-foreground">
                      {a.name}
                    </p>
                    <p className="truncate text-[11px] text-muted/60">
                      {a.description}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted/70">
                    {Math.round(a.globalUnlockPct)}%
                  </span>
                </li>
              ))}
              {detail.achievements.length === 0 && (
                <li className="text-[12px] text-muted/60">
                  No achievements available.
                </li>
              )}
            </ul>
          </Card>

          {/* News & patches */}
          {detail.patchNotes && detail.patchNotes.length > 0 && (
            <Card className="p-5">
              <header className="mb-3 flex items-baseline justify-between">
                <div className="flex items-center gap-2">
                  <Newspaper className="h-3.5 w-3.5 text-muted/60" />
                  <h2 className="text-[14px] font-semibold text-foreground">
                    News & patches
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`${ROUTES.gameDb(detail.id)}#patches`)}
                  className="text-[11px] text-muted/70 hover:text-foreground"
                >
                  View all updates →
                </button>
              </header>
              <ul className="space-y-3">
                {detail.patchNotes.slice(0, 3).map((p) => (
                  <li
                    key={p.version}
                    className="border-l-2 border-separator pl-3"
                  >
                    <div className="flex items-baseline gap-2">
                      <p className="text-[12px] font-semibold text-foreground">
                        {p.title}
                      </p>
                      <span className="text-[10px] text-muted/60">
                        {relativeDate(p.date)}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-muted/70">
                      {(p.bullets ?? []).join(" · ").slice(0, 100)}
                      {(p.bullets ?? []).join(" · ").length > 100 && "…"}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Time to beat */}
          {detail.playtime && (
            <Card className="p-5">
              <header className="mb-3 flex items-center gap-2">
                <FolderOpen className="h-3.5 w-3.5 text-muted/60" />
                <h2 className="text-[14px] font-semibold text-foreground">
                  Time to beat
                </h2>
              </header>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <PlaytimeTile
                  label="Main story"
                  hours={detail.playtime.mainHours}
                />
                <PlaytimeTile
                  label="Main + Extras"
                  hours={detail.playtime.mainPlusSidesHours}
                />
                <PlaytimeTile
                  label="Completionist"
                  hours={detail.playtime.completionistHours}
                />
                <PlaytimeTile
                  label="All Styles"
                  hours={Math.round(
                    (detail.playtime.mainHours +
                      detail.playtime.mainPlusSidesHours +
                      detail.playtime.completionistHours) /
                      3,
                  )}
                />
              </div>
              <p className="mt-3 text-[10px] text-muted/50">
                Estimates via {detail.playtime.source}
              </p>
            </Card>
          )}
        </div>

        {/* Side rail */}
        <aside className="space-y-4">
          <AutoTuner gameId={detail.id} />
          <CloudSaves gameId={detail.id} />
          <ModCompatibility mods={["HD Textures", "Better Lighting", "UI Tweaks"]} />
          <Card className="p-4">
            <h2 className="mb-3 text-[14px] font-semibold text-foreground">
              Install & access
            </h2>
            <dl className="space-y-2 text-[12px]">
              <InfoRow label="Source" value={launcherLabel(entry.sourceLauncher)} />
              <InfoRow label="DRM" value={entry.drmType ?? "unknown"} />
              <InfoRow label="Offline mode" value={settings.offlineModeEnabled ? "On" : "Off"} />
              <InfoRow
                label="Offline launch"
                value={offlineLaunchStatus}
              />
              <InfoRow label="Cloud saves" value={cloudSaveStatus} />
              {entry.sources && entry.sources.length > 1 && (
                <InfoRow label="Detected copies" value={entry.sources.length.toString()} />
              )}
            </dl>
          </Card>
          <CompatibilityPanel gameId={detail.id} compact />
          <FriendsWhoOwn gameId={detail.id} />
        </aside>
      </section>

      <ReviewPollModal game={detail} open={pollOpen} onClose={() => setPollOpen(false)} />
    </motion.div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────

function StatTile({
  value,
  subLabel,
  label,
}: {
  value: string;
  subLabel: string;
  label: string;
}) {
  return (
    <Card className="p-4">
      <p className="text-[11px] uppercase tracking-widest text-muted/60">
        {label}
      </p>
      <p className="mt-1 text-[18px] font-semibold tabular-nums text-foreground">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-muted/60">{subLabel}</p>
    </Card>
  );
}

function PlaytimeTile({ label, hours }: { label: string; hours: number }) {
  return (
    <div className="rounded-lg bg-card-active/60 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted/60">
        {label}
      </p>
      <p className="mt-1 text-[15px] font-semibold tabular-nums text-foreground">
        {hours}
        <span className="text-[10px] font-normal text-muted/60"> hrs</span>
      </p>
    </div>
  );
}

function CompletionCircle({ pct }: { pct: number }) {
  const size = 40;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, pct));
  const dashOffset = circumference - (clamped / 100) * circumference;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={stroke}
        fill="none"
        className="text-input"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        className={cn(clamped >= 100 ? "text-green" : "text-acid")}
      />
    </svg>
  );
}

function launcherLabel(source: LibraryEntry["sourceLauncher"]): string {
  const labels: Record<NonNullable<LibraryEntry["sourceLauncher"]>, string> = {
    dreamworks: "Dreamworks",
    manual: "Manual",
    steam: "Steam",
    epic: "Epic Games",
    gog: "GOG Galaxy",
    ubisoft: "Ubisoft Connect",
    "ea-app": "EA App",
    "xbox-pc": "Xbox PC",
    rockstar: "Rockstar",
    battlenet: "Battle.net",
    amazon: "Amazon Games",
  };
  return source ? labels[source] : "Dreamworks";
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-separator/40 pb-2 last:border-0 last:pb-0">
      <dt className="text-muted/60">{label}</dt>
      <dd className="truncate text-right font-medium text-foreground/80">{value}</dd>
    </div>
  );
}

function ManageItem({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
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
