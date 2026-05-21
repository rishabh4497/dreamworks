import { MonitorCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCompatibility, useUpdateCompatibilityPreference } from "@/hooks/use-compatibility";
import { toast } from "@/stores/toast-store";
import type { GameId } from "@/lib/types";
import type { CompatibilityRating } from "@/lib/api/compatibility";
import { cn } from "@/lib/utils";

const RATING_LABEL: Record<CompatibilityRating, string> = {
  verified: "Verified",
  playable: "Playable",
  tweaks: "Needs tweaks",
  unsupported: "Unsupported",
  unknown: "Unknown",
};

function ratingVariant(rating: CompatibilityRating) {
  if (rating === "verified") return "free";
  if (rating === "playable") return "new";
  if (rating === "tweaks") return "soon";
  if (rating === "unsupported") return "warn";
  return "default";
}

interface CompatibilityPanelProps {
  gameId: GameId;
  compact?: boolean;
}

export function CompatibilityPanel({ gameId, compact = false }: CompatibilityPanelProps) {
  const { data } = useCompatibility(gameId);
  const updatePreference = useUpdateCompatibilityPreference(gameId);

  if (!data) return null;

  const updateRuntime = (selectedRuntime: string) => {
    updatePreference.mutate(
      { selectedRuntime },
      { onSuccess: () => toast.success("Runtime preference saved") },
    );
  };

  const updateLaunchOptions = (launchOptions: string) => {
    updatePreference.mutate(
      { launchOptions },
      { onSuccess: () => toast.success("Launch options saved") },
    );
  };

  return (
    <section
      className={cn(
        "rounded-2xl border border-separator bg-card p-4",
        compact && "rounded-xl",
      )}
    >
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MonitorCheck className="h-4 w-4 text-muted/60" />
          <h2 className="text-[14px] font-semibold text-foreground">
            Linux & Handheld
          </h2>
        </div>
        <div className="flex gap-1">
          <Badge variant={ratingVariant(data.linux)}>{RATING_LABEL[data.linux]}</Badge>
          <Badge variant={ratingVariant(data.handheld)}>Handheld {RATING_LABEL[data.handheld]}</Badge>
        </div>
      </header>

      <div className="space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-muted/45">
            Runtime
          </span>
          <select
            value={data.selectedRuntime}
            onChange={(event) => updateRuntime(event.target.value)}
            className="h-9 w-full rounded-lg border border-separator bg-input px-3 text-[12px] text-foreground focus:outline-none"
          >
            {data.runtimes.map((runtime) => (
              <option key={runtime.id} value={runtime.id}>
                {runtime.label}
                {runtime.recommended ? " (recommended)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-muted/45">
            Launch options
          </span>
          <input
            value={data.launchOptions}
            onChange={(event) => updateLaunchOptions(event.target.value)}
            placeholder="PROTON_ENABLE_NVAPI=1 %command%"
            className="h-9 w-full rounded-lg border border-separator bg-input px-3 text-[12px] text-foreground placeholder:text-muted/35 focus:outline-none"
          />
        </label>

        <div className="space-y-1.5 text-[11px] text-muted/65">
          {data.notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
          {data.warnings.map((warning) => (
            <p key={warning} className="flex gap-1.5 text-orange">
              <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
              <span>{warning}</span>
            </p>
          ))}
        </div>

        {data.linux === "unknown" && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => toast.info("Compatibility report submitted for review")}
          >
            Submit report
          </Button>
        )}
      </div>
    </section>
  );
}
