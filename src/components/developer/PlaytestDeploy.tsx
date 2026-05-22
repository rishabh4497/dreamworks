import { useState } from "react";
import { Rocket, Users, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PlaytestDeploy() {
  const [deployed, setDeployed] = useState(false);

  return (
    <Card className="p-6 border-acid/30 bg-acid/5">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-foreground flex items-center gap-2">
            <Rocket className="h-5 w-5 text-acid" /> 1-Click Playtest Branch
          </h2>
          <p className="text-[13px] text-muted/70 mt-1">Deploy a closed beta build directly to randomly selected wishlisters.</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-3 bg-card rounded-lg p-3 border border-separator">
          <div className="h-8 w-8 rounded-full bg-input flex items-center justify-center">
            <Users className="h-4 w-4 text-muted/80" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-foreground">Select Audience</p>
            <p className="text-[11px] text-muted/60">Invite 500 users who have wishlisted the game for &gt; 3 months.</p>
          </div>
          <Button variant="secondary" size="sm">Edit</Button>
        </div>
        
        <div className="flex items-center gap-3 bg-card rounded-lg p-3 border border-separator">
          <div className="h-8 w-8 rounded-full bg-input flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-green" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-foreground">Automated NDA</p>
            <p className="text-[11px] text-muted/60">Users must agree to a strict non-disclosure agreement before downloading.</p>
          </div>
          <Button variant="secondary" size="sm">View Contract</Button>
        </div>
      </div>

      <Button 
        onClick={() => setDeployed(true)} 
        disabled={deployed}
        className="w-full bg-acid text-background hover:brightness-110"
      >
        {deployed ? "Playtest Deployed!" : "Deploy Playtest Build v0.8.4"}
      </Button>
    </Card>
  );
}
