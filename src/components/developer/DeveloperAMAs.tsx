import { MessageCircle, Calendar } from "lucide-react";
export function DeveloperAMAs() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2"><MessageCircle className="h-5 w-5 text-green" /> In-Launcher Developer AMAs</h3>
      <p className="text-[13px] text-muted/80 mt-1 mb-4">Schedule a live Q&A session where developers can chat directly with players.</p>
      <button className="bg-green/10 text-green border border-green/30 w-full py-3 rounded-lg text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-green/20 transition-colors cursor-pointer">
        <Calendar className="h-4 w-4" /> Schedule New AMA Event
      </button>
    </div>
  );
}
