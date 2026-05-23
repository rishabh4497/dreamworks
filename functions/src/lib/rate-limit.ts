import { getFirestore } from "firebase-admin/firestore";

interface BucketDoc {
  tokens: number;
  lastRefillMs: number;
  capacity: number;
  refillPerSec: number;
}

export interface RateLimitOptions {
  key: string;
  capacity: number;
  refillPerSec: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

const COLLECTION = "dw_rate_limits";

export async function checkRateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const db = getFirestore();
  const ref = db.collection(COLLECTION).doc(opts.key);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = Date.now();
    let tokens = opts.capacity;
    if (snap.exists) {
      const data = snap.data() as BucketDoc;
      const elapsedSec = Math.max(0, (now - data.lastRefillMs) / 1000);
      tokens = Math.min(opts.capacity, (data.tokens ?? opts.capacity) + elapsedSec * opts.refillPerSec);
    }
    if (tokens < 1) {
      const retryAfterSeconds = Math.max(1, Math.ceil((1 - tokens) / opts.refillPerSec));
      return { allowed: false, retryAfterSeconds };
    }
    tokens -= 1;
    tx.set(ref, {
      tokens,
      lastRefillMs: now,
      capacity: opts.capacity,
      refillPerSec: opts.refillPerSec,
    });
    return { allowed: true, retryAfterSeconds: 0 };
  });
}
