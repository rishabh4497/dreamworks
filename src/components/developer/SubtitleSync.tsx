import { Languages, FileAudio } from "lucide-react";
export function SubtitleSync() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2"><Languages className="h-5 w-5 text-cyan" /> Automated Subtitle Sync</h3>
      <p className="text-[13px] text-muted/80 mt-1 mb-4">Upload raw voiceover .wav files, and automatically generate accurately timed .srt subtitle files.</p>
      <div className="border-2 border-dashed border-separator rounded-xl p-6 text-center hover:border-cyan/50 hover:bg-cyan/5 transition-colors cursor-pointer group">
        <FileAudio className="h-8 w-8 mx-auto mb-2 text-muted group-hover:text-cyan" />
        <p className="text-[12px] font-bold text-foreground">Drop Voiceover Files Here</p>
        <p className="text-[10px] text-muted">Supports .wav, .mp3, .ogg</p>
      </div>
    </div>
  );
}
