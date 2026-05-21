import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Bell, Heart } from "lucide-react";
import { useGames } from "@/hooks/use-games";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useSimulateWishlistAlert } from "@/hooks/use-wishlist-alerts";
import { ROUTES } from "@/lib/routes";
import { EmptyState } from "@/components/common/EmptyState";
import { PriceTag } from "@/components/ui/price-tag";
import { Badge } from "@/components/ui/badge";
import { AlertSettings } from "@/components/wishlist/AlertSettings";
import { useCartStore } from "@/stores/cart-store";
import { toast } from "@/stores/toast-store";
import { cn, formatPrice } from "@/lib/utils";
import type { GameId, WishlistEntry } from "@/lib/types";

type Sort = "added" | "discount" | "price-low" | "price-high" | "rating" | "name";

const SORT_LABELS: Record<Sort, string> = {
  added: "Most recently added",
  discount: "Biggest discount",
  "price-low": "Price: low to high",
  "price-high": "Price: high to low",
  rating: "Highest rated",
  name: "Name (A → Z)",
};

function thresholdLabel(entry: WishlistEntry | undefined): string | null {
  if (!entry) return null;
  if (entry.notifyOnlyAtATL) return "Alert at all-time low";
  if (typeof entry.priceCeilingCents === "number") {
    return `Alert under ${formatPrice(entry.priceCeilingCents, "USD")}`;
  }
  return null;
}

function hasThreshold(entry: WishlistEntry | undefined): boolean {
  if (!entry) return false;
  return Boolean(
    entry.notifyOnlyAtATL || typeof entry.priceCeilingCents === "number",
  );
}

export function WishlistPage() {
  const entries = useWishlistStore((s) => s.entries);
  const remove = useWishlistStore((s) => s.remove);
  const getEntry = useWishlistStore((s) => s.getEntry);
  const { data: games } = useGames();
  const addToCart = useCartStore((s) => s.add);
  const simulate = useSimulateWishlistAlert();
  const [sort, setSort] = useState<Sort>("added");
  const [editing, setEditing] = useState<{ id: GameId; name: string } | null>(null);

  const ids = useMemo(() => entries.map((e) => e.gameId), [entries]);

  const list = useMemo(() => {
    if (!games) return [];
    const owned = games.filter((g) => ids.includes(g.id));
    const sorted = [...owned];
    switch (sort) {
      case "discount":
        sorted.sort((a, b) => b.price.discountPct - a.price.discountPct);
        break;
      case "price-low":
        sorted.sort((a, b) => a.price.final - b.price.final);
        break;
      case "price-high":
        sorted.sort((a, b) => b.price.final - a.price.final);
        break;
      case "rating":
        sorted.sort((a, b) => b.reviewSummary.scorePct - a.reviewSummary.scorePct);
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "added":
      default:
        sorted.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    }
    return sorted;
  }, [games, ids, sort]);

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Your wishlist is empty"
        description="Heart any game from the store to track it here."
        action={
          <Link
            to={ROUTES.store}
            className="rounded-xl bg-acid px-4 py-2 text-[13px] font-semibold text-background"
          >
            Browse the store
          </Link>
        }
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">Wishlist</h1>
          <p className="text-[13px] text-muted/60">{list.length} games tracked</p>
        </div>
        <label className="text-[12px] text-muted/70 flex items-center gap-2">
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-lg border border-separator bg-input px-2 py-1.5 text-[12px] text-foreground"
          >
            {(Object.keys(SORT_LABELS) as Sort[]).map((s) => (
              <option key={s} value={s}>
                {SORT_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="space-y-2">
        {list.map((g) => {
          const entry = getEntry(g.id);
          const tLabel = thresholdLabel(entry);
          const hasT = hasThreshold(entry);
          return (
            <div
              key={g.id}
              className={cn(
                "flex items-center gap-4 rounded-xl border bg-card p-3 hover:bg-card-hover transition-colors",
                g.isOnSale ? "border-discount-bg/60" : "border-separator",
              )}
            >
              <Link to={ROUTES.gameDetail(g.id)} className="shrink-0">
                <img src={g.capsuleUrl} alt="" referrerPolicy="no-referrer" className="h-16 w-32 rounded-md object-cover" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={ROUTES.gameDetail(g.id)} className="hover:underline">
                  <p className="text-[13px] font-semibold text-foreground truncate">{g.name}</p>
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {g.isOnSale && <Badge variant="discount">-{g.price.discountPct}% on sale</Badge>}
                  {g.comingSoon && <Badge variant="soon">Coming Soon</Badge>}
                  <PriceTag price={g.price} size="sm" />
                  {tLabel && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-acid/10 px-1.5 py-[2px] text-[10px] font-semibold text-acid">
                      <Bell className="h-3 w-3" />
                      {tLabel}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing({ id: g.id, name: g.name })}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 text-[11px] transition-colors",
                    hasT
                      ? "border-acid/40 bg-acid/10 text-acid hover:bg-acid/15"
                      : "border-separator bg-card text-muted hover:bg-card-active hover:text-foreground/80",
                  )}
                  title={hasT ? "Edit alert" : "Set alert threshold"}
                >
                  <Bell className={cn("h-3.5 w-3.5", hasT && "fill-current")} />
                </button>
                {hasT && (
                  <button
                    onClick={() => {
                      void simulate(g.id);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md border border-separator bg-card px-2.5 py-1.5 text-[11px] text-muted hover:bg-card-active hover:text-foreground/80"
                    title="Run alert check now"
                  >
                    <Bell className="h-3.5 w-3.5" />
                    Test alert
                  </button>
                )}
                {!g.comingSoon && (
                  <button
                    onClick={() => {
                      addToCart(g.id);
                      toast.success(`Added “${g.name}” to cart`);
                    }}
                    className="rounded-md bg-acid px-3 py-1.5 text-[11px] font-semibold text-background hover:brightness-110"
                  >
                    Add to cart
                  </button>
                )}
                <button
                  onClick={() => {
                    remove(g.id);
                    toast.info("Removed from wishlist");
                  }}
                  className="rounded-md border border-separator bg-card px-3 py-1.5 text-[11px] text-muted hover:bg-card-active hover:text-foreground/80"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <AlertSettings
          gameId={editing.id}
          gameName={editing.name}
          open={editing !== null}
          onClose={() => setEditing(null)}
        />
      )}
    </motion.div>
  );
}
