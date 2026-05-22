import { Server, Activity } from "lucide-react";
export function ServerAutoScaler() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2"><Server className="h-5 w-5 text-acid" /> Server Fleet Auto-Scaler</h3>
      <p className="text-[13px] text-muted/80 mt-1 mb-4">Automatically spins up AWS/GCP servers based on live concurrent player count predictions.</p>
      <div className="flex items-end justify-between bg-card-active rounded-lg border border-separator p-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted font-bold mb-1"><Activity className="h-3 w-3 inline mr-1 text-acid" /> Current Load</p>
          <p className="text-[20px] font-black text-foreground">84% Capacity</p>
        </div>
        <div className="text-right">
          <p className="text-[12px] text-acid font-bold">Spinning up 3 new nodes...</p>
        </div>
      </div>
    </div>
  );
}
