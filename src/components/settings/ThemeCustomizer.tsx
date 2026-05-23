import { Paintbrush, Check, Sun, Moon } from "lucide-react";
import { useThemes } from "@/hooks/use-themes";
import { useProfileStore } from "@/stores/profile-store";
import { cn } from "@/lib/utils";
import type { ThemePreset } from "@/lib/types";

interface AccentPair {
  darkAccent: string;
  lightAccent: string;
}

const ACCENTS: Record<string, AccentPair> = {
  "theme-cyberpunk-neon": { darkAccent: "#ff3df0", lightAccent: "#c91fb8" },
  "theme-paper-white": { darkAccent: "#6ea8d8", lightAccent: "#2a6fa5" },
  "theme-retro-crt": { darkAccent: "#00ff66", lightAccent: "#008833" },
};

const DEFAULT_ACCENT: AccentPair = { darkAccent: "#01ffff", lightAccent: "#008b8b" };

function resolveAccents(theme: ThemePreset): AccentPair {
  if (theme.swatches?.accent) {
    return { darkAccent: theme.swatches.accent, lightAccent: theme.swatches.accent };
  }
  return ACCENTS[theme.id] ?? DEFAULT_ACCENT;
}

export function ThemeCustomizer() {
  const { data: themes = [], isLoading } = useThemes();
  const activeThemeId = useProfileStore((s) => s.activeThemeId);
  const setActiveThemeId = useProfileStore((s) => s.setActiveThemeId);

  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="mb-2 flex items-center gap-2 text-[16px] font-bold">
        <Paintbrush className="h-5 w-5 text-cyan" /> App Themes
      </h3>
      <p className="mb-6 text-[13px] text-muted/80">
        First-party palettes from Dreamworks. Each theme adapts to your light/dark mode preference and syncs across devices.
      </p>

      {isLoading ? (
        <div className="rounded-lg border border-separator bg-input p-4 text-[12px] text-muted">
          Loading themes…
        </div>
      ) : themes.length === 0 ? (
        <div className="rounded-lg border border-separator bg-input p-4 text-[12px] text-muted">
          No themes installed.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {themes.map((theme) => {
            const active = activeThemeId === theme.id;
            const { darkAccent, lightAccent } = resolveAccents(theme);
            return (
              <button
                type="button"
                key={theme.id}
                onClick={() => {
                  setActiveThemeId(active ? "" : theme.id);
                }}
                aria-pressed={active}
                className={cn(
                  "group relative flex h-full flex-col items-start gap-4 rounded-lg border bg-input p-4 text-left transition-colors",
                  active
                    ? "border-cyan/60 ring-1 ring-cyan/30"
                    : "border-separator hover:border-foreground/30",
                )}
              >
                {active && (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded bg-cyan/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan">
                    <Check className="h-3 w-3" /> Active
                  </span>
                )}
                <span className="block max-w-[calc(100%-72px)] truncate text-[14px] font-bold text-foreground">
                  {theme.name}
                </span>
                <div className="flex w-full gap-2">
                  <div className="flex flex-1 items-center gap-1.5 rounded-md border border-separator/60 bg-[#0a0a0a] px-2 py-1.5">
                    <Moon className="h-3 w-3 shrink-0 text-white/50" />
                    <span
                      className="h-4 flex-1 rounded"
                      style={{ background: darkAccent }}
                    />
                  </div>
                  <div className="flex flex-1 items-center gap-1.5 rounded-md border border-separator/60 bg-[#f5f5f7] px-2 py-1.5">
                    <Sun className="h-3 w-3 shrink-0 text-black/50" />
                    <span
                      className="h-4 flex-1 rounded"
                      style={{ background: lightAccent }}
                    />
                  </div>
                </div>
                <p className="mt-auto text-[11px] leading-snug text-muted">
                  {theme.description}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
