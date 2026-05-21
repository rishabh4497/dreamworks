import { create } from "zustand";
import type { DownloadStatus, DownloadTask, GameId } from "@/lib/types";
import { pauseDownload, resumeDownload } from "@/lib/api/downloads";

interface DownloadStore {
  tasks: DownloadTask[];
  activeCount: number;
  start: (gameId: GameId, sizeBytes: number) => void;
  pause: (taskId: string) => void;
  resume: (taskId: string) => void;
  cancel: (taskId: string) => void;
  clearCompleted: () => void;
  _tick: (taskId: string, progress: number, bytes: number) => void;
  _finish: (taskId: string, status: DownloadStatus) => void;
}

function recomputeActive(tasks: DownloadTask[]): number {
  return tasks.filter((t) =>
    ["queued", "downloading", "verifying", "extracting"].includes(t.status),
  ).length;
}

export const useDownloadStore = create<DownloadStore>((set, get) => ({
  tasks: [],
  activeCount: 0,
  start: (gameId, sizeBytes) => {
    const taskId = `${gameId}-${Date.now()}`;
    const task: DownloadTask = {
      taskId,
      gameId,
      status: "downloading",
      progress: 0,
      totalBytes: sizeBytes || 8_000_000_000,
      downloadedBytes: 0,
      queuedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      canPause: true,
      canResume: false,
    };
    set((s) => ({ tasks: [...s.tasks, task], activeCount: s.activeCount + 1 }));

    // Mock progression
    const total = task.totalBytes;
    const stepCount = 24;
    const stepMs = 220;
    let i = 0;
    const interval = setInterval(() => {
      const current = get().tasks.find((t) => t.taskId === taskId);
      if (!current || current.status === "cancelled") {
        clearInterval(interval);
        return;
      }
      if (current.status === "paused") return;
      i += 1;
      const progress = Math.min(1, i / stepCount);
      const bytes = Math.round(total * progress);
      get()._tick(taskId, progress, bytes);
      if (progress >= 1) {
        clearInterval(interval);
        get()._finish(taskId, "complete");
      }
    }, stepMs);
  },
  pause: (taskId) => {
    void pauseDownload(taskId);
    set((s) => {
      const tasks = s.tasks.map((t) =>
        t.taskId === taskId
          ? {
              ...t,
              status: "paused" as DownloadStatus,
              canPause: false,
              canResume: true,
              updatedAt: new Date().toISOString(),
            }
          : t,
      );
      return { tasks, activeCount: recomputeActive(tasks) };
    });
  },
  resume: (taskId) => {
    void resumeDownload(taskId);
    set((s) => {
      const tasks = s.tasks.map((t) =>
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
      return { tasks, activeCount: recomputeActive(tasks) };
    });
  },
  cancel: (taskId) => {
    set((s) => {
      const tasks = s.tasks.map((t) =>
        t.taskId === taskId
          ? {
              ...t,
              status: "cancelled" as DownloadStatus,
              canPause: false,
              canResume: false,
              updatedAt: new Date().toISOString(),
            }
          : t,
      );
      return { tasks, activeCount: recomputeActive(tasks) };
    });
  },
  clearCompleted: () => {
    set((s) => {
      const tasks = s.tasks.filter(
        (t) => !["complete", "cancelled", "error"].includes(t.status),
      );
      return { tasks, activeCount: recomputeActive(tasks) };
    });
  },
  _tick: (taskId, progress, downloadedBytes) =>
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.taskId === taskId
          ? { ...t, progress, downloadedBytes, updatedAt: new Date().toISOString() }
          : t,
      ),
    })),
  _finish: (taskId, status) =>
    set((s) => {
      const tasks = s.tasks.map((t) =>
        t.taskId === taskId
          ? {
              ...t,
              status,
              progress: 1,
              canPause: false,
              canResume: false,
              updatedAt: new Date().toISOString(),
            }
          : t,
      );
      return { tasks, activeCount: recomputeActive(tasks) };
    }),
}));
