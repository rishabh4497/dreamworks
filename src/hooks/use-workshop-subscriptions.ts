import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listWorkshopSubscriptions,
  setWorkshopSubscription,
} from "@/lib/api/workshop";
import { useAuthStore } from "@/stores/auth-store";

export const workshopSubKeys = {
  all: ["workshop-subs"] as const,
  forUser: (uid: string | null) => [...workshopSubKeys.all, uid ?? "anon"] as const,
};

export function useWorkshopSubscriptions() {
  const uid = useAuthStore((s) => s.profile?.uid ?? null);
  return useQuery({
    queryKey: workshopSubKeys.forUser(uid),
    queryFn: async () => {
      if (!uid) return new Set<string>();
      const ids = await listWorkshopSubscriptions(uid);
      return new Set(ids);
    },
    enabled: uid !== null,
  });
}

export function useToggleWorkshopSubscription() {
  const qc = useQueryClient();
  const uid = useAuthStore((s) => s.profile?.uid ?? null);

  return useMutation({
    mutationFn: async (input: { modId: string; subscribed: boolean }) => {
      if (!uid) throw new Error("Not signed in");
      await setWorkshopSubscription({ userId: uid, ...input });
      return input;
    },
    onMutate: async ({ modId, subscribed }) => {
      const key = workshopSubKeys.forUser(uid);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Set<string>>(key);
      const next = new Set(previous ?? []);
      if (subscribed) next.add(modId);
      else next.delete(modId);
      qc.setQueryData<Set<string>>(key, next);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(workshopSubKeys.forUser(uid), context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: workshopSubKeys.forUser(uid) });
    },
  });
}
