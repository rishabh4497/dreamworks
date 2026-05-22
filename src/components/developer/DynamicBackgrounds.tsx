import { Video, Upload, PlayCircle } from "lucide-react";
export function DynamicBackgrounds() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2"><Video className="h-5 w-5 text-purple-400" /> Dynamic Store Backgrounds</h3>
      <p className="text-[13px] text-muted/80 mt-1 mb-4">Set 4K 60FPS video loops as the background of your store page.</p>
      <div className="border-2 border-dashed border-separator rounded-xl h-32 flex flex-col items-center justify-center text-muted hover:border-purple-400/50 hover:text-purple-400 transition-colors cursor-pointer bg-card-active/30">
        <Upload className="h-6 w-6 mb-2" />
        <span className="text-[12px] font-bold">Upload MP4 or WebM (Max 50MB)</span>
      </div>
      <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-foreground">
        <PlayCircle className="h-4 w-4 text-positive" /> Current Video: <span className="text-muted">cyber_strike_bg_loop.mp4</span>
      </div>
    </div>
  );
}
