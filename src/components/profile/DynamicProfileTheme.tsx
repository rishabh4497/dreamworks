import { Palette, Check } from "lucide-react";
import { useProfileStore } from "@/stores/profile-store";
import { useAccentStore } from "@/stores/accent-store";
import { useEffect } from "react";

export function DynamicProfileTheme() {
  const { activeThemeId, setActiveThemeId } = useProfileStore();
  const setAccent = useAccentStore((s) => s.setAccent);

  const themes = [
    { id: "default", name: "Default Dark", color: "#222222", accent: null },
    { id: "cyber", name: "Cyber Neon", color: "#00eeff", accent: "#00eeff" },
    { id: "fantasy", name: "Fantasy Gold", color: "#ffaa00", accent: "#ffaa00" },
    { id: "sync", name: "Auto-Sync with Game", color: "linear-gradient(45deg, #ff0055, #00eeff)", accent: "#ff0055" },
  ];

  // Apply accent when theme changes
  useEffect(() => {
    const activeTheme = themes.find((t) => t.id === activeThemeId) || themes[0];
    setAccent(activeTheme.accent);
    return () => setAccent(null);
  }, [activeThemeId, setAccent]);

  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2 mb-4">
        <Palette className="h-5 w-5 text-pink-400" /> Dynamic Profile Themes
      </h3>
      <p className="text-[13px] text-muted/80 mb-4">Change the layout and color palette of your public profile.</p>

      <div className="grid sm:grid-cols-2 gap-3">
        {themes.map((theme) => {
          const active = theme.id === activeThemeId;
          return (
            <div
              key={theme.id}
              onClick={() => setActiveThemeId(theme.id)}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                active
                  ? "border-pink-400 bg-pink-400/5"
                  : "border-separator bg-input hover:border-separator/80"
              }`}
            >
              <div
                className="h-6 w-6 rounded-full shadow-sm flex items-center justify-center"
                style={{ background: theme.color }}
              >
                {active && <Check className="h-3.5 w-3.5 text-white drop-shadow-md" />}
              </div>
              <span
                className={`text-[12px] font-bold ${
                  active ? "text-foreground" : "text-muted"
                }`}
              >
                {theme.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
