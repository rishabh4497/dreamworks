import { Heart } from "lucide-react";
import type { GameId } from "@/lib/types";
import { useWishlistStore } from "@/stores/wishlist-store";
import { toast } from "@/stores/toast-store";
import { cn } from "@/lib/utils";

export function WishlistButton({ gameId, label }: { gameId: GameId; label?: string }) {
  const has = useWishlistStore((s) => s.has(gameId));
  const toggle = useWishlistStore((s) => s.toggle);
  const add = useWishlistStore((s) => s.add);

  const onClick = async () => {
    const added = await toggle(gameId);
    if (added) {
      toast.success("Added to wishlist");
    } else {
      toast.success("Removed from wishlist", {
        action: {
          label: "Undo",
          onClick: () => {
            void add(gameId);
          },
        },
      });
    }
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[12px] font-medium transition-all",
        has
          ? "border-red/30 bg-red/10 text-red"
          : "border-separator bg-card text-foreground/80 hover:bg-card-active",
      )}
    >
      <Heart className={cn("h-3.5 w-3.5", has && "fill-current")} />
      {label ?? (has ? "On wishlist" : "Add to wishlist")}
    </button>
  );
}
