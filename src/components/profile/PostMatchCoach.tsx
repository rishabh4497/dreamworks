import { Activity, Target, TrendingDown, ArrowRight } from "lucide-react";

export function PostMatchCoach() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[16px] font-bold flex items-center gap-2">
          <Activity className="h-5 w-5 text-acid" /> AI Post-Match Coach
        </h3>
        <span className="text-[11px] bg-card-active border border-separator px-2 py-1 rounded text-muted font-bold">Cyber Strike - Match #421</span>
      </div>

      <div className="bg-input rounded-xl border border-separator p-4 mb-4">
        <p className="text-[12px] leading-relaxed text-foreground/90">
          <strong className="text-acid">Analysis:</strong> You started strong in rounds 1-5, but your crosshair placement dropped significantly in the final 10 minutes. You lost 3 direct duels because your aim was aimed at chest-height instead of head-height.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card-active rounded-lg p-3 border border-separator/50">
          <p className="text-[10px] uppercase text-muted font-bold mb-1 flex items-center gap-1"><Target className="h-3 w-3" /> Headshot Accuracy</p>
          <div className="flex items-end gap-2">
            <span className="text-[18px] font-black text-foreground">18%</span>
            <span className="text-[11px] text-red flex items-center mb-1"><TrendingDown className="h-3 w-3 mr-0.5" /> -4%</span>
          </div>
        </div>
        <button className="bg-acid/10 hover:bg-acid/20 text-acid rounded-lg p-3 border border-acid/20 transition-colors flex items-center justify-center gap-2 text-[12px] font-bold">
          View Aim Training Routine <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
