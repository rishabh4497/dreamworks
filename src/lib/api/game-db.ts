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
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { COLLECTIONS, SUBCOLLECTIONS, getDb } from "../firebase";
import { getGameDetail } from "./games";

/**
 * SteamDB-style analytics endpoints.
 *
 * Several of these (price history, player counts, depots) require a telemetry
 * pipeline that does not exist yet. Those endpoints intentionally return empty
 * arrays — the UI handles the empty state and surfacing fake "data" would mask
 * the missing pipeline. A future Cloud Function should backfill these from
 * real signals (purchase log → price-history, play-session log → player-count,
 * `dw_apps/{id}/builds` → depots).
 *
 * The remaining endpoints (achievements, regional prices, store tags,
 * patch notes) are wired to live Firestore data already.
 */

export async function getPriceHistory(_id: GameId): Promise<PriceHistoryPoint[]> {
  // Pending price-tracking telemetry. Empty until that pipeline lands.
  return [];
}

export async function getHistoricalLows(id: GameId): Promise<HistoricalLows> {
  const detail = await getGameDetail(id);
  const current = detail?.price.final ?? 0;
  return {
    allTimeLow: current,
    lastYearLow: current,
    lastMonthLow: current,
    currentPrice: current,
  };
}

export async function getPlayerCounts(
  _id: GameId,
  _range: "7d" | "30d" | "all" = "30d",
): Promise<PlayerCountPoint[]> {
  // Pending play-session telemetry. Empty until that pipeline lands.
  return [];
}

export async function getDepots(id: GameId): Promise<Depot[]> {
  // Depots map 1:1 to platform builds in `dw_apps/{appId}/builds`. Until
  // each build doc carries platform/size metadata, return empty.
  const ref = collection(getDb(), COLLECTIONS.apps, id, SUBCOLLECTIONS.appBuilds);
  const snap = await getDocs(ref);
  const out: Depot[] = [];
  snap.forEach((d) => {
    const data = d.data() as Partial<Depot> & { id?: string };
    if (data.platform && data.sizeBytes != null && data.buildId) {
      out.push({
        id: data.id ?? d.id,
        name: data.name ?? `Depot ${d.id}`,
        platform: data.platform,
        sizeBytes: data.sizeBytes,
        lastUpdated: data.lastUpdated ?? "",
        buildId: data.buildId,
      });
    }
  });
  return out;
}

export async function getPatchNotes(id: GameId): Promise<PatchNote[]> {
  // Patch notes are announcements with category=patch on the app.
  const q = query(
    collection(getDb(), COLLECTIONS.announcements),
    where("appId", "==", id),
    where("category", "==", "patch"),
  );
  const snap = await getDocs(q);
  const out: PatchNote[] = [];
  snap.forEach((d) => {
    const data = d.data() as {
      title: string;
      body: string;
      publishedAt: string;
    };
    out.push({
      version: data.title,
      date: data.publishedAt,
      title: data.title,
      bullets: data.body.split("\n").filter((l) => l.trim().length > 0),
    });
  });
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getAchievements(id: GameId): Promise<Achievement[]> {
  const ref = collection(
    getDb(),
    COLLECTIONS.apps,
    id,
    SUBCOLLECTIONS.appAchievements,
  );
  const snap = await getDocs(ref);
  const out: Achievement[] = [];
  snap.forEach((d) => out.push(d.data() as Achievement));
  return out;
}

export async function getRegionalPrices(id: GameId): Promise<RegionalPrice[]> {
  const detail = await getGameDetail(id);
  return detail?.pricesByRegion ?? [];
}

export async function getStoreTagBreakdown(id: GameId): Promise<Tag[]> {
  const detail = await getGameDetail(id);
  return detail?.storeTags ?? [];
}
