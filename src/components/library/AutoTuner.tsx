import { useState } from "react";
import { Cpu, Zap, Settings2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AutoTunerProps {
  gameId: string;
}

export function AutoTuner({ gameId }: AutoTunerProps) {
  const [status, setStatus] = useState<"idle" | "scanning" | "tuned">("idle");

  const startTuning = () => {
    setStatus("scanning");
    setTimeout(() => setStatus("tuned"), 3000);
  };

  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border p-4 transition-all duration-500",
      status === "tuned" ? "border-green/30 bg-green/5" : "border-separator bg-card"
    )}>
      <div className="mb-4 flex items-center gap-2">
        <Cpu className={cn("h-4 w-4", status === "tuned" ? "text-green" : "text-acid")} />
        <h3 className="text-[14px] font-semibold text-foreground">Hardware Auto-Tuner</h3>
      </div>

      <div className="mb-4 text-[12px] text-muted/80">
        {status === "idle" && "Inject optimal graphics settings based on your RTX 4070 Ti and Ryzen 7 5800X."}
        {status === "scanning" && "Analyzing game engine config files..."}
        {status === "tuned" && "Settings injected! Expected 120 FPS at 1440p (High Preset)."}
      </div>

      {status === "scanning" && (
        <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-input">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-acid" />
        </div>
      )}

      <div className="flex gap-2">
        <Button 
          onClick={startTuning} 
          disabled={status === "scanning"}
          variant={status === "tuned" ? "secondary" : "primary"}
          className={cn("flex-1", status === "idle" && "bg-acid text-background")}
        >
          {status === "idle" && <><Zap className="mr-2 h-4 w-4" /> Auto-Tune Now</>}
          {status === "scanning" && "Tuning..."}
          {status === "tuned" && <><CheckCircle2 className="mr-2 h-4 w-4 text-green" /> Re-Tune Hardware</>}
        </Button>
        <Button variant="secondary" className="px-3">
          <Settings2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
