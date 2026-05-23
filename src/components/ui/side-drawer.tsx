import { AnimatePresence, motion } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Header rendered above the body — pass title chip + status row, not just a string. */
  header?: ReactNode;
  children: ReactNode;
  /** Tailwind width class — defaults to 460px-ish. */
  width?: string;
}

/**
 * Right-edge drawer used for chat side panels (Ask-AI, etc.). Acts like the
 * inline assistants in ChatGPT / Linear / Notion: full-height, snaps to the
 * right edge, doesn't blur the page behind it. ESC and outside click close.
 */
export function SideDrawer({
  open,
  onClose,
  header,
  children,
  width = "w-full max-w-[520px]",
}: SideDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            className="fixed inset-0 z-[190] bg-black/35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-modal="true"
            className={cn(
              "fixed inset-y-0 right-0 z-[200] flex flex-col border-l border-separator bg-bg shadow-2xl shadow-black/40",
              width,
            )}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <header className="flex items-center gap-3 border-b border-separator px-4 py-3">
              <div className="min-w-0 flex-1">{header}</div>
              <button
                onClick={onClose}
                aria-label="Close panel"
                className="rounded-lg p-1.5 text-muted/60 transition-colors hover:bg-card-active hover:text-foreground/85"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="flex min-h-0 flex-1 flex-col p-4">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
