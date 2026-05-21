import type {
  Achievement,
  Depot,
  GameId,
  HistoricalLows,
  PatchNote,
  PlayerCountPoint,
  PriceHistoryPoint,
  RegionalPrice,
  Tag,
} from "../types";
import {
  buildAchievements,
  buildDepots,
  buildHistoricalLows,
  buildPatchNotes,
  buildPlayerCountHistory,
  buildPriceHistory,
  buildRegionalPrices,
} from "../mock";
import { buildGameDetail } from "../mock/game-detail";
import { wait } from "./_delay";

export async function getPriceHistory(id: GameId): Promise<PriceHistoryPoint[]> {
  await wait();
  return buildPriceHistory(id);
}

export async function getHistoricalLows(id: GameId): Promise<HistoricalLows> {
  await wait();
  return buildHistoricalLows(id);
}

export async function getPlayerCounts(
  id: GameId,
  range: "7d" | "30d" | "all" = "30d",
): Promise<PlayerCountPoint[]> {
  await wait();
  const all = buildPlayerCountHistory(id);
  if (range === "all") return all;
  const limit = range === "7d" ? 7 : 30;
  return all.slice(-limit);
}

export async function getDepots(id: GameId): Promise<Depot[]> {
  await wait();
  return buildDepots(id);
}

export async function getPatchNotes(id: GameId): Promise<PatchNote[]> {
  await wait();
  return buildPatchNotes(id);
}

export async function getAchievements(id: GameId): Promise<Achievement[]> {
  await wait();
  return buildAchievements(id);
}

export async function getRegionalPrices(id: GameId): Promise<RegionalPrice[]> {
  await wait();
  return buildRegionalPrices(id);
}

export async function getStoreTagBreakdown(id: GameId): Promise<Tag[]> {
  await wait();
  const detail = buildGameDetail(id);
  return detail?.storeTags ?? [];
}
