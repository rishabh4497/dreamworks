// Lightweight client-side feature-flag / A/B variant resolver. Pulls active
// experiments from `dw_console_experiments` once per session, picks a stable
// variant per uid+flag via a deterministic hash, and emits an exposure event
// so the dashboard can compute conversion lift.

import { collection, getDocs, query, where } from "firebase/firestore";
import { COLLECTIONS, getDb } from "@/lib/firebase";
import { track } from "@/lib/telemetry";
import type { Experiment, ExperimentVariant } from "@/lib/types";

const ASSIGNMENTS = new Map<string, string>(); // flagKey -> variantId
const EXPOSED = new Set<string>(); // `${flagKey}:${variantId}` so we only emit one exposure/session
let experimentsLoaded = false;
let experimentsCache: Experiment[] = [];

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0; // unsigned
}

function pickVariant(
  exp: Experiment,
  bucketSeed: string,
): ExperimentVariant | null {
  if (exp.variants.length === 0) return null;
  const total = exp.variants.reduce((sum, v) => sum + v.allocationPct, 0);
  if (total <= 0) return exp.variants[0];
  const bucket = djb2(`${exp.flagKey}:${bucketSeed}`) % 100;
  let cursor = 0;
  for (const v of exp.variants) {
    cursor += (v.allocationPct / total) * 100;
    if (bucket < cursor) return v;
  }
  return exp.variants[exp.variants.length - 1];
}

export async function loadExperiments(): Promise<void> {
  if (experimentsLoaded) return;
  experimentsLoaded = true;
  try {
    const db = getDb();
    const snap = await getDocs(
      query(
        collection(db, COLLECTIONS.consoleExperiments),
        where("status", "==", "running"),
      ),
    );
    experimentsCache = snap.docs.map(
      (d) => ({ id: d.id, ...(d.data() as Omit<Experiment, "id">) }) as Experiment,
    );
  } catch {
    /* fail-soft — flags default to control */
  }
}

/** Returns the assigned variant id for the given flag, or null if no active experiment. */
export function resolveFlag(flagKey: string, uid: string | null): string | null {
  const cached = ASSIGNMENTS.get(flagKey);
  if (cached) return cached;
  const exp = experimentsCache.find((e) => e.flagKey === flagKey);
  if (!exp) return null;
  const seed = uid || `anon:${Math.random().toString(36).slice(2, 8)}`;
  const variant = pickVariant(exp, seed);
  if (!variant) return null;
  ASSIGNMENTS.set(flagKey, variant.id);
  // Emit one exposure event per (flag, variant) per session.
  const key = `${flagKey}:${variant.id}`;
  if (!EXPOSED.has(key)) {
    EXPOSED.add(key);
    track("feature_flag_exposure", {
      flagKey,
      variantId: variant.id,
      variantName: variant.name,
      experimentId: exp.id,
    });
  }
  return variant.id;
}

export function getKnownExperiments(): Experiment[] {
  return experimentsCache;
}
