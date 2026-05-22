import { Shield, Zap } from "lucide-react";
export function DRMToggles() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2"><Shield className="h-5 w-5 text-acid" /> DRM A/B Testing</h3>
      <p className="text-[13px] text-muted/80 mt-1 mb-4">Test beta versions of your game with and without Dreamworks Guard DRM.</p>
      <div className="flex items-center gap-4 bg-acid/10 border border-acid/20 p-3 rounded-lg">
        <Zap className="h-5 w-5 text-acid" />
        <div>
          <p className="text-[12px] font-bold text-foreground">Performance Impact: 1.2% FPS drop</p>
          <p className="text-[11px] text-muted">Based on 14,029 active beta sessions</p>
        </div>
      </div>
    </div>
  );
}
