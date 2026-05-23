import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { COLLECTIONS, getDb } from "../firebase";
import type {
  CdnNode,
  CdnNodeStatus,
  DeltaPatch,
  DistributionStatsDoc,
  GameManifest,
} from "../types";

export async function listCdnNodes(): Promise<CdnNode[]> {
  const snap = await getDocs(collection(getDb(), COLLECTIONS.cdnNodes));
  const out: CdnNode[] = [];
  snap.forEach((d) => out.push(d.data() as CdnNode));
  return out.sort((a, b) => a.region.localeCompare(b.region) || a.hostname.localeCompare(b.hostname));
}

export async function setCdnNodeStatus(nodeId: string, status: CdnNodeStatus): Promise<void> {
  const ref = doc(getDb(), COLLECTIONS.cdnNodes, nodeId);
  await setDoc(
    ref,
    { status, lastHeartbeatAt: new Date().toISOString() },
    { merge: true },
  );
}

export async function listDistributionStats(): Promise<DistributionStatsDoc[]> {
  const snap = await getDocs(collection(getDb(), COLLECTIONS.distributionStats));
  const out: DistributionStatsDoc[] = [];
  snap.forEach((d) => out.push(d.data() as DistributionStatsDoc));
  return out;
}

export async function getGameManifest(gameId: string, version: string): Promise<GameManifest | null> {
  const ref = doc(getDb(), COLLECTIONS.gameManifests, `${gameId}__${version}`);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as GameManifest) : null;
}

export async function listGameManifests(gameId: string): Promise<GameManifest[]> {
  const q = query(
    collection(getDb(), COLLECTIONS.gameManifests),
    where("gameId", "==", gameId),
  );
  const snap = await getDocs(q);
  const out: GameManifest[] = [];
  snap.forEach((d) => out.push(d.data() as GameManifest));
  return out.sort((a, b) => b.releasedAt.localeCompare(a.releasedAt));
}

export async function listDeltaPatches(gameId?: string): Promise<DeltaPatch[]> {
  const colRef = collection(getDb(), COLLECTIONS.deltaPatches);
  const snap = gameId
    ? await getDocs(query(colRef, where("gameId", "==", gameId), orderBy("releasedAt", "desc")))
    : await getDocs(colRef);
  const out: DeltaPatch[] = [];
  snap.forEach((d) => out.push(d.data() as DeltaPatch));
  return gameId ? out : out.sort((a, b) => b.releasedAt.localeCompare(a.releasedAt));
}
