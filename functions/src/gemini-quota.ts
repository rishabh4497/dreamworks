import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

const QUOTAS_COLLECTION = "dw_ai_quotas";

const HOURLY_LIMIT = 60;
const DAILY_LIMIT = 500;

interface QuotaDoc {
  hourlyCount: number;
  hourlyResetAt: Timestamp;
  dailyCount: number;
  dailyResetAt: Timestamp;
}

/**
 * Atomically charges one call against the user's quota. Throws an HttpsError
 * with code `resource-exhausted` when over budget. Run this inside a
 * transaction so concurrent calls can't race past the limit.
 */
export async function chargeQuota(uid: string): Promise<void> {
  const ref = getFirestore().collection(QUOTAS_COLLECTION).doc(uid);
  const now = Timestamp.now();

  await getFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = (snap.data() as QuotaDoc | undefined) ?? null;

    const next = rollOver(data, now);

    if (next.hourlyCount >= HOURLY_LIMIT) {
      const retryAfterSec = next.hourlyResetAt.seconds - now.seconds;
      throw new HttpsError(
        "resource-exhausted",
        `Hourly AI quota exceeded (${HOURLY_LIMIT}/hr). Try again in ${retryAfterSec}s.`,
        { retryDelay: retryAfterSec },
      );
    }
    if (next.dailyCount >= DAILY_LIMIT) {
      const retryAfterSec = next.dailyResetAt.seconds - now.seconds;
      throw new HttpsError(
        "resource-exhausted",
        `Daily AI quota exceeded (${DAILY_LIMIT}/day). Try again in ${retryAfterSec}s.`,
        { retryDelay: retryAfterSec },
      );
    }

    tx.set(ref, {
      hourlyCount: next.hourlyCount + 1,
      hourlyResetAt: next.hourlyResetAt,
      dailyCount: next.dailyCount + 1,
      dailyResetAt: next.dailyResetAt,
    });
  });
}

function rollOver(data: QuotaDoc | null, now: Timestamp): QuotaDoc {
  const oneHour = 60 * 60;
  const oneDay = 24 * 60 * 60;

  if (!data) {
    return {
      hourlyCount: 0,
      hourlyResetAt: new Timestamp(now.seconds + oneHour, 0),
      dailyCount: 0,
      dailyResetAt: new Timestamp(now.seconds + oneDay, 0),
    };
  }

  const hourlyResetAt =
    data.hourlyResetAt.seconds <= now.seconds
      ? new Timestamp(now.seconds + oneHour, 0)
      : data.hourlyResetAt;
  const dailyResetAt =
    data.dailyResetAt.seconds <= now.seconds
      ? new Timestamp(now.seconds + oneDay, 0)
      : data.dailyResetAt;

  return {
    hourlyCount: data.hourlyResetAt.seconds <= now.seconds ? 0 : data.hourlyCount,
    hourlyResetAt,
    dailyCount: data.dailyResetAt.seconds <= now.seconds ? 0 : data.dailyCount,
    dailyResetAt,
  };
}
