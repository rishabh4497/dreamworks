import { useQuery } from "@tanstack/react-query";
import { listThemes } from "@/lib/api/themes";

export const themeKeys = {
  all: ["themes"] as const,
  list: () => [...themeKeys.all, "list"] as const,
};

export function useThemes() {
  return useQuery({
    queryKey: themeKeys.list(),
    queryFn: listThemes,
    staleTime: 5 * 60 * 1000,
  });
}
