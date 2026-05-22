import { Sparkles } from "lucide-react";
export function ReviewExtractor() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2"><Sparkles className="h-5 w-5 text-yellow" /> AI Review Extractor</h3>
      <p className="text-[13px] text-muted/80 mt-1 mb-4">Analyzes 10,000+ text reviews and outputs top complaints and praises.</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-red/5 border border-red/20 rounded-lg p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-red mb-2">Top Complaints</p>
          <p className="text-[12px] text-foreground">• Frame drops in level 4 (12% of negative)</p>
          <p className="text-[12px] text-foreground">• Multiplayer disconnects (8%)</p>
        </div>
        <div className="bg-positive/5 border border-positive/20 rounded-lg p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-positive mb-2">Top Praises</p>
          <p className="text-[12px] text-foreground">• Amazing soundtrack (34% of positive)</p>
          <p className="text-[12px] text-foreground">• Fluid combat mechanics (28%)</p>
        </div>
      </div>
    </div>
  );
}
