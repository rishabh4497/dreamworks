import { create } from "zustand";

export type ThemeMode = "dark" | "light" | "system";

interface ThemeStore {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
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

export const useThemeStore = create<ThemeStore>((set) => {
  const initial = getInitialMode();
  applyTheme(initial);

  if (typeof window !== "undefined") {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        const current = localStorage.getItem("dreamworks-theme") as ThemeMode | null;
        if (!current || current === "system") applyTheme("system");
      });
  }

  return {
    mode: initial,
    setMode: (mode) => {
      localStorage.setItem("dreamworks-theme", mode);
      applyTheme(mode);
      set({ mode });
    },
  };
});
