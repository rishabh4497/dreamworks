import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface QueryErrorStateProps {
  message?: string;
  onRetry: () => void;
  isRetrying?: boolean;
  className?: string;
}

/**
 * Inline error+retry affordance for any React Query consumer. Pair with
 * `useQuery`'s `isError` + `refetch` so the user can recover from a transient
 * failure without reloading the page.
 */
export function QueryErrorState({
  message = "Couldn't load this. Please retry.",
  onRetry,
  isRetrying = false,
  className,
}: QueryErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-3 rounded-xl border border-red/25 bg-red/5 px-3 py-2.5 text-[12px] text-foreground/85",
        className,
      )}
    >
      <AlertTriangle className="h-4 w-4 shrink-0 text-red/80" />
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="inline-flex items-center gap-1.5 rounded-md border border-red/30 bg-red/10 px-2.5 py-1 text-[11px] font-semibold text-red hover:bg-red/15 disabled:opacity-50"
      >
        <RefreshCw className={cn("h-3 w-3", isRetrying && "animate-spin")} />
        Retry
      </button>
    </div>
  );
}
