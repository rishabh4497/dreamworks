import { AlertOctagon, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

export function RefundPredictor() {
  return (
    <Card className="p-6 border-red/30 bg-red/5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-foreground flex items-center gap-2 text-red">
            <AlertOctagon className="h-5 w-5" /> Automated Refund Risk
          </h2>
          <p className="text-[13px] text-muted/70 mt-1">Predictive analysis of upcoming refund waves.</p>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="flex-1 space-y-3">
          <p className="text-[13px] font-medium text-foreground">
            Algorithm predicts a <strong className="text-red">14% spike</strong> in refunds over the next 24 hours.
          </p>
          <div className="rounded-lg bg-card border border-red/20 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted/60 mb-2">Primary Causes</p>
            <ul className="space-y-1.5 text-[12px] text-foreground/80">
              <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-red" /> Post-patch v1.2 performance issues on AMD GPUs</li>
              <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-orange" /> Playtime stalling at 1.8 hours (just before refund cutoff)</li>
            </ul>
          </div>
        </div>
        <div className="w-32 rounded-xl bg-card border border-red/20 p-3 text-center">
          <p className="text-[10px] uppercase tracking-widest text-muted/60">Risk Score</p>
          <p className="text-[32px] font-black text-red mt-1">High</p>
          <div className="mt-2 flex justify-center text-red">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </div>
    </Card>
  );
}
