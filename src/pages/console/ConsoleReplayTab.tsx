import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConsoleSection } from "@/components/console/ConsoleSection";
import { ConsoleReplayList } from "@/components/console/ConsoleReplayList";
import { ConsoleReplayPlayer } from "@/components/console/ConsoleReplayPlayer";
import { useReplay, useReplaysList } from "@/hooks/use-console-advanced";

export function ConsoleReplayTab() {
  const [params] = useSearchParams();
  const id = params.get("id") ?? undefined;
  const [filter, setFilter] = useState<"all" | "frustration">("all");
  const { data: rows = [], isLoading } = useReplaysList({
    hasFrustration: filter === "frustration" ? true : undefined,
  });
  const { data: replay } = useReplay(id);
  if (isLoading) return <LoadingSpinner label="Loading replays…" />;
  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <div>
        <ConsoleSection
          title="Sessions"
          action={
            <div className="flex items-center gap-1 rounded-lg bg-input p-1">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`rounded-md px-2 py-0.5 text-[10.5px] font-medium transition-colors ${
                  filter === "all" ? "bg-card-active text-foreground" : "text-muted/65"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilter("frustration")}
                className={`rounded-md px-2 py-0.5 text-[10.5px] font-medium transition-colors ${
                  filter === "frustration" ? "bg-card-active text-foreground" : "text-muted/65"
                }`}
              >
                Frustration
              </button>
            </div>
          }
        >
          <Card className="p-2">
            <ConsoleReplayList rows={rows} selectedId={id} />
          </Card>
        </ConsoleSection>
      </div>
      <div>
        {replay ? (
          <ConsoleSection title="Player">
            <ConsoleReplayPlayer replay={replay} />
          </ConsoleSection>
        ) : (
          <Card className="p-10 text-center text-[12.5px] text-muted/55">
            Select a session from the list to play it back.
          </Card>
        )}
      </div>
    </div>
  );
}
