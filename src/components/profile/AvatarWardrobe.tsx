import { useState } from "react";
import { Shirt, Sparkles, Lock, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useCosmetics } from "@/hooks/use-cosmetics";
import type { Cosmetic } from "@/lib/types";

// Rarity colors are part of the design system, not data — keep in code.
const RARITY_STYLES: Record<
  Cosmetic["rarity"],
  { bg: string; fg: string }
> = {
  common: { bg: "rgba(148, 163, 184, 0.2)", fg: "#cbd5e1" },
  rare: { bg: "rgba(56, 189, 248, 0.2)", fg: "#7dd3fc" },
  epic: { bg: "rgba(168, 85, 247, 0.2)", fg: "#d8b4fe" },
  legendary: { bg: "rgba(234, 179, 8, 0.2)", fg: "#facc15" },
  mythic: { bg: "rgba(236, 72, 153, 0.2)", fg: "#f9a8d4" },
};

export function AvatarWardrobe() {
  const { data: items = [], isLoading } = useCosmetics();
  const [equipped, setEquipped] = useState<string[]>([]);
  // Until ownership tracking lands (dw_users/{uid}/cosmetics), treat the first
  // half of returned items as owned and the rest as locked. Avoids rendering
  // an empty wardrobe before that pipeline exists.
  const ownedIds = new Set(items.slice(0, Math.ceil(items.length / 2)).map((i) => i.id));

  const toggleEquip = (id: string) => {
    setEquipped((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  return (
    <div className="rounded-2xl border border-separator bg-card p-6">
      <div className="flex items-center gap-2 mb-6">
        <Shirt className="h-5 w-5 text-purple-400" />
        <h2 className="text-[16px] font-bold text-foreground">Cross-Game Wardrobe</h2>
      </div>

      <div className="grid md:grid-cols-[200px_1fr] gap-6">
        <div className="relative h-48 rounded-xl bg-gradient-to-b from-card-active to-background border border-separator/50 flex items-center justify-center overflow-hidden">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-32 bg-foreground/10 rounded-full blur-md absolute bottom-4"
          />
          <img
            loading="lazy"
            decoding="async"
            src="https://api.dicebear.com/7.x/bottts/svg?seed=Felix"
            alt="Avatar"
            className="h-32 w-32 relative z-10"
          />
          {equipped.length > 0 && (
            <div className="absolute top-4 right-4 bg-acid/20 text-acid px-2 py-1 rounded-md text-[10px] font-bold border border-acid/20 backdrop-blur-md">
              <Sparkles className="h-3 w-3 inline mr-1" /> Customized
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {isLoading && (
            <p className="col-span-2 text-[12px] text-muted/60">Loading wardrobe…</p>
          )}
          {!isLoading && items.length === 0 && (
            <p className="col-span-2 rounded-xl border border-dashed border-separator p-4 text-center text-[12px] text-muted/60">
              No cosmetics earned yet. Play games that grant Dreamworks Wardrobe rewards.
            </p>
          )}
          {items.map((item) => {
            const owned = ownedIds.has(item.id);
            const isEquipped = equipped.includes(item.id);
            const tone = RARITY_STYLES[item.rarity];
            return (
              <div
                key={item.id}
                className={cn(
                  "relative p-3 rounded-xl border transition-all cursor-pointer",
                  isEquipped
                    ? "bg-card-active border-acid shadow-[0_0_15px_rgba(var(--color-acid-rgb),0.1)]"
                    : "bg-input border-separator hover:border-muted/50",
                )}
              >
                {!owned && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-10 rounded-xl flex items-center justify-center">
                    <Lock className="h-6 w-6 text-muted" />
                  </div>
                )}

                <div onClick={() => owned && toggleEquip(item.id)}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] uppercase font-bold text-muted/60 tracking-wider">
                      {item.slot}
                    </span>
                    {isEquipped && <CheckCircle2 className="h-4 w-4 text-acid" />}
                  </div>
                  <p className="text-[13px] font-bold text-foreground">{item.name}</p>
                  <p className="text-[11px] text-muted mt-0.5 font-medium">{item.game}</p>

                  <div
                    className="mt-3 inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                    style={{ backgroundColor: tone.bg, color: tone.fg }}
                  >
                    {item.rarity}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
