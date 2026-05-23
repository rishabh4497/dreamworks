import { useNavigate } from "react-router-dom";
import { Check, Download, ShoppingCart } from "lucide-react";
import type { Game } from "@/lib/types";
import { useCartStore } from "@/stores/cart-store";
import { useLibraryStore } from "@/stores/library-store";
import { useStartDownload } from "@/hooks/use-start-download";
import { toast } from "@/stores/toast-store";
import { ROUTES } from "@/lib/routes";

export function AddToLibraryButton({ game }: { game: Game }) {
  const navigate = useNavigate();
  const cartHas = useCartStore((s) => s.has(game.id));
  const addToCart = useCartStore((s) => s.add);
  const owned = useLibraryStore((s) => s.has(game.id));
  const entry = useLibraryStore((s) => s.entries.find((e) => e.gameId === game.id));
  const toggleInstalled = useLibraryStore((s) => s.toggleInstalled);
  const startDownload = useStartDownload();

  if (owned) {
    const installed = entry?.installed;
    return (
      <button
        onClick={() => {
          if (installed) {
            toast.info("Launching would happen here in the desktop client");
          } else {
            toggleInstalled(game.id);
            startDownload(game.id, 8_000_000_000, { silent: true });
            toast.success("Install started");
          }
        }}
        className="inline-flex items-center gap-2 rounded-xl bg-green px-4 py-2 text-[13px] font-semibold text-white hover:brightness-110"
      >
        {installed ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
        {installed ? "Play" : "Install"}
      </button>
    );
  }

  if (cartHas) {
    return (
      <button
        onClick={() => navigate(ROUTES.cart)}
        className="inline-flex items-center gap-2 rounded-xl border border-acid/40 bg-acid/10 px-4 py-2 text-[13px] font-semibold text-acid hover:bg-acid/20"
      >
        <Check className="h-4 w-4" /> In cart
      </button>
    );
  }

  return (
    <button
      onClick={() => {
        addToCart(game.id);
        toast.success(`Added “${game.name}” to cart`);
      }}
      className="inline-flex items-center gap-2 rounded-xl bg-acid px-4 py-2 text-[13px] font-semibold text-background hover:brightness-110"
    >
      <ShoppingCart className="h-4 w-4" />
      Add to cart
    </button>
  );
}
