import { RefreshCw, CheckCircle2 } from "lucide-react";

export function WishlistSync() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6 mt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[16px] font-bold flex items-center gap-2 mb-1">
            <RefreshCw className="h-5 w-5 text-cyan" /> Cross-Platform Wishlist Sync
          </h3>
          <p className="text-[13px] text-muted/80">Automatically sync your wishlists from external platforms. We'll notify you if they go on sale here.</p>
        </div>
        <button className="bg-input text-foreground border border-separator px-4 py-2 rounded-lg text-[12px] font-bold hover:bg-card-hover flex items-center gap-2">
          <RefreshCw className="h-3.5 w-3.5" /> Sync Now
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-card-active rounded-xl border border-separator/50 p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#171a21]" />
          <h4 className="text-[14px] font-bold text-foreground mt-2">Steam</h4>
          <p className="text-[11px] text-muted mt-1">42 games tracked</p>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-positive bg-positive/10 px-2 py-1 rounded w-fit">
            <CheckCircle2 className="h-3 w-3" /> Connected
          </div>
        </div>
        
        <div className="bg-card-active rounded-xl border border-separator/50 p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#00439c]" />
          <h4 className="text-[14px] font-bold text-foreground mt-2">PlayStation Network</h4>
          <p className="text-[11px] text-muted mt-1">Not connected</p>
          <button className="mt-3 text-[11px] font-bold text-foreground bg-input border border-separator px-3 py-1 rounded hover:bg-card-hover w-full text-center">
            Connect PSN
          </button>
        </div>
        
        <div className="bg-card-active rounded-xl border border-separator/50 p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#107c10]" />
          <h4 className="text-[14px] font-bold text-foreground mt-2">Xbox Network</h4>
          <p className="text-[11px] text-muted mt-1">14 games tracked</p>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-positive bg-positive/10 px-2 py-1 rounded w-fit">
            <CheckCircle2 className="h-3 w-3" /> Connected
          </div>
        </div>
      </div>
    </div>
  );
}
