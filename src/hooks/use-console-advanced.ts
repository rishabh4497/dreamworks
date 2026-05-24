// React Query hooks for the Tier 1–6 Console expansion. Keeps the original
// `use-console.ts` lean — this file only contains the new advanced surface.

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ackAlert,
  compareCohorts,
  createAlertRule,
  createDashboard,
  createDeploy,
  createExperiment,
  createFunnel,
  deleteAlertRule,
  deleteDashboard,
  deleteDeploy,
  deleteExperiment,
  deleteFunnel,
  deleteQuery,
  evaluateAlertRules,
  evaluateFunnel,
  getApdexByRoute,
  getAuthAnomalyReport,
  getCdnRegionReport,
  getChurnPredictions,
  getCrashFree,
  getDrmHealth,
  getEmailFunnel,
  getExperimentResult,
  getFraudReport,
  getInstallPipeline,
  getLaunchReport,
  getLongTaskAttribution,
  getLtvForecast,
  getMemoryLeakSuspicions,
  getModerationReport,
  getOnboardingFunnel,
  getPathSankey,
  getRecCtrReport,
  getReferralReport,
  getReplay,
  getResourceTimings,
  getRetentionCohorts,
  getSearchAnalytics,
  getVoiceQos,
  getWishlistDecay,
  listAlertEvents,
  listAlertRules,
  listDashboards,
  listDeploys,
  listExperiments,
  listFunnels,
  listQueries,
  listReplays,
  resolveAlert,
  runAdHocQuery,
  saveQuery,
  subscribeAlertEvents,
  updateAlertRule,
  updateExperiment,
} from "@/lib/api/telemetry-advanced";
import type {
  AdHocQuerySpec,
  AlertEvent,
  AlertEventStatus,
  AlertRule,
  ConsoleDashboard,
  ConsoleRange,
  DeployMarker,
  Experiment,
  FunnelDefinition,
} from "@/lib/types";

const COMMON_OPTS = { staleTime: 30_000, gcTime: 5 * 60_000 };

export const advKeys = {
  all: ["console-advanced"] as const,
  replays: (uid?: string, hasFrustration?: boolean) =>
    [...advKeys.all, "replays", uid ?? null, hasFrustration ?? null] as const,
  replay: (id: string) => [...advKeys.all, "replay", id] as const,
  funnels: () => [...advKeys.all, "funnels"] as const,
  funnelEval: (id: string, range: ConsoleRange) =>
    [...advKeys.all, "funnelEval", id, range] as const,
  sankey: (start: string, range: ConsoleRange) =>
    [...advKeys.all, "sankey", start, range] as const,
  retention: (weeks: number) => [...advKeys.all, "retention", weeks] as const,
  experiments: () => [...advKeys.all, "experiments"] as const,
  expResult: (id: string, range: ConsoleRange) =>
    [...advKeys.all, "expResult", id, range] as const,
  alertRules: () => [...advKeys.all, "alertRules"] as const,
  alertEvents: (status: AlertEventStatus) =>
    [...advKeys.all, "alertEvents", status] as const,
  apdex: (range: ConsoleRange) => [...advKeys.all, "apdex", range] as const,
  crashFree: (range: ConsoleRange) => [...advKeys.all, "crashFree", range] as const,
  deploys: () => [...advKeys.all, "deploys"] as const,
  resources: (range: ConsoleRange) => [...advKeys.all, "resources", range] as const,
  memory: (range: ConsoleRange) => [...advKeys.all, "memory", range] as const,
  longTasks: (range: ConsoleRange) => [...advKeys.all, "longTasks", range] as const,
  install: (range: ConsoleRange) => [...advKeys.all, "install", range] as const,
  launch: (range: ConsoleRange) => [...advKeys.all, "launch", range] as const,
  voice: (range: ConsoleRange) => [...advKeys.all, "voice", range] as const,
  cdn: () => [...advKeys.all, "cdn"] as const,
  drm: (range: ConsoleRange) => [...advKeys.all, "drm", range] as const,
  wishlistDecay: () => [...advKeys.all, "wishlistDecay"] as const,
  onboarding: (range: ConsoleRange) => [...advKeys.all, "onboarding", range] as const,
  referral: (range: ConsoleRange) => [...advKeys.all, "referral", range] as const,
  email: (range: ConsoleRange) => [...advKeys.all, "email", range] as const,
  search: (range: ConsoleRange) => [...advKeys.all, "search", range] as const,
  recs: (range: ConsoleRange) => [...advKeys.all, "recs", range] as const,
  fraud: (range: ConsoleRange) => [...advKeys.all, "fraud", range] as const,
  moderation: () => [...advKeys.all, "moderation"] as const,
  auth: (range: ConsoleRange) => [...advKeys.all, "auth", range] as const,
  queries: () => [...advKeys.all, "queries"] as const,
  queryResult: (id: string) => [...advKeys.all, "queryResult", id] as const,
  dashboards: () => [...advKeys.all, "dashboards"] as const,
  churn: () => [...advKeys.all, "churn"] as const,
  ltv: () => [...advKeys.all, "ltv"] as const,
  compare: (a: string, b: string, r: ConsoleRange) =>
    [...advKeys.all, "compare", a, b, r] as const,
};

// ── Replay ────────────────────────────────────────────────────────────────

export function useReplaysList(opts: { uid?: string; hasFrustration?: boolean } = {}) {
  return useQuery({
    queryKey: advKeys.replays(opts.uid, opts.hasFrustration),
    queryFn: () => listReplays({ uid: opts.uid, hasFrustration: opts.hasFrustration }),
    ...COMMON_OPTS,
  });
}

export function useReplay(sessionId: string | undefined) {
  return useQuery({
    queryKey: sessionId ? advKeys.replay(sessionId) : ["disabled"],
    queryFn: () => getReplay(sessionId!),
    enabled: !!sessionId,
    ...COMMON_OPTS,
  });
}

// ── Funnels ───────────────────────────────────────────────────────────────

export function useFunnels() {
  return useQuery({ queryKey: advKeys.funnels(), queryFn: () => listFunnels(), ...COMMON_OPTS });
}

export function useFunnelEval(id: string | undefined, range: ConsoleRange) {
  return useQuery({
    queryKey: id ? advKeys.funnelEval(id, range) : ["disabled"],
    queryFn: () => evaluateFunnel(id!, range),
    enabled: !!id,
    ...COMMON_OPTS,
  });
}

export function useCreateFunnel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (f: Omit<FunnelDefinition, "id" | "createdAt" | "updatedAt">) => createFunnel(f),
    onSuccess: () => qc.invalidateQueries({ queryKey: advKeys.funnels() }),
  });
}

export function useDeleteFunnel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFunnel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: advKeys.funnels() }),
  });
}

// ── Sankey + Retention ────────────────────────────────────────────────────

export function useSankey(startNode: string, range: ConsoleRange) {
  return useQuery({
    queryKey: advKeys.sankey(startNode, range),
    queryFn: () => getPathSankey(startNode, range),
    ...COMMON_OPTS,
  });
}

export function useRetention(weeks = 8) {
  return useQuery({
    queryKey: advKeys.retention(weeks),
    queryFn: () => getRetentionCohorts(weeks),
    ...COMMON_OPTS,
  });
}

// ── Experiments ───────────────────────────────────────────────────────────

export function useExperiments() {
  return useQuery({
    queryKey: advKeys.experiments(),
    queryFn: () => listExperiments(),
    ...COMMON_OPTS,
  });
}

export function useExperimentResult(id: string | undefined, range: ConsoleRange) {
  return useQuery({
    queryKey: id ? advKeys.expResult(id, range) : ["disabled"],
    queryFn: () => getExperimentResult(id!, range),
    enabled: !!id,
    ...COMMON_OPTS,
  });
}

export function useCreateExperiment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (e: Omit<Experiment, "id" | "createdAt" | "updatedAt">) => createExperiment(e),
    onSuccess: () => qc.invalidateQueries({ queryKey: advKeys.experiments() }),
  });
}

export function useUpdateExperiment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; patch: Partial<Experiment> }) =>
      updateExperiment(args.id, args.patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: advKeys.experiments() }),
  });
}

export function useDeleteExperiment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExperiment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: advKeys.experiments() }),
  });
}

// ── Alerts ────────────────────────────────────────────────────────────────

export function useAlertRules() {
  return useQuery({
    queryKey: advKeys.alertRules(),
    queryFn: () => listAlertRules(),
    ...COMMON_OPTS,
  });
}

export function useAlertEvents(status: AlertEventStatus = "firing") {
  return useQuery({
    queryKey: advKeys.alertEvents(status),
    queryFn: () => listAlertEvents({ status }),
    ...COMMON_OPTS,
  });
}

export function useLiveAlertEvents(status: AlertEventStatus = "firing"): AlertEvent[] {
  const [rows, setRows] = useState<AlertEvent[]>([]);
  useEffect(() => subscribeAlertEvents(setRows, status), [status]);
  return rows;
}

export function useCreateAlertRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rule: Omit<AlertRule, "id" | "createdAt" | "updatedAt">) =>
      createAlertRule(rule),
    onSuccess: () => qc.invalidateQueries({ queryKey: advKeys.alertRules() }),
  });
}

export function useUpdateAlertRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; patch: Partial<AlertRule> }) =>
      updateAlertRule(args.id, args.patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: advKeys.alertRules() }),
  });
}

export function useDeleteAlertRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAlertRule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: advKeys.alertRules() }),
  });
}

export function useAckAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; uid: string }) => ackAlert(args.id, args.uid),
    onSuccess: () => qc.invalidateQueries({ queryKey: advKeys.all }),
  });
}

export function useResolveAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resolveAlert(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: advKeys.all }),
  });
}

export function useEvaluateAlerts() {
  return useMutation({ mutationFn: () => evaluateAlertRules() });
}

// ── Tier 2 ────────────────────────────────────────────────────────────────

export function useApdex(range: ConsoleRange) {
  return useQuery({
    queryKey: advKeys.apdex(range),
    queryFn: () => getApdexByRoute(range),
    ...COMMON_OPTS,
  });
}

export function useCrashFree(range: ConsoleRange) {
  return useQuery({
    queryKey: advKeys.crashFree(range),
    queryFn: () => getCrashFree(range),
    ...COMMON_OPTS,
  });
}

export function useDeploys() {
  return useQuery({
    queryKey: advKeys.deploys(),
    queryFn: () => listDeploys(),
    ...COMMON_OPTS,
  });
}

export function useCreateDeploy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: Omit<DeployMarker, "id" | "createdAt">) => createDeploy(args),
    onSuccess: () => qc.invalidateQueries({ queryKey: advKeys.deploys() }),
  });
}

export function useDeleteDeploy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDeploy(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: advKeys.deploys() }),
  });
}

export function useResources(range: ConsoleRange) {
  return useQuery({
    queryKey: advKeys.resources(range),
    queryFn: () => getResourceTimings(range),
    ...COMMON_OPTS,
  });
}

export function useMemoryLeaks(range: ConsoleRange) {
  return useQuery({
    queryKey: advKeys.memory(range),
    queryFn: () => getMemoryLeakSuspicions(range),
    ...COMMON_OPTS,
  });
}

export function useLongTasks(range: ConsoleRange) {
  return useQuery({
    queryKey: advKeys.longTasks(range),
    queryFn: () => getLongTaskAttribution(range),
    ...COMMON_OPTS,
  });
}

// ── Tier 3 ────────────────────────────────────────────────────────────────

export function useInstallPipeline(range: ConsoleRange) {
  return useQuery({
    queryKey: advKeys.install(range),
    queryFn: () => getInstallPipeline(range),
    ...COMMON_OPTS,
  });
}

export function useLaunchReport(range: ConsoleRange) {
  return useQuery({
    queryKey: advKeys.launch(range),
    queryFn: () => getLaunchReport(range),
    ...COMMON_OPTS,
  });
}

export function useVoiceQos(range: ConsoleRange) {
  return useQuery({
    queryKey: advKeys.voice(range),
    queryFn: () => getVoiceQos(range),
    ...COMMON_OPTS,
  });
}

export function useCdn() {
  return useQuery({
    queryKey: advKeys.cdn(),
    queryFn: () => getCdnRegionReport(),
    ...COMMON_OPTS,
  });
}

export function useDrm(range: ConsoleRange) {
  return useQuery({
    queryKey: advKeys.drm(range),
    queryFn: () => getDrmHealth(range),
    ...COMMON_OPTS,
  });
}

export function useWishlistDecay() {
  return useQuery({
    queryKey: advKeys.wishlistDecay(),
    queryFn: () => getWishlistDecay(),
    ...COMMON_OPTS,
  });
}

// ── Tier 4 ────────────────────────────────────────────────────────────────

export function useOnboarding(range: ConsoleRange) {
  return useQuery({
    queryKey: advKeys.onboarding(range),
    queryFn: () => getOnboardingFunnel(range),
    ...COMMON_OPTS,
  });
}

export function useReferralReport(range: ConsoleRange) {
  return useQuery({
    queryKey: advKeys.referral(range),
    queryFn: () => getReferralReport(range),
    ...COMMON_OPTS,
  });
}

export function useEmailFunnel(range: ConsoleRange) {
  return useQuery({
    queryKey: advKeys.email(range),
    queryFn: () => getEmailFunnel(range),
    ...COMMON_OPTS,
  });
}

export function useSearchAnalytics(range: ConsoleRange) {
  return useQuery({
    queryKey: advKeys.search(range),
    queryFn: () => getSearchAnalytics(range),
    ...COMMON_OPTS,
  });
}

export function useRecCtr(range: ConsoleRange) {
  return useQuery({
    queryKey: advKeys.recs(range),
    queryFn: () => getRecCtrReport(range),
    ...COMMON_OPTS,
  });
}

// ── Tier 5 ────────────────────────────────────────────────────────────────

export function useFraud(range: ConsoleRange) {
  return useQuery({
    queryKey: advKeys.fraud(range),
    queryFn: () => getFraudReport(range),
    ...COMMON_OPTS,
  });
}

export function useModeration() {
  return useQuery({
    queryKey: advKeys.moderation(),
    queryFn: () => getModerationReport(),
    ...COMMON_OPTS,
  });
}

export function useAuthAnomalies(range: ConsoleRange) {
  return useQuery({
    queryKey: advKeys.auth(range),
    queryFn: () => getAuthAnomalyReport(range),
    ...COMMON_OPTS,
  });
}

// ── Tier 6 ────────────────────────────────────────────────────────────────

export function useQueries() {
  return useQuery({
    queryKey: advKeys.queries(),
    queryFn: () => listQueries(),
    ...COMMON_OPTS,
  });
}

export function useRunQuery(spec: AdHocQuerySpec | null) {
  return useQuery({
    queryKey: spec ? advKeys.queryResult(spec.id) : ["disabled"],
    queryFn: () => runAdHocQuery(spec!),
    enabled: !!spec,
    ...COMMON_OPTS,
  });
}

export function useSaveQuery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (spec: Omit<AdHocQuerySpec, "id" | "createdAt" | "updatedAt">) => saveQuery(spec),
    onSuccess: () => qc.invalidateQueries({ queryKey: advKeys.queries() }),
  });
}

export function useDeleteQuery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteQuery(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: advKeys.queries() }),
  });
}

export function useDashboards() {
  return useQuery({
    queryKey: advKeys.dashboards(),
    queryFn: () => listDashboards(),
    ...COMMON_OPTS,
  });
}

export function useCreateDashboard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Omit<ConsoleDashboard, "id" | "createdAt" | "updatedAt">) => createDashboard(d),
    onSuccess: () => qc.invalidateQueries({ queryKey: advKeys.dashboards() }),
  });
}

export function useDeleteDashboard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDashboard(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: advKeys.dashboards() }),
  });
}

export function useChurnPredictions() {
  return useQuery({
    queryKey: advKeys.churn(),
    queryFn: () => getChurnPredictions(),
    ...COMMON_OPTS,
  });
}

export function useLtvForecast() {
  return useQuery({
    queryKey: advKeys.ltv(),
    queryFn: () => getLtvForecast(),
    ...COMMON_OPTS,
  });
}

export function useCohortCompare(
  a: "desktop" | "web" | "new" | "returning",
  b: "desktop" | "web" | "new" | "returning",
  range: ConsoleRange,
) {
  return useQuery({
    queryKey: advKeys.compare(a, b, range),
    queryFn: () => compareCohorts(range, a, b),
    ...COMMON_OPTS,
  });
}
