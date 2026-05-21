import { useQuery } from "@tanstack/react-query";
import {
  getAchievements,
  getDepots,
  getHistoricalLows,
  getPatchNotes,
  getPlayerCounts,
  getPriceHistory,
  getRegionalPrices,
  getStoreTagBreakdown,
} from "@/lib/api/game-db";
import type { GameId } from "@/lib/types";

export function usePriceHistory(id: GameId | undefined) {
  return useQuery({
    queryKey: ["price-history", id],
    queryFn: () => getPriceHistory(id!),
    enabled: !!id,
  });
}

export function useHistoricalLows(id: GameId | undefined) {
  return useQuery({
    queryKey: ["historical-lows", id],
    queryFn: () => getHistoricalLows(id!),
    enabled: !!id,
  });
}

export function usePlayerCounts(id: GameId | undefined, range: "7d" | "30d" | "all" = "30d") {
  return useQuery({
    queryKey: ["player-counts", id, range],
    queryFn: () => getPlayerCounts(id!, range),
    enabled: !!id,
  });
}

export function useDepots(id: GameId | undefined) {
  return useQuery({
    queryKey: ["depots", id],
    queryFn: () => getDepots(id!),
    enabled: !!id,
  });
}

export function usePatchNotes(id: GameId | undefined) {
  return useQuery({
    queryKey: ["patch-notes", id],
    queryFn: () => getPatchNotes(id!),
    enabled: !!id,
  });
}

export function useAchievements(id: GameId | undefined) {
  return useQuery({
    queryKey: ["achievements", id],
    queryFn: () => getAchievements(id!),
    enabled: !!id,
  });
}

export function useRegionalPrices(id: GameId | undefined) {
  return useQuery({
    queryKey: ["regional-prices", id],
    queryFn: () => getRegionalPrices(id!),
    enabled: !!id,
  });
}

export function useStoreTagBreakdown(id: GameId | undefined) {
  return useQuery({
    queryKey: ["store-tags", id],
    queryFn: () => getStoreTagBreakdown(id!),
    enabled: !!id,
  });
}
