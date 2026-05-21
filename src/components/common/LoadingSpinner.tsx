import { Loader2 } from "lucide-react";

export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-muted/60">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label && <span className="text-[13px]">{label}</span>}
    </div>
  );
}
