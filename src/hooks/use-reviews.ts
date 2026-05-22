import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listReviews } from "@/lib/api/reviews";
import { useUserReviewsStore } from "@/stores/user-reviews-store";
import { useEffect } from "react";
import type { GameId } from "@/lib/types";

export function useGameReviews(id: GameId | undefined) {
  const qc = useQueryClient();
  
  useEffect(() => {
    if (!id) return;
    return useUserReviewsStore.subscribe(() => {
      qc.invalidateQueries({ queryKey: ["reviews", id] });
    });
  }, [qc, id]);

  return useQuery({
    queryKey: ["reviews", id],
    queryFn: () => listReviews(id!),
    enabled: !!id,
  });
}
