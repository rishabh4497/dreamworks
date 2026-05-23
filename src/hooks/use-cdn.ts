import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listCdnNodes,
  listDeltaPatches,
  listDistributionStats,
  listGameManifests,
  setCdnNodeStatus,
} from "@/lib/api/cdn";
import type { CdnNodeStatus, GameId } from "@/lib/types";

export const cdnKeys = {
  nodes: ["cdn", "nodes"] as const,
  stats: ["cdn", "stats"] as const,
  manifests: (gameId: GameId) => ["cdn", "manifests", gameId] as const,
  patches: (gameId?: GameId) => ["cdn", "patches", gameId ?? "all"] as const,
};

export function useCdnNodes() {
  return useQuery({ queryKey: cdnKeys.nodes, queryFn: listCdnNodes });
}

export function useDistributionStats() {
  return useQuery({ queryKey: cdnKeys.stats, queryFn: listDistributionStats });
}

export function useGameManifests(gameId: GameId) {
  return useQuery({
    queryKey: cdnKeys.manifests(gameId),
    queryFn: () => listGameManifests(gameId),
    enabled: Boolean(gameId),
  });
}

export function useDeltaPatches(gameId?: GameId) {
  return useQuery({
    queryKey: cdnKeys.patches(gameId),
    queryFn: () => listDeltaPatches(gameId),
  });
}

export function useSetCdnNodeStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ nodeId, status }: { nodeId: string; status: CdnNodeStatus }) =>
      setCdnNodeStatus(nodeId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: cdnKeys.nodes }),
  });
}
