import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSubmission,
  listMySubmissions,
  listSubmissionQueue,
  listSubmissionsForApp,
  publishApprovedAppCallable,
  reviewAppSubmissionCallable,
  submitAppForReviewCallable,
  type ReviewSubmissionInput,
} from "@/lib/api/submissions";
import type { SubmissionStatus } from "@/lib/types";
import { appKeys } from "@/hooks/use-apps";
import { invalidateCatalogCache } from "@/lib/api/games";

export const submissionKeys = {
  all: ["submissions"] as const,
  queue: (status?: SubmissionStatus | "all") =>
    [...submissionKeys.all, "queue", status ?? "all"] as const,
  mine: () => [...submissionKeys.all, "mine"] as const,
  byApp: (id: string) => [...submissionKeys.all, "app", id] as const,
  byId: (id: string) => [...submissionKeys.all, "id", id] as const,
};

export function useSubmissionQueue(status?: SubmissionStatus | "all") {
  return useQuery({
    queryKey: submissionKeys.queue(status),
    queryFn: () => listSubmissionQueue(status && status !== "all" ? status : undefined),
  });
}

export function useMySubmissions() {
  return useQuery({
    queryKey: submissionKeys.mine(),
    queryFn: listMySubmissions,
  });
}

export function useSubmissionsForApp(appId: string | undefined) {
  return useQuery({
    queryKey: appId ? submissionKeys.byApp(appId) : ["disabled"],
    queryFn: () => listSubmissionsForApp(appId!),
    enabled: !!appId,
  });
}

export function useSubmission(submissionId: string | undefined) {
  return useQuery({
    queryKey: submissionId ? submissionKeys.byId(submissionId) : ["disabled"],
    queryFn: () => getSubmission(submissionId!),
    enabled: !!submissionId,
  });
}

export function useSubmitAppForReviewCallable(appId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => submitAppForReviewCallable(appId!),
    onSuccess: () => {
      if (!appId) return;
      qc.invalidateQueries({ queryKey: appKeys.byId(appId) });
      qc.invalidateQueries({ queryKey: appKeys.mine() });
      qc.invalidateQueries({ queryKey: submissionKeys.byApp(appId) });
      qc.invalidateQueries({ queryKey: submissionKeys.mine() });
      qc.invalidateQueries({ queryKey: submissionKeys.queue() });
    },
  });
}

export function useReviewAppSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ReviewSubmissionInput) => reviewAppSubmissionCallable(input),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: submissionKeys.byId(result.submissionId) });
      qc.invalidateQueries({ queryKey: submissionKeys.byApp(result.appId) });
      qc.invalidateQueries({ queryKey: submissionKeys.all });
      qc.invalidateQueries({ queryKey: appKeys.byId(result.appId) });
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function usePublishApprovedApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (appId: string) => publishApprovedAppCallable(appId),
    onSuccess: (_result, appId) => {
      qc.invalidateQueries({ queryKey: appKeys.byId(appId) });
      qc.invalidateQueries({ queryKey: appKeys.mine() });
      qc.invalidateQueries({ queryKey: submissionKeys.byApp(appId) });
      qc.invalidateQueries({ queryKey: submissionKeys.all });
      qc.invalidateQueries({ queryKey: ["games"] });
      qc.invalidateQueries({ queryKey: ["admin"] });
      invalidateCatalogCache();
    },
  });
}
