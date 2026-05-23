import { AnimatePresence, motion } from "motion/react";
import { Pause, Play, RotateCcw, X } from "lucide-react";
import { useDownloadStore } from "@/stores/download-store";
import { cn, formatBytes } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  queued: "Queued",
  downloading: "Downloading",
  verifying: "Verifying",
  extracting: "Extracting",
  complete: "Complete",
  error: "Failed",
  cancelled: "Cancelled",
  paused: "Paused",
};

export function DownloadsQueue() {
  const tasks = useDownloadStore((s) => s.tasks);
  const cancel = useDownloadStore((s) => s.cancel);
  const pause = useDownloadStore((s) => s.pause);
  const resume = useDownloadStore((s) => s.resume);
  const retry = useDownloadStore((s) => s.retry);
  const clearCompleted = useDownloadStore((s) => s.clearCompleted);
  const hasFinished = tasks.some((t) =>
    ["complete", "cancelled", "error"].includes(t.status),
  );

  return (
    <AnimatePresence>
      {tasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="px-3 pt-2.5 pb-1">
            <div className="flex items-center justify-between px-2 mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted/35">
                Downloads
              </span>
              {hasFinished && (
                <button
                  onClick={clearCompleted}
                  className="text-[10px] text-muted/30 hover:text-muted/60 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="space-y-1">
              {tasks.map((task) => {
                const progress = Math.round(task.progress * 100);
                const isActive = ["downloading", "verifying", "extracting", "queued"].includes(task.status);
                const isPaused = task.status === "paused";
                const isDone = task.status === "complete";
                const isFailed = task.status === "error" || task.status === "cancelled";
                return (
                  <div key={task.taskId} className="rounded-lg bg-card px-2.5 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-medium text-foreground/70 truncate">
                        {task.gameId}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "text-[9px] font-medium",
                            isDone ? "text-green" : isFailed ? "text-red/60" : "text-muted/40",
                          )}
                        >
                          {task.status === "downloading" ? `${progress}%` : STATUS_LABELS[task.status]}
                        </span>
                        {isActive && task.canPause !== false && (
                          <button
                            onClick={() => pause(task.taskId)}
                            className="text-muted/25 hover:text-foreground/70 transition-colors"
                            title="Pause download"
                          >
                            <Pause className="h-3 w-3" />
                          </button>
                        )}
                        {isPaused && (
                          <button
                            onClick={() => resume(task.taskId)}
                            className="text-muted/25 hover:text-price transition-colors"
                            title="Resume download"
                          >
                            <Play className="h-3 w-3" fill="currentColor" />
                          </button>
                        )}
                        {(isActive || isPaused) && (
                          <button
                            onClick={() => cancel(task.taskId)}
                            className="text-muted/25 hover:text-red/60 transition-colors"
                            title="Cancel download"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                        {isFailed && (
                          <button
                            onClick={() => retry(task.taskId)}
                            className="text-muted/25 hover:text-foreground/70 transition-colors"
                            title="Retry download"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    {(isActive || isPaused) && (
                      <div className="h-[3px] rounded-full bg-card-active overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            isPaused ? "bg-muted/35" : "bg-foreground/40",
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                    {task.status === "downloading" && task.totalBytes > 0 && (
                      <p className="text-[9px] text-muted/25 mt-1">
                        {formatBytes(task.downloadedBytes)} / {formatBytes(task.totalBytes)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
