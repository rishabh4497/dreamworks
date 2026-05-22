import { Wrench, Check, AlertCircle } from "lucide-react";

export function ModManager() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6 mt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[16px] font-bold flex items-center gap-2 mb-1">
            <Wrench className="h-5 w-5 text-orange-400" /> Automated Mod Manager
          </h3>
          <p className="text-[13px] text-muted/80">Native support for Nexus Mods and Steam Workshop. Automatically handles load orders and conflicts.</p>
        </div>
        <button className="bg-orange-500 text-white px-4 py-2 rounded-lg text-[12px] font-bold shadow-lg hover:bg-orange-600 transition-colors">
          Browse Mods
        </button>
      </div>

      <div className="rounded-xl border border-separator bg-input overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-separator bg-card-active">
          <span className="text-[12px] font-bold text-foreground">Cyber Strike Mods</span>
          <span className="text-[11px] text-muted font-bold px-2 py-1 bg-card rounded border border-separator">3 Active</span>
        </div>
        
        <div className="divide-y divide-separator/50">
          <div className="flex items-center justify-between p-3 bg-card-hover">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded border border-acid bg-acid flex items-center justify-center">
                <Check className="h-3 w-3 text-background" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-foreground">4K Texture Overhaul V2</p>
                <p className="text-[11px] text-muted">Graphics • 4.2GB</p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-muted">Load Order: 01</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-card-hover">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded border border-acid bg-acid flex items-center justify-center">
                <Check className="h-3 w-3 text-background" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-foreground">Cyber UI Redux</p>
                <p className="text-[11px] text-muted">Interface • 12MB</p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-muted">Load Order: 02</span>
          </div>
          
          <div className="flex items-center justify-between p-3 border-l-2 border-l-red bg-red/5">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded border border-separator bg-card" />
              <div>
                <p className="text-[13px] font-bold text-foreground line-through opacity-70">Unlimited Sprint Cheat</p>
                <p className="text-[11px] text-red flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Blocked by Dreamworks Guard</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
