import { Zap, UploadCloud } from "lucide-react";

export function SilentHotfixDeployer() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2 mb-1">
        <Zap className="h-5 w-5 text-yellow" /> Silent Hotfix Deployer
      </h3>
      <p className="text-[13px] text-muted/80 mb-6">Push patches under 50MB directly into active memory without requiring a game restart.</p>

      <div className="border-2 border-dashed border-yellow/30 bg-yellow/5 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-yellow/50 transition-colors cursor-pointer group">
        <UploadCloud className="h-8 w-8 text-yellow/70 group-hover:text-yellow mb-2 transition-colors" />
        <p className="text-[13px] font-bold text-foreground">Upload Hotfix Package</p>
        <p className="text-[10px] text-muted mt-1">.pak or .dll modifications only (Max 50MB)</p>
      </div>

      <div className="mt-4 bg-input rounded-lg p-3 border border-separator flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-acid animate-pulse" />
          <span className="text-[11px] text-muted">Active Players: <strong className="text-foreground">14,209</strong></span>
        </div>
        <span className="text-[10px] bg-card-active px-2 py-1 rounded border border-separator text-muted">Ready to inject</span>
      </div>
    </div>
  );
}
