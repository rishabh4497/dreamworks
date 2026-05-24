import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { BookmarkPlus, Star, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useSavedViews, consoleKeys } from "@/hooks/use-console";
import { createSavedView, deleteSavedView } from "@/lib/api/telemetry-extra";

export function ConsoleSavedViews() {
  const { data } = useSavedViews();
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState("");

  const onSave = async () => {
    if (!name.trim()) return;
    await createSavedView(name.trim(), location.search.slice(1));
    setName("");
    qc.invalidateQueries({ queryKey: consoleKeys.savedViews() });
  };

  const onDelete = async (id: string) => {
    await deleteSavedView(id);
    qc.invalidateQueries({ queryKey: consoleKeys.savedViews() });
  };

  return (
    <Card className="p-4">
      <header className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted/55">
          <Star className="h-3 w-3" />
          Saved views
        </p>
      </header>
      <div className="mb-3 flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Save current filters as…"
          className="flex-1 rounded-md bg-input px-2.5 py-1.5 text-[12px] text-foreground placeholder:text-muted/50 outline-none focus:ring-1 focus:ring-acid/40"
        />
        <button
          type="button"
          onClick={onSave}
          className="inline-flex items-center gap-1 rounded-md bg-acid/15 px-2 py-1 text-[11px] font-medium text-acid hover:bg-acid/25"
        >
          <BookmarkPlus className="h-3 w-3" />
          Save
        </button>
      </div>
      {(!data || data.length === 0) ? (
        <p className="py-3 text-center text-[12px] text-muted/55">No saved views yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {data.map((v) => (
            <li
              key={v.id}
              className="flex items-center gap-2 rounded-md bg-card-active/40 px-2 py-1.5 text-[12px]"
            >
              <button
                type="button"
                onClick={() => navigate(`${location.pathname}?${v.query}`)}
                className="flex-1 min-w-0 truncate text-left text-foreground/85 hover:text-foreground"
              >
                {v.name}
              </button>
              <button
                type="button"
                onClick={() => onDelete(v.id)}
                className="text-muted/40 hover:text-red transition-colors"
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
