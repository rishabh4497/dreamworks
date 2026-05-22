import { Map, Footprints } from "lucide-react";
export function TelemetryHeatmaps() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2"><Map className="h-5 w-5 text-orange-400" /> "First 15 Mins" Heatmaps</h3>
      <p className="text-[13px] text-muted/80 mt-1 mb-4">A granular map showing exactly where players walk during the first 15 minutes.</p>
      <div className="h-32 bg-[url('https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc8f29.jpg')] bg-cover bg-center rounded-lg border border-separator overflow-hidden relative">
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute top-1/2 left-1/4 h-12 w-12 rounded-full bg-red/60 blur-xl mix-blend-screen" />
        <div className="absolute top-1/3 left-1/2 h-8 w-8 rounded-full bg-orange-500/60 blur-lg mix-blend-screen" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[14px] font-bold text-white flex items-center gap-2"><Footprints className="h-4 w-4" /> 72% Player Churn at Zone B</span>
        </div>
      </div>
    </div>
  );
}
