import { Handshake, Ticket, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PromoEngine() {
  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-foreground flex items-center gap-2">
            <Handshake className="h-5 w-5 text-acid" /> Cross-Game Promo Engine
          </h2>
          <p className="text-[13px] text-muted/70 mt-1">Partner with other indie devs to create auto-bundled discounts.</p>
        </div>
        <Button size="sm">Find Partners</Button>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-separator bg-card-active p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-bold text-foreground">"The Sci-Fi Shooter Bundle"</span>
            <span className="text-[11px] font-bold text-green px-2 py-0.5 rounded-full bg-green/10">Active</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex-1 flex items-center gap-3 bg-card rounded-lg p-2 border border-separator">
              <div className="h-10 w-10 bg-input rounded-md flex items-center justify-center text-[10px] font-bold">You</div>
              <div>
                <p className="text-[12px] font-semibold">Your Game</p>
                <p className="text-[10px] text-muted">70% Rev Share</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted/40" />
            <div className="flex-1 flex items-center gap-3 bg-card rounded-lg p-2 border border-separator">
              <div className="h-10 w-10 bg-input rounded-md flex items-center justify-center text-[10px] font-bold">Other</div>
              <div>
                <p className="text-[12px] font-semibold">Stellar Tactics</p>
                <p className="text-[10px] text-muted">30% Rev Share</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between text-[12px]">
            <span className="text-muted/80 flex items-center gap-1.5"><Ticket className="h-3.5 w-3.5" /> 15% Bundle Discount</span>
            <span className="font-semibold text-foreground">1,204 Sales Generated</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
