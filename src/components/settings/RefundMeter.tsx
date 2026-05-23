import { Clock, AlertCircle } from "lucide-react";
import { useLibraryStore } from "@/stores/library-store";
import { useGames } from "@/hooks/use-games";
import { useTranslation } from "@/lib/i18n";
import { toast } from "@/stores/toast-store";
import { isRefundEligible } from "@/lib/refund";
import { cn } from "@/lib/utils";
import type { LibraryEntry, Game } from "@/lib/types";

const MAX_ROWS = 3;

export function RefundMeter() {
  const entries = useLibraryStore((s) => s.entries);
  const requestRefund = useLibraryStore((s) => s.requestRefund);
  const { data: games = [] } = useGames();
  const { t } = useTranslation();

  const eligible = entries
    .filter((e) => isRefundEligible(e.refundWindow, e.playMinutes))
    .slice(0, MAX_ROWS);

  const onRequest = async (entry: LibraryEntry, game: Game | undefined) => {
    const ok = await requestRefund(entry.gameId);
    if (ok) {
      toast.success(t("Refund requested for {game}", { game: game?.name ?? entry.gameId }));
    }
  };

  return (
    <div className="rounded-xl border border-separator bg-card p-6 mt-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2 mb-2">
        <Clock className="h-5 w-5 text-cyan" /> {t("Refund Eligibility Meter")}
      </h3>
      <p className="text-[13px] text-muted/80 mb-6">
        {t("Track the remaining refund window for your recent purchases.")}
      </p>

      {eligible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-separator bg-card-active/40 p-6 text-center">
          <AlertCircle className="mx-auto mb-2 h-7 w-7 text-muted/45" />
          <p className="text-[12px] text-muted/65">
            {t("No purchases within the refund window")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {eligible.map((entry) => {
            const game = games.find((g) => g.id === entry.gameId);
            const budget = entry.refundWindow!.eligibleMinutes;
            const progress = Math.min(1, entry.playMinutes / budget);
            const overHalf = progress > 0.5;
            return (
              <div key={entry.gameId} className="bg-input rounded-xl border border-separator p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {game?.coverUrl ? (
                      <img loading="lazy" decoding="async" loading="lazy" decoding="async" src={game.coverUrl} alt="" className="w-12 h-12 rounded object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-card flex items-center justify-center border border-separator">
                        <span className="text-[10px] text-muted">Art</span>
                      </div>
                    )}
                    <div>
                      <p className="text-[13px] font-bold text-foreground">
                        {game?.name ?? entry.gameId}
                      </p>
                      <p className="text-[11px] text-muted">
                        {t("{n} mins played", { n: entry.playMinutes })}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRequest(entry, game)}
                    className="bg-cyan/10 text-cyan border border-cyan/30 px-3 py-1.5 rounded-md text-[11px] font-bold hover:bg-cyan/20 transition-colors"
                  >
                    {t("Request Refund")}
                  </button>
                </div>
                <div className="relative h-2 bg-card rounded-full overflow-hidden mb-2">
                  <div
                    className={cn(
                      "absolute top-0 left-0 h-full transition-[width]",
                      overHalf ? "bg-orange-500" : "bg-cyan",
                    )}
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted">
                  <span>{t("{n} mins played", { n: entry.playMinutes })}</span>
                  <span>{t("{n} hours max", { n: Math.round(budget / 60) })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
