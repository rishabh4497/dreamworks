import { Gamepad2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useControllerLayouts } from "@/hooks/use-controller-layouts";
import { compactNumber } from "@/lib/utils";

export function ControllerHub() {
  const { data: layouts = [], isLoading } = useControllerLayouts();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-separator bg-card p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue/10 text-blue">
          <Gamepad2 className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-[14px] font-semibold text-foreground">DualSense Wireless Controller</h3>
          <p className="text-[12px] text-green">Connected via Bluetooth · 82% Battery</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" size="sm">Calibrate</Button>
          <Button size="sm">Edit Layout</Button>
        </div>
      </div>

      <div className="rounded-xl border border-separator bg-card p-4">
        <h3 className="mb-4 text-[13px] font-semibold text-foreground">Community Layouts (Global)</h3>
        {isLoading ? (
          <p className="text-[12px] text-muted">Loading layouts…</p>
        ) : layouts.length === 0 ? (
          <p className="text-[12px] text-muted">No community layouts yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {layouts.map((layout) => (
              <div key={layout.id} className="flex items-center justify-between rounded-lg border border-separator/50 bg-card-active p-3">
                <div>
                  <p className="text-[12px] font-semibold text-foreground">{layout.name}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted/70">
                    <span>by {layout.creator}</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5"><Download className="h-3 w-3" /> {compactNumber(layout.downloads)}</span>
                  </div>
                </div>
                <Button variant="secondary" size="sm" className="h-7 px-3 text-[11px]">Apply</Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
