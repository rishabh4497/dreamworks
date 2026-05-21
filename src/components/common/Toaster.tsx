import { AnimatePresence, motion } from "motion/react";
import { Check, AlertCircle, Info, X } from "lucide-react";
import { useToastStore } from "@/stores/toast-store";

const icons = { success: Check, error: AlertCircle, info: Info } as const;
const colors = {
  success: "text-green",
  error: "text-red/70",
  info: "text-foreground/60",
} as const;

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto flex items-center gap-2.5 rounded-xl border border-separator bg-bg/95 backdrop-blur-lg px-4 py-3 shadow-lg shadow-black/20 min-w-[240px]"
            >
              <Icon className={`h-4 w-4 shrink-0 ${colors[toast.type]}`} />
              <span className="text-[13px] text-foreground/80 flex-1">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-muted/30 hover:text-foreground/50 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
