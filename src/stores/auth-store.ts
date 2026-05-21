import { create } from "zustand";
import type { AuthStateResponse, UserProfile } from "@/lib/types";
import { DEFAULT_AVATAR_OPTIONS, type AvatarOptions } from "@/lib/avatar";

interface AuthStore {
  authState: AuthStateResponse;
  profile: UserProfile | null;
  startSignIn: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => void;
  updateAvatar: (options: AvatarOptions) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
}

const STORAGE_KEY = "dreamworks-auth";
const AVATAR_STORAGE_KEY = "dreamworks-avatar";

function readPersisted(): AuthStateResponse {
  if (typeof localStorage === "undefined") return { type: "Anonymous" };
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { type: "Anonymous" };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.type === "Authenticated") return parsed;
  } catch {
    /* ignore */
  }
  return { type: "Anonymous" };
}

function persist(state: AuthStateResponse) {
  if (typeof localStorage === "undefined") return;
  if (state.type === "Authenticated") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function readPersistedAvatar(): AvatarOptions | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(AVATAR_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.seed === "string" && typeof parsed.backgroundColor === "string") {
      return parsed as AvatarOptions;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function persistAvatar(options: AvatarOptions) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(options));
}

const SUBSCRIBED_STORAGE_KEY = "dreamworks-subscribed";

function readPersistedSubscribed(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(SUBSCRIBED_STORAGE_KEY) === "true";
}

function persistSubscribed(subscribed: boolean) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(SUBSCRIBED_STORAGE_KEY, subscribed ? "true" : "false");
}

const MOCK_USER = {
  uid: "rishav-001",
  email: "you@dreams.tech",
  displayName: "rishav",
};

function buildMockProfile(overrideAvatar?: AvatarOptions | null): UserProfile {
  return {
    uid: MOCK_USER.uid,
    email: MOCK_USER.email,
    displayName: MOCK_USER.displayName,
    avatarUrl: `https://picsum.photos/seed/${MOCK_USER.uid}/96/96`,
    avatarOptions: overrideAvatar ?? DEFAULT_AVATAR_OPTIONS,
    level: 24,
    bio: "Player of slow things, builder of short games.",
    country: "India",
    memberSince: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 4).toISOString(),
    showcaseGameIds: ["elden-ring", "witcher-3", "cyberpunk-2077"],
    isSubscribed: readPersistedSubscribed(),
  };
}

const persistedAuth = readPersisted();
const persistedAvatar = readPersistedAvatar();

export const useAuthStore = create<AuthStore>((set, get) => ({
  authState: persistedAuth,
  profile: persistedAuth.type === "Authenticated" ? buildMockProfile(persistedAvatar) : null,
  initialize: () => {
    /* future: subscribe to Firebase Auth here */
  },
  startSignIn: async () => {
    set({ authState: { type: "Authenticating" } });
    await new Promise((r) => setTimeout(r, 450));
    const next: AuthStateResponse = { type: "Authenticated", user: MOCK_USER };
    persist(next);
    set({ authState: next, profile: buildMockProfile(readPersistedAvatar()) });
  },
  signOut: async () => {
    persist({ type: "Anonymous" });
    set({ authState: { type: "Anonymous" }, profile: null });
  },
  updateAvatar: (options) => {
    persistAvatar(options);
    const current = get().profile;
    if (!current) return;
    set({ profile: { ...current, avatarOptions: options } });
  },
  updateProfile: (updates) => {
    const current = get().profile;
    if (!current) return;
    if (updates.isSubscribed !== undefined) {
      persistSubscribed(updates.isSubscribed);
    }
    set({ profile: { ...current, ...updates } });
  },
}));
