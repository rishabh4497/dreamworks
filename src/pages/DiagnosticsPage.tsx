import { motion } from "motion/react";

export function DiagnosticsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="space-y-6"
    >
      <header>
        <h1 className="text-[20px] font-semibold tracking-tight text-foreground">
          System Diagnostics
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          Hardware snapshot, live resource monitor, FPS estimate, and launcher scan.
        </p>
      </header>
      <div className="rounded-xl border border-separator bg-card p-6 text-[13px] text-muted">
        Diagnostics surface is initializing — switch back shortly once the Rust commands ship in
        this build.
      </div>
    </motion.div>
  );
}
