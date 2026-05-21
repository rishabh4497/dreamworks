import { create } from "zustand";

/**
 * Spotify-style page accent. Each route that has a meaningful identity
 * (game detail, developer/publisher storefront) sets an accent color on
 * mount; AppLayout renders a soft top-of-app wash from that color which
 * bleeds across sidebar + topbar + content. Routes without a strong
 * identity clear it and the app falls back to its default dark theme.
 */
interface AccentStore {
  /** Hex string like "#FCAF17". `null` means no accent (default theme). */
  accent: string | null;
  setAccent: (hex: string | null) => void;
}

export const useAccentStore = create<AccentStore>((set) => ({
  accent: null,
  setAccent: (hex) => set({ accent: hex }),
}));
