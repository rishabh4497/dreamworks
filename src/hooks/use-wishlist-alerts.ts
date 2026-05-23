import { useCallback, useEffect, useRef } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { getGameDetail } from "@/lib/api/games";
import { gameKeys } from "@/hooks/use-games";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useUiStore } from "@/stores/ui-store";
import { dispatchAppNotification } from "@/lib/notify-dispatch";
import { ROUTES } from "@/lib/routes";
import { formatPrice } from "@/lib/utils";
import type { GameDetail, GameId, WishlistEntry } from "@/lib/types";

const ALERT_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h
const POLL_INTERVAL_MS = 5 * 60 * 1000; // re-evaluate every 5 minutes

function hasThreshold(entry: WishlistEntry): boolean {
  return Boolean(
    entry.notifyOnlyAtATL || typeof entry.priceCeilingCents === "number",
  );
}

function withinCooldown(entry: WishlistEntry): boolean {
  if (!entry.lastAlertedAt) return false;
  const last = new Date(entry.lastAlertedAt).getTime();
  if (!Number.isFinite(last)) return false;
  return Date.now() - last < ALERT_COOLDOWN_MS;
}

function alltimeLow(detail: GameDetail): number {
  if (detail.priceHistory.length === 0) return detail.price.final;
  return Math.min(
    detail.price.final,
    ...detail.priceHistory.map((p) => p.cents),
  );
}

/** Pure evaluator: returns the alert payload if the entry meets its criteria, else null. */
export function evaluateAlert(
  entry: WishlistEntry,
  detail: GameDetail,
): { title: string; body: string } | null {
  const finalCents = detail.price.final;
  // Free or coming-soon games don't trigger alerts.
  if (detail.price.isFree || detail.comingSoon) return null;

  if (entry.notifyOnlyAtATL) {
    const atl = alltimeLow(detail);
    if (finalCents <= atl) {
      return {
        title: `${detail.name} hit an all-time low`,
        body: `Now ${formatPrice(finalCents, detail.price.currency)} — the lowest it has ever been.`,
      };
    }
    return null;
  }

  if (typeof entry.priceCeilingCents === "number") {
    if (finalCents <= entry.priceCeilingCents) {
      return {
        title: `${detail.name} is on sale`,
        body: `Now ${formatPrice(finalCents, detail.price.currency)} — at or below your ${formatPrice(entry.priceCeilingCents, detail.price.currency)} target.`,
      };
    }
    return null;
  }

  // Fallback: "any sale" semantic — fire when on sale.
  if (entry.notifyOnSale && detail.isOnSale) {
    return {
      title: `${detail.name} is on sale`,
      body: `Now ${formatPrice(finalCents, detail.price.currency)} — ${detail.price.discountPct}% off.`,
    };
  }

  return null;
}

interface RunOptions {
  force?: GameId;
  respectCooldown?: boolean;
}

async function runEvaluationOnce(
  queryClient: QueryClient,
  opts: RunOptions = {},
): Promise<void> {
  const { entries, getEntry, updateEntry } = useWishlistStore.getState();
  const targets = opts.force
    ? entries.filter((e) => e.gameId === opts.force)
    : entries.filter((e) => hasThreshold(e));

  for (const entry of targets) {
    const fresh = getEntry(entry.gameId);
    if (!fresh) continue;
    if (
      opts.respectCooldown !== false &&
      !opts.force &&
      withinCooldown(fresh)
    ) {
      continue;
    }

    let detail: GameDetail | undefined;
    try {
      detail = await queryClient.fetchQuery({
        queryKey: gameKeys.detail(entry.gameId),
        queryFn: () => getGameDetail(entry.gameId),
      });
    } catch {
      continue;
    }
    if (!detail) continue;

    const result = evaluateAlert(fresh, detail);
    if (!result) continue;

    const { emailOnSale } = useUiStore.getState().settings;
    dispatchAppNotification({
      kind: "wishlist-alert",
      title: result.title,
      body: emailOnSale ? `${result.body} (via email + in-app)` : result.body,
      gameId: entry.gameId,
      href: ROUTES.gameDetail(entry.gameId),
    });
    updateEntry(entry.gameId, { lastAlertedAt: new Date().toISOString() });
  }
}

/**
 * Mount once at AppLayout. Periodically (and on wishlist changes) evaluates
 * each wishlist entry that has a threshold set, firing a toast + desktop
 * notification when its criteria are met.
 */
export function useWishlistAlerts(): void {
  const queryClient = useQueryClient();
  const evaluatingRef = useRef(false);

  const runEvaluation = useCallback(
    async (opts: RunOptions = {}) => {
      if (evaluatingRef.current) return;
      evaluatingRef.current = true;
      try {
        await runEvaluationOnce(queryClient, opts);
      } finally {
        evaluatingRef.current = false;
      }
    },
    [queryClient],
  );

  // Initial run + interval polling.
  useEffect(() => {
    void runEvaluation();
    const id = window.setInterval(() => {
      void runEvaluation();
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [runEvaluation]);

  // Re-run when the set of thresholded entries changes.
  useEffect(() => {
    let prev = useWishlistStore.getState().entries;
    const unsub = useWishlistStore.subscribe((state) => {
      const next = state.entries;
      if (next === prev) return;
      const prevKey = prev
        .filter(hasThreshold)
        .map(
          (e) =>
            `${e.gameId}:${e.priceCeilingCents ?? ""}:${e.notifyOnlyAtATL ?? ""}`,
        )
        .join("|");
      const nextKey = next
        .filter(hasThreshold)
        .map(
          (e) =>
            `${e.gameId}:${e.priceCeilingCents ?? ""}:${e.notifyOnlyAtATL ?? ""}`,
        )
        .join("|");
      prev = next;
      if (prevKey !== nextKey) {
        void runEvaluation();
      }
    });
    return () => unsub();
  }, [runEvaluation]);
}

/**
 * Companion hook for manual simulation (the "Test alert" button on the
 * wishlist page). Forces immediate evaluation of a single entry, ignoring the
 * cooldown so the user can see the feature work without waiting.
 */
export function useSimulateWishlistAlert(): (id: GameId) => Promise<void> {
  const queryClient = useQueryClient();
  return useCallback(
    (id: GameId) =>
      runEvaluationOnce(queryClient, { force: id, respectCooldown: false }),
    [queryClient],
  );
}
