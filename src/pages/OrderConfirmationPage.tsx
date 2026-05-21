import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { useLibraryStore } from "@/stores/library-store";
import { useGames } from "@/hooks/use-games";
import { remainingRefundCopy } from "@/lib/refund";
import { getOrder } from "@/lib/api/orders";

export function OrderConfirmationPage() {
  const { orderId } = useParams();
  const entries = useLibraryStore((s) => s.entries);
  const { data: games } = useGames();
  const { data: order } = useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => getOrder(orderId!),
    enabled: Boolean(orderId),
  });
  const orderEntries = orderId ? entries.filter((e) => e.orderId === orderId) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-[60vh] flex-col items-center justify-center text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green/15">
        <CheckCircle2 className="h-6 w-6 text-green" />
      </div>
      <h1 className="mt-5 text-[20px] font-semibold text-foreground">Thanks for your order</h1>
      <p className="mt-1 text-[13px] text-muted/60">
        Order <span className="font-mono text-foreground/80">{orderId}</span> has been added to your library.
      </p>
      {order?.receiptNumber && (
        <p className="mt-1 text-[11px] text-muted/50">
          Receipt <span className="font-mono">{order.receiptNumber}</span>
        </p>
      )}

      {orderEntries.length > 0 ? (
        <div className="mt-5 w-full max-w-md rounded-xl border border-separator bg-card p-4 text-left">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted/60">
            <ShieldCheck className="h-3 w-3" /> Refund eligibility
          </p>
          <ul className="space-y-1.5">
            {orderEntries.map((entry) => {
              const game = games?.find((g) => g.id === entry.gameId);
              const name = game?.name ?? entry.gameId;
              const copy = entry.refundWindow
                ? remainingRefundCopy(entry.refundWindow, entry.playMinutes)
                : "Refund window closed";
              return (
                <li key={entry.gameId} className="text-[12px] text-foreground/80">
                  <span className="font-medium text-foreground">{name}</span>
                  <span className="text-muted/70"> - {copy}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-[10px] text-muted/50">
            14 days from purchase, scaled to game length. Stop the clock the moment you exceed the
            play budget.
          </p>
        </div>
      ) : (
        <p className="mt-5 max-w-md text-[12px] text-muted/60">
          Refund eligibility: 14 days from purchase, scaled to game length.
        </p>
      )}

      <div className="mt-6 flex gap-2">
        <Link
          to={ROUTES.library}
          className="rounded-xl bg-acid px-4 py-2 text-[13px] font-semibold text-background"
        >
          Go to library
        </Link>
        <Link
          to={ROUTES.store}
          className="rounded-xl border border-separator bg-card px-4 py-2 text-[13px] font-medium text-foreground/80 hover:bg-card-active"
        >
          Keep shopping
        </Link>
      </div>
    </motion.div>
  );
}
