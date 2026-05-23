import { create } from "zustand";
import { syncWithFirestore } from "@/lib/firestore-sync";

export type ThemeMode = "dark" | "light" | "system";

interface ThemeStore {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

interface RemoteTheme {
  mode: ThemeMode;
}

function getInitialMode(): ThemeMode {
  if (typeof localStorage === "undefined") return "system";
  const stored = localStorage.getItem("dreamworks-theme");
  if (stored === "dark" || stored === "light" || stored === "system") return stored;
  return "system";
}

function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  let resolved: "dark" | "light" = mode === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
    : mode;
  root.setAttribute("data-theme", resolved);
}

let firestoreHandle: ReturnType<typeof syncWithFirestore<RemoteTheme>> | null = null;

export const useThemeStore = create<ThemeStore>((set, get) => {
  const initial = getInitialMode();
  applyTheme(initial);

  if (typeof window !== "undefined") {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        const current = localStorage.getItem("dreamworks-theme") as ThemeMode | null;
        if (!current || current === "system") applyTheme("system");
      });

    // Pull remote prefs once authenticated; localStorage covers pre-auth state.
    firestoreHandle = syncWithFirestore<RemoteTheme>({
      key: "theme",
      selectSlice: () => ({ mode: get().mode }),
      applyRemote: (remote) => {
        if (
          remote.mode === "dark" ||
          remote.mode === "light" ||
          remote.mode === "system"
        ) {
          localStorage.setItem("dreamworks-theme", remote.mode);
          applyTheme(remote.mode);
          set({ mode: remote.mode });
        }
      },
    });
  }

  return {
    mode: initial,
    setMode: (mode) => {
      localStorage.setItem("dreamworks-theme", mode);
      applyTheme(mode);
      set({ mode });
      firestoreHandle?.push({ mode });
    },
  };
});
