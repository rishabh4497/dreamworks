import { CalendarClock, DownloadCloud, ShoppingCart } from "lucide-react";
import type { Game } from "@/lib/types";
import { useCartStore } from "@/stores/cart-store";
import { toast } from "@/stores/toast-store";
import { formatBytes, formatDate, formatPrice } from "@/lib/utils";

function daysUntil(iso: string): number {
  const now = Date.now();
  const target = new Date(iso).getTime();
  const diffDays = Math.ceil((target - now) / (24 * 60 * 60 * 1000));
  return Math.max(0, diffDays);
}

interface PreOrderPanelProps {
  game: Game;
}

/**
 * Pre-order panel — renders for `comingSoon` titles that ship pre-order
 * tiers. Surfaces a countdown to release, pre-load info if available, and
 * a vertical list of tier cards each with a "Pre-order this edition"
 * button that drops the game into the cart.
 */
export function PreOrderPanel({ game }: PreOrderPanelProps) {
  const tiers = game.preOrderTiers ?? [];
  if (tiers.length === 0) return null;

  const addToCart = useCartStore((s) => s.add);
  const cartHas = useCartStore((s) => s.has(game.id));

  const releaseDays = daysUntil(game.releaseDate);
  const showPreLoad =
    typeof game.preLoadSizeBytes === "number" && game.preLoadStartsAt;

  const onPreOrder = (tierName: string) => {
    if (!cartHas) addToCart(game.id);
    toast.success(`Pre-ordered ${game.name} — ${tierName} added to cart`);
  };

  return (
    <section className="rounded-2xl border border-separator bg-card p-4">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground">Pre-order</h3>
          <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted/70">
            <CalendarClock className="h-3 w-3" />
            {releaseDays === 0
              ? "Releases today"
              : releaseDays === 1
              ? "Releases in 1 day"
              : `Releases in ${releaseDays} days`}
          </p>
        </div>
      </header>

      {showPreLoad && (
        <div className="mb-3 flex items-start gap-2 rounded-lg bg-card-active px-3 py-2 text-[11px] text-foreground/80">
          <DownloadCloud className="mt-0.5 h-3.5 w-3.5 shrink-0 text-acid" />
          <span>
            Pre-load {formatBytes(game.preLoadSizeBytes!)} starting{" "}
            {formatDate(game.preLoadStartsAt!)}
          </span>
        </div>
      )}

      <div className="space-y-2.5">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className="rounded-xl border border-separator bg-card-active/50 p-3"
          >
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <p className="text-[13px] font-semibold text-foreground">
                {tier.name}
              </p>
              <p className="text-[13px] font-semibold text-foreground">
                {formatPrice(tier.priceCents)}
              </p>
            </div>
            <ul className="mb-3 space-y-1 text-[11px] text-foreground/75">
              {tier.bonuses.map((b) => (
                <li key={b.name} className="flex items-start gap-1.5">
                  <span aria-hidden className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-acid" />
                  <span>
                    <span className="font-medium text-foreground/85">{b.name}</span>
                    <span className="text-muted/70"> — {b.description}</span>
                  </span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => onPreOrder(tier.name)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-acid px-3 py-2 text-[12px] font-semibold text-background hover:brightness-110"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Pre-order this edition
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
