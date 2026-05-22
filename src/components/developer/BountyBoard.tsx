import { Video, DollarSign, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function BountyBoard() {
  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-foreground flex items-center gap-2">
            <Video className="h-5 w-5 text-[#9146FF]" /> Streamer Bounty Board
          </h2>
          <p className="text-[13px] text-muted/70 mt-1">Offer incentives to content creators to play your game.</p>
        </div>
        <Button size="sm" className="bg-[#9146FF] text-white hover:bg-[#9146FF]/80">Create Bounty</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: "Defeat the First Boss", reward: "$50 + 5 Keys", req: "100+ Avg Viewers", claimed: 12, max: 20 },
          { title: "Review / First Impressions", reward: "Free Game Key", req: "Any Size Channel", claimed: 412, max: 1000 },
        ].map((b, i) => (
          <div key={i} className="rounded-xl border border-separator bg-card-active p-4">
            <h3 className="text-[14px] font-bold text-foreground">{b.title}</h3>
            
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-[12px] text-muted/80">
                <DollarSign className="h-3.5 w-3.5 text-green" /> Reward: <span className="font-semibold text-foreground">{b.reward}</span>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-muted/80">
                <Target className="h-3.5 w-3.5 text-acid" /> Req: {b.req}
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-separator/50 flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted/60">{b.claimed} / {b.max} Claimed</span>
              <span className="text-[11px] font-bold text-green">Active</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
