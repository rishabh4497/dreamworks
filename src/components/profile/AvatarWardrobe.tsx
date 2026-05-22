import { useState } from "react";
import { Shirt, Sparkles, Lock, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { id: 1, name: "Neon Visor", game: "Cyber Strike", rarity: "legendary", unlocked: true, type: "head" },
  { id: 2, name: "N7 Hoodie", game: "Space Explorer", rarity: "epic", unlocked: true, type: "body" },
  { id: 3, name: "Dragon Wings", game: "Fantasy Quest", rarity: "mythic", unlocked: false, type: "back" },
  { id: 4, name: "Pixel Glasses", game: "Retro Dash", rarity: "rare", unlocked: true, type: "head" },
];

export function AvatarWardrobe() {
  const [equipped, setEquipped] = useState<number[]>([2]);

  const toggleEquip = (id: number) => {
    setEquipped(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="rounded-2xl border border-separator bg-card p-6">
      <div className="flex items-center gap-2 mb-6">
        <Shirt className="h-5 w-5 text-purple-400" />
        <h2 className="text-[16px] font-bold text-foreground">Cross-Game Wardrobe</h2>
      </div>

      <div className="grid md:grid-cols-[200px_1fr] gap-6">
        <div className="relative h-48 rounded-xl bg-gradient-to-b from-card-active to-background border border-separator/50 flex items-center justify-center overflow-hidden">
          {/* Mock Avatar */}
          <motion.div 
            animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-32 bg-foreground/10 rounded-full blur-md absolute bottom-4" 
          />
          <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Felix" alt="Avatar" className="h-32 w-32 relative z-10" />
          {equipped.length > 0 && (
            <div className="absolute top-4 right-4 bg-acid/20 text-acid px-2 py-1 rounded-md text-[10px] font-bold border border-acid/20 backdrop-blur-md">
              <Sparkles className="h-3 w-3 inline mr-1" /> Customized
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {ITEMS.map(item => (
            <div key={item.id} className={cn("relative p-3 rounded-xl border transition-all cursor-pointer", equipped.includes(item.id) ? "bg-card-active border-acid shadow-[0_0_15px_rgba(var(--color-acid-rgb),0.1)]" : "bg-input border-separator hover:border-muted/50")}>
              {!item.unlocked && <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-10 rounded-xl flex items-center justify-center"><Lock className="h-6 w-6 text-muted" /></div>}
              
              <div onClick={() => item.unlocked && toggleEquip(item.id)}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] uppercase font-bold text-muted/60 tracking-wider">{item.type}</span>
                  {equipped.includes(item.id) && <CheckCircle2 className="h-4 w-4 text-acid" />}
                </div>
                <p className="text-[13px] font-bold text-foreground">{item.name}</p>
                <p className="text-[11px] text-muted mt-0.5 font-medium">{item.game}</p>
                
                <div className="mt-3 inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider" style={{
                  backgroundColor: item.rarity === 'legendary' ? 'rgba(234, 179, 8, 0.2)' : item.rarity === 'mythic' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                  color: item.rarity === 'legendary' ? '#facc15' : item.rarity === 'mythic' ? '#d8b4fe' : '#7dd3fc'
                }}>
                  {item.rarity}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
