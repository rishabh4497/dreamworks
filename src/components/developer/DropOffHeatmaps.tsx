import { Flame, Clock, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";

export function DropOffHeatmaps() {
  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-foreground flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange" /> Player Drop-Off Heatmaps
          </h2>
          <p className="text-[13px] text-muted/70 mt-1">Track exactly when players quit your game forever.</p>
        </div>
      </div>

      <div className="space-y-4">
        {[
          { time: "0-10 Mins", drop: "4.2%", reason: "Menu / Crash", severity: "low" },
          { time: "11-30 Mins", drop: "18.5%", reason: "Tutorial Boss", severity: "high" },
          { time: "30-60 Mins", drop: "12.1%", reason: "First Open World Area", severity: "medium" },
          { time: "1-2 Hours", drop: "22.4%", reason: "Refund Window Ending", severity: "critical" },
        ].map((h, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-separator/40 pb-4 last:border-0 last:pb-0">
            <div className="w-24 text-[12px] font-medium text-muted/80 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {h.time}
            </div>
            <div className="flex-1 relative h-6 bg-input rounded-md overflow-hidden">
              <div 
                className={`absolute left-0 top-0 h-full ${h.severity === "critical" ? "bg-red" : h.severity === "high" ? "bg-orange" : h.severity === "medium" ? "bg-yellow/80" : "bg-acid/60"}`} 
                style={{ width: h.drop }}
              />
            </div>
            <div className="w-48">
              <p className="text-[12px] font-semibold flex items-center gap-1.5 text-foreground">
                <TrendingDown className="h-3 w-3 text-red" /> {h.drop} Quit
              </p>
              <p className="text-[10px] text-muted/60 truncate">Suspected: {h.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
