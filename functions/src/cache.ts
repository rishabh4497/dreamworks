import { createHash } from "node:crypto";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import type { AIFeatureKey } from "./feature-keys.js";

const CACHE_COLLECTION = "dw_ai_cache";

/**
 * Cache key is the sha256 of the inputs that determine the response.
 * Anything that changes the output must be included here.
 */
export function buildCacheKey(args: {
  featureKey: AIFeatureKey;
  promptVersion: string;
  model: string;
  payload: unknown;
}): string {
  const canonical = JSON.stringify({
    f: args.featureKey,
    v: args.promptVersion,
    m: args.model,
    p: args.payload,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

export interface CacheRecord<T> {
  featureKey: AIFeatureKey;
  promptVersion: string;
  model: string;
  payloadHash: string;
  response: T;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  createdAt: Timestamp;
  hits: number;
}

export async function readCache<T>(cacheKey: string): Promise<CacheRecord<T> | null> {
  const snap = await getFirestore().collection(CACHE_COLLECTION).doc(cacheKey).get();
  if (!snap.exists) return null;
  return snap.data() as CacheRecord<T>;
}

export async function bumpCacheHits(cacheKey: string): Promise<void> {
  await getFirestore()
    .collection(CACHE_COLLECTION)
    .doc(cacheKey)
    .update({ hits: FieldValue.increment(1) });
}

export async function writeCache<T>(
  cacheKey: string,
  record: Omit<CacheRecord<T>, "createdAt" | "hits">,
): Promise<void> {
  await getFirestore()
    .collection(CACHE_COLLECTION)
    .doc(cacheKey)
    .set({
      ...record,
      createdAt: Timestamp.now(),
      hits: 0,
    });
}
