import { History, RotateCcw, AlertTriangle } from "lucide-react";

export function SaveRollback() {
  const saves = [
    { id: 1, date: "Today, 14:32", location: "Fire Temple Boss", playtime: "45h 12m", active: true },
    { id: 2, date: "Yesterday, 22:15", location: "Fire Temple Entrance", playtime: "44h 50m", active: false },
    { id: 3, date: "Oct 12, 18:00", location: "Village of Echoes", playtime: "40h 10m", active: false },
  ];

  return (
    <div className="rounded-xl border border-separator bg-card p-6 mt-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2 mb-2"><History className="h-5 w-5 text-purple-400" /> Cloud Save History</h3>
      <p className="text-[13px] text-muted/80 mb-6">Revert your cloud save to any point in the last 30 days.</p>
      
      <div className="space-y-3">
        {saves.map(save => (
          <div key={save.id} className={`flex items-center justify-between p-3 rounded-lg border ${save.active ? 'border-acid/50 bg-acid/5' : 'border-separator bg-input'}`}>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-foreground">{save.date}</span>
                {save.active && <span className="text-[10px] font-bold bg-acid text-background px-1.5 rounded">ACTIVE</span>}
              </div>
              <p className="text-[11px] text-muted mt-1">{save.location} • {save.playtime}</p>
            </div>
            
            {!save.active && (
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-separator rounded-md hover:bg-card-hover text-[11px] font-bold text-foreground transition-colors">
                <RotateCcw className="h-3.5 w-3.5 text-muted" /> Rollback
              </button>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-4 flex items-start gap-2 text-[11px] text-orange-500 bg-orange-500/10 p-3 rounded-lg border border-orange-500/20">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <p>Warning: Rolling back a save will permanently overwrite your current active save state across all devices.</p>
      </div>
    </div>
  );
}
