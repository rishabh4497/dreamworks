import { useMutation, useQueryClient } from "@tanstack/react-query";
import { scanAllLaunchers, type ScanResult } from "@/lib/scanner";

export const scannerKeys = {
  all: ["scanner"] as const,
  result: () => [...scannerKeys.all, "result"] as const,
};

/**
 * Wraps `scanAllLaunchers()` as a mutation so the consent step can fire it
 * imperatively. We also stash the latest `ScanResult` in the React Query
 * cache under `scannerKeys.result()` so the modal (or any other consumer)
 * can re-read it after the mutation settles — e.g. if the modal closes and
 * reopens before the results step is dismissed.
 */
export function useScanner() {
  const queryClient = useQueryClient();
  return useMutation<ScanResult>({
    mutationKey: scannerKeys.all,
    mutationFn: () => scanAllLaunchers(),
    onSuccess: (data) => {
      queryClient.setQueryData<ScanResult>(scannerKeys.result(), data);
    },
  });
}
