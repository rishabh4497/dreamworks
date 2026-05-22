import { motion } from "motion/react";
import { Activity } from "lucide-react";

export function PlaytimeHeatmap() {
  // Generate random heatmap data
  const days = Array.from({ length: 180 }).map((_, i) => ({
    date: new Date(Date.now() - (180 - i) * 24 * 60 * 60 * 1000),
    hours: Math.random() > 0.3 ? Math.floor(Math.random() * 8) : 0,
  }));

  const getColor = (hours: number) => {
    if (hours === 0) return "bg-card border border-separator/30";
    if (hours < 2) return "bg-acid/20 border border-acid/10";
    if (hours < 5) return "bg-acid/50 border border-acid/20";
    return "bg-acid shadow-[0_0_8px_rgba(var(--color-acid-rgb),0.5)]";
  };

  return (
    <div className="rounded-2xl border border-separator bg-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[16px] font-bold text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-acid" /> Playtime History
          </h2>
          <p className="text-[12px] text-muted/70 mt-1">428 hours in the last 6 months</p>
        </div>
      </div>
      
      <div className="flex gap-1 overflow-x-auto pb-2 custom-scrollbar">
        {Array.from({ length: Math.ceil(days.length / 7) }).map((_, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-1">
            {days.slice(colIndex * 7, (colIndex + 1) * 7).map((day, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: colIndex * 0.01 }}
                className={`h-3 w-3 rounded-[2px] ${getColor(day.hours)}`}
                title={`${day.hours} hours on ${day.date.toLocaleDateString()}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-muted font-medium">
        <span>Less</span>
        <div className="h-2 w-2 rounded-[2px] bg-card border border-separator/30" />
        <div className="h-2 w-2 rounded-[2px] bg-acid/20" />
        <div className="h-2 w-2 rounded-[2px] bg-acid/50" />
        <div className="h-2 w-2 rounded-[2px] bg-acid" />
        <span>More</span>
      </div>
    </div>
  );
}
