import { CloudOff, ArrowRight, Download, Upload } from "lucide-react";

export function CloudSaveConflict() {
  return (
    <div className="rounded-xl border border-red/30 bg-red/5 p-6 mb-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2 text-red mb-4">
        <CloudOff className="h-5 w-5" /> Cloud Save Conflict Detected
      </h3>
      <p className="text-[13px] text-foreground/80 mb-6">Cyber Strike has conflicting save data. Please choose which version to keep.</p>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 bg-card rounded-xl border border-separator p-4 w-full">
          <div className="flex items-center justify-between mb-3 border-b border-separator pb-2">
            <span className="text-[12px] font-bold text-muted uppercase tracking-wider">Local File</span>
            <span className="text-[10px] bg-card-active px-2 py-0.5 rounded text-muted">Today, 14:32</span>
          </div>
          <div className="space-y-1 text-[12px] mb-4">
            <p className="text-foreground"><span className="text-muted w-20 inline-block">Level:</span> 45 <span className="text-positive font-bold ml-1">(Higher)</span></p>
            <p className="text-foreground"><span className="text-muted w-20 inline-block">Playtime:</span> 12h 45m</p>
            <p className="text-foreground"><span className="text-muted w-20 inline-block">Location:</span> Final Boss Room</p>
          </div>
          <button className="w-full py-2 bg-input border border-separator rounded-lg text-[12px] font-bold hover:bg-card-hover flex items-center justify-center gap-2">
            <Upload className="h-3.5 w-3.5" /> Keep Local (Overwrite Cloud)
          </button>
        </div>

        <ArrowRight className="h-6 w-6 text-muted hidden md:block shrink-0" />

        <div className="flex-1 bg-card rounded-xl border border-cyan/30 p-4 w-full shadow-[0_0_15px_rgba(6,182,212,0.05)]">
          <div className="flex items-center justify-between mb-3 border-b border-cyan/20 pb-2">
            <span className="text-[12px] font-bold text-cyan uppercase tracking-wider flex items-center gap-1">Cloud File</span>
            <span className="text-[10px] bg-cyan/10 text-cyan px-2 py-0.5 rounded">Yesterday, 22:15</span>
          </div>
          <div className="space-y-1 text-[12px] mb-4">
            <p className="text-foreground"><span className="text-muted w-20 inline-block">Level:</span> 42</p>
            <p className="text-foreground"><span className="text-muted w-20 inline-block">Playtime:</span> 10h 12m</p>
            <p className="text-foreground"><span className="text-muted w-20 inline-block">Location:</span> Fire Temple</p>
          </div>
          <button className="w-full py-2 bg-cyan text-background rounded-lg text-[12px] font-bold hover:brightness-110 flex items-center justify-center gap-2">
            <Download className="h-3.5 w-3.5" /> Download Cloud (Overwrite Local)
          </button>
        </div>
      </div>
    </div>
  );
}
