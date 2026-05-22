import { Users, Search, PlusCircle } from "lucide-react";

export function LFGBoard() {
  const posts = [
    { id: 1, user: "TankMaster", game: "Fantasy Quest", text: "Need a healer for the Fire Temple raid. Mics required.", time: "2m ago", players: "3/4" },
    { id: 2, user: "SniperPro", game: "Cyber Strike", text: "Looking for casual competitive. Gold rank minimum.", time: "5m ago", players: "2/5" },
    { id: 3, user: "CoopFan", game: "Overcooked 2", text: "Just looking to chill and cook some burgers!", time: "12m ago", players: "1/4" },
  ];

  return (
    <div className="rounded-xl border border-separator bg-card overflow-hidden mt-8">
      <div className="p-4 border-b border-separator flex items-center justify-between bg-card-active">
        <h2 className="text-[16px] font-bold flex items-center gap-2"><Users className="h-5 w-5 text-yellow" /> Looking for Group (LFG)</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
            <input type="text" placeholder="Search games..." className="pl-8 pr-3 py-1.5 rounded-lg bg-input border border-separator text-[12px] text-foreground focus:outline-none focus:border-acid/50 w-48" />
          </div>
          <button className="flex items-center gap-1.5 bg-acid text-background px-3 py-1.5 rounded-lg text-[12px] font-bold hover:brightness-110">
            <PlusCircle className="h-3.5 w-3.5" /> Create Post
          </button>
        </div>
      </div>
      
      <div className="divide-y divide-separator/50">
        {posts.map(post => (
          <div key={post.id} className="p-4 hover:bg-card-hover transition-colors flex items-center justify-between group">
            <div className="flex gap-4 items-start">
              <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${post.user}`} alt={post.user} className="h-10 w-10 rounded-lg bg-input border border-separator" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[13px] font-bold text-foreground">{post.user}</span>
                  <span className="text-[10px] bg-card border border-separator px-1.5 py-0.5 rounded text-muted uppercase tracking-wider">{post.game}</span>
                  <span className="text-[10px] text-muted/60">{post.time}</span>
                </div>
                <p className="text-[12px] text-muted/90">{post.text}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-[11px] font-bold text-cyan bg-cyan/10 px-2 py-1 rounded-md">{post.players} full</span>
              <button className="text-[11px] font-bold text-foreground bg-input border border-separator px-4 py-1.5 rounded-md hover:bg-card-active opacity-0 group-hover:opacity-100 transition-opacity">
                Join Party
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
