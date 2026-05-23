import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  writeBatch,
} from "firebase/firestore";
import { COLLECTIONS, getDb } from "../firebase";
import { CONTROLLER_LAYOUT_SEEDS } from "../mock/controller-layouts";
import type { ControllerLayout, GameId } from "../types";

let seedingPromise: Promise<void> | null = null;

export async function ensureControllerLayoutsSeeded(): Promise<void> {
  if (seedingPromise) return seedingPromise;
  seedingPromise = (async () => {
    const colRef = collection(getDb(), COLLECTIONS.controllerLayouts);
    const snap = await getDocs(query(colRef, limit(1)));
    if (!snap.empty) return;

    const batch = writeBatch(getDb());
    for (const layout of CONTROLLER_LAYOUT_SEEDS) {
      batch.set(doc(getDb(), COLLECTIONS.controllerLayouts, layout.id), layout);
    }
    await batch.commit();
  })();
  return seedingPromise;
}

export async function listControllerLayouts(
  gameId?: GameId,
): Promise<ControllerLayout[]> {
  await ensureControllerLayoutsSeeded();
  const snap = await getDocs(
    collection(getDb(), COLLECTIONS.controllerLayouts),
  );
  const layouts: ControllerLayout[] = [];
  snap.forEach((d) => layouts.push(d.data() as ControllerLayout));
  const filtered = gameId
    ? layouts.filter((l) => l.gameId === gameId)
    : layouts.filter((l) => !l.gameId);
  return filtered.sort((a, b) => b.downloads - a.downloads);
}
