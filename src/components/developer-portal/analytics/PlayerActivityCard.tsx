import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PlayerCountChart } from "@/components/db/PlayerCountChart";
import { compactNumber } from "@/lib/utils";
import type { GameDetail } from "@/lib/types";

export function PlayerActivityCard({ detail }: { detail: GameDetail | undefined }) {
  const history = detail?.playerCountHistory ?? [];
  return (
    <Card className="p-5">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
            <Users className="h-4 w-4 text-green" /> Concurrent players
          </h3>
          <p className="text-[12px] text-muted/60">
            Live concurrent players, with 24h and all-time peaks for context.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[18px] font-semibold tabular-nums text-foreground">
            {compactNumber(detail?.currentPlayers ?? 0)}
          </p>
          <p className="text-[11px] text-muted/55">
            Peak 24h {compactNumber(detail?.peakPlayers24h ?? 0)} · all-time{" "}
            {compactNumber(detail?.peakPlayersAllTime ?? 0)}
          </p>
        </div>
      </header>
      {history.length === 0 ? (
        <p className="rounded-xl border border-dashed border-separator p-6 text-center text-[12px] text-muted/55">
          No player-count history yet. The first 24 hours after launch typically populates this.
        </p>
      ) : (
        <PlayerCountChart data={history} />
      )}
    </Card>
  );
}
