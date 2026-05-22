import { Globe, ArrowUpRight } from "lucide-react";

export function LocalizationHeatmaps() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2 mb-1">
        <Globe className="h-5 w-5 text-blue-400" /> Localization Heatmaps
      </h3>
      <p className="text-[13px] text-muted/80 mb-6">Identify high-ROI translation opportunities based on global wishlist data.</p>

      <div className="bg-input border border-separator rounded-xl p-4">
        <div className="flex items-center justify-between mb-3 border-b border-separator pb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Unmet Language Demand</span>
          <span className="text-[10px] text-muted">Based on wishlists vs supported</span>
        </div>
        
        <div className="space-y-3">
          {[
            { lang: "Portuguese (Brazil)", wishlists: "14.2k", pct: "+12%" },
            { lang: "Korean", wishlists: "8.9k", pct: "+8%" },
            { lang: "Polish", wishlists: "5.4k", pct: "+4%" }
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between bg-card-active p-2 rounded">
              <span className="text-[13px] font-bold text-foreground">{item.lang}</span>
              <div className="text-right">
                <p className="text-[12px] font-bold text-foreground">{item.wishlists} <span className="text-muted font-normal text-[10px]">wishlists</span></p>
                <p className="text-[10px] text-positive flex items-center gap-0.5 justify-end"><ArrowUpRight className="h-3 w-3" /> {item.pct} this month</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
