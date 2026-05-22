import { Swords, Settings2 } from "lucide-react";

export function MatchmakingSandbox() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2 mb-1">
        <Swords className="h-5 w-5 text-orange-500" /> Matchmaking Sandbox
      </h3>
      <p className="text-[13px] text-muted/80 mb-6">Simulate ELO/MMR tweaks against historical player data to optimize queue times.</p>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-input rounded-lg border border-separator p-3">
            <span className="text-[10px] uppercase font-bold text-muted">Avg Queue Time</span>
            <p className="text-[16px] font-black text-foreground mt-1">1m 45s</p>
          </div>
          <div className="bg-input rounded-lg border border-separator p-3">
            <span className="text-[10px] uppercase font-bold text-muted">Win Rate Spread</span>
            <p className="text-[16px] font-black text-foreground mt-1">48% - 52%</p>
          </div>
        </div>

        <div className="bg-card-active rounded-lg border border-separator/50 p-4 space-y-3">
          <div>
            <div className="flex justify-between text-[11px] text-foreground mb-1">
              <span>ELO Tolerance Expansion Rate</span>
              <span>+10 per min</span>
            </div>
            <div className="h-1.5 w-full bg-input rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 w-[30%]" />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-[11px] text-foreground mb-1">
              <span>Max Ping Limit</span>
              <span>80ms</span>
            </div>
            <div className="h-1.5 w-full bg-input rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 w-[60%]" />
            </div>
          </div>
        </div>

        <button className="w-full bg-card border border-orange-500/30 text-orange-500 py-2 rounded-lg text-[12px] font-bold hover:bg-orange-500/10 transition-colors flex items-center justify-center gap-2">
          <Settings2 className="h-4 w-4" /> Run Simulation
        </button>
      </div>
    </div>
  );
}
