import { collection, getDocs } from "firebase/firestore";
import { COLLECTIONS, getDb } from "../firebase";
import type { ControllerLayout, GameId } from "../types";

export async function listControllerLayouts(
  gameId?: GameId,
): Promise<ControllerLayout[]> {
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
