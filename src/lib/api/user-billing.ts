import { doc, getDoc, setDoc } from "firebase/firestore";
import { COLLECTIONS, getDb } from "../firebase";
import type { PaymentMethod, UserBillingDoc, UserSubscription } from "../types";

function now(): string {
  return new Date().toISOString();
}

export function emptyBilling(userId: string): UserBillingDoc {
  return {
    userId,
    paymentMethods: [],
    subscription: {
      tier: "free",
      paused: false,
      pausedUntil: null,
      nextBillingAt: null,
    },
    updatedAt: now(),
  };
}

export async function getUserBilling(userId: string): Promise<UserBillingDoc> {
  const snap = await getDoc(doc(getDb(), COLLECTIONS.userBilling, userId));
  if (!snap.exists()) return emptyBilling(userId);
  return snap.data() as UserBillingDoc;
}

async function writeBilling(next: UserBillingDoc): Promise<void> {
  await setDoc(doc(getDb(), COLLECTIONS.userBilling, next.userId), {
    ...next,
    updatedAt: now(),
  });
}

type PaymentMethodInput = Omit<PaymentMethod, "id" | "isDefault"> & {
  isDefault?: boolean;
};

export async function addPaymentMethod(
  userId: string,
  input: PaymentMethodInput,
): Promise<PaymentMethod> {
  const current = await getUserBilling(userId);
  const makeDefault = input.isDefault || current.paymentMethods.length === 0;
  const card: PaymentMethod = {
    ...input,
    id: `card-${Date.now()}`,
    isDefault: makeDefault,
  };
  const others = makeDefault
    ? current.paymentMethods.map((c) => ({ ...c, isDefault: false }))
    : current.paymentMethods;
  await writeBilling({
    ...current,
    paymentMethods: [...others, card],
  });
  return card;
}

export async function removePaymentMethod(
  userId: string,
  id: string,
): Promise<void> {
  const current = await getUserBilling(userId);
  const filtered = current.paymentMethods.filter((c) => c.id !== id);
  const hasDefault = filtered.some((c) => c.isDefault);
  const next =
    !hasDefault && filtered.length > 0
      ? filtered.map((c, i) => ({ ...c, isDefault: i === 0 }))
      : filtered;
  await writeBilling({ ...current, paymentMethods: next });
}

export async function setDefaultPaymentMethod(
  userId: string,
  id: string,
): Promise<void> {
  const current = await getUserBilling(userId);
  await writeBilling({
    ...current,
    paymentMethods: current.paymentMethods.map((c) => ({
      ...c,
      isDefault: c.id === id,
    })),
  });
}

export async function updateSubscription(
  userId: string,
  patch: Partial<UserSubscription>,
): Promise<void> {
  const current = await getUserBilling(userId);
  await writeBilling({
    ...current,
    subscription: { ...current.subscription, ...patch },
  });
}

export async function pauseSubscription(
  userId: string,
  untilISO: string,
): Promise<void> {
  await updateSubscription(userId, { paused: true, pausedUntil: untilISO });
}

export async function resumeSubscription(userId: string): Promise<void> {
  await updateSubscription(userId, { paused: false, pausedUntil: null });
}
