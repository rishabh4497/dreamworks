import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserHardware, saveHardwareSnapshot } from "@/lib/api/user-hardware";
import { useAuthStore } from "@/stores/auth-store";
import type { HardwareSnapshot } from "@/lib/types";

export const hardwareKeys = {
  all: ["user-hardware"] as const,
  forUser: (uid: string) => [...hardwareKeys.all, uid] as const,
};

export function useUserHardware() {
  const uid = useAuthStore((s) => s.profile?.uid);
  return useQuery({
    queryKey: uid ? hardwareKeys.forUser(uid) : ["disabled"],
    queryFn: () => getUserHardware(uid!),
    enabled: !!uid,
  });
}

export function useSaveHardwareSnapshot() {
  const qc = useQueryClient();
  const uid = useAuthStore((s) => s.profile?.uid);
  return useMutation({
    mutationFn: async (snapshot: HardwareSnapshot) => {
      if (!uid) throw new Error("Sign in to save benchmark results.");
      await saveHardwareSnapshot(uid, snapshot);
    },
    onSuccess: () => {
      if (uid) qc.invalidateQueries({ queryKey: hardwareKeys.forUser(uid) });
    },
  });
}
