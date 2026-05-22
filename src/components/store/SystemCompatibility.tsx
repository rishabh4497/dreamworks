import { Cpu, Monitor, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";
import { type GameDetail } from "@/lib/types";

export function SystemCompatibility({ game }: { game: GameDetail }) {
  // Mocking the user's system specs (this would come from a system info store in a real app)
  const systemInfo = {
    os: "Windows 11 Pro 64-bit",
    cpu: "AMD Ryzen 7 7800X3D",
    gpu: "NVIDIA GeForce RTX 4080 SUPER 16GB",
    ram: "32 GB DDR5",
  };

  return (
    <div className="rounded-xl border border-separator bg-card mt-6 overflow-hidden">
      <div className="bg-gradient-to-r from-acid/20 to-transparent p-4 border-b border-separator/50 flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-bold text-foreground flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-acid" /> AI System Compatibility
          </h3>
          <p className="text-[11px] text-muted mt-0.5">Comparing your rig against {game.name}'s requirements</p>
        </div>
        <div className="flex items-center gap-1.5 bg-positive/10 text-positive px-2.5 py-1 rounded-md text-[11px] font-bold">
          <CheckCircle2 className="h-3.5 w-3.5" /> Optimal Performance
        </div>
      </div>
      
      <div className="p-4 grid gap-4 sm:grid-cols-2">
        <div className="bg-input rounded-lg border border-separator p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1"><Cpu className="h-3 w-3" /> Processor</span>
            <span className="text-[10px] text-positive font-bold">Exceeds</span>
          </div>
          <p className="text-[12px] font-bold text-foreground truncate">{systemInfo.cpu}</p>
          <p className="text-[10px] text-muted mt-1 truncate line-through opacity-70">Req: {game.systemRequirements?.windows?.cpu || game.systemRequirements?.mac?.cpu || game.systemRequirements?.linux?.cpu || "Core i7"}</p>
        </div>
        
        <div className="bg-input rounded-lg border border-separator p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1"><Monitor className="h-3 w-3" /> Graphics</span>
            <span className="text-[10px] text-positive font-bold">Exceeds</span>
          </div>
          <p className="text-[12px] font-bold text-foreground truncate">{systemInfo.gpu}</p>
          <p className="text-[10px] text-muted mt-1 truncate line-through opacity-70">Req: {game.systemRequirements?.windows?.gpu || game.systemRequirements?.mac?.gpu || game.systemRequirements?.linux?.gpu || "RTX 2070"}</p>
        </div>
      </div>
      
      <div className="bg-card-active p-3 border-t border-separator text-[12px] text-muted/90 flex items-start gap-2">
        <ShieldAlert className="h-4 w-4 text-acid shrink-0 mt-0.5" />
        <p>
          <strong className="text-foreground">AI Verdict:</strong> Your system is <span className="text-positive font-bold">in the top 5%</span> of players. 
          You can expect to run this game at <strong className="text-foreground">144+ FPS on Ultra settings at 1440p</strong> with Ray Tracing enabled.
        </p>
      </div>
    </div>
  );
}
