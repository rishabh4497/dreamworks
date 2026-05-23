import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";

import { getGeminiClient } from "./gemini-client.js";
import { getPromptModule } from "./prompts/index.js";
import { buildCacheKey, readCache, writeCache, bumpCacheHits } from "./cache.js";
import { chargeQuota } from "./gemini-quota.js";
import { estimateMicroCents, logUsage } from "./usage.js";
import { MODEL_FLASH_LITE, MODEL_FLASH_REASONING } from "./models.js";

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

// Pricing per 1M tokens (USD). Update if Google pricing changes.
const PRICING: Record<string, { input: number; output: number; cached: number }> = {
  [MODEL_FLASH_LITE]: { input: 0.25, output: 1.5, cached: 0.025 },
  [MODEL_FLASH_REASONING]: { input: 0.3, output: 2.5, cached: 0.03 },
};

interface ProxyRequest {
  featureKey: string;
  payload: unknown;
}

interface ProxyResponse {
  result: unknown;
  cacheHit: boolean;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cachedInputTokens: number;
  };
}

export const geminiProxy = onCall(
  {
    region: "us-central1",
    secrets: [GEMINI_API_KEY],
    memory: "512MiB",
    timeoutSeconds: 60,
    maxInstances: 50,
    concurrency: 20,
  },
  async (request: CallableRequest<ProxyRequest>): Promise<ProxyResponse> => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "Sign-in required for AI features.");
    }

    const { featureKey, payload } = request.data ?? ({} as ProxyRequest);
    if (typeof featureKey !== "string" || !featureKey) {
      throw new HttpsError("invalid-argument", "Missing featureKey.");
    }

    const prompt = getPromptModule(featureKey);
    if (!prompt) {
      throw new HttpsError("not-found", `Unknown AI feature: ${featureKey}`);
    }

    const cacheKey = buildCacheKey({
      featureKey: prompt.featureKey,
      promptVersion: prompt.promptVersion,
      model: prompt.model,
      payload,
    });

    // 1. Cache lookup (before quota debit — cache hits are free for users).
    if (prompt.cacheable) {
      const cached = await readCache<unknown>(cacheKey);
      if (cached) {
        await bumpCacheHits(cacheKey);
        await logUsage({
          uid,
          featureKey: prompt.featureKey,
          inputTokens: 0,
          outputTokens: 0,
          cachedTokens: cached.inputTokens,
          costMicroCents: 0,
          cacheHit: true,
        });
        return {
          result: cached.response,
          cacheHit: true,
          usage: {
            inputTokens: 0,
            outputTokens: 0,
            cachedInputTokens: cached.inputTokens,
          },
        };
      }
    }

    // 2. Quota check (transaction-safe).
    await chargeQuota(uid);

    // 3. Build content + call Gemini with retry.
    const contents = prompt.buildContents(payload);
    const ai = getGeminiClient();

    let response;
    try {
      response = await callWithBackoff(() =>
        ai.models.generateContent({
          model: prompt.model,
          contents,
          config: {
            systemInstruction: prompt.systemInstruction,
            responseMimeType: "application/json",
            responseSchema: prompt.responseSchema,
            temperature: prompt.temperature,
            thinkingConfig: prompt.useThinking ? { thinkingBudget: 4096 } : { thinkingBudget: 0 },
          },
        }),
      );
    } catch (err) {
      logger.error("gemini call failed", { featureKey, err: serialize(err) });
      throw new HttpsError("internal", "AI provider call failed.");
    }

    const text = response.text ?? "";
    if (!text) {
      throw new HttpsError("internal", "Empty AI response.");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new HttpsError("internal", "AI returned invalid JSON.");
    }

    let validated: unknown;
    try {
      validated = prompt.validate(parsed);
    } catch (err) {
      logger.error("validation failed", { featureKey, err: serialize(err) });
      throw new HttpsError("internal", "AI response failed validation.");
    }

    const usageMeta = response.usageMetadata ?? {};
    const inputTokens = usageMeta.promptTokenCount ?? 0;
    const outputTokens = usageMeta.candidatesTokenCount ?? 0;
    const cachedTokens = usageMeta.cachedContentTokenCount ?? 0;

    // 4. Write cache (if cacheable).
    if (prompt.cacheable) {
      await writeCache(cacheKey, {
        featureKey: prompt.featureKey,
        promptVersion: prompt.promptVersion,
        model: prompt.model,
        payloadHash: cacheKey,
        response: validated,
        inputTokens,
        outputTokens,
        cachedTokens,
      });
    }

    // 5. Log usage.
    const price = PRICING[prompt.model] ?? PRICING[MODEL_FLASH_LITE];
    const costMicroCents = estimateMicroCents({
      inputTokens,
      outputTokens,
      cachedTokens,
      inputPer1M: price.input,
      outputPer1M: price.output,
      cachedPer1M: price.cached,
    });
    await logUsage({
      uid,
      featureKey: prompt.featureKey,
      inputTokens,
      outputTokens,
      cachedTokens,
      costMicroCents,
      cacheHit: false,
    });

    return {
      result: validated,
      cacheHit: false,
      usage: {
        inputTokens,
        outputTokens,
        cachedInputTokens: cachedTokens,
      },
    };
  },
);

async function callWithBackoff<T>(fn: () => Promise<T>, maxRetries = 4): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!is429(err) || attempt === maxRetries) throw err;
      const base = Math.min(60_000, 1_000 * Math.pow(2, attempt));
      const jitter = base * (0.5 + Math.random());
      await sleep(jitter);
    }
  }
  throw lastErr;
}

function is429(err: unknown): boolean {
  const msg = (err as { message?: string })?.message ?? "";
  const status = (err as { status?: number })?.status;
  return status === 429 || /429|RESOURCE_EXHAUSTED|rate/i.test(msg);
}

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

function serialize(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}`;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}
