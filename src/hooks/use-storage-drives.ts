import { useQuery } from "@tanstack/react-query";
import { fetchStorageDrives, type StorageDrive } from "@/lib/api/storage";
import { isDesktop } from "@/lib/platform";

const EMPTY_DRIVES: StorageDrive[] = [];

export function useStorageDrives() {
  return useQuery({
    queryKey: ["storage", "drives"],
    queryFn: async () => {
      if (!isDesktop()) return EMPTY_DRIVES;
      const result = await fetchStorageDrives();
      return result.ok ? result.data : EMPTY_DRIVES;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
