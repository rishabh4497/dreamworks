import { useState } from "react";
import { Cpu, Play, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

export function HardwareBenchmarker() {
  const [status, setStatus] = useState<"idle" | "running" | "done">("idle");
  const [progress, setProgress] = useState(0);

  const runBenchmark = () => {
    setStatus("running");
    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setStatus("done");
      }
    }, 100);
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
              Run a quick 60-second hardware scan. We will automatically recommend the optimal graphics settings for games in your library.
            </p>
            
            {status === "running" && (
              <div className="mt-4 w-full max-w-md h-2 bg-input rounded-full overflow-hidden">
                <motion.div className="h-full bg-orange-500" style={{ width: `${progress}%` }} />
              </div>
            )}
            
            {status === "done" && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-card-active p-3 rounded-lg border border-separator/50">
                  <p className="text-[10px] text-muted/60 uppercase">CPU</p>
                  <p className="text-[12px] font-bold text-foreground truncate">AMD Ryzen 7 7800X3D</p>
                </div>
                <div className="bg-card-active p-3 rounded-lg border border-separator/50">
                  <p className="text-[10px] text-muted/60 uppercase">GPU</p>
                  <p className="text-[12px] font-bold text-foreground truncate">RTX 4080 SUPER</p>
                </div>
                <div className="bg-card-active p-3 rounded-lg border border-separator/50">
                  <p className="text-[10px] text-muted/60 uppercase">RAM</p>
                  <p className="text-[12px] font-bold text-foreground truncate">32 GB DDR5</p>
                </div>
                <div className="bg-orange-500/10 p-3 rounded-lg border border-orange-500/30 flex flex-col justify-center">
                  <p className="text-[12px] font-bold text-orange-500 flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Ready for 4K</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {status === "idle" && (
          <Button onClick={runBenchmark} className="bg-input text-foreground hover:bg-card-hover border-separator shrink-0 cursor-pointer">
            <Play className="h-4 w-4 mr-2" /> Start Scan
          </Button>
        )}
      </div>
    </div>
  );
}
