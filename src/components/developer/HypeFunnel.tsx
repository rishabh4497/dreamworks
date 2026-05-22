import { Filter, TrendingUp } from "lucide-react";
export function HypeFunnel() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2"><Filter className="h-5 w-5 text-purple-400" /> Pre-Launch Hype Funnel</h3>
      <p className="text-[13px] text-muted/80 mt-1 mb-4">Visualize where your wishlisters are coming from and their conversion rates.</p>
      <div className="space-y-2">
        <div className="w-full bg-input rounded-full h-8 flex relative overflow-hidden">
          <div className="bg-purple-500 w-[80%] h-full flex items-center px-3 text-[11px] font-bold text-white">External (Twitter/TikTok) - 80%</div>
        </div>
        <div className="w-full bg-input rounded-full h-8 flex relative overflow-hidden">
          <div className="bg-cyan w-[60%] h-full flex items-center px-3 text-[11px] font-bold text-black">Internal Discovery - 60%</div>
        </div>
        <p className="text-[11px] text-muted mt-2 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Expected Day 1 Conversion: 12.4%</p>
      </div>
    </div>
  );
}
