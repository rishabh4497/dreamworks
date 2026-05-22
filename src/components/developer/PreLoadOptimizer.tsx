import { DownloadCloud, Play } from "lucide-react";

export function PreLoadOptimizer() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[16px] font-bold flex items-center gap-2 mb-1">
            <DownloadCloud className="h-5 w-5 text-cyan" /> "Play as you Download" Optimizer
          </h3>
          <p className="text-[13px] text-muted/80">Select which chunks are required to launch the tutorial level while the rest downloads.</p>
        </div>
      </div>

      <div className="bg-input rounded-xl border border-separator p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-bold text-foreground">Total Build Size: 85 GB</span>
          <span className="text-[10px] text-acid font-bold flex items-center gap-1"><Play className="h-3 w-3" /> Playable at 12 GB</span>
        </div>
        
        <div className="h-4 w-full bg-card rounded-full overflow-hidden flex mb-4 border border-separator/50">
          <div className="h-full bg-acid w-[14%]" title="Chunk 0 (Tutorial)" />
          <div className="h-full bg-cyan/40 w-[30%]" title="Chunk 1 (Act 1)" />
          <div className="h-full bg-muted/20 w-[56%]" title="Chunk 2 (Act 2 & 3)" />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[11px] text-foreground">
            <input type="checkbox" defaultChecked className="accent-acid" /> Chunk 0: Core Engine + Tutorial Level (12GB)
          </label>
          <label className="flex items-center gap-2 text-[11px] text-foreground">
            <input type="checkbox" className="accent-acid" /> Chunk 1: Act 1 Assets (25GB)
          </label>
          <label className="flex items-center gap-2 text-[11px] text-foreground">
            <input type="checkbox" className="accent-acid" /> Chunk 2: Act 2 & 3 Assets (48GB)
          </label>
        </div>
      </div>
    </div>
  );
}
