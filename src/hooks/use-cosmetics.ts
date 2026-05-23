import { useQuery } from "@tanstack/react-query";
import { listCosmetics } from "@/lib/api/cosmetics";

export function useCosmetics() {
  return useQuery({
    queryKey: ["cosmetics", "catalog"],
    queryFn: listCosmetics,
    // Cosmetics are a slow-moving catalog — admin-edited, not user-edited.
    staleTime: 60 * 60 * 1000,
  });
}
