import type { FollowSuggestion } from "../types";
import { FOLLOW_SUGGESTIONS } from "../mock/follow-suggestions";
import { COLLECTIONS, getDb } from "../firebase";
import {
  collection,
  doc,
  getDocs,
  writeBatch,
} from "firebase/firestore";

let seedingPromise: Promise<void> | null = null;

function handleToDocId(handle: string): string {
  return handle.replace(/^@/, "");
}

async function ensureFollowSuggestionsSeeded(): Promise<void> {
  if (seedingPromise) return seedingPromise;
  seedingPromise = (async () => {
    const snap = await getDocs(collection(getDb(), COLLECTIONS.followSuggestions));
    if (!snap.empty) return;
    const batch = writeBatch(getDb());
    for (const suggestion of FOLLOW_SUGGESTIONS) {
      batch.set(
        doc(getDb(), COLLECTIONS.followSuggestions, handleToDocId(suggestion.handle)),
        suggestion,
      );
    }
    await batch.commit();
  })();
  return seedingPromise;
}

export async function listFollowSuggestions(): Promise<FollowSuggestion[]> {
  await ensureFollowSuggestionsSeeded();
  const snap = await getDocs(collection(getDb(), COLLECTIONS.followSuggestions));
  const out: FollowSuggestion[] = [];
  snap.forEach((d) => out.push(d.data() as FollowSuggestion));
  return out;
}
