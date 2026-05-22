import type {
  CartItem,
  Entitlement,
  Game,
  Order,
  OrderLineItem,
  PriceCents,
  UserProfile,
} from "../types";
import { getDb, COLLECTIONS } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { createEntitlementsForOrder, upsertEntitlements } from "./entitlements";

const TAX_RATE = 0.08;

export interface PlaceMockOrderInput {
  items: CartItem[];
  games: Game[];
  profile: UserProfile;
  country: string;
  includeSubscription?: boolean;
}

export interface PlaceMockOrderResult {
  order: Order;
  entitlementIds: string[];
}

function receiptNumber(orderId: string) {
  return `DW-RCPT-${orderId.slice(-8)}`;
}

function buildLineItems(input: PlaceMockOrderInput): OrderLineItem[] {
  const byId = new Map(input.games.map((g) => [g.id, g] as const));
  const lines: OrderLineItem[] = [];
  for (const item of input.items) {
    if (item.gameId === "plus-sub") continue;
    const game = byId.get(item.gameId);
    if (!game) continue;
    lines.push({
      id: `line:${item.gameId}`,
      gameId: game.id,
      name: game.name,
      quantity: 1,
      unitCents: game.price.base,
      finalCents: game.price.final,
      entitlementKind: item.asGift ? "gift" : "purchase",
      asGift: item.asGift,
      giftRecipient: item.asGift ? item.giftRecipient : undefined,
      scheduledDeliveryAt: item.asGift ? item.scheduledDeliveryAt : undefined,
      familyApproval: item.familyApproval,
    });
  }
  if (input.includeSubscription) {
    lines.push({
      id: "line:plus-sub",
      gameId: "plus-sub",
      name: "Dreamworks+ (1 Month)",
      quantity: 1,
      unitCents: 1499,
      finalCents: 1499,
      entitlementKind: "subscription",
      asGift: false,
      familyApproval: { required: false, status: "not_required" },
    });
  }
  return lines;
}

function buildOrderMetadata(lineItems: OrderLineItem[]): Order["metadata"] {
  const giftLines = lineItems.filter((line) => line.asGift);
  const familyLines = lineItems.filter((line) => line.familyApproval?.required);
  const pendingGiftCount = giftLines.filter((line) => {
    if (!line.scheduledDeliveryAt) return true;
    return new Date(line.scheduledDeliveryAt).getTime() > Date.now();
  }).length;
  const familyApprovalPendingCount = familyLines.filter(
    (line) => line.familyApproval?.status === "pending",
  ).length;
  const familyApprovalDeniedCount = familyLines.filter(
    (line) => line.familyApproval?.status === "denied",
  ).length;
  const notes: string[] = [];
  if (giftLines.length > 0) {
    notes.push("Gift line items are receipt-only for the buyer until claimed by recipients.");
  }
  if (familyApprovalPendingCount > 0) {
    notes.push("Pending family approval line items do not grant buyer library access yet.");
  }
  if (familyApprovalDeniedCount > 0) {
    notes.push("Denied family approval line items were recorded without buyer library access.");
  }
  return {
    giftCount: giftLines.length,
    pendingGiftCount,
    familyApprovalCount: familyLines.length,
    familyApprovalPendingCount,
    familyApprovalDeniedCount,
    notes,
  };
}

function grantsBuyerAccess(line: OrderLineItem): boolean {
  if (line.gameId === "plus-sub" || line.asGift) return false;
  const approvalStatus = line.familyApproval?.status;
  return approvalStatus !== "pending" && approvalStatus !== "denied";
}

export function calculateOrderTotals(lineItems: OrderLineItem[]): {
  subtotalCents: PriceCents;
  taxCents: PriceCents;
  totalCents: PriceCents;
} {
  const subtotalCents = lineItems.reduce((sum, line) => sum + line.finalCents, 0);
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  return { subtotalCents, taxCents, totalCents: subtotalCents + taxCents };
}

export async function listOrders(userId: string): Promise<Order[]> {
  const q = query(
    collection(getDb(), COLLECTIONS.orders),
    where("userId", "==", userId)
  );
  const snap = await getDocs(q);
  const orders: Order[] = [];
  snap.forEach((d) => {
    orders.push(d.data() as Order);
  });
  // Sort orders by placedAt descending
  return orders.sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const docRef = doc(getDb(), COLLECTIONS.orders, orderId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data() as Order;
}

export async function placeMockOrder(input: PlaceMockOrderInput): Promise<PlaceMockOrderResult> {
  const lineItems = buildLineItems(input);
  const totals = calculateOrderTotals(lineItems);
  const now = new Date().toISOString();
  const orderId = `DW-${Date.now().toString().slice(-8)}`;
  const gameIds = lineItems.map((line) => line.gameId);
  const order: Order = {
    id: orderId,
    placedAt: now,
    gameIds,
    subtotalCents: totals.subtotalCents,
    taxCents: totals.taxCents,
    totalCents: totals.totalCents,
    refunded: false,
    status: "paid",
    currency: "USD",
    userId: input.profile.uid,
    country: input.country,
    paymentProvider: "mock",
    receiptNumber: receiptNumber(orderId),
    lineItems,
    metadata: buildOrderMetadata(lineItems),
  };

  const docRef = doc(getDb(), COLLECTIONS.orders, orderId);
  await setDoc(docRef, order);

  const purchasedGames = input.games.filter((game) =>
    lineItems.some((line) => line.gameId === game.id && grantsBuyerAccess(line)),
  );
  const entitlements = await createEntitlementsForOrder({
    order,
    games: purchasedGames,
    userId: input.profile.uid,
  });
  const subscriptionEntitlements: Entitlement[] = input.includeSubscription
    ? [
        {
          id: `ent:${input.profile.uid}:dreamworks:plus-sub:${order.id}`,
          userId: input.profile.uid,
          gameId: "plus-sub",
          kind: "subscription",
          status: "active",
          sourceLauncher: "dreamworks",
          grantedAt: order.placedAt,
          expiresAt: null,
          orderId: order.id,
          canInstall: false,
          canLaunch: true,
          canLaunchOffline: false,
          refundWindow: null,
        },
      ]
    : [];
  if (subscriptionEntitlements.length > 0) {
    await upsertEntitlements(subscriptionEntitlements);
  }

  return {
    order,
    entitlementIds: [
      ...entitlements.map((e) => e.id),
      ...subscriptionEntitlements.map((e) => e.id),
    ],
  };
}
