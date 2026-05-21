import { useQuery } from "@tanstack/react-query";
import {
  getCompletionStats,
  getHoursHeatmap,
  getLibraryValue,
} from "@/lib/api/account";

export function useLibraryValue() {
  return useQuery({ queryKey: ["account", "library-value"], queryFn: getLibraryValue });
}

export function useHoursHeatmap() {
  return useQuery({ queryKey: ["account", "heatmap"], queryFn: getHoursHeatmap });
}

export function useCompletionStats() {
  return useQuery({ queryKey: ["account", "completion"], queryFn: getCompletionStats });
}
