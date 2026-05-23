import type { FollowSuggestion } from "../types";
import { COLLECTIONS, getDb } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

export async function listFollowSuggestions(): Promise<FollowSuggestion[]> {
  const snap = await getDocs(collection(getDb(), COLLECTIONS.followSuggestions));
  const out: FollowSuggestion[] = [];
  snap.forEach((d) => out.push(d.data() as FollowSuggestion));
  return out;
}
