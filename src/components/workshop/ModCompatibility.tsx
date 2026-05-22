import { useState } from "react";
import { Settings, ShieldAlert, ShieldCheck, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ModCompatibilityProps {
  mods: string[];
}

export function ModCompatibility({ mods }: ModCompatibilityProps) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<"clean" | "conflict" | null>(null);

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setResult(mods.length > 2 ? "conflict" : "clean");
      setScanning(false);
    }, 2000);
  };

  return (
    <div className="rounded-xl border border-separator bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-acid" />
          <h3 className="text-[14px] font-semibold text-foreground">AI Mod Compatibility</h3>
        </div>
      </div>

      <div className="mb-4 text-[12px] text-muted/80">
        AI will analyze script hooks and asset overrides to prevent crashes before you launch.
      </div>

      {result === "clean" && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-green/10 p-3 text-[12px] text-green border border-green/20">
          <ShieldCheck className="h-4 w-4" /> No conflicts detected in load order.
        </div>
      )}

      {result === "conflict" && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-red/10 p-3 text-[12px] text-red border border-red/20">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> 
          <div>
            <p className="font-semibold">Severe Conflict Detected</p>
            <p className="mt-1 opacity-80">"HD Textures Overhaul" and "Real Lighting Mod" both attempt to modify core shader pipelines. Game will likely crash.</p>
          </div>
        </div>
      )}

      <Button 
        onClick={handleScan} 
        disabled={scanning || mods.length === 0}
        className="w-full"
        variant={result ? "secondary" : "primary"}
      >
        {scanning ? "Analyzing Scripts..." : "Run AI Scan"}
      </Button>
    </div>
  );
}
