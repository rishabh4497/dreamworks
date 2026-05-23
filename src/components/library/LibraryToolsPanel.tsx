import type { ReactNode } from "react";
import { motion } from "motion/react";
import { SaveRollback } from "@/components/library/SaveRollback";
import { ModManager } from "@/components/library/ModManager";
import { WishlistSync } from "@/components/library/WishlistSync";
import { CrossLauncherSearch } from "@/components/library/CrossLauncherSearch";
import { LibraryAutoOrganizer } from "@/components/library/LibraryAutoOrganizer";

interface LibraryToolsPanelProps {
  onPickCollection: (ids: string[], name: string) => void;
}

export function LibraryToolsPanel({ onPickCollection }: LibraryToolsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="space-y-8"
    >
      <ToolGroup label="Save & Mods">
        <div className="grid gap-6 md:grid-cols-2">
          <SaveRollback />
          <ModManager />
        </div>
      </ToolGroup>
      <ToolGroup label="Launcher & Sync">
        <div className="space-y-6">
          <CrossLauncherSearch />
          <WishlistSync />
        </div>
      </ToolGroup>
      <ToolGroup label="AI helpers">
        <LibraryAutoOrganizer onPickCollection={onPickCollection} />
      </ToolGroup>
    </motion.div>
  );
}

function ToolGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted/70">
        {label}
      </h3>
      {children}
    </section>
  );
}
