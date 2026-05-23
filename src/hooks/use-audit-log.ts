import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { listAuditLog } from "@/lib/api/admin";
import type { AuditAction, AuditTargetType } from "@/lib/types";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

export const auditKeys = {
  all: ["audit"] as const,
  list: (filters: { action?: AuditAction; actorUid?: string; targetType?: AuditTargetType }) =>
    [...auditKeys.all, "list", filters] as const,
  user: (uid: string) => [...auditKeys.all, "user", uid] as const,
  recent: () => [...auditKeys.all, "recent"] as const,
};

export function useRecentAuditLog(pageSize = 20) {
  return useQuery({
    queryKey: auditKeys.recent(),
    queryFn: async () => {
      const { entries } = await listAuditLog({ pageSize });
      return entries;
    },
  });
}

export function useAuditLog(filters: {
  action?: AuditAction;
  actorUid?: string;
  targetType?: AuditTargetType;
} = {}) {
  return useInfiniteQuery({
    queryKey: auditKeys.list(filters),
    queryFn: ({ pageParam }) =>
      listAuditLog({
        ...filters,
        pageSize: 50,
        after: pageParam as QueryDocumentSnapshot<DocumentData> | null,
      }),
    initialPageParam: null as QueryDocumentSnapshot<DocumentData> | null,
    getNextPageParam: (last) => last.cursor,
  });
}

export function useUserAuditTrail(uid: string | undefined) {
  return useQuery({
    queryKey: uid ? auditKeys.user(uid) : ["disabled"],
    queryFn: async () => {
      if (!uid) return [];
      const { entries } = await listAuditLog({ actorUid: uid, pageSize: 100 });
      return entries;
    },
    enabled: !!uid,
  });
}
