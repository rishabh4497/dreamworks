import { SplitSquareHorizontal, ArrowRight } from "lucide-react";
export function CapsuleABTesting() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2"><SplitSquareHorizontal className="h-5 w-5 text-cyan" /> Capsule A/B Testing</h3>
      <p className="text-[13px] text-muted/80 mt-1 mb-4">Test multiple store capsule arts to see which converts higher.</p>
      <div className="flex items-center gap-4">
        <div className="flex-1 bg-input rounded-lg border border-separator p-2 text-center">
          <div className="h-20 bg-card border border-dashed border-separator rounded mb-2 flex items-center justify-center text-muted text-[10px]">Capsule A</div>
          <p className="text-[12px] font-bold text-foreground">CTR: 4.2%</p>
        </div>
        <ArrowRight className="h-6 w-6 text-muted shrink-0" />
        <div className="flex-1 bg-cyan/10 rounded-lg border border-cyan/30 p-2 text-center shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <div className="h-20 bg-card border border-solid border-cyan/50 rounded mb-2 flex items-center justify-center text-cyan text-[10px]">Capsule B (Winner)</div>
          <p className="text-[12px] font-bold text-cyan">CTR: 6.8%</p>
        </div>
      </div>
    </div>
  );
}
