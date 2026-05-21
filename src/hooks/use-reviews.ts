import { useQuery } from "@tanstack/react-query";
import { listReviews } from "@/lib/api/reviews";
import type { GameId } from "@/lib/types";

export function useGameReviews(id: GameId | undefined) {
  return useQuery({
    queryKey: ["reviews", id],
    queryFn: () => listReviews(id!),
    enabled: !!id,
  });
}
