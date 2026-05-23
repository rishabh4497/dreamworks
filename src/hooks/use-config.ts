import { useQuery } from "@tanstack/react-query";
import {
  activeEntries,
  getAnnouncementKinds,
  getCardBrands,
  getConfigDoc,
  getCountries,
  getFamilyRelationships,
  getLanguages,
  getLfgSessionTypes,
  getNotificationKinds,
  getPlatforms,
  getRejectionReasons,
  getSocialPlatforms,
  getTelemetryScaffold,
  resolveLabel,
} from "@/lib/api/config";
import type {
  ConfigDocument,
  ConfigEntry,
  ConfigKey,
  NotificationKindEntry,
} from "@/lib/types";

/**
 * Config docs are admin-edited and read by every dropdown in the app. We cache
 * aggressively (24h staleTime) and trust the seed/admin write to bump the doc
 * — manual refetch via React Query is enough when an admin edits.
 */
const CONFIG_STALE_MS = 24 * 60 * 60 * 1000;

export function useConfigDoc<E extends ConfigEntry = ConfigEntry>(key: ConfigKey) {
  return useQuery<ConfigDocument<E> | null>({
    queryKey: ["config", key],
    queryFn: () => getConfigDoc<E>(key),
    staleTime: CONFIG_STALE_MS,
  });
}

// ── Typed wrappers ──────────────────────────────────────────────────────────
//
// Each returns the same shape `{ data, isLoading, ... }` you'd get from
// `useQuery`, but with `data.entries` already sorted and filtered to enabled
// rows. Pages can call e.g. `useCountries().data?.entries` and treat the
// result as a ready-to-render list.

export function useCountries() {
  return useQuery({
    queryKey: ["config", "countries"],
    queryFn: getCountries,
    staleTime: CONFIG_STALE_MS,
    select: selectActive,
  });
}

export function useLanguages() {
  return useQuery({
    queryKey: ["config", "languages"],
    queryFn: getLanguages,
    staleTime: CONFIG_STALE_MS,
    select: selectActive,
  });
}

export function useCardBrands() {
  return useQuery({
    queryKey: ["config", "card_brands"],
    queryFn: getCardBrands,
    staleTime: CONFIG_STALE_MS,
    select: selectActive,
  });
}

export function useFamilyRelationships() {
  return useQuery({
    queryKey: ["config", "family_relationships"],
    queryFn: getFamilyRelationships,
    staleTime: CONFIG_STALE_MS,
    select: selectActive,
  });
}

export function useLfgSessionTypes() {
  return useQuery({
    queryKey: ["config", "lfg_session_types"],
    queryFn: getLfgSessionTypes,
    staleTime: CONFIG_STALE_MS,
    select: selectActive,
  });
}

export function useAnnouncementKinds() {
  return useQuery({
    queryKey: ["config", "announcement_kinds"],
    queryFn: getAnnouncementKinds,
    staleTime: CONFIG_STALE_MS,
    select: selectActive,
  });
}

export function useSocialPlatforms() {
  return useQuery({
    queryKey: ["config", "social_platforms"],
    queryFn: getSocialPlatforms,
    staleTime: CONFIG_STALE_MS,
    select: selectActive,
  });
}

export function usePlatforms() {
  return useQuery({
    queryKey: ["config", "platforms"],
    queryFn: getPlatforms,
    staleTime: CONFIG_STALE_MS,
    select: selectActive,
  });
}

export function useNotificationKinds() {
  return useQuery({
    queryKey: ["config", "notification_kinds"],
    queryFn: getNotificationKinds,
    staleTime: CONFIG_STALE_MS,
    select: (doc: ConfigDocument<NotificationKindEntry> | null) =>
      activeEntries(doc?.entries),
  });
}

export function useTelemetryScaffold() {
  return useQuery({
    queryKey: ["config", "telemetry_scaffold"],
    queryFn: getTelemetryScaffold,
    staleTime: CONFIG_STALE_MS,
    select: selectActive,
  });
}

export function useRejectionReasons() {
  return useQuery({
    queryKey: ["config", "rejection_reasons"],
    queryFn: getRejectionReasons,
    staleTime: CONFIG_STALE_MS,
  });
}

// Re-export the label resolver so components can render i18n strings without
// importing from `@/lib/api/config` directly.
export { resolveLabel } from "@/lib/api/config";

function selectActive(doc: ConfigDocument | null): ConfigEntry[] {
  return activeEntries(doc?.entries);
}
