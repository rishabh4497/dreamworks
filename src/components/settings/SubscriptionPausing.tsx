import { PauseCircle, PlayCircle, Calendar } from "lucide-react";

export function SubscriptionPausing() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6 mt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[16px] font-bold flex items-center gap-2 mb-1">
            <PauseCircle className="h-5 w-5 text-[#a052ff]" /> Pause Dreamworks+ Subscription
          </h3>
          <p className="text-[13px] text-muted/80">Going on vacation? Pause your billing for up to 2 months without losing your perks.</p>
        </div>
      </div>

      <div className="bg-card-active rounded-xl border border-separator/50 p-4 relative overflow-hidden flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-[#a052ff]/10 flex items-center justify-center border border-[#a052ff]/30">
            <PlayCircle className="h-6 w-6 text-[#a052ff]" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-foreground">Status: Active</p>
            <p className="text-[11px] text-muted flex items-center gap-1 mt-0.5"><Calendar className="h-3 w-3" /> Next billing date: Oct 15, 2026</p>
          </div>
        </div>
        <button className="bg-input border border-separator text-foreground px-4 py-2 rounded-lg text-[12px] font-bold hover:bg-card-hover transition-colors">
          Pause Billing
        </button>
      </div>
    </div>
  );
}
