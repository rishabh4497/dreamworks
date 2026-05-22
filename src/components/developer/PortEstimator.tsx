import { Gamepad2, Percent } from "lucide-react";
export function PortEstimator() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2"><Gamepad2 className="h-5 w-5 text-blue-500" /> Console Port Estimator</h3>
      <p className="text-[13px] text-muted/80 mt-1 mb-4">Analyzes poly counts and memory usage to give a feasibility score for a console port.</p>
      <div className="flex gap-4">
        <div className="flex-1 bg-input rounded-lg border border-separator p-3 text-center">
          <p className="text-[10px] uppercase font-bold text-muted mb-1">PlayStation 5</p>
          <div className="text-[20px] font-black text-positive flex items-center justify-center gap-1">98<Percent className="h-4 w-4" /></div>
          <p className="text-[10px] text-muted">Ready to port</p>
        </div>
        <div className="flex-1 bg-input rounded-lg border border-separator p-3 text-center opacity-70">
          <p className="text-[10px] uppercase font-bold text-muted mb-1">Nintendo Switch</p>
          <div className="text-[20px] font-black text-red flex items-center justify-center gap-1">24<Percent className="h-4 w-4" /></div>
          <p className="text-[10px] text-red">Memory limit exceeded</p>
        </div>
      </div>
    </div>
  );
}
