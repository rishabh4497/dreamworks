import { LineChart, DollarSign } from "lucide-react";
export function MTXSimulator() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2"><LineChart className="h-5 w-5 text-yellow" /> Microtransaction Simulator</h3>
      <p className="text-[13px] text-muted/80 mt-1 mb-4">Simulate revenue impact based on price elasticity before pushing a new DLC.</p>
      <div className="flex items-center justify-between border-t border-separator/50 pt-4">
        <div>
          <p className="text-[11px] text-muted">Simulated $14.99 Price Point</p>
          <p className="text-[16px] font-bold text-positive flex items-center"><DollarSign className="h-4 w-4" /> +12.4% Est. Revenue</p>
        </div>
        <button className="text-[12px] font-bold bg-card-active px-3 py-1.5 rounded-lg hover:bg-input cursor-pointer">Run Simulation</button>
      </div>
    </div>
  );
}
