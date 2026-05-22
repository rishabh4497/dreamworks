import { Globe2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function RegionalPricingAI() {
  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-foreground flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-blue" /> Dynamic Regional Pricing
          </h2>
          <p className="text-[13px] text-muted/70 mt-1">AI-suggested adjustments based on real-time currency parity.</p>
        </div>
      </div>

      <div className="space-y-3">
        {[
          { country: "Argentina", code: "ARS", current: "$14.99", suggested: "$8.99", reason: "Hyperinflation adjustment", action: "Decrease" },
          { country: "Turkey", code: "TRY", current: "$12.99", suggested: "$9.50", reason: "Purchasing power parity shift", action: "Decrease" },
          { country: "Japan", code: "JPY", current: "¥2,400", suggested: "¥2,800", reason: "Yen stabilization", action: "Increase" },
        ].map((r, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-separator bg-card-active">
            <div className="w-1/3">
              <p className="text-[13px] font-semibold text-foreground">{r.country} ({r.code})</p>
              <p className="text-[11px] text-muted/60">{r.reason}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-medium text-muted/80 line-through">{r.current}</span>
              <ArrowRight className="h-4 w-4 text-muted/40" />
              <span className={`text-[14px] font-bold ${r.action === "Decrease" ? "text-green" : "text-acid"}`}>
                {r.suggested}
              </span>
            </div>
            
            <Button size="sm" variant={r.action === "Decrease" ? "secondary" : "primary"}>
              Apply
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
