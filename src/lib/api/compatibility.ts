import type { GameId } from "../types";
import { getDb } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export type CompatibilityRating = "verified" | "playable" | "tweaks" | "unsupported" | "unknown";

export interface RuntimeOption {
  id: string;
  label: string;
  recommended?: boolean;
}

export interface CompatibilityRecord {
  gameId: GameId;
  linux: CompatibilityRating;
  handheld: CompatibilityRating;
  defaultRuntime: string;
  selectedRuntime: string;
  launchOptions: string;
  notes: string[];
  warnings: string[];
  runtimes: RuntimeOption[];
}

const PREF_KEY = "dreamworks-compatibility-prefs";
const COLLECTION = "dw_compatibility";

const DEFAULT_RUNTIMES: RuntimeOption[] = [
  { id: "native", label: "Native runtime" },
  { id: "proton-stable", label: "Proton Stable", recommended: true },
  { id: "proton-experimental", label: "Proton Experimental" },
  { id: "proton-ge", label: "GE-Proton" },
];

const SEEDED: Record<string, Omit<CompatibilityRecord, "selectedRuntime" | "launchOptions">> = {
  "elden-ring": {
    gameId: "elden-ring",
    linux: "verified",
    handheld: "verified",
    defaultRuntime: "proton-stable",
    notes: ["Runs well with Proton Stable.", "Gamepad prompts are detected automatically."],
    warnings: [],
    runtimes: DEFAULT_RUNTIMES,
  },
  "cyberpunk-2077": {
    gameId: "cyberpunk-2077",
    linux: "playable",
    handheld: "playable",
    defaultRuntime: "proton-experimental",
    notes: ["Ray tracing should stay disabled on handheld presets."],
    warnings: ["First launch may compile shaders for several minutes."],
    runtimes: DEFAULT_RUNTIMES,
  },
  "ac-shadows": {
    gameId: "ac-shadows",
    linux: "tweaks",
    handheld: "tweaks",
    defaultRuntime: "proton-experimental",
    notes: ["Recommended to use borderless display mode."],
    warnings: ["Third-party account runtime may be required."],
    runtimes: DEFAULT_RUNTIMES,
  },
};

interface StoredPreference {
  gameId: GameId;
  selectedRuntime?: string;
  launchOptions?: string;
}

function readPrefs(): StoredPreference[] {
  if (typeof localStorage === "undefined") return [];
  const raw = localStorage.getItem(PREF_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredPreference[]) : [];
  } catch {
    return [];
  }
}

function writePrefs(prefs: StoredPreference[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
}

function seedFor(gameId: GameId): Omit<CompatibilityRecord, "selectedRuntime" | "launchOptions"> {
  return (
    SEEDED[gameId] ?? {
      gameId,
      linux: "unknown",
      handheld: "unknown",
      defaultRuntime: "proton-stable",
      notes: ["No community compatibility sample has been recorded yet."],
      warnings: ["Check publisher anti-cheat and launcher requirements before installing on Linux."],
      runtimes: DEFAULT_RUNTIMES,
    }
  );
}

async function currentUserId(): Promise<string | null> {
  // Lazy import keeps this module free of a store dependency at evaluation time.
  const { useAuthStore } = await import("@/stores/auth-store");
  return useAuthStore.getState().profile?.uid ?? null;
}

function docKey(userId: string, gameId: GameId): string {
  return `${userId}_${gameId}`;
}

async function fetchRemotePref(gameId: GameId): Promise<StoredPreference | null> {
  const uid = await currentUserId();
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(getDb(), COLLECTION, docKey(uid, gameId)));
    if (!snap.exists()) return null;
    const data = snap.data() as StoredPreference & { userId: string };
    return {
      gameId: data.gameId,
      selectedRuntime: data.selectedRuntime,
      launchOptions: data.launchOptions,
    };
  } catch {
    return null;
  }
}

async function writeRemotePref(pref: StoredPreference): Promise<void> {
  const uid = await currentUserId();
  if (!uid) return;
  try {
    await setDoc(doc(getDb(), COLLECTION, docKey(uid, pref.gameId)), {
      ...pref,
      userId: uid,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    // Best-effort — local cache stays authoritative.
  }
}

export async function getCompatibility(gameId: GameId): Promise<CompatibilityRecord> {
  const seed = seedFor(gameId);
  const localPref = readPrefs().find((item) => item.gameId === gameId);
  const remotePref = await fetchRemotePref(gameId);
  // Prefer remote (cross-device) over local cache; fall back to seed defaults.
  const merged: StoredPreference = {
    gameId,
    selectedRuntime:
      remotePref?.selectedRuntime ?? localPref?.selectedRuntime ?? seed.defaultRuntime,
    launchOptions: remotePref?.launchOptions ?? localPref?.launchOptions ?? "",
  };
  if (remotePref) {
    // Keep local cache aligned.
    const others = readPrefs().filter((p) => p.gameId !== gameId);
    writePrefs([merged, ...others]);
  }
  return {
    ...seed,
    selectedRuntime: merged.selectedRuntime ?? seed.defaultRuntime,
    launchOptions: merged.launchOptions ?? "",
  };
}

export async function updateCompatibilityPreference(input: {
  gameId: GameId;
  selectedRuntime?: string;
  launchOptions?: string;
}): Promise<CompatibilityRecord> {
  const existing = readPrefs();
  const current = existing.find((item) => item.gameId === input.gameId) ?? {
    gameId: input.gameId,
  };
  const next: StoredPreference = {
    ...current,
    selectedRuntime: input.selectedRuntime ?? current.selectedRuntime,
    launchOptions: input.launchOptions ?? current.launchOptions,
  };
  writePrefs([next, ...existing.filter((item) => item.gameId !== input.gameId)]);
  void writeRemotePref(next);
  return getCompatibility(input.gameId);
}
