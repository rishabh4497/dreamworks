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

// Fallback country list so checkout still works when the Firestore config
// document is empty or unreachable. Codes are ISO-3166 alpha-2.
const FALLBACK_COUNTRIES: ConfigEntry[] = [
  { id: "US", labels: { en: "United States" }, sortOrder: 0, enabled: true },
  { id: "CA", labels: { en: "Canada" }, sortOrder: 1, enabled: true },
  { id: "GB", labels: { en: "United Kingdom" }, sortOrder: 2, enabled: true },
  { id: "DE", labels: { en: "Germany" }, sortOrder: 3, enabled: true },
  { id: "FR", labels: { en: "France" }, sortOrder: 4, enabled: true },
  { id: "ES", labels: { en: "Spain" }, sortOrder: 5, enabled: true },
  { id: "IT", labels: { en: "Italy" }, sortOrder: 6, enabled: true },
  { id: "NL", labels: { en: "Netherlands" }, sortOrder: 7, enabled: true },
  { id: "SE", labels: { en: "Sweden" }, sortOrder: 8, enabled: true },
  { id: "PL", labels: { en: "Poland" }, sortOrder: 9, enabled: true },
  { id: "AU", labels: { en: "Australia" }, sortOrder: 10, enabled: true },
  { id: "NZ", labels: { en: "New Zealand" }, sortOrder: 11, enabled: true },
  { id: "JP", labels: { en: "Japan" }, sortOrder: 12, enabled: true },
  { id: "KR", labels: { en: "South Korea" }, sortOrder: 13, enabled: true },
  { id: "IN", labels: { en: "India" }, sortOrder: 14, enabled: true },
  { id: "BR", labels: { en: "Brazil" }, sortOrder: 15, enabled: true },
  { id: "MX", labels: { en: "Mexico" }, sortOrder: 16, enabled: true },
  { id: "AR", labels: { en: "Argentina" }, sortOrder: 17, enabled: true },
  { id: "ZA", labels: { en: "South Africa" }, sortOrder: 18, enabled: true },
  { id: "AE", labels: { en: "United Arab Emirates" }, sortOrder: 19, enabled: true },
];

export function useCountries() {
  return useQuery({
    queryKey: ["config", "countries"],
    queryFn: getCountries,
    staleTime: CONFIG_STALE_MS,
    select: (doc: ConfigDocument | null) => {
      const entries = selectActive(doc);
      return entries.length > 0 ? entries : FALLBACK_COUNTRIES;
    },
  });
}

// Only languages with actual UI dictionaries belong in the dropdown — picking
// anything else silently falls back to English because the translator can't
// resolve the locale. Falls back to a hardcoded list when Firestore isn't
// seeded so the dropdown is never empty.
const SUPPORTED_LANG_IDS = new Set(["en", "fr", "de", "es", "ja", "ko"]);

const FALLBACK_LANGUAGES: ConfigEntry[] = [
  {
    id: "en",
    labels: { en: "English" },
    sortOrder: 0,
    enabled: true,
    meta: { nativeName: "English" },
  },
  {
    id: "fr",
    labels: { en: "French" },
    sortOrder: 1,
    enabled: true,
    meta: { nativeName: "Français" },
  },
  {
    id: "de",
    labels: { en: "German" },
    sortOrder: 2,
    enabled: true,
    meta: { nativeName: "Deutsch" },
  },
  {
    id: "es",
    labels: { en: "Spanish" },
    sortOrder: 3,
    enabled: true,
    meta: { nativeName: "Español" },
  },
  {
    id: "ja",
    labels: { en: "Japanese" },
    sortOrder: 4,
    enabled: true,
    meta: { nativeName: "日本語" },
  },
  {
    id: "ko",
    labels: { en: "Korean" },
    sortOrder: 5,
    enabled: true,
    meta: { nativeName: "한국어" },
  },
];

export function useLanguages() {
  return useQuery({
    queryKey: ["config", "languages"],
    queryFn: getLanguages,
    staleTime: CONFIG_STALE_MS,
    select: (doc: ConfigDocument | null) => {
      const entries = selectActive(doc).filter((e) => SUPPORTED_LANG_IDS.has(e.id));
      return entries.length > 0 ? entries : FALLBACK_LANGUAGES;
    },
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
