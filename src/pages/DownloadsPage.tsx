import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FolderOpen,
  Gauge,
  HardDrive,
  MoveRight,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Server,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ToggleRow } from "@/components/ui/toggle-row";
import { useDownloadStore } from "@/stores/download-store";
import { useLibraryStore } from "@/stores/library-store";
import { useUiStore } from "@/stores/ui-store";
import { toast } from "@/stores/toast-store";
import { useStartDownload } from "@/hooks/use-start-download";
import {
  STORAGE_DRIVES,
  buildCleanupCandidates,
  buildMovedInstallPath,
  installPathForGame,
  resolveDriveForPath,
  type CleanupCandidate,
  type StorageDrive,
} from "@/lib/api/storage";
import {
  moveInstall,
  openInstallFolder,
  readBackupManifest,
  uninstallGame,
  verifyInstall,
  writeBackupManifest,
} from "@/lib/api/downloads";
import { isDesktop, pathExistsSafe } from "@/lib/platform";
import { getGameById } from "@/lib/mock";
import { cn, formatBytes, relativeDate } from "@/lib/utils";
import type { DownloadLimitOption, DownloadStatus, DownloadTask, GameId, LibraryEntry } from "@/lib/types";

const ENGINE_SIZE_BYTES = 4_500_000_000;
const MOCK_DISK_BYTES = 1_000_000_000_000;

const LIMIT_OPTIONS: Array<{ value: DownloadLimitOption; label: string }> = [
  { value: "unlimited", label: "Unlimited" },
  { value: "10", label: "10 MB/s" },
  { value: "25", label: "25 MB/s" },
  { value: "50", label: "50 MB/s" },
  { value: "100", label: "100 MB/s" },
];

const REGION_OPTIONS = [
  "US East (New York)",
  "US West (San Jose)",
  "Europe West (Frankfurt)",
  "Asia East (Tokyo)",
  "South America (São Paulo)",
];

interface BackupManifest {
  id: string;
  createdAt: string;
  gameCount: number;
  sizeBytes: number;
  targetPath: string;
}

const STATUS_LABELS: Record<DownloadStatus, string> = {
  queued: "Queued",
  downloading: "Downloading",
  verifying: "Verifying",
  extracting: "Extracting",
  complete: "Complete",
  error: "Failed",
  cancelled: "Cancelled",
  paused: "Paused",
};

function isRunning(status: DownloadStatus) {
  return ["queued", "downloading", "verifying", "extracting"].includes(status);
}

function isFinished(status: DownloadStatus) {
  return ["complete", "cancelled", "error"].includes(status);
}

function statusTone(status: DownloadStatus) {
  if (status === "complete") return "text-green bg-green/10";
  if (status === "error" || status === "cancelled") return "text-red/80 bg-red/10";
  if (status === "paused") return "text-orange bg-orange/10";
  return "text-positive bg-positive/10";
}

function bytesPerSecond(limit: DownloadLimitOption) {
  if (limit === "unlimited") return 42_000_000;
  return Number(limit) * 1_000_000;
}

function formatEta(task: DownloadTask, limit: DownloadLimitOption) {
  if (task.status === "complete") return "Ready";
  if (task.status === "paused") return "Paused";
  if (task.status === "cancelled") return "Cancelled";
  if (task.status === "error") return "Needs attention";
  if (task.status === "verifying") return "Verifying";
  if (task.status === "extracting") return "Extracting";
  const remaining = Math.max(0, task.totalBytes - task.downloadedBytes);
  const seconds = Math.ceil(remaining / bytesPerSecond(limit));
  if (seconds <= 0) return "Finishing";
  if (seconds < 60) return `${seconds}s left`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)}m left`;
  return `${Math.ceil(seconds / 3600)}h left`;
}

function formatSpeed(status: DownloadStatus, limit: DownloadLimitOption) {
  if (!isRunning(status) || status === "queued") return "--";
  if (status === "verifying") return "Disk";
  if (status === "extracting") return "CPU";
  return limit === "unlimited" ? "42 MB/s" : `${limit} MB/s`;
}

function taskSortScore(task: DownloadTask) {
  if (isRunning(task.status)) return 0;
  if (task.status === "paused") return 1;
  return 2;
}

export function DownloadsPage() {
  const tasks = useDownloadStore((s) => s.tasks);
  const pause = useDownloadStore((s) => s.pause);
  const resume = useDownloadStore((s) => s.resume);
  const cancel = useDownloadStore((s) => s.cancel);
  const retryTask = useDownloadStore((s) => s.retry);
  const clearCompleted = useDownloadStore((s) => s.clearCompleted);
  const libraryEntries = useLibraryStore((s) => s.entries);
  const moveInstallPath = useLibraryStore((s) => s.moveInstallPath);
  const { settings, updateSettings } = useUiStore();
  const startDownload = useStartDownload();
  const desktop = isDesktop();
  const [moveProgress, setMoveProgress] = useState<Record<GameId, number>>({});
  const [verifyState, setVerifyState] = useState<Record<GameId, "verified" | "verifying">>({});
  const [backupTarget, setBackupTarget] = useState("/Backups/Dreamworks/library-manifest.json");
  const [backupManifest, setBackupManifest] = useState<BackupManifest | null>(null);
  const [restorePath, setRestorePath] = useState("/Volumes/Vault/Dreamworks/elden-ring");
  const [restoreStatus, setRestoreStatus] = useState("No restore session");
  const [selectedCleanupIds, setSelectedCleanupIds] = useState<Set<string>>(new Set());
  const cleanupSeededRef = useRef(false);

  const runningTasks = useMemo(() => tasks.filter((task) => isRunning(task.status)), [tasks]);
  const pausedTasks = useMemo(() => tasks.filter((task) => task.status === "paused"), [tasks]);
  const finishedTasks = useMemo(() => tasks.filter((task) => isFinished(task.status)), [tasks]);
  const sortedTasks = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        const statusSort = taskSortScore(a) - taskSortScore(b);
        if (statusSort !== 0) return statusSort;
        return new Date(b.updatedAt ?? b.queuedAt ?? 0).getTime() - new Date(a.updatedAt ?? a.queuedAt ?? 0).getTime();
      }),
    [tasks],
  );

  const installedBytes = useMemo(
    () =>
      libraryEntries
        .filter((entry) => entry.installed)
        .reduce((sum, entry) => sum + entry.sizeBytes, 0),
    [libraryEntries],
  );
  const installedEntries = useMemo(
    () => libraryEntries.filter((entry) => entry.installed),
    [libraryEntries],
  );
  const downloadedBytes = useMemo(
    () => tasks.reduce((sum, task) => sum + task.downloadedBytes, 0),
    [tasks],
  );
  const queuedBytes = useMemo(
    () =>
      tasks
        .filter((task) => isRunning(task.status) || task.status === "paused")
        .reduce((sum, task) => sum + Math.max(0, task.totalBytes - task.downloadedBytes), 0),
    [tasks],
  );
  const storagePct = Math.min(100, Math.round((installedBytes / MOCK_DISK_BYTES) * 100));
  const activeSpeed = runningTasks.length ? bytesPerSecond(settings.downloadLimit) : 0;
  const cleanupCandidates = useMemo(
    () =>
      buildCleanupCandidates(installedEntries, (entry) =>
        installPathForGame(entry.gameId, entry.installPath, settings.installPath),
      ),
    [installedEntries, settings.installPath],
  );
  useEffect(() => {
    if (cleanupSeededRef.current || cleanupCandidates.length === 0) return;
    cleanupSeededRef.current = true;
    setSelectedCleanupIds(
      new Set(
        cleanupCandidates.filter((c) => c.selected).map((c) => c.id),
      ),
    );
  }, [cleanupCandidates]);

  const selectedCleanupBytes = useMemo(
    () =>
      cleanupCandidates
        .filter((candidate) => selectedCleanupIds.has(candidate.id))
        .reduce((sum, candidate) => sum + candidate.sizeBytes, 0),
    [cleanupCandidates, selectedCleanupIds],
  );

  const toggleCleanup = (id: string) => {
    setSelectedCleanupIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCleanup = async () => {
    const selected = cleanupCandidates.filter((c) => selectedCleanupIds.has(c.id));
    if (selected.length === 0) return;
    const bytes = selected.reduce((sum, c) => sum + c.sizeBytes, 0);

    if (desktop) {
      const gameCandidates = selected.filter((c) =>
        installedEntries.some((e) => e.gameId === c.source),
      );
      for (const candidate of gameCandidates) {
        const entry = installedEntries.find((e) => e.gameId === candidate.source);
        if (!entry) continue;
        const installPath = installPathForGame(
          entry.gameId,
          entry.installPath,
          settings.installPath,
        );
        await uninstallGame({ gameId: entry.gameId, installPath });
      }
    }

    setSelectedCleanupIds(new Set());
    toast.success(`Reclaimed ${formatBytes(bytes)}`);
  };
  const driveStats = useMemo(
    () =>
      STORAGE_DRIVES.map((drive) => {
        const installedOnDrive = installedEntries.reduce((sum, entry) => {
          const path = installPathForGame(entry.gameId, entry.installPath, settings.installPath);
          return resolveDriveForPath(path).id === drive.id ? sum + entry.sizeBytes : sum;
        }, 0);
        const queuedOnDrive = tasks.reduce((sum, task) => {
          const path = task.installPath ?? settings.installPath;
          return resolveDriveForPath(path).id === drive.id
            ? sum + Math.max(0, task.totalBytes - task.downloadedBytes)
            : sum;
        }, 0);
        const cleanupOnDrive = cleanupCandidates
          .filter((candidate) => candidate.driveId === drive.id)
          .reduce((sum, candidate) => sum + candidate.sizeBytes, 0);
        const usedBytes = drive.reservedBytes + installedOnDrive + queuedOnDrive;

        return {
          ...drive,
          installedBytes: installedOnDrive,
          queuedBytes: queuedOnDrive,
          cleanupBytes: cleanupOnDrive,
          freeBytes: Math.max(0, drive.totalBytes - usedBytes),
          usedPct: Math.min(100, Math.round((usedBytes / drive.totalBytes) * 100)),
        };
      }),
    [cleanupCandidates, installedEntries, settings.installPath, tasks],
  );

  const handleStartEngine = () => {
    const existing = tasks.find(
      (task) =>
        task.gameId === "Dreams Engine" &&
        !["complete", "cancelled", "error"].includes(task.status),
    );
    if (existing) {
      toast.info("Dreams Engine is already in the queue");
      return;
    }
    startDownload("Dreams Engine", ENGINE_SIZE_BYTES, { silent: true });
    toast.success("Dreams Engine download started");
  };

  const handleRetry = (task: DownloadTask) => {
    retryTask(task.taskId);
    toast.success(`${task.gameId} resuming`);
  };

  const handlePauseAll = () => {
    runningTasks.forEach((task) => pause(task.taskId));
    toast.info("Active downloads paused");
  };

  const handleResumeAll = () => {
    pausedTasks.forEach((task) => resume(task.taskId));
    toast.success("Paused downloads resumed");
  };

  const handleOpenFolder = async (task?: DownloadTask) => {
    const path = task?.installPath ?? settings.installPath;
    if (!desktop) {
      toast.info("Open folder is desktop-only");
      return;
    }
    const result = await openInstallFolder(path);
    if (!result.ok) toast.error(result.error.message);
  };

  const handleClearFinished = () => {
    clearCompleted();
    toast.success("Finished downloads cleared");
  };

  const handleMoveInstall = async (entry: LibraryEntry, targetDriveId: string) => {
    const fromPath = installPathForGame(
      entry.gameId,
      entry.installPath,
      settings.installPath,
    );
    const toPath = buildMovedInstallPath(entry.gameId, targetDriveId);
    if (fromPath === toPath) return;

    setMoveProgress((current) => ({ ...current, [entry.gameId]: 35 }));
    toast.info(`Moving ${entry.gameId}`);

    if (desktop) {
      const result = await moveInstall({
        gameId: entry.gameId,
        fromPath,
        toPath,
      });
      setMoveProgress((current) => {
        const next = { ...current };
        delete next[entry.gameId];
        return next;
      });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      await moveInstallPath(entry.gameId, toPath);
      toast.success(`${entry.gameId} moved to ${toPath}`);
      return;
    }

    // Web fallback: simulate
    window.setTimeout(() => {
      setMoveProgress((current) => ({ ...current, [entry.gameId]: 72 }));
    }, 450);
    window.setTimeout(async () => {
      await moveInstallPath(entry.gameId, toPath);
      setMoveProgress((current) => {
        const next = { ...current };
        delete next[entry.gameId];
        return next;
      });
      toast.success(`${entry.gameId} moved to ${toPath}`);
    }, 900);
  };

  const handleVerifyInstall = async (entry: LibraryEntry) => {
    setVerifyState((current) => ({ ...current, [entry.gameId]: "verifying" }));
    toast.info(`Verifying ${entry.gameId}`);

    if (desktop) {
      const installPath = installPathForGame(
        entry.gameId,
        entry.installPath,
        settings.installPath,
      );
      const result = await verifyInstall({ gameId: entry.gameId, installPath });
      if (result.ok && result.data.exists) {
        setVerifyState((current) => ({ ...current, [entry.gameId]: "verified" }));
        toast.success(`${entry.gameId} verified`);
      } else {
        setVerifyState((current) => {
          const next = { ...current };
          delete next[entry.gameId];
          return next;
        });
        toast.error(
          result.ok
            ? `${entry.gameId} install folder missing`
            : result.error.message,
        );
      }
      return;
    }

    // Web fallback
    window.setTimeout(() => {
      setVerifyState((current) => ({ ...current, [entry.gameId]: "verified" }));
      toast.success(`${entry.gameId} verified`);
    }, 800);
  };

  const handleCreateBackup = async () => {
    const manifest: BackupManifest = {
      id: `manifest-${Date.now()}`,
      createdAt: new Date().toISOString(),
      gameCount: installedEntries.length,
      sizeBytes: installedBytes,
      targetPath: backupTarget,
    };

    if (desktop) {
      const ok = await writeBackupManifest(backupTarget, {
        ...manifest,
        entries: installedEntries.map((e) => ({
          gameId: e.gameId,
          sizeBytes: e.sizeBytes,
          installPath: e.installPath,
        })),
      });
      if (!ok) {
        toast.error("Failed to write backup manifest");
        return;
      }
    }

    setBackupManifest(manifest);
    toast.success("Backup manifest created");
  };

  const handleRestoreRelink = async () => {
    if (desktop) {
      const exists = await pathExistsSafe(restorePath);
      if (!exists) {
        setRestoreStatus(`Path not found: ${restorePath}`);
        toast.error("Restore path does not exist");
        return;
      }
    }
    const selectedGame = installedEntries[0];
    if (selectedGame) {
      await moveInstallPath(selectedGame.gameId, restorePath);
      setRestoreStatus(`Relinked ${selectedGame.gameId} from ${restorePath}`);
      toast.success("Install relinked");
      return;
    }
    setRestoreStatus(`Restore path staged at ${restorePath}`);
    toast.info("Restore path staged");
  };

  const handleValidateBackup = async () => {
    if (desktop) {
      const onDisk = await readBackupManifest(backupTarget);
      if (!onDisk) {
        setRestoreStatus(`No manifest found at ${backupTarget}`);
        toast.error("Backup manifest not found on disk");
        return;
      }
      setRestoreStatus(
        `Validated ${onDisk.gameCount} entries (${formatBytes(onDisk.sizeBytes)})`,
      );
      toast.success("Backup manifest validated");
      return;
    }
    const count = backupManifest?.gameCount ?? installedEntries.length;
    setRestoreStatus(`Validated ${count} manifest entries`);
    toast.success("Backup manifest validated");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted/45">
            Launcher
          </p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-foreground">
            Downloads
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleStartEngine} className="rounded-full">
            <Download className="h-4 w-4" />
            Dreams Engine
          </Button>
          <Button
            variant="secondary"
            onClick={handlePauseAll}
            disabled={runningTasks.length === 0}
          >
            <Pause className="h-4 w-4" />
            Pause all
          </Button>
          <Button
            variant="secondary"
            onClick={handleResumeAll}
            disabled={pausedTasks.length === 0}
          >
            <Play className="h-4 w-4" fill="currentColor" />
            Resume all
          </Button>
          <Button
            variant="ghost"
            onClick={handleClearFinished}
            disabled={finishedTasks.length === 0}
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Download className="h-4 w-4" />}
          label="Active"
          value={String(runningTasks.length)}
          detail={`${pausedTasks.length} paused`}
        />
        <MetricCard
          icon={<Gauge className="h-4 w-4" />}
          label="Speed"
          value={activeSpeed > 0 ? formatBytes(activeSpeed) + "/s" : "--"}
          detail={settings.downloadLimit === "unlimited" ? "Unlimited" : `${settings.downloadLimit} MB/s limit`}
        />
        <MetricCard
          icon={<HardDrive className="h-4 w-4" />}
          label="Queued"
          value={formatBytes(queuedBytes)}
          detail={`${formatBytes(downloadedBytes)} downloaded`}
        />
        <MetricCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Finished"
          value={String(finishedTasks.filter((task) => task.status === "complete").length)}
          detail={`${finishedTasks.length} total history`}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="overflow-hidden rounded-xl border border-separator bg-card/35">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <h2 className="text-[14px] font-semibold text-foreground">Queue</h2>
              <p className="text-[11px] text-muted/45">
                {tasks.length === 0 ? "No active transfers" : `${tasks.length} transfer records`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenFolder()}
              className="inline-flex h-8 items-center gap-2 rounded-lg px-2.5 text-[12px] font-medium text-muted hover:bg-input hover:text-foreground/80"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              Folder
            </button>
          </div>

          {tasks.length > 0 ? (
            <>
              <div className="hidden grid-cols-[minmax(0,1.35fr)_minmax(170px,0.9fr)_90px_110px_136px] gap-4 border-y border-separator/70 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted/35 md:grid">
                <span>Title</span>
                <span>Progress</span>
                <span>Speed</span>
                <span>ETA</span>
                <span className="text-right">Actions</span>
              </div>
              <div className="divide-y divide-separator/55">
                {sortedTasks.map((task) => (
                  <TaskRow
                    key={task.taskId}
                    task={task}
                    downloadLimit={settings.downloadLimit}
                    fallbackInstallPath={settings.installPath}
                    onPause={() => pause(task.taskId)}
                    onResume={() => resume(task.taskId)}
                    onCancel={() => cancel(task.taskId)}
                    onRetry={() => handleRetry(task)}
                    onOpenFolder={() => handleOpenFolder(task)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 px-6 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-card-active">
                <Download className="h-7 w-7 text-muted/55" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-foreground">Nothing downloading</h3>
                <p className="mt-1 text-[12px] text-muted/50">
                  Queue installs, updates, and repairs from here.
                </p>
              </div>
              <Button onClick={handleStartEngine} size="sm" className="rounded-full">
                <Download className="h-3.5 w-3.5" />
                Dreams Engine
              </Button>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-separator bg-card/35 p-4">
            <div className="mb-4 flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-muted/55" />
              <h2 className="text-[14px] font-semibold text-foreground">Transfer Settings</h2>
            </div>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-muted/45">
                  Speed limit
                </span>
                <select
                  value={settings.downloadLimit}
                  onChange={(e) =>
                    updateSettings({ downloadLimit: e.target.value as DownloadLimitOption })
                  }
                  className="h-9 w-full rounded-lg border border-separator bg-input px-3 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-acid/20"
                >
                  {LIMIT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-muted/45">
                  Region
                </span>
                <div className="flex h-9 items-center gap-2 rounded-lg border border-separator bg-input px-3">
                  <Server className="h-3.5 w-3.5 shrink-0 text-muted/45" />
                  <select
                    value={settings.downloadRegion}
                    onChange={(e) => updateSettings({ downloadRegion: e.target.value })}
                    className="w-full bg-transparent text-[12px] text-foreground focus:outline-none"
                  >
                    {REGION_OPTIONS.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-muted/45">
                  Install folder
                </span>
                <Input
                  value={settings.installPath}
                  onChange={(e) => updateSettings({ installPath: e.target.value })}
                  className="h-9 rounded-lg text-[12px]"
                />
              </label>

              <div className="rounded-lg bg-card-active/35 px-3 py-1">
                <ToggleRow
                  label="Downloads during gameplay"
                  description="Throttle-safe background transfers"
                  checked={settings.allowDownloadsDuringGameplay}
                  onCheckedChange={(next) =>
                    updateSettings({ allowDownloadsDuringGameplay: next })
                  }
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-separator bg-card/35 p-4">
            <div className="mb-4 flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted/55" />
              <h2 className="text-[14px] font-semibold text-foreground">Storage</h2>
            </div>
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-[12px]">
                  <span className="text-muted/55">Installed</span>
                  <span className="font-medium text-foreground/85">
                    {formatBytes(installedBytes)} / {formatBytes(MOCK_DISK_BYTES)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-card-active">
                  <div
                    className="h-full rounded-full bg-foreground/65 transition-all"
                    style={{ width: `${storagePct}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <StorageStat label="Queue" value={formatBytes(queuedBytes)} />
                <StorageStat
                  label="Free"
                  value={formatBytes(Math.max(0, MOCK_DISK_BYTES - installedBytes))}
                />
              </div>
            </div>
          </section>
        </aside>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-[17px] font-semibold tracking-tight text-foreground">
              Storage Manager
            </h2>
            <p className="text-[12px] text-muted/45">
              Drives, installs, cleanup, and backup recovery in one place.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={handleCleanup}
            disabled={selectedCleanupBytes === 0}
          >
            <Trash2 className="h-4 w-4" />
            Clean {formatBytes(selectedCleanupBytes)}
          </Button>
        </div>

        <div className="grid gap-3 xl:grid-cols-3">
          {driveStats.map((drive) => (
            <DriveCard key={drive.id} drive={drive} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Card className="overflow-hidden bg-card/35">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <h3 className="text-[14px] font-semibold text-foreground">
                  Installed Library
                </h3>
                <p className="text-[11px] text-muted/45">
                  {installedEntries.length} installed games across {STORAGE_DRIVES.length} drives
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleOpenFolder()}>
                <FolderOpen className="h-3.5 w-3.5" />
                Folder
              </Button>
            </div>

            <div className="hidden grid-cols-[minmax(0,1.15fr)_minmax(190px,1fr)_88px_170px] gap-4 border-y border-separator/70 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted/35 md:grid">
              <span>Game</span>
              <span>Install path</span>
              <span>Size</span>
              <span className="text-right">Actions</span>
            </div>
            <div className="divide-y divide-separator/55">
              {installedEntries.map((entry) => (
                <InstalledGameRow
                  key={entry.gameId}
                  entry={entry}
                  installPath={installPathForGame(
                    entry.gameId,
                    entry.installPath,
                    settings.installPath,
                  )}
                  moveProgress={moveProgress[entry.gameId]}
                  verifyState={verifyState[entry.gameId]}
                  onMove={(driveId) => handleMoveInstall(entry, driveId)}
                  onVerify={() => handleVerifyInstall(entry)}
                />
              ))}
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="bg-card/35 p-4">
              <div className="mb-4 flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-muted/55" />
                <h3 className="text-[14px] font-semibold text-foreground">
                  Cleanup Candidates
                </h3>
              </div>
              <div className="space-y-2">
                {cleanupCandidates.slice(0, 5).map((candidate) => (
                  <CleanupCandidateRow
                    key={candidate.id}
                    candidate={candidate}
                    selected={selectedCleanupIds.has(candidate.id)}
                    onToggle={() => toggleCleanup(candidate.id)}
                  />
                ))}
              </div>
            </Card>

            <Card className="bg-card/35 p-4">
              <div className="mb-4 flex items-center gap-2">
                <Archive className="h-4 w-4 text-muted/55" />
                <h3 className="text-[14px] font-semibold text-foreground">
                  Backup & Restore
                </h3>
              </div>
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-muted/45">
                    Backup manifest
                  </span>
                  <Input
                    value={backupTarget}
                    onChange={(e) => setBackupTarget(e.target.value)}
                    className="h-9 rounded-lg text-[12px]"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" onClick={handleCreateBackup}>
                    <Archive className="h-4 w-4" />
                    Manifest
                  </Button>
                  <Button variant="ghost" onClick={handleValidateBackup}>
                    <ClipboardCheck className="h-4 w-4" />
                    Validate
                  </Button>
                </div>
                {backupManifest && (
                  <div className="rounded-lg bg-card-active/35 px-3 py-2">
                    <p className="text-[12px] font-semibold text-foreground/85">
                      {backupManifest.gameCount} games · {formatBytes(backupManifest.sizeBytes)}
                    </p>
                    <p className="mt-1 truncate text-[11px] text-muted/45">
                      {backupManifest.targetPath}
                    </p>
                    <p className="mt-1 text-[10px] text-muted/35">
                      Created {relativeDate(backupManifest.createdAt)}
                    </p>
                  </div>
                )}
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-muted/45">
                    Restore or relink path
                  </span>
                  <Input
                    value={restorePath}
                    onChange={(e) => setRestorePath(e.target.value)}
                    className="h-9 rounded-lg text-[12px]"
                  />
                </label>
                <Button onClick={handleRestoreRelink} className="w-full">
                  <MoveRight className="h-4 w-4" />
                  Restore / relink
                </Button>
                <div className="rounded-lg bg-card-active/35 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted/35">
                    Status
                  </p>
                  <p className="mt-1 text-[12px] text-foreground/80">{restoreStatus}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-separator bg-card/35 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-muted/55">{icon}</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted/35">
          {label}
        </span>
      </div>
      <p className="text-[22px] font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-[11px] text-muted/45">{detail}</p>
    </div>
  );
}

function StorageStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card-active/35 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted/35">
        {label}
      </p>
      <p className="mt-1 text-[13px] font-semibold text-foreground/85">{value}</p>
    </div>
  );
}

type DriveStats = StorageDrive & {
  installedBytes: number;
  queuedBytes: number;
  cleanupBytes: number;
  freeBytes: number;
  usedPct: number;
};

function DriveCard({ drive }: { drive: DriveStats }) {
  return (
    <Card className="bg-card/35 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[14px] font-semibold text-foreground">
            {drive.name}
          </h3>
          <p className="mt-0.5 truncate text-[11px] text-muted/45">{drive.rootPath}</p>
        </div>
        <HardDrive className="h-4 w-4 shrink-0 text-muted/55" />
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-card-active">
        <div
          className="h-full rounded-full bg-foreground/65 transition-all"
          style={{ width: `${drive.usedPct}%` }}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <StorageStat label="Installed" value={formatBytes(drive.installedBytes)} />
        <StorageStat label="Free" value={formatBytes(drive.freeBytes)} />
        <StorageStat label="Queue" value={formatBytes(drive.queuedBytes)} />
        <StorageStat label="Cleanup" value={formatBytes(drive.cleanupBytes)} />
      </div>
    </Card>
  );
}

function CleanupCandidateRow({
  candidate,
  selected,
  onToggle,
}: {
  candidate: CleanupCandidate;
  selected: boolean;
  onToggle: () => void;
}) {
  const drive = STORAGE_DRIVES.find((item) => item.id === candidate.driveId);

  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-card-active/35 px-3 py-2 hover:bg-card-active/55">
      <div className="flex min-w-0 items-center gap-2.5">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="h-3.5 w-3.5 shrink-0 cursor-pointer rounded border border-separator bg-input accent-acid focus:outline-none focus:ring-1 focus:ring-acid/40"
        />
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold text-foreground/85">
            {candidate.label}
          </p>
          <p className="mt-0.5 truncate text-[10px] text-muted/40">
            {candidate.source} · {drive?.name ?? "Unknown drive"}
          </p>
        </div>
      </div>
      <p className="shrink-0 text-[12px] font-semibold text-foreground/75">
        {formatBytes(candidate.sizeBytes)}
      </p>
    </label>
  );
}

function InstalledGameRow({
  entry,
  installPath,
  moveProgress,
  verifyState,
  onMove,
  onVerify,
}: {
  entry: LibraryEntry;
  installPath: string;
  moveProgress?: number;
  verifyState?: "verified" | "verifying";
  onMove: (driveId: string) => void;
  onVerify: () => void;
}) {
  const game = getGameById(entry.gameId);
  const drive = resolveDriveForPath(installPath);
  const moving = typeof moveProgress === "number";

  return (
    <div className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1.15fr)_minmax(190px,1fr)_88px_170px] md:items-center md:gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 shrink-0 text-muted/55" />
          <p className="truncate text-[13px] font-semibold text-foreground/90">
            {game?.name ?? entry.gameId}
          </p>
        </div>
        <p className="mt-1 truncate text-[11px] text-muted/40">{drive.name}</p>
      </div>

      <div className="min-w-0">
        <p className="truncate text-[12px] font-medium text-foreground/75">
          {installPath}
        </p>
        {moving ? (
          <div className="mt-2">
            <div className="h-1.5 overflow-hidden rounded-full bg-card-active">
              <div
                className="h-full rounded-full bg-acid transition-all duration-300"
                style={{ width: `${moveProgress}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-muted/40">Moving install files</p>
          </div>
        ) : (
          <p className="mt-1 text-[10px] text-muted/35">
            {verifyState === "verified" ? "Verified today" : "Ready"}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between md:block">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted/35 md:hidden">
          Size
        </span>
        <span className="text-[12px] font-semibold text-foreground/75">
          {formatBytes(entry.sizeBytes)}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <select
          value={drive.id}
          onChange={(event) => onMove(event.target.value)}
          disabled={moving}
          aria-label={`Move ${game?.name ?? entry.gameId}`}
          className="h-8 max-w-[108px] rounded-lg border border-separator bg-input px-2 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-acid/20 disabled:opacity-50"
        >
          {STORAGE_DRIVES.map((target) => (
            <option key={target.id} value={target.id}>
              {target.name}
            </option>
          ))}
        </select>
        <Button
          variant="ghost"
          size="sm"
          onClick={onVerify}
          disabled={verifyState === "verifying"}
        >
          {verifyState === "verifying" ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ClipboardCheck className="h-3.5 w-3.5" />
          )}
          Verify
        </Button>
      </div>
    </div>
  );
}

function TaskRow({
  task,
  downloadLimit,
  fallbackInstallPath,
  onPause,
  onResume,
  onCancel,
  onRetry,
  onOpenFolder,
}: {
  task: DownloadTask;
  downloadLimit: DownloadLimitOption;
  fallbackInstallPath: string;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onRetry: () => void;
  onOpenFolder: () => void;
}) {
  const progress = Math.max(0, Math.min(100, Math.round(task.progress * 100)));
  const running = isRunning(task.status);
  const paused = task.status === "paused";
  const failed = task.status === "error" || task.status === "cancelled";
  const complete = task.status === "complete";
  const updatedLabel = task.updatedAt ? relativeDate(task.updatedAt) : "Queued";

  return (
    <div className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1.35fr)_minmax(170px,0.9fr)_90px_110px_136px] md:items-center md:gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {failed ? (
            <AlertTriangle className="h-4 w-4 shrink-0 text-red/75" />
          ) : complete ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-green" />
          ) : (
            <Download className="h-4 w-4 shrink-0 text-muted/55" />
          )}
          <p className="truncate text-[13px] font-semibold text-foreground/90">
            {task.gameId}
          </p>
        </div>
        <p className="mt-1 truncate text-[11px] text-muted/40">
          {task.installPath ?? fallbackInstallPath}
        </p>
      </div>

      <div className="min-w-0">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
              statusTone(task.status),
            )}
          >
            {STATUS_LABELS[task.status]}
          </span>
          <span className="text-[11px] font-medium text-muted/55">{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-card-active">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              failed ? "bg-red/65" : paused ? "bg-orange/75" : complete ? "bg-green" : "bg-foreground/65",
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1 text-[10px] text-muted/35">
          {formatBytes(task.downloadedBytes)} / {formatBytes(task.totalBytes)}
        </p>
      </div>

      <div className="flex items-center justify-between md:block">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted/35 md:hidden">
          Speed
        </span>
        <span className="text-[12px] font-medium text-foreground/75">
          {formatSpeed(task.status, downloadLimit)}
        </span>
      </div>

      <div className="flex items-center justify-between md:block">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted/35 md:hidden">
          ETA
        </span>
        <div>
          <p className="text-[12px] font-medium text-foreground/75">
            {formatEta(task, downloadLimit)}
          </p>
          <p className="text-[10px] text-muted/35">{updatedLabel}</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1">
        {running && task.canPause !== false && (
          <IconAction label="Pause" onClick={onPause}>
            <Pause className="h-3.5 w-3.5" />
          </IconAction>
        )}
        {paused && (
          <IconAction label="Resume" onClick={onResume}>
            <Play className="h-3.5 w-3.5" fill="currentColor" />
          </IconAction>
        )}
        {(running || paused) && (
          <IconAction label="Cancel" onClick={onCancel} tone="danger">
            <X className="h-3.5 w-3.5" />
          </IconAction>
        )}
        {failed && (
          <IconAction label="Retry" onClick={onRetry}>
            <RotateCcw className="h-3.5 w-3.5" />
          </IconAction>
        )}
        {complete && (
          <IconAction label="Open folder" onClick={onOpenFolder}>
            <FolderOpen className="h-3.5 w-3.5" />
          </IconAction>
        )}
      </div>
    </div>
  );
}

function IconAction({
  children,
  label,
  tone,
  onClick,
}: {
  children: ReactNode;
  label: string;
  tone?: "danger";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted/55 transition-colors hover:bg-input hover:text-foreground/85",
        tone === "danger" && "hover:text-red/80",
      )}
    >
      {children}
    </button>
  );
}
