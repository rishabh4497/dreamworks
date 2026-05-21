import { Download } from "lucide-react";
import { toast } from "@/stores/toast-store";

/**
 * Surfaces the "Try the demo" affordance on games that ship a free playable
 * sampler. The actual download is gated to the desktop client — clicking
 * here just informs the user via a toast.
 */
export function DemoButton() {
  const onClick = () => {
    toast.info("Demo install would start here in the desktop client");
  };

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-separator bg-card px-3 py-2 text-[12px] font-medium text-foreground/80 hover:bg-card-active hover:text-foreground transition-all"
    >
      <Download className="h-3.5 w-3.5" />
      Try the demo
    </button>
  );
}
