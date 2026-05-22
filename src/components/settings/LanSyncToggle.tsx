import { useState } from "react";
import { Network, ServerCog } from "lucide-react";

export function LanSyncToggle() {
  const [enabled, setEnabled] = useState(true);

  return (
    <div className="rounded-xl border border-separator bg-card p-5 mt-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan/20 text-cyan">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-foreground">Local Network Transfers</h3>
            <p className="text-[13px] text-muted/80 mt-1 max-w-xl leading-relaxed">
              When enabled, Dreamworks will automatically discover and transfer game files from other PCs on your local network (LAN) instead of downloading them from the internet, saving bandwidth and time.
            </p>
            {enabled && (
              <div className="mt-4 flex items-center gap-2 text-[12px] font-medium text-cyan bg-cyan/10 px-3 py-1.5 rounded-lg w-fit border border-cyan/20">
                <ServerCog className="h-4 w-4" /> 2 devices found on local network
              </div>
            )}
          </div>
        </div>
        
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={enabled} onChange={() => setEnabled(!enabled)} />
          <div className="w-11 h-6 bg-input peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-separator after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan"></div>
        </label>
      </div>
    </div>
  );
}
