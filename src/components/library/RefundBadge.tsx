import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import type { LibraryEntry } from "@/lib/types";
import { useGames } from "@/hooks/use-games";
import { useLibraryStore } from "@/stores/library-store";
import { toast } from "@/stores/toast-store";
import { isRefundEligible, remainingRefundCopy } from "@/lib/refund";
import { formatPrice } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";

interface RefundBadgeProps {
  entry: LibraryEntry;
}

export function RefundBadge({ entry }: RefundBadgeProps) {
  const [open, setOpen] = useState(false);
  const { data: games } = useGames();
  const game = games?.find((g) => g.id === entry.gameId);
  const eligible = isRefundEligible(entry.refundWindow, entry.playMinutes);

  if (!entry.refundWindow) return null;

  if (!eligible) {
    return (
      <span className="inline-flex items-center text-[10px] text-muted/50">
        Refund window closed
      </span>
    );
  }

  const copy = remainingRefundCopy(entry.refundWindow, entry.playMinutes);

  const confirmRefund = () => {
    const ok = useLibraryStore.getState().requestRefund(entry.gameId);
    setOpen(false);
    if (!ok) {
      toast.error("This game is no longer refund-eligible");
      return;
    }
    const refundCents = game?.price.final ?? 0;
    toast.success(`Refunded ${formatPrice(refundCents)}`);
  };

  return (
    <>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green/15 px-2 py-0.5 text-[10px] font-medium text-green">
        <ShieldCheck className="h-3 w-3" />
        {copy}
        <button
          onClick={() => setOpen(true)}
          className="ml-1 rounded-sm text-green underline-offset-2 hover:underline"
          type="button"
        >
          Refund
        </button>
      </span>
      <Modal open={open} onClose={() => setOpen(false)} title="Confirm refund">
        <div className="space-y-4">
          <p className="text-[13px] text-foreground/80">
            Refund{" "}
            <span className="font-semibold text-foreground">
              {game?.name ?? entry.gameId}
            </span>{" "}
            for{" "}
            <span className="font-semibold text-foreground">
              {formatPrice(game?.price.final ?? 0)}
            </span>
            ? The game will be removed from your library.
          </p>
          <p className="text-[11px] text-muted/60">{copy}</p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-separator bg-card px-4 py-2 text-[13px] font-medium text-foreground/80 hover:bg-card-active"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmRefund}
              className="rounded-xl bg-acid px-4 py-2 text-[13px] font-semibold text-background hover:brightness-110"
            >
              Confirm refund
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
