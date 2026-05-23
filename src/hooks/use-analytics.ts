import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useMyApps } from "@/hooks/use-apps";
import { gameKeys } from "@/hooks/use-games";
import { getGameDetail } from "@/lib/api/games";
import {
  computePortfolioKpis,
  countWishlistsForApp,
  getOrdersForApp,
  getWishlistEntriesForApp,
  revenueForAppCents,
  revenueTrend,
  wishlistTrend,
  reviewLabelBreakdown,
  achievementCompletionRows,
} from "@/lib/api/analytics";
import type {
  AchievementCompletionRow,
  GameDetail,
  PortfolioKpis,
  RevenuePoint,
  WishlistTrendPoint,
} from "@/lib/types";

const STALE = 5 * 60 * 1000;
const GC = 30 * 60 * 1000;

export const analyticsKeys = {
  all: ["analytics"] as const,
  wishlistCount: (appId: string) =>
    [...analyticsKeys.all, "wishlist-count", appId] as const,
  wishlistEntries: (appId: string) =>
    [...analyticsKeys.all, "wishlist-entries", appId] as const,
  orders: (appId: string) => [...analyticsKeys.all, "orders", appId] as const,
};

function useDetailsForApps(appIds: string[]) {
  return useQueries({
    queries: appIds.map((id) => ({
      queryKey: gameKeys.detail(id),
      queryFn: () => getGameDetail(id),
      staleTime: STALE,
      gcTime: GC,
    })),
  });
}

export function usePortfolioKpis(): {
  kpis: PortfolioKpis;
  isLoading: boolean;
} {
  const myApps = useMyApps();
  const apps = myApps.data ?? [];
  const ids = apps.map((a) => a.id);

  const details = useDetailsForApps(ids);
  const wishlistCounts = useQueries({
    queries: ids.map((id) => ({
      queryKey: analyticsKeys.wishlistCount(id),
      queryFn: () => countWishlistsForApp(id),
      staleTime: STALE,
      gcTime: GC,
    })),
  });
  const ordersByApp = useQueries({
    queries: ids.map((id) => ({
      queryKey: analyticsKeys.orders(id),
      queryFn: () => getOrdersForApp(id),
      staleTime: STALE,
      gcTime: GC,
    })),
  });

  const isLoading =
    myApps.isLoading ||
    details.some((d) => d.isLoading) ||
    wishlistCounts.some((q) => q.isLoading) ||
    ordersByApp.some((q) => q.isLoading);

  const kpis = useMemo(() => {
    const wishlistsByApp: Record<string, number> = {};
    const revenueByApp: Record<string, number> = {};
    ids.forEach((id, i) => {
      wishlistsByApp[id] = wishlistCounts[i]?.data ?? 0;
      revenueByApp[id] = revenueForAppCents(ordersByApp[i]?.data ?? [], id);
    });
    return computePortfolioKpis({
      apps,
      details: details.map((d) => d.data as GameDetail | undefined),
      wishlistsByApp,
      revenueByApp,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    apps,
    ids.join("|"),
    details.map((d) => d.dataUpdatedAt).join("|"),
    wishlistCounts.map((q) => q.dataUpdatedAt).join("|"),
    ordersByApp.map((q) => q.dataUpdatedAt).join("|"),
  ]);

  return { kpis, isLoading };
}

export interface AppAnalytics {
  detail: GameDetail | undefined;
  wishlistCount: number;
  wishlistTrend: WishlistTrendPoint[];
  revenueTrend: RevenuePoint[];
  totalRevenueCents: number;
  reviewBreakdown: ReturnType<typeof reviewLabelBreakdown>;
  achievementRows: AchievementCompletionRow[];
  orderCount: number;
  isLoading: boolean;
}

export function useAppAnalytics(appId: string | undefined): AppAnalytics {
  const detailQ = useQuery({
    queryKey: appId ? gameKeys.detail(appId) : ["disabled"],
    queryFn: () => getGameDetail(appId!),
    enabled: !!appId,
    staleTime: STALE,
    gcTime: GC,
  });
  const wishlistEntriesQ = useQuery({
    queryKey: appId ? analyticsKeys.wishlistEntries(appId) : ["disabled"],
    queryFn: () => getWishlistEntriesForApp(appId!),
    enabled: !!appId,
    staleTime: STALE,
    gcTime: GC,
  });
  const ordersQ = useQuery({
    queryKey: appId ? analyticsKeys.orders(appId) : ["disabled"],
    queryFn: () => getOrdersForApp(appId!),
    enabled: !!appId,
    staleTime: STALE,
    gcTime: GC,
  });

  const detail = detailQ.data as GameDetail | undefined;
  const entries = wishlistEntriesQ.data ?? [];
  const orders = ordersQ.data ?? [];

  return useMemo<AppAnalytics>(
    () => ({
      detail,
      wishlistCount: entries.length,
      wishlistTrend: wishlistTrend(entries),
      revenueTrend: appId ? revenueTrend(orders, appId) : [],
      totalRevenueCents: appId ? revenueForAppCents(orders, appId) : 0,
      reviewBreakdown: reviewLabelBreakdown(detail?.reviewSummary),
      achievementRows: achievementCompletionRows(detail),
      orderCount: orders.filter((o) => !o.refunded).length,
      isLoading: detailQ.isLoading || wishlistEntriesQ.isLoading || ordersQ.isLoading,
    }),
    [
      appId,
      detail,
      entries,
      orders,
      detailQ.isLoading,
      wishlistEntriesQ.isLoading,
      ordersQ.isLoading,
    ],
  );
}
