import { Flame, Activity } from "lucide-react";
import { motion } from "motion/react";
export function CrashVisualizer() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2"><Flame className="h-5 w-5 text-orange-500" /> Crash Dump Visualizer</h3>
      <p className="text-[13px] text-muted/80 mt-1 mb-4">3D flame graphs showing exactly which engine functions caused crashes.</p>
      <div className="h-24 bg-card-active rounded-xl border border-separator/50 flex items-end p-2 gap-1 overflow-hidden relative">
        <div className="absolute top-2 left-2 text-[10px] font-bold text-muted/50 uppercase"><Activity className="h-3 w-3 inline mr-1" /> Stack Trace Activity</div>
        {Array.from({length: 20}).map((_, i) => (
          <motion.div key={i} animate={{ height: [10, Math.random() * 60 + 20, 10] }} transition={{ duration: 2 + Math.random(), repeat: Infinity }} className="flex-1 bg-orange-500/80 rounded-sm" />
        ))}
      </div>
    </div>
  );
}
