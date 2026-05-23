import { useQuery } from "@tanstack/react-query";
import { listFollowSuggestions } from "@/lib/api/follow-suggestions";

export const followSuggestionKeys = {
  all: ["follow-suggestions"] as const,
};

export function useFollowSuggestions() {
  return useQuery({
    queryKey: followSuggestionKeys.all,
    queryFn: listFollowSuggestions,
  });
}
