import { Star, Verified } from "lucide-react";

export function CuratorShelves() {
  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[18px] font-bold text-foreground flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow fill-yellow" /> Followed Curators
        </h2>
        <button className="text-[12px] font-bold text-cyan hover:text-cyan/80 transition-colors">Find more curators</button>
      </div>

      <div className="rounded-xl border border-separator bg-card p-4">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-separator/50">
          <img loading="lazy" decoding="async" loading="lazy" decoding="async" src="https://api.dicebear.com/7.x/bottts/svg?seed=Reviewer" alt="Curator" className="h-12 w-12 rounded-full border-2 border-cyan/50 bg-input" />
          <div>
            <h3 className="text-[14px] font-bold text-foreground flex items-center gap-1">IGN Verified <Verified className="h-4 w-4 text-cyan" /></h3>
            <p className="text-[11px] text-muted">"Our top picks for the week across all genres."</p>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 shelf-scroll">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="min-w-[160px] bg-input border border-separator rounded-lg overflow-hidden group cursor-pointer">
              <div className="h-24 bg-card-active" />
              <div className="p-3">
                <p className="text-[12px] font-bold text-foreground group-hover:text-cyan transition-colors">Game Title {i}</p>
                <div className="mt-2 text-[10px] text-muted line-clamp-2">"A masterpiece of storytelling and combat mechanics."</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
