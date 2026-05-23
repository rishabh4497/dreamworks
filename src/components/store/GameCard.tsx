import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Info } from "lucide-react";
import type { Game, RecommendationReason } from "@/lib/types";
import { ROUTES } from "@/lib/routes";
import { PriceTag } from "@/components/ui/price-tag";
import { Badge } from "@/components/ui/badge";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useRecentlyViewedStore } from "@/stores/recently-viewed-store";
import { toast } from "@/stores/toast-store";
import { gameAccent } from "@/lib/game-accents";
import { cn } from "@/lib/utils";

interface GameCardProps {
  game: Game;
  width?: number | string;
  reason?: RecommendationReason;
}

export function GameCard({ game, width = 240, reason }: GameCardProps) {
  const navigate = useNavigate();
  const has = useWishlistStore((s) => s.has(game.id));
  const toggle = useWishlistStore((s) => s.toggle);
  const pushRecent = useRecentlyViewedStore((s) => s.push);

  const [showReason, setShowReason] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Dismiss the tooltip on any click outside the card.
  useEffect(() => {
    if (!showReason) return;
    const handler = (e: MouseEvent) => {
      if (!cardRef.current?.contains(e.target as Node)) {
        setShowReason(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showReason]);

  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (game.trailerUrl) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsVideoPlaying(true);
      }, 600);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsVideoPlaying(false);
  };

  const onClick = () => {
    pushRecent(game.id);
    navigate(ROUTES.gameDetail(game.id));
  };

  const onWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const added = await toggle(game.id);
    toast.success(added ? `Added “${game.name}” to wishlist` : `Removed from wishlist`);
  };

  const onReasonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowReason((v) => !v);
  };

  return (
    <div ref={cardRef} className="relative shrink-0" style={{ width }}>
      <motion.div
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        initial={{ boxShadow: "0 0 0 0 transparent" }}
        whileHover={{
          y: -3,
          boxShadow: `0 22px 50px -18px ${gameAccent(game.id) ?? "var(--color-positive)"}66, 0 10px 26px -10px rgba(0,0,0,0.55), 0 0 0 1px ${gameAccent(game.id) ?? "var(--color-positive)"}33`,
        }}
        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="group cursor-pointer overflow-hidden rounded-xl border border-separator bg-card hover:bg-card-hover"
      >
        <div className="relative aspect-[460/215] overflow-hidden bg-card-active">
          <img
            src={game.headerUrl}
            alt={game.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className={cn(
              "h-full w-full object-cover transition-all duration-300 group-hover:scale-[1.03]",
              isVideoPlaying && "opacity-0"
            )}
          />
          {game.trailerUrl && isVideoPlaying && (
            <video
              src={game.trailerUrl}
              autoPlay
              muted
              loop
              className="absolute inset-0 h-full w-full object-cover transition-all duration-300 group-hover:scale-[1.03]"
            />
          )}
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent" />
          <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
            {game.includedInSubscription && (
              <span className="rounded bg-[#a052ff]/20 border border-[#a052ff]/30 px-1.5 py-[1px] text-[10px] font-bold uppercase tracking-wide text-[#c99eff] shadow-sm backdrop-blur-md">
                Dreamworks+
              </span>
            )}
            {game.comingSoon && <Badge variant="soon">Soon</Badge>}
            {game.price.isFree && <Badge variant="free">Free</Badge>}
            {game.isOnSale && !game.price.isFree && (
              <Badge variant="discount">-{game.price.discountPct}%</Badge>
            )}
            {reason && (
              <button
                type="button"
                onClick={onReasonClick}
                aria-label="Why am I seeing this?"
                aria-expanded={showReason}
                className={cn(
                  "rounded-md p-1 backdrop-blur-md transition-all",
                  showReason
                    ? "bg-acid/20 text-acid"
                    : "bg-background/30 text-foreground/70 hover:bg-background/50 hover:text-foreground",
                )}
              >
                <Info className="h-3 w-3" />
              </button>
            )}
          </div>
          <button
            onClick={onWishlist}
            className={cn(
              "absolute top-1.5 left-1.5 rounded-md p-1.5 backdrop-blur-md transition-all",
              has
                ? "bg-red/20 text-red"
                : "bg-background/30 text-foreground/60 hover:bg-background/50",
            )}
          >
            <Heart className={cn("h-3.5 w-3.5", has && "fill-current")} />
          </button>
        </div>

        <div className="px-3 pb-3 pt-2">
          <h3 className="truncate text-[13px] font-semibold text-foreground">{game.name}</h3>
          <div className="mt-1 flex flex-wrap gap-1">
            {game.tags.slice(0, 2).map((t) => (
              <Link
                key={t}
                to={ROUTES.storeTag(t)}
                onClick={(e) => e.stopPropagation()}
                className="rounded-md bg-card-active px-1.5 py-[1px] text-[9px] font-medium text-muted/70 transition-colors hover:bg-acid/15 hover:text-acid"
              >
                {t}
              </Link>
            ))}
          </div>
          <div className="mt-2.5">
            <PriceTag price={game.price} size="sm" />
          </div>
        </div>
      </motion.div>

      {reason && showReason && (
        <div
          role="tooltip"
          onClick={(e) => e.stopPropagation()}
          className="absolute left-2 right-2 top-full z-20 mt-1 rounded-lg border border-separator bg-card p-2.5 shadow-lg"
        >
          <p className="text-[11px] font-medium text-foreground">{reason.label}</p>
          {reason.detail && (
            <p className="mt-1 text-[10px] leading-snug text-muted/70">{reason.detail}</p>
          )}
        </div>
      )}
    </div>
  );
}
