import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  DownloadLimitOption,
  DownloadStatus,
  DownloadTask,
  GameId,
  LauncherSource,
} from "@/lib/types";
import {
  pauseDownload,
  resumeDownload,
  startInstall,
} from "@/lib/api/downloads";
import { notify } from "@/lib/platform";
import { notificationPrefEnabled, useUiStore } from "@/stores/ui-store";
import { toast } from "@/stores/toast-store";

const MAX_CONCURRENT = 2;
const TICK_MS = 1000;
const STALL_PROBABILITY = 0.08;
const STALL_DURATION_MS = 1000;
const ERROR_PROBABILITY = 0.005;
const RETRY_DELAY_MS = 3000;
const VERIFY_DURATION_MS = 1500;
const EXTRACT_DURATION_MS = 1500;

const intervals = new Map<string, ReturnType<typeof setInterval>>();
const stallUntil = new Map<string, number>();
const erroredOnceFor = new Set<string>();

function bytesPerSecondForLimit(limit: DownloadLimitOption): number {
  if (limit === "unlimited") return 42_000_000;
  return Number(limit) * 1_000_000;
}

function isActiveStatus(status: DownloadStatus): boolean {
  return ["downloading", "verifying", "extracting"].includes(status);
}

function isRunningStatus(status: DownloadStatus): boolean {
  return ["queued", "downloading", "verifying", "extracting"].includes(status);
}

function recomputeActive(tasks: DownloadTask[]): number {
  return tasks.filter((t) => isRunningStatus(t.status)).length;
}

function clearTaskTimers(taskId: string) {
  const interval = intervals.get(taskId);
  if (interval) {
    clearInterval(interval);
    intervals.delete(taskId);
  }
  stallUntil.delete(taskId);
}

function promoteQueued(tasks: DownloadTask[]): {
  tasks: DownloadTask[];
  promotedIds: string[];
} {
  const activeCount = tasks.filter((t) => isActiveStatus(t.status)).length;
  const slots = Math.max(0, MAX_CONCURRENT - activeCount);
  if (slots === 0) return { tasks, promotedIds: [] };

  const promotedIds = tasks
    .filter((t) => t.status === "queued")
    .sort(
      (a, b) =>
        new Date(a.queuedAt ?? 0).getTime() -
        new Date(b.queuedAt ?? 0).getTime(),
    )
    .slice(0, slots)
    .map((t) => t.taskId);
  if (promotedIds.length === 0) return { tasks, promotedIds: [] };

  const now = new Date().toISOString();
  const nextTasks = tasks.map((t) =>
    promotedIds.includes(t.taskId)
      ? {
          ...t,
          status: "downloading" as DownloadStatus,
          canPause: true,
          canResume: false,
          updatedAt: now,
        }
      : t,
  );
  return { tasks: nextTasks, promotedIds };
}

function scheduleVerifyExtract(taskId: string) {
  setTimeout(() => {
    const current = useDownloadStore
      .getState()
      .tasks.find((t) => t.taskId === taskId);
    if (current?.status !== "verifying") return;
    useDownloadStore.setState((s) => ({
      tasks: s.tasks.map((t) =>
        t.taskId === taskId
          ? {
              ...t,
              status: "extracting" as DownloadStatus,
              updatedAt: new Date().toISOString(),
            }
          : t,
      ),
    }));
    setTimeout(() => {
      const stillExtracting = useDownloadStore
        .getState()
        .tasks.find((t) => t.taskId === taskId);
      if (stillExtracting?.status !== "extracting") return;
      useDownloadStore.getState()._finish(taskId, "complete");
    }, EXTRACT_DURATION_MS);
  }, VERIFY_DURATION_MS);
}

function startProgression(taskId: string) {
  clearTaskTimers(taskId);

  const interval = setInterval(() => {
    const current = useDownloadStore
      .getState()
      .tasks.find((t) => t.taskId === taskId);
    if (!current) {
      clearInterval(interval);
      intervals.delete(taskId);
      return;
    }
    if (["paused", "cancelled", "complete", "error"].includes(current.status)) {
      clearInterval(interval);
      intervals.delete(taskId);
      return;
    }
    if (current.status !== "downloading") return;

    const stallEnd = stallUntil.get(taskId);
    if (stallEnd && Date.now() < stallEnd) {
      useDownloadStore
        .getState()
        ._tick(taskId, current.progress, current.downloadedBytes, 0);
      return;
    }
    if (stallEnd) stallUntil.delete(taskId);

    if (!erroredOnceFor.has(taskId) && Math.random() < ERROR_PROBABILITY) {
      erroredOnceFor.add(taskId);
      useDownloadStore.getState()._finish(taskId, "error");
      setTimeout(() => {
        const t = useDownloadStore
          .getState()
          .tasks.find((x) => x.taskId === taskId);
        if (t?.status === "error") useDownloadStore.getState().retry(taskId);
      }, RETRY_DELAY_MS);
      return;
    }

    if (Math.random() < STALL_PROBABILITY) {
      stallUntil.set(taskId, Date.now() + STALL_DURATION_MS);
      useDownloadStore
        .getState()
        ._tick(taskId, current.progress, current.downloadedBytes, 0);
      return;
    }

    const limit = useUiStore.getState().settings.downloadLimit;
    const bps = bytesPerSecondForLimit(limit);
    const jitter = 0.85 + Math.random() * 0.3;
    const delta = bps * (TICK_MS / 1000) * jitter;
    const nextBytes = Math.min(current.totalBytes, current.downloadedBytes + delta);
    const nextProgress =
      current.totalBytes > 0 ? nextBytes / current.totalBytes : 1;

    if (nextProgress >= 1) {
      useDownloadStore.getState()._tick(taskId, 1, current.totalBytes, bps);
      useDownloadStore.setState((s) => ({
        tasks: s.tasks.map((t) =>
          t.taskId === taskId
            ? {
                ...t,
                status: "verifying" as DownloadStatus,
                updatedAt: new Date().toISOString(),
                speedBytesPerSec: 0,
              }
            : t,
        ),
      }));
      clearInterval(interval);
      intervals.delete(taskId);
      scheduleVerifyExtract(taskId);
      return;
    }

    useDownloadStore
      .getState()
      ._tick(taskId, nextProgress, nextBytes, bps * jitter);
  }, TICK_MS);

  intervals.set(taskId, interval);
}

interface StartOptions {
  installPath?: string;
  sourceLauncher?: LauncherSource;
}

interface DownloadStore {
  tasks: DownloadTask[];
  activeCount: number;
  start: (gameId: GameId, sizeBytes: number, opts?: StartOptions) => void;
  pause: (taskId: string) => void;
  resume: (taskId: string) => void;
  cancel: (taskId: string) => void;
  retry: (taskId: string) => void;
  removeTask: (taskId: string) => void;
  clearCompleted: () => void;
  _tick: (
    taskId: string,
    progress: number,
    bytes: number,
    speedBps?: number,
  ) => void;
  _finish: (taskId: string, status: DownloadStatus) => void;
}

export const useDownloadStore = create<DownloadStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      activeCount: 0,
      start: (gameId, sizeBytes, opts) => {
        const taskId = `${gameId}-${Date.now()}`;
        const active = get().tasks.filter((t) => isActiveStatus(t.status))
          .length;
        const status: DownloadStatus =
          active >= MAX_CONCURRENT ? "queued" : "downloading";
        const task: DownloadTask = {
          taskId,
          gameId,
          status,
          progress: 0,
          totalBytes: sizeBytes || 8_000_000_000,
          downloadedBytes: 0,
          sourceLauncher: opts?.sourceLauncher,
          installPath: opts?.installPath,
          queuedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          canPause: status === "downloading",
          canResume: false,
        };
        const tasks = [...get().tasks, task];
        set({ tasks, activeCount: recomputeActive(tasks) });

        if (opts?.installPath) {
          void startInstall({
            gameId,
            sourceLauncher: opts.sourceLauncher,
            installPath: opts.installPath,
            sizeBytes: task.totalBytes,
          });
        }

        if (status === "downloading") startProgression(taskId);
      },
      pause: (taskId) => {
        void pauseDownload(taskId);
        clearTaskTimers(taskId);
        const next = get().tasks.map((t) =>
          t.taskId === taskId
            ? {
                ...t,
                status: "paused" as DownloadStatus,
                canPause: false,
                canResume: true,
                updatedAt: new Date().toISOString(),
                speedBytesPerSec: 0,
              }
            : t,
        );
        const promoted = promoteQueued(next);
        set({
          tasks: promoted.tasks,
          activeCount: recomputeActive(promoted.tasks),
        });
        promoted.promotedIds.forEach((id) =>
          queueMicrotask(() => startProgression(id)),
        );
      },
      resume: (taskId) => {
        void resumeDownload(taskId);
        const active = get().tasks.filter((t) => isActiveStatus(t.status))
          .length;
        if (active >= MAX_CONCURRENT) {
          const requeued = get().tasks.map((t) =>
            t.taskId === taskId
              ? {
                  ...t,
                  status: "queued" as DownloadStatus,
                  canPause: false,
                  canResume: false,
                  updatedAt: new Date().toISOString(),
                }
              : t,
          );
          set({ tasks: requeued, activeCount: recomputeActive(requeued) });
          return;
        }
        const resumed = get().tasks.map((t) =>
          t.taskId === taskId
            ? {
                ...t,
                status: "downloading" as DownloadStatus,
                canPause: true,
                canResume: false,
                updatedAt: new Date().toISOString(),
              }
            : t,
        );
        set({ tasks: resumed, activeCount: recomputeActive(resumed) });
        startProgression(taskId);
      },
      cancel: (taskId) => {
        clearTaskTimers(taskId);
        const next = get().tasks.map((t) =>
          t.taskId === taskId
            ? {
                ...t,
                status: "cancelled" as DownloadStatus,
                canPause: false,
                canResume: false,
                updatedAt: new Date().toISOString(),
                speedBytesPerSec: 0,
              }
            : t,
        );
        const promoted = promoteQueued(next);
        set({
          tasks: promoted.tasks,
          activeCount: recomputeActive(promoted.tasks),
        });
        promoted.promotedIds.forEach((id) =>
          queueMicrotask(() => startProgression(id)),
        );
      },
      retry: (taskId) => {
        erroredOnceFor.delete(taskId);
        const active = get().tasks.filter((t) => isActiveStatus(t.status))
          .length;
        const nextStatus: DownloadStatus =
          active >= MAX_CONCURRENT ? "queued" : "downloading";
        const next = get().tasks.map((t) =>
          t.taskId === taskId
            ? {
                ...t,
                status: nextStatus,
                canPause: nextStatus === "downloading",
                canResume: false,
                errorMessage: undefined,
                updatedAt: new Date().toISOString(),
              }
            : t,
        );
        set({ tasks: next, activeCount: recomputeActive(next) });
        if (nextStatus === "downloading") startProgression(taskId);
      },
      removeTask: (taskId) => {
        clearTaskTimers(taskId);
        erroredOnceFor.delete(taskId);
        const next = get().tasks.filter((t) => t.taskId !== taskId);
        const promoted = promoteQueued(next);
        set({
          tasks: promoted.tasks,
          activeCount: recomputeActive(promoted.tasks),
        });
        promoted.promotedIds.forEach((id) =>
          queueMicrotask(() => startProgression(id)),
        );
      },
      clearCompleted: () => {
        const finished = get().tasks.filter((t) =>
          ["complete", "cancelled", "error"].includes(t.status),
        );
        finished.forEach((t) => {
          clearTaskTimers(t.taskId);
          erroredOnceFor.delete(t.taskId);
        });
        const tasks = get().tasks.filter(
          (t) => !["complete", "cancelled", "error"].includes(t.status),
        );
        set({ tasks, activeCount: recomputeActive(tasks) });
      },
      _tick: (taskId, progress, downloadedBytes, speedBps) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.taskId === taskId
              ? {
                  ...t,
                  progress,
                  downloadedBytes,
                  speedBytesPerSec:
                    speedBps !== undefined ? speedBps : t.speedBytesPerSec,
                  updatedAt: new Date().toISOString(),
                }
              : t,
          ),
        })),
      _finish: (taskId, status) => {
        const finished = get().tasks.find((t) => t.taskId === taskId);
        clearTaskTimers(taskId);
        const next = get().tasks.map((t) =>
          t.taskId === taskId
            ? {
                ...t,
                status,
                progress: status === "complete" ? 1 : t.progress,
                canPause: false,
                canResume: false,
                updatedAt: new Date().toISOString(),
                speedBytesPerSec: 0,
              }
            : t,
        );
        const promoted = promoteQueued(next);
        set({
          tasks: promoted.tasks,
          activeCount: recomputeActive(promoted.tasks),
        });
        promoted.promotedIds.forEach((id) =>
          queueMicrotask(() => startProgression(id)),
        );

        if (finished && notificationPrefEnabled("system")) {
          const name = String(finished.gameId);
          queueMicrotask(() => {
            if (status === "complete") {
              void notify("Download complete", `${name} is ready to play`);
              toast.success(`${name} ready`);
            } else if (status === "error") {
              void notify(
                "Download failed",
                `${name} hit an error and will retry`,
              );
              toast.error(`${name} failed — retrying`);
            }
          });
        }
      },
    }),
    {
      name: "dreamworks-downloads",
      version: 1,
      partialize: (s) => ({ tasks: s.tasks }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        queueMicrotask(() => {
          const current = useDownloadStore.getState().tasks;
          const promoted = promoteQueued(current);
          useDownloadStore.setState({
            tasks: promoted.tasks,
            activeCount: recomputeActive(promoted.tasks),
          });
          promoted.tasks.forEach((task) => {
            if (task.status === "downloading") {
              startProgression(task.taskId);
            } else if (task.status === "verifying") {
              scheduleVerifyExtract(task.taskId);
            } else if (task.status === "extracting") {
              setTimeout(() => {
                const t = useDownloadStore
                  .getState()
                  .tasks.find((x) => x.taskId === task.taskId);
                if (t?.status === "extracting") {
                  useDownloadStore.getState()._finish(task.taskId, "complete");
                }
              }, EXTRACT_DURATION_MS);
            }
          });
        });
      },
    },
  ),
);
