import { getFirestore, Timestamp } from "firebase-admin/firestore";

const USAGE_COLLECTION = "dw_ai_usage";

interface UsageLog {
  uid: string;
  featureKey: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  costMicroCents: number;
  cacheHit: boolean;
  ts: Timestamp;
}

/**
 * Estimated cost in micro-cents. Tuned for Gemini 3.1 Flash-Lite ($0.25 / $1.50 per 1M).
 * For other models the proxy passes the per-1M rate explicitly.
 */
export function estimateMicroCents(args: {
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  inputPer1M: number; // dollars per 1M
  outputPer1M: number;
  cachedPer1M: number;
}): number {
  const billableInput = Math.max(0, args.inputTokens - args.cachedTokens);
  const cents =
    (billableInput / 1_000_000) * args.inputPer1M * 100 +
    (args.cachedTokens / 1_000_000) * args.cachedPer1M * 100 +
    (args.outputTokens / 1_000_000) * args.outputPer1M * 100;
  return Math.round(cents * 1_000_000); // micro-cents
}

export async function logUsage(entry: Omit<UsageLog, "ts">): Promise<void> {
  await getFirestore()
    .collection(USAGE_COLLECTION)
    .add({ ...entry, ts: Timestamp.now() });
}
