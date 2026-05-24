import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useUiStore } from "@/stores/ui-store";
import { track } from "@/lib/telemetry";

const LS_KEY = "dw_consent_v1";

/**
 * One-time banner on first session: explains what telemetry we capture and
 * lets users pick "share usage", "crashes only", or "no telemetry". Writes
 * through to the ui-store flags that the in-house telemetry collector reads.
 */
export function ConsentBanner() {
  const updateSettings = useUiStore((s) => s.updateSettings);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(LS_KEY)) return;
    const t = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const choose = (choice: "all" | "crashes" | "none") => {
    updateSettings({
      usageDiagnosticsEnabled: choice === "all",
      crashReportsEnabled: choice !== "none",
    });
    window.localStorage.setItem(LS_KEY, choice);
    setOpen(false);
    track("consent_change", { choice });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed bottom-4 left-1/2 z-50 w-[min(640px,calc(100vw-2rem))] -translate-x-1/2"
        >
          <Card className="flex items-start gap-3 p-4 shadow-xl">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-acid/10 text-acid">
              <Shield className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-[13px] font-semibold text-foreground/90">
                Help us improve Dreamworks
              </p>
              <p className="text-[12px] text-muted/70">
                We capture page views, performance, and errors in our own Firestore — no third-party
                trackers. Pick what you'd like to share. Change any time in Settings → Privacy.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => choose("all")}
                  className="rounded-md bg-acid px-3 py-1.5 text-[12px] font-semibold text-background hover:brightness-110"
                >
                  Share usage + crashes
                </button>
                <button
                  type="button"
                  onClick={() => choose("crashes")}
                  className="rounded-md bg-card-active px-3 py-1.5 text-[12px] font-medium text-foreground/85 hover:bg-card-hover"
                >
                  Crashes only
                </button>
                <button
                  type="button"
                  onClick={() => choose("none")}
                  className="rounded-md px-3 py-1.5 text-[12px] font-medium text-muted hover:text-foreground/85"
                >
                  Don't share anything
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => choose("crashes")}
              className="text-muted/40 hover:text-foreground"
              title="Dismiss (crashes only)"
            >
              <X className="h-4 w-4" />
            </button>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
