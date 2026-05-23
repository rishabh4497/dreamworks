import { doc, getDoc } from "firebase/firestore";
import { COLLECTIONS, getDb } from "../firebase";
import type {
  ConfigDocument,
  ConfigEntry,
  ConfigKey,
  ConfigLabel,
  NotificationKindEntry,
  RejectionReasonsDoc,
} from "../types";

/**
 * Fetch a single `dw_config/{key}` document.
 *
 * Each config doc is a small, read-mostly registry — entries are admin-edited
 * in the dashboard and reads are cached by React Query with a 24h staleTime.
 * Callers should prefer the typed wrappers below over this raw getter.
 */
export async function getConfigDoc<E extends ConfigEntry = ConfigEntry>(
  key: ConfigKey,
): Promise<ConfigDocument<E> | null> {
  const ref = doc(getDb(), COLLECTIONS.config, key);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as ConfigDocument<E>;
}

export async function getCountries(): Promise<ConfigDocument | null> {
  return getConfigDoc("countries");
}

export async function getLanguages(): Promise<ConfigDocument | null> {
  return getConfigDoc("languages");
}

export async function getCardBrands(): Promise<ConfigDocument | null> {
  return getConfigDoc("card_brands");
}

export async function getFamilyRelationships(): Promise<ConfigDocument | null> {
  return getConfigDoc("family_relationships");
}

export async function getLfgSessionTypes(): Promise<ConfigDocument | null> {
  return getConfigDoc("lfg_session_types");
}

export async function getAnnouncementKinds(): Promise<ConfigDocument | null> {
  return getConfigDoc("announcement_kinds");
}

export async function getSocialPlatforms(): Promise<ConfigDocument | null> {
  return getConfigDoc("social_platforms");
}

export async function getPlatforms(): Promise<ConfigDocument | null> {
  return getConfigDoc("platforms");
}

export async function getNotificationKinds(): Promise<ConfigDocument<NotificationKindEntry> | null> {
  return getConfigDoc<NotificationKindEntry>("notification_kinds");
}

export async function getTelemetryScaffold(): Promise<ConfigDocument | null> {
  return getConfigDoc("telemetry_scaffold");
}

export async function getRejectionReasons(): Promise<RejectionReasonsDoc | null> {
  const ref = doc(getDb(), COLLECTIONS.config, "rejection_reasons");
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as RejectionReasonsDoc;
}

/**
 * Pick the best label for `locale`, falling back to English. Used by both the
 * hook layer and the seed script; keeping it next to `getConfigDoc` so the
 * shape of `ConfigLabel` stays a private contract.
 */
export function resolveLabel(label: ConfigLabel | undefined, locale = "en"): string {
  if (!label) return "";
  return label[locale] ?? label.en ?? "";
}

/** Sort + filter helper used by every typed config hook. */
export function activeEntries<E extends ConfigEntry>(
  entries: E[] | undefined,
): E[] {
  if (!entries) return [];
  return entries
    .filter((e) => e.enabled !== false)
    .slice()
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.id.localeCompare(b.id);
    });
}
