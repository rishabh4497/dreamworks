import type {
  Entitlement,
  EntitlementKind,
  Game,
  GameId,
  LauncherSource,
  Order,
  RefundWindow,
} from "../types";
import { wait } from "./_delay";

const STORAGE_KEY = "dreamworks-entitlements";

function readStored(): Entitlement[] {
  if (typeof localStorage === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Entitlement[]) : [];
  } catch {
    return [];
  }
}

function writeStored(entitlements: Entitlement[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entitlements));
}

function entitlementId(parts: {
  userId: string;
  gameId: GameId;
  sourceLauncher: LauncherSource;
  orderId?: string;
  externalId?: string;
}) {
  return [
    "ent",
    parts.userId,
    parts.sourceLauncher,
    parts.gameId,
    parts.orderId ?? parts.externalId ?? "local",
  ].join(":");
}

export async function getEntitlements(userId: string): Promise<Entitlement[]> {
  await wait();
  return readStored().filter((e) => e.userId === userId);
}

export async function upsertEntitlements(next: Entitlement[]): Promise<Entitlement[]> {
  await wait();
  const existing = readStored();
  const byId = new Map(existing.map((e) => [e.id, e] as const));
  for (const entitlement of next) byId.set(entitlement.id, entitlement);
  const saved = [...byId.values()];
  writeStored(saved);
  return next;
}

export async function createEntitlementsForOrder(input: {
  order: Order;
  games: Game[];
  userId: string;
  kind?: EntitlementKind;
  refundWindows?: Map<GameId, RefundWindow | null>;
}): Promise<Entitlement[]> {
  const entitlements = input.games.map((game) => {
    const kind: EntitlementKind =
      input.kind ?? (game.includedInSubscription ? "subscription" : "purchase");
    return {
      id: entitlementId({
        userId: input.userId,
        gameId: game.id,
        sourceLauncher: "dreamworks",
        orderId: input.order.id,
      }),
      userId: input.userId,
      gameId: game.id,
      kind,
      status: "active",
      sourceLauncher: "dreamworks",
      grantedAt: input.order.placedAt,
      expiresAt: kind === "subscription" ? null : null,
      orderId: input.order.id,
      canInstall: true,
      canLaunch: true,
      canLaunchOffline: kind === "purchase",
      refundWindow: input.refundWindows?.get(game.id) ?? null,
    } satisfies Entitlement;
  });
  return upsertEntitlements(entitlements);
}

export async function createExternalEntitlement(input: {
  userId: string;
  gameId: GameId;
  sourceLauncher: LauncherSource;
  externalId?: string;
  canLaunchOffline?: boolean;
}): Promise<Entitlement> {
  const entitlement: Entitlement = {
    id: entitlementId(input),
    userId: input.userId,
    gameId: input.gameId,
    kind: input.sourceLauncher === "manual" ? "manual" : "external",
    status: "active",
    sourceLauncher: input.sourceLauncher,
    grantedAt: new Date().toISOString(),
    expiresAt: null,
    externalId: input.externalId,
    canInstall: false,
    canLaunch: true,
    canLaunchOffline: input.canLaunchOffline ?? false,
    refundWindow: null,
  };
  await upsertEntitlements([entitlement]);
  return entitlement;
}

export async function resolveGameAccess(input: {
  userId: string;
  gameId: GameId;
}): Promise<Entitlement | null> {
  await wait();
  return (
    readStored().find(
      (e) =>
        e.userId === input.userId &&
        e.gameId === input.gameId &&
        e.status === "active" &&
        (e.expiresAt === null || new Date(e.expiresAt).getTime() > Date.now()),
    ) ?? null
  );
}
