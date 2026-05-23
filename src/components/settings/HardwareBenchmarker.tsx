import { useState } from "react";
import { Cpu, Play, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { isDesktop } from "@/lib/platform";
import { runHardwareSnapshot } from "@/lib/diagnostics";
import {
  useUserHardware,
  useSaveHardwareSnapshot,
} from "@/hooks/use-user-hardware";
import { formatBytes } from "@/lib/utils";
import type { HardwareSnapshot } from "@/lib/types";

function bestGpu(snapshot: HardwareSnapshot): string {
  return snapshot.gpus[0]?.model || "Integrated GPU";
}

function totalMemoryLabel(snapshot: HardwareSnapshot): string {
  return formatBytes(snapshot.memory.totalBytes);
}

function readinessLabel(snapshot: HardwareSnapshot): string {
  const totalGb = snapshot.memory.totalBytes / 1_000_000_000;
  const hasDiscreteGpu = snapshot.gpus.some(
    (g) => g.vramBytes >= 6_000_000_000,
  );
  if (hasDiscreteGpu && totalGb >= 24) return "Ready for 4K";
  if (hasDiscreteGpu && totalGb >= 12) return "Ready for 1440p";
  return "Ready for 1080p";
}

export function HardwareBenchmarker() {
  const { data: stored } = useUserHardware();
  const saveSnapshot = useSaveHardwareSnapshot();
  const [status, setStatus] = useState<"idle" | "running" | "done" | "unsupported" | "failed">(
    "idle",
  );
  const [progress, setProgress] = useState(0);
  const snapshot = stored?.latestSnapshot ?? null;

  const runBenchmark = async () => {
    if (!isDesktop()) {
      setStatus("unsupported");
      return;
    }
    setStatus("running");
    setProgress(0);
    const start = Date.now();
    const ticker = window.setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(95, Math.floor((elapsed / 6000) * 100)));
    }, 100);
    try {
      const result = await runHardwareSnapshot();
      window.clearInterval(ticker);
      if (!result) {
        setStatus("failed");
        return;
      }
      await saveSnapshot.mutateAsync(result);
      setProgress(100);
      setStatus("done");
    } catch {
      window.clearInterval(ticker);
      setStatus("failed");
    }
  };

  return (
    <div className="rounded-xl border border-separator bg-card p-5 mt-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-orange-500">
            <Cpu className="h-5 w-5" />
          </div>
          <div className="w-full">
            <h3 className="text-[15px] font-bold text-foreground">Hardware Benchmarker</h3>
            <p className="text-[13px] text-muted/80 mt-1 max-w-xl leading-relaxed">
              Run a quick hardware scan. We will automatically recommend the optimal graphics settings for games in your library.
            </p>

            {status === "running" && (
              <div className="mt-4 w-full max-w-md h-2 bg-input rounded-full overflow-hidden">
                <motion.div className="h-full bg-orange-500" style={{ width: `${progress}%` }} />
              </div>
            )}

            {status === "unsupported" && (
              <p className="mt-4 flex items-center gap-1.5 text-[12px] text-muted">
                <AlertCircle className="h-4 w-4" />
                Hardware scanning is only available in the desktop app.
              </p>
            )}

            {status === "failed" && (
              <p className="mt-4 flex items-center gap-1.5 text-[12px] text-red">
                <AlertCircle className="h-4 w-4" />
                Scan failed. Try again or check the console for details.
              </p>
            )}

            {snapshot && status !== "running" && status !== "unsupported" && status !== "failed" && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-card-active p-3 rounded-lg border border-separator/50">
                  <p className="text-[10px] text-muted/60 uppercase">CPU</p>
                  <p className="text-[12px] font-bold text-foreground truncate">{snapshot.cpu.brand}</p>
                </div>
                <div className="bg-card-active p-3 rounded-lg border border-separator/50">
                  <p className="text-[10px] text-muted/60 uppercase">GPU</p>
                  <p className="text-[12px] font-bold text-foreground truncate">{bestGpu(snapshot)}</p>
                </div>
                <div className="bg-card-active p-3 rounded-lg border border-separator/50">
                  <p className="text-[10px] text-muted/60 uppercase">RAM</p>
                  <p className="text-[12px] font-bold text-foreground truncate">{totalMemoryLabel(snapshot)}</p>
                </div>
                <div className="bg-orange-500/10 p-3 rounded-lg border border-orange-500/30 flex flex-col justify-center">
                  <p className="text-[12px] font-bold text-orange-500 flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> {readinessLabel(snapshot)}</p>
                </div>
              </div>
            )}

            {!snapshot && status === "idle" && (
              <p className="mt-4 text-[12px] text-muted">No benchmark on file yet. Run a scan to populate this card.</p>
            )}
          </div>
        </div>

        {status !== "running" && (
          <Button onClick={runBenchmark} className="bg-input text-foreground hover:bg-card-hover border-separator shrink-0 cursor-pointer">
            <Play className="h-4 w-4 mr-2" /> {snapshot ? "Re-run Scan" : "Start Scan"}
          </Button>
        )}
      </div>
    </div>
  );
}
