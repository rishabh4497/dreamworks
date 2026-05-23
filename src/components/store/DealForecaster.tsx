import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Sparkles, TrendingDown, Clock, AlertTriangle, Loader2, Ban } from "lucide-react";
import { usePriceHistory, useHistoricalLows } from "@/hooks/use-game-db";
import { useGameDetail } from "@/hooks/use-games";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useAIWishlistSniper } from "@/hooks/use-ai";
import { cn } from "@/lib/utils";
import type { WishlistSniperPayload } from "@/lib/ai/payload-types";

interface DealForecasterProps {
  gameId: string;
}

const DEFAULT_RULE = "buy when at or near all-time low, or at least 50% off";

type Verdict = "buy-now" | "wait" | "watch" | "skip";

const VERDICT_STYLES: Record<
  Verdict,
  { label: string; color: string; bg: string; icon: typeof TrendingDown }
> = {
  "buy-now": {
    label: "BUY NOW",
    color: "text-positive",
    bg: "bg-positive/10 border-positive/30",
    icon: TrendingDown,
  },
  wait: {
    label: "WAIT",
    color: "text-acid",
    bg: "bg-acid/10 border-acid/30",
    icon: Clock,
  },
  watch: {
    label: "WATCH",
    color: "text-orange",
    bg: "bg-orange/10 border-orange/30",
    icon: AlertTriangle,
  },
  skip: {
    label: "SKIP",
    color: "text-red",
    bg: "bg-red/10 border-red/30",
    icon: Ban,
  },
};

export function DealForecaster({ gameId }: DealForecasterProps) {
  const { data: detail } = useGameDetail(gameId);
  const { data: history } = usePriceHistory(gameId);
  const { data: lows } = useHistoricalLows(gameId);
  const wishlistEntry = useWishlistStore((s) => s.getEntry(gameId));
  const [ruleDraft, setRuleDraft] = useState(wishlistEntry?.smartRule ?? "");

  const activeRule = (wishlistEntry?.smartRule ?? "").trim() || DEFAULT_RULE;

  const payload = useMemo<WishlistSniperPayload | null>(() => {
    if (!detail || !history || history.length === 0 || !lows) return null;
    return {
      gameName: detail.name,
      basePriceCents: detail.price.base,
      currentPriceCents: detail.price.final,
      historicalLowCents: lows.allTimeLow,
      userRule: activeRule,
      recentHistory: history.slice(-12).map((p) => ({ date: p.date, cents: p.cents })),
    };
  }, [detail, history, lows, activeRule]);

  const { data: sniper, isLoading, isError } = useAIWishlistSniper(payload);

  if (!payload) return null;

  const verdict: Verdict = sniper?.verdict ?? "watch";
  const style = VERDICT_STYLES[verdict];
  const Icon = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("relative overflow-hidden rounded-xl border p-4 transition-all", style.bg)}
    >
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-20 blur-3xl bg-current" />

      <div className="relative z-10">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className={cn("h-4 w-4", style.color)} />
            <h3 className="text-[12px] font-bold uppercase tracking-widest text-foreground">
              AI Wishlist Sniper
            </h3>
          </div>
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full border border-separator/50 bg-background/50 px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm",
              style.color,
            )}
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Icon className="h-3 w-3" />}
            {isLoading ? "ANALYZING" : style.label}
          </div>
        </div>

        {isError && (
          <p className="text-[12px] text-muted/70">
            Sniper offline — showing default verdict based on current price.
          </p>
        )}

        {sniper && (
          <>
            <p className="text-[13px] leading-relaxed text-foreground/85">
              {sniper.verdictReason}
            </p>
            <p className="mt-2 text-[11px] text-muted/70">
              Rule: <span className="text-foreground/80">{sniper.ruleSummary}</span>
            </p>

            <div className="mt-3">
              <div className="mb-1.5 flex justify-between text-[10px] font-semibold uppercase tracking-widest text-muted/70">
                <span>Confidence</span>
                <span className={style.color}>{sniper.confidencePct}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-background/50">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${sniper.confidencePct}%` }}
                  transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                  className={cn("h-full bg-current", style.color)}
                />
              </div>
            </div>

            {sniper.predictedSaleWindowDays != null && verdict === "wait" && (
              <p className="mt-3 text-[11px] text-muted/70">
                Expected sale window:{" "}
                <span className="text-foreground/80">
                  ~{sniper.predictedSaleWindowDays} days
                </span>
              </p>
            )}
          </>
        )}

        {isLoading && !sniper && (
          <p className="text-[12px] text-muted/70">Comparing against {history?.length ?? 0} price points…</p>
        )}

        <RuleEditor
          gameId={gameId}
          draft={ruleDraft}
          setDraft={setRuleDraft}
          currentRule={wishlistEntry?.smartRule}
        />
      </div>
    </motion.div>
  );
}

function RuleEditor({
  gameId,
  draft,
  setDraft,
  currentRule,
}: {
  gameId: string;
  draft: string;
  setDraft: (s: string) => void;
  currentRule?: string;
}) {
  const updateEntry = useWishlistStore((s) => s.updateEntry);
  const has = useWishlistStore((s) => s.has(gameId));
  const [editing, setEditing] = useState(false);

  if (!has) {
    return (
      <p className="mt-3 text-[11px] text-muted/60">
        Add to your wishlist to set a custom alert rule.
      </p>
    );
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-3 text-[11px] text-muted/70 underline-offset-2 hover:text-foreground/80 hover:underline"
      >
        {currentRule ? "Edit alert rule" : "Set a smart alert rule…"}
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={2}
        placeholder='e.g. "alert me below $20 OR at all-time low"'
        className="w-full rounded-lg border border-separator bg-input/60 px-3 py-2 text-[12px] text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-acid/40"
      />
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setDraft(currentRule ?? "");
          }}
          className="rounded-md border border-separator px-2.5 py-1 text-[11px] text-muted hover:bg-card-active hover:text-foreground/80"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            void updateEntry(gameId, { smartRule: draft.trim() || undefined });
            setEditing(false);
          }}
          className="rounded-md bg-acid px-2.5 py-1 text-[11px] font-semibold text-background hover:brightness-110"
        >
          Save rule
        </button>
      </div>
    </div>
  );
}
