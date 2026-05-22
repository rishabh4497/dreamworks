import { Palette, Check } from "lucide-react";

export function DynamicProfileTheme() {
  const themes = [
    { name: "Default Dark", color: "#222222", active: false },
    { name: "Cyber Neon", color: "#00eeff", active: true },
    { name: "Fantasy Gold", color: "#ffaa00", active: false },
    { name: "Auto-Sync with Game", color: "linear-gradient(45deg, #ff0055, #00eeff)", active: false },
  ];

  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2 mb-4">
        <Palette className="h-5 w-5 text-pink-400" /> Dynamic Profile Themes
      </h3>
      <p className="text-[13px] text-muted/80 mb-4">Change the layout and color palette of your public profile.</p>

      <div className="grid sm:grid-cols-2 gap-3">
        {themes.map((theme, i) => (
          <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${theme.active ? 'border-pink-400 bg-pink-400/5' : 'border-separator bg-input hover:border-separator/80'}`}>
            <div className="h-6 w-6 rounded-full shadow-sm flex items-center justify-center" style={{ background: theme.color }}>
              {theme.active && <Check className="h-3.5 w-3.5 text-white drop-shadow-md" />}
            </div>
            <span className={`text-[12px] font-bold ${theme.active ? 'text-foreground' : 'text-muted'}`}>{theme.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
