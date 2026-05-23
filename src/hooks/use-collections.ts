import { useQuery } from "@tanstack/react-query";
import { listCollections } from "@/lib/api/collections";
import { useAuthStore } from "@/stores/auth-store";

export const collectionKeys = {
  all: ["collections"] as const,
  user: (uid: string) => [...collectionKeys.all, uid] as const,
};

export function useCollections() {
  const uid = useAuthStore((s) => s.profile?.uid);
  return useQuery({
    queryKey: uid ? collectionKeys.user(uid) : ["disabled"],
    queryFn: listCollections,
    enabled: !!uid,
  });
}
