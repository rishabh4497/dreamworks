import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  getDeviceBreakdown,
  getErrorFeed,
  getFeatureUsage,
  getOverviewSummary,
  getPerformanceBreakdown,
  getPublisherKpis,
  getStudioKpis,
  getUserKpis,
  subscribeActiveSessions,
} from "@/lib/api/telemetry";
import type { ConsoleActiveSession, ConsoleRange } from "@/lib/types";

const RANGES: ConsoleRange[] = ["24h", "7d", "30d", "90d"];

export const consoleKeys = {
  all: ["console"] as const,
  overview: (r: ConsoleRange) => [...consoleKeys.all, "overview", r] as const,
  users: (r: ConsoleRange) => [...consoleKeys.all, "users", r] as const,
  studios: (r: ConsoleRange) => [...consoleKeys.all, "studios", r] as const,
  publishers: (r: ConsoleRange) => [...consoleKeys.all, "publishers", r] as const,
  devices: (r: ConsoleRange) => [...consoleKeys.all, "devices", r] as const,
  performance: (r: ConsoleRange) => [...consoleKeys.all, "performance", r] as const,
  features: (r: ConsoleRange) => [...consoleKeys.all, "features", r] as const,
  errors: (r: ConsoleRange) => [...consoleKeys.all, "errors", r] as const,
};

const COMMON_OPTS = {
  staleTime: 30_000,
  gcTime: 5 * 60_000,
};

export function useConsoleRange(): [ConsoleRange, (r: ConsoleRange) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get("range");
  const range: ConsoleRange = RANGES.includes(raw as ConsoleRange)
    ? (raw as ConsoleRange)
    : "7d";
  const setRange = (next: ConsoleRange) => {
    const updated = new URLSearchParams(params);
    updated.set("range", next);
    setParams(updated, { replace: true });
  };
  return [range, setRange];
}

export function useConsoleTab(): [string, (next: string) => void] {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "overview";
  const setTab = (next: string) => {
    const updated = new URLSearchParams(params);
    updated.set("tab", next);
    setParams(updated, { replace: true });
  };
  return [tab, setTab];
}

export function useConsoleOverview(range: ConsoleRange) {
  return useQuery({
    queryKey: consoleKeys.overview(range),
    queryFn: () => getOverviewSummary(range),
    ...COMMON_OPTS,
  });
}

export function useConsoleUsers(range: ConsoleRange) {
  return useQuery({
    queryKey: consoleKeys.users(range),
    queryFn: () => getUserKpis(range),
    ...COMMON_OPTS,
  });
}

export function useConsoleStudios(range: ConsoleRange) {
  return useQuery({
    queryKey: consoleKeys.studios(range),
    queryFn: () => getStudioKpis(range),
    ...COMMON_OPTS,
  });
}

export function useConsolePublishers(range: ConsoleRange) {
  return useQuery({
    queryKey: consoleKeys.publishers(range),
    queryFn: () => getPublisherKpis(range),
    ...COMMON_OPTS,
  });
}

export function useConsoleDevices(range: ConsoleRange) {
  return useQuery({
    queryKey: consoleKeys.devices(range),
    queryFn: () => getDeviceBreakdown(range),
    ...COMMON_OPTS,
  });
}

export function useConsolePerformance(range: ConsoleRange) {
  return useQuery({
    queryKey: consoleKeys.performance(range),
    queryFn: () => getPerformanceBreakdown(range),
    ...COMMON_OPTS,
  });
}

export function useConsoleFeatures(range: ConsoleRange) {
  return useQuery({
    queryKey: consoleKeys.features(range),
    queryFn: () => getFeatureUsage(range),
    ...COMMON_OPTS,
  });
}

export function useConsoleErrors(range: ConsoleRange) {
  return useQuery({
    queryKey: consoleKeys.errors(range),
    queryFn: () => getErrorFeed(range),
    ...COMMON_OPTS,
  });
}

/** Live-updating list of active sessions (started in last 5 min, no endedAt). */
export function useLiveSessions(): ConsoleActiveSession[] {
  const [sessions, setSessions] = useState<ConsoleActiveSession[]>([]);
  useEffect(() => {
    const unsub = subscribeActiveSessions(setSessions);
    return () => unsub();
  }, []);
  return sessions;
}
