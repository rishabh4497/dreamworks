import { useQuery } from "@tanstack/react-query";
import { listCategories, listTags } from "@/lib/api/categories";

export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: listCategories });
}

export function useTags() {
  return useQuery({ queryKey: ["tags"], queryFn: listTags });
}
