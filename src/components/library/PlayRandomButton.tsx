import { Dices } from "lucide-react";

export function PlayRandomButton() {
  return (
    <button className="flex flex-col items-center justify-center gap-2 h-full w-full min-h-[120px] rounded-xl border border-dashed border-separator bg-card-active/50 hover:bg-card-hover hover:border-acid/50 hover:text-acid transition-all group cursor-pointer">
      <Dices className="h-8 w-8 text-muted group-hover:text-acid transition-colors" />
      <div className="text-center">
        <p className="text-[13px] font-bold text-foreground group-hover:text-acid transition-colors">Play Random</p>
        <p className="text-[10px] text-muted/80 mt-0.5 max-w-[120px]">Algorithmically select an unplayed game</p>
      </div>
    </button>
  );
}
