import { useQuery } from "@tanstack/react-query";
import { getChart, getCurrentDiscounts } from "@/lib/api/charts";
import type { ChartType } from "@/lib/types";

export function useChart(type: ChartType) {
  return useQuery({ queryKey: ["chart", type], queryFn: () => getChart(type) });
}

export function useCurrentDiscounts(sort: "discount" | "ending" = "discount") {
  return useQuery({
    queryKey: ["sales", sort],
    queryFn: () => getCurrentDiscounts(sort),
  });
}
