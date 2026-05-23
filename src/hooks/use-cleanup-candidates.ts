import { useQuery } from "@tanstack/react-query";
import {
  fetchCleanupCandidates,
  type CleanupCandidate,
  type StorageDrive,
} from "@/lib/api/storage";
import { isDesktop } from "@/lib/platform";
import type { CleanupScanEntry } from "@/lib/native-launcher";

const EMPTY: CleanupCandidate[] = [];

export function useCleanupCandidates(
  installEntries: CleanupScanEntry[],
  drives: StorageDrive[],
) {
  return useQuery({
    queryKey: [
      "storage",
      "cleanup",
      installEntries.map((e) => `${e.gameId}:${e.installPath}`).join("|"),
      drives.map((d) => d.id).join("|"),
    ],
    queryFn: async () => {
      if (!isDesktop()) return EMPTY;
      if (installEntries.length === 0) return EMPTY;
      const result = await fetchCleanupCandidates(installEntries, drives);
      return result.ok ? result.data : EMPTY;
    },
    staleTime: 30_000,
  });
}
