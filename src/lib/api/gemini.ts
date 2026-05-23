import { httpsCallable, type HttpsCallable } from "firebase/functions";
import { getFirebaseFunctions } from "@/lib/firebase";
import type { AIFeatureKey } from "@/lib/ai/feature-keys";
import type { AIResponseMap } from "@/lib/ai/response-types";

interface ProxyRequestEnvelope<TPayload> {
  featureKey: AIFeatureKey;
  payload: TPayload;
}

interface ProxyResponseEnvelope<TResult> {
  result: TResult;
  cacheHit: boolean;
  usage: { inputTokens: number; outputTokens: number; cachedInputTokens: number };
}

let callable: HttpsCallable<ProxyRequestEnvelope<unknown>, ProxyResponseEnvelope<unknown>> | null =
  null;

function getCallable() {
  if (callable) return callable;
  callable = httpsCallable<ProxyRequestEnvelope<unknown>, ProxyResponseEnvelope<unknown>>(
    getFirebaseFunctions(),
    "geminiProxy",
  );
  return callable;
}

/**
 * Single typed entry-point for every AI feature. The compiler ties `K` (the
 * feature key) to the expected response type from `AIResponseMap`. The payload
 * is unknown because each feature's payload shape lives next to its prompt
 * module in `functions/src/prompts/`.
 */
export async function callGemini<K extends AIFeatureKey, TPayload>(
  featureKey: K,
  payload: TPayload,
): Promise<{
  result: AIResponseMap[K];
  cacheHit: boolean;
  usage: ProxyResponseEnvelope<unknown>["usage"];
}> {
  const fn = getCallable();
  const resp = await fn({ featureKey, payload });
  const data = resp.data as ProxyResponseEnvelope<AIResponseMap[K]>;
  return {
    result: data.result,
    cacheHit: data.cacheHit,
    usage: data.usage,
  };
}
