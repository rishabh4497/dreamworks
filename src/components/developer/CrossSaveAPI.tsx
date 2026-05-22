import { Database, Link2 } from "lucide-react";

export function CrossSaveAPI() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[16px] font-bold flex items-center gap-2 mb-1">
            <Database className="h-5 w-5 text-indigo-400" /> Universal Cross-Save API
          </h3>
          <p className="text-[13px] text-muted/80">A single unified API to sync your game's Xbox, PS5, and PC saves without building a backend.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-input rounded-lg border border-separator p-3 text-center opacity-50">
          <div className="h-2 w-2 rounded-full bg-red mx-auto mb-2" />
          <span className="text-[11px] font-bold text-muted uppercase">PlayStation</span>
        </div>
        <div className="bg-card-active rounded-lg border border-acid/50 p-3 text-center shadow-[0_0_10px_rgba(182,255,0,0.1)]">
          <div className="h-2 w-2 rounded-full bg-acid mx-auto mb-2 shadow-[0_0_5px_rgba(182,255,0,0.5)]" />
          <span className="text-[11px] font-bold text-foreground uppercase">PC / Dreamworks</span>
        </div>
        <div className="bg-input rounded-lg border border-separator p-3 text-center opacity-50">
          <div className="h-2 w-2 rounded-full bg-red mx-auto mb-2" />
          <span className="text-[11px] font-bold text-muted uppercase">Xbox</span>
        </div>
      </div>

      <button className="w-full bg-indigo-500 text-white font-bold text-[12px] py-2 rounded-lg hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2">
        <Link2 className="h-4 w-4" /> Link Console Developer Accounts
      </button>
    </div>
  );
}
