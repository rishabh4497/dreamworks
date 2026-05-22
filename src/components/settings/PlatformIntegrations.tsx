import { useState } from "react";
import { CheckCircle2, Link as LinkIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  { id: "psn", name: "PlayStation Network", color: "bg-[#00439C]", connected: true, lastSync: "2 hours ago" },
  { id: "xbox", name: "Xbox Live", color: "bg-[#107C10]", connected: false, lastSync: null },
  { id: "steam", name: "Steam", color: "bg-[#171a21]", connected: true, lastSync: "Just now" },
  { id: "epic", name: "Epic Games", color: "bg-[#313131]", connected: false, lastSync: null },
];

export function PlatformIntegrations() {
  const [syncing, setSyncing] = useState<string | null>(null);

  const handleSync = (id: string) => {
    setSyncing(id);
    setTimeout(() => setSyncing(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="text-[13px] text-muted/80">
        Connect your other gaming accounts to import your playtime, achievements, and library into Dreamworks.
      </div>
      
      <div className="grid gap-3 sm:grid-cols-2">
        {PLATFORMS.map(p => (
          <div key={p.id} className={cn("flex flex-col justify-between rounded-xl border p-4", p.connected ? "border-separator bg-card" : "border-dashed border-separator/50 bg-card-active/30")}>
            <div className="flex items-center gap-3">
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-inner", p.color)}>
                <span className="text-[12px] font-bold text-white uppercase">{p.id}</span>
              </div>
              <div>
                <p className="text-[14px] font-semibold text-foreground">{p.name}</p>
                {p.connected ? (
                  <p className="flex items-center gap-1 text-[11px] text-green">
                    <CheckCircle2 className="h-3 w-3" /> Connected
                  </p>
                ) : (
                  <p className="text-[11px] text-muted">Not connected</p>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-separator/30 pt-4">
              <span className="text-[10px] text-muted/60">
                {p.connected ? `Last synced: ${p.lastSync}` : "No data"}
              </span>
              {p.connected ? (
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="h-7 px-3 text-[11px]"
                    onClick={() => handleSync(p.id)}
                    disabled={syncing === p.id}
                  >
                    <RefreshCw className={cn("mr-1.5 h-3 w-3", syncing === p.id && "animate-spin")} />
                    Sync
                  </Button>
                  <Button variant="secondary" size="sm" className="h-7 px-3 text-[11px] text-red hover:bg-red/10 hover:text-red">Unlink</Button>
                </div>
              ) : (
                <Button size="sm" className="h-7 px-3 text-[11px] bg-acid text-background hover:brightness-110">
                  <LinkIcon className="mr-1.5 h-3 w-3" /> Connect
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
