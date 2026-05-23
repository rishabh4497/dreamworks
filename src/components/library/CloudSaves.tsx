import { useState } from "react";
import { Cloud, History, RotateCcw, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSaveHistory } from "@/hooks/use-save-history";

interface CloudSavesProps {
  gameId: string;
}

export function CloudSaves({ gameId }: CloudSavesProps) {
  const { data: saves = [] } = useSaveHistory(gameId);
  const [synced, setSynced] = useState(true);
  const [rollingBack, setRollingBack] = useState<string | null>(null);

  const handleRollback = (id: string) => {
    setRollingBack(id);
    setTimeout(() => {
      setRollingBack(null);
    }, 2000);
  };

  return (
    <div className="rounded-xl border border-separator bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {synced ? <Cloud className="h-4 w-4 text-blue" /> : <CloudOff className="h-4 w-4 text-red" />}
          <h3 className="text-[14px] font-semibold text-foreground">Cloud Save Time Machine</h3>
        </div>
        <span className="text-[11px] font-medium text-muted/60">38 MB used</span>
      </div>

      <div className="space-y-2">
        {saves.map((save, i) => (
          <div key={save.id} className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${i === 0 ? "border-blue/30 bg-blue/5" : "border-separator/50 bg-card-active hover:bg-card-hover"}`}>
            <div className="flex items-start gap-3">
              <History className="mt-0.5 h-4 w-4 text-muted/50" />
              <div>
                <p className="text-[12px] font-semibold text-foreground">{save.desc}</p>
                <div className="flex gap-2 text-[10px] text-muted/70">
                  <span>{save.date}</span>
                  <span>·</span>
                  <span>{save.size}</span>
                </div>
              </div>
            </div>
            
            <Button 
              size="sm" 
              variant={i === 0 ? "primary" : "secondary"} 
              className={`h-7 px-3 text-[11px] ${i === 0 ? "pointer-events-none opacity-50" : ""}`}
              onClick={() => handleRollback(save.id)}
            >
              {rollingBack === save.id ? "Restoring..." : i === 0 ? "Current" : <><RotateCcw className="mr-1.5 h-3 w-3" /> Rollback</>}
            </Button>
          </div>
        ))}
      </div>
      
      <div className="mt-4 flex gap-2">
        <Button variant="secondary" className="w-full" onClick={() => setSynced(!synced)}>
          {synced ? "Force Sync Now" : "Enable Cloud Sync"}
        </Button>
      </div>
    </div>
  );
}
