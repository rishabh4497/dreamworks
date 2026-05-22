import { Gift, Wand2 } from "lucide-react";

export function GiftCardCreator() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6 mt-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 blur-[80px] rounded-full pointer-events-none" />
      
      <div className="flex flex-col md:flex-row gap-8 relative z-10">
        <div className="flex-1">
          <h3 className="text-[20px] font-bold text-foreground mb-2 flex items-center gap-2">
            <Gift className="h-6 w-6 text-pink-400" /> Digital Gift Card Creator
          </h3>
          <p className="text-[13px] text-muted/80 leading-relaxed mb-6">
            Design a custom digital gift card with personalized messages, stickers, and game art to send to friends alongside store credit.
          </p>
          <button className="bg-pink-500 text-white px-6 py-3 rounded-lg text-[13px] font-bold hover:bg-pink-600 transition-colors shadow-lg shadow-pink-500/20 flex items-center gap-2">
            <Wand2 className="h-4 w-4" /> Start Designing
          </button>
        </div>
        
        <div className="w-full max-w-[300px] h-40 rounded-xl bg-gradient-to-br from-pink-500 to-orange-400 p-1 shadow-xl transform rotate-2 hover:rotate-0 transition-transform cursor-pointer">
          <div className="w-full h-full bg-card rounded-lg p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-[100px] opacity-10">🎁</div>
            <div>
              <p className="text-[10px] uppercase font-bold text-pink-500 tracking-widest">Dreamworks Gift</p>
              <p className="text-[24px] font-black text-foreground mt-1">$50.00</p>
            </div>
            <div>
              <p className="text-[12px] font-medium text-foreground">To: Alex</p>
              <p className="text-[10px] text-muted">Happy Birthday! Buy Cyber Strike so we can play.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
