import { Clock, AlertCircle } from "lucide-react";

export function RefundMeter() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6 mt-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2 mb-2">
        <Clock className="h-5 w-5 text-cyan" /> Refund Eligibility Meter
      </h3>
      <p className="text-[13px] text-muted/80 mb-6">Track the remaining 2-hour refund window for your recent purchases.</p>

      <div className="space-y-4">
        <div className="bg-input rounded-xl border border-separator p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <img src="https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc8f29.jpg" alt="Game" className="w-12 h-12 rounded object-cover" />
              <div>
                <p className="text-[13px] font-bold text-foreground">Cyber Strike</p>
                <p className="text-[11px] text-muted">Purchased Today</p>
              </div>
            </div>
            <button className="bg-cyan/10 text-cyan border border-cyan/30 px-3 py-1.5 rounded-md text-[11px] font-bold hover:bg-cyan/20 transition-colors">
              Request Refund
            </button>
          </div>
          <div className="relative h-2 bg-card rounded-full overflow-hidden mb-2">
            <div className="absolute top-0 left-0 h-full bg-cyan w-[45%]" />
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted">
            <span>54 mins played</span>
            <span>2 hours max</span>
          </div>
        </div>

        <div className="bg-input rounded-xl border border-separator p-4 opacity-70">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-card flex items-center justify-center border border-separator">
                <span className="text-[10px] text-muted">Art</span>
              </div>
              <div>
                <p className="text-[13px] font-bold text-foreground line-through">Fantasy Quest</p>
                <p className="text-[11px] text-red flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Not Eligible</p>
              </div>
            </div>
          </div>
          <div className="relative h-2 bg-card rounded-full overflow-hidden mb-2">
            <div className="absolute top-0 left-0 h-full bg-red w-full" />
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted">
            <span className="text-red">14 hours played</span>
            <span>2 hours max</span>
          </div>
        </div>
      </div>
    </div>
  );
}
