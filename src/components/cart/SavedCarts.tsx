import { useState } from "react";
import { Archive, BookmarkPlus, Loader2, MoreHorizontal, Trash2 } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { useSavedCartsStore } from "@/stores/saved-carts-store";
import { toast } from "@/stores/toast-store";
import { cn, formatDate } from "@/lib/utils";

export function SavedCarts() {
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const addToCart = useCartStore((s) => s.add);
  const saved = useSavedCartsStore((s) => s.saved);
  const save = useSavedCartsStore((s) => s.save);
  const removeSaved = useSavedCartsStore((s) => s.remove);
  const [naming, setNaming] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleSave = () => {
    const realItems = items.filter((i) => i.gameId !== "plus-sub");
    if (realItems.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    const id = save(draftName, realItems);
    setDraftName("");
    setNaming(false);
    toast.success("Cart saved", {
      action: {
        label: "Undo",
        onClick: () => removeSaved(id),
      },
    });
  };

  const handleRestore = (id: string) => {
    const cart = saved.find((c) => c.id === id);
    if (!cart) return;
    // Snapshot current cart so we can offer Undo.
    const prev = items.map((i) => ({ ...i }));
    clear();
    for (const item of cart.items) {
      addToCart(item.gameId, item.asGift);
    }
    toast.success(`Restored “${cart.name}”`, {
      action: {
        label: "Undo",
        onClick: () => {
          clear();
          for (const item of prev) addToCart(item.gameId, item.asGift);
        },
      },
    });
  };

  return (
    <section className="rounded-2xl border border-separator bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Archive className="h-4 w-4 text-acid" />
        <h2 className="text-[13px] font-semibold text-foreground">Saved carts</h2>
        <span className="ml-auto text-[11px] text-muted/60 tabular-nums">{saved.length}/20</span>
      </div>

      {naming ? (
        <div className="flex gap-2">
          <input
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSave();
              } else if (e.key === "Escape") {
                setNaming(false);
                setDraftName("");
              }
            }}
            placeholder="Name this cart (e.g. Birthday wishlist)"
            className="flex-1 rounded-lg border border-separator bg-input/60 px-2.5 py-1.5 text-[12px] text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-acid/40"
          />
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-acid px-2.5 py-1.5 text-[12px] font-semibold text-background hover:brightness-110"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setNaming(false);
              setDraftName("");
            }}
            className="rounded-lg border border-separator bg-card px-2.5 py-1.5 text-[12px] text-muted hover:bg-card-active"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setNaming(true)}
          disabled={items.length === 0}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-separator bg-card-active/40 px-2.5 py-1.5 text-[12px] font-semibold text-foreground/85 hover:bg-card-active disabled:opacity-50"
        >
          <BookmarkPlus className="h-3.5 w-3.5" />
          Save current cart
        </button>
      )}

      {saved.length > 0 ? (
        <ul className="space-y-1.5">
          {saved.map((c) => (
            <li
              key={c.id}
              className="group relative flex items-center gap-2 rounded-lg border border-separator bg-card-active/30 px-2.5 py-1.5"
            >
              <button
                type="button"
                onClick={() => handleRestore(c.id)}
                className="flex-1 min-w-0 text-left"
              >
                <p className="truncate text-[12px] font-medium text-foreground/90">{c.name}</p>
                <p className="text-[10px] text-muted/60">
                  {c.items.length} {c.items.length === 1 ? "game" : "games"} ·{" "}
                  {formatDate(c.savedAt)}
                </p>
              </button>
              <button
                type="button"
                onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                className="rounded-md p-1 text-muted/60 hover:bg-card-hover hover:text-foreground/80"
                aria-label="More"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
              {openMenuId === c.id && (
                <div
                  className={cn(
                    "absolute right-1 top-9 z-10 w-36 overflow-hidden rounded-lg border border-separator bg-card shadow-xl",
                  )}
                  onMouseLeave={() => setOpenMenuId(null)}
                >
                  <button
                    type="button"
                    onClick={() => {
                      handleRestore(c.id);
                      setOpenMenuId(null);
                    }}
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[11px] text-foreground/85 hover:bg-card-active"
                  >
                    <Loader2 className="h-3 w-3" /> Restore (replaces cart)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      removeSaved(c.id);
                      setOpenMenuId(null);
                      toast.info(`Deleted “${c.name}”`);
                    }}
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[11px] text-red hover:bg-red/10"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-separator px-2.5 py-3 text-center text-[11px] text-muted/60">
          No saved carts yet. Save the current cart to come back to it later.
        </p>
      )}
    </section>
  );
}
