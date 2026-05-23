import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { App } from "@/lib/types";

interface AppPickerProps {
  apps: App[];
  value: string | null;
  onChange: (id: string) => void;
}

export function AppPicker({ apps, value, onChange }: AppPickerProps) {
  if (!apps.length) return null;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted/55">
        Viewing
      </span>
      <select
        value={value ?? apps[0].id}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 min-w-[14rem] rounded-xl border border-separator bg-input px-3 text-[13px] text-foreground focus:border-acid/30 focus:outline-none focus:ring-1 focus:ring-acid/15"
      >
        {apps.map((a) => (
          <option key={a.id} value={a.id}>
            {a.gameTitle}
          </option>
        ))}
      </select>
    </div>
  );
}

export function useSelectedAppId(apps: App[]): {
  selectedId: string | null;
  setSelectedId: (id: string) => void;
} {
  const [params, setParams] = useSearchParams();
  const fromUrl = params.get("app");
  const defaultId = apps[0]?.id ?? null;
  const isValid = (id: string | null) => !!id && apps.some((a) => a.id === id);
  const selectedId = isValid(fromUrl) ? fromUrl : defaultId;

  useEffect(() => {
    if (selectedId && fromUrl !== selectedId) {
      const next = new URLSearchParams(params);
      next.set("app", selectedId);
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return {
    selectedId,
    setSelectedId: (id: string) => {
      const next = new URLSearchParams(params);
      next.set("app", id);
      setParams(next, { replace: false });
    },
  };
}
