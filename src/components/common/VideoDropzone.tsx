import { useRef, useState } from "react";
import { AlertTriangle, Loader2, Upload, X } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { uploadAsset } from "@/lib/platform";
import { toast } from "@/stores/toast-store";

interface VideoDropzoneProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /**
   * Firebase Storage path (without leading slash). When provided, the file is
   * uploaded there and the returned download URL is stored. Required for video
   * uploads — there's no data-URL fallback because videos are too large to
   * inline into Firestore. If omitted, the dropzone is disabled.
   *
   * Use the `dw_` prefix convention, e.g.
   *   `dw_developers/{slug}/promo.mp4`
   *   `dw_apps/{appId}/trailers/{uuid}.mp4`
   */
  storagePath?: string;
  /** Soft warning threshold; user sees a toast if file exceeds this. */
  maxBytesSoft?: number;
  /** Hard reject threshold; uploads above this fail before hitting the network. */
  maxBytesHard?: number;
  className?: string;
}

const DEFAULT_SOFT_LIMIT = 50 * 1024 * 1024;   // 50 MB — toast warning
const DEFAULT_HARD_LIMIT = 500 * 1024 * 1024;  // 500 MB — rejected

export function VideoDropzone({
  label,
  value,
  onChange,
  storagePath,
  maxBytesSoft = DEFAULT_SOFT_LIMIT,
  maxBytesHard = DEFAULT_HARD_LIMIT,
  className,
}: VideoDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const disabled = !storagePath;

  const processFile = async (file: File) => {
    if (!file.type.startsWith("video/")) {
      toast.error("Please upload a video file (MP4, WebM, MOV).");
      return;
    }
    if (file.size > maxBytesHard) {
      toast.error(
        `${file.name} is ${formatBytes(file.size)} — exceeds ${formatBytes(maxBytesHard)} hard limit.`,
      );
      return;
    }
    if (file.size > maxBytesSoft) {
      toast.info(
        `Uploading ${formatBytes(file.size)} — large videos may take a while.`,
      );
    }
    if (!storagePath) {
      toast.error("Video upload requires a storage path.");
      return;
    }
    try {
      setStatus("uploading");
      const { url } = await uploadAsset(file, storagePath, {
        contentType: file.type || "video/mp4",
        onStorageError: "throw",
      });
      onChange(url);
      setStatus("idle");
    } catch (err: unknown) {
      setStatus("error");
      const msg = err instanceof Error ? err.message : "Upload failed.";
      toast.error(`Couldn't upload ${label.toLowerCase()}: ${msg}`);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true);
    else if (e.type === "dragleave") setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (disabled) return;
    const f = e.dataTransfer.files?.[0];
    if (f) void processFile(f);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const f = e.target.files?.[0];
    if (f) void processFile(f);
    e.target.value = "";
  };

  const onButtonClick = () => {
    if (disabled || status === "uploading") return;
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <span className="block text-[11px] font-semibold uppercase tracking-widest text-muted/50">
        {label}
      </span>

      {value ? (
        <div className="group relative overflow-hidden rounded-xl border border-separator bg-card-active/40">
          <video
            src={value}
            controls
            playsInline
            preload="metadata"
            className="aspect-video w-full bg-black object-cover"
          />
          {status === "uploading" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <Loader2 className="h-6 w-6 animate-spin text-acid" />
            </div>
          )}
          <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={onButtonClick}
              disabled={disabled || status === "uploading"}
              className="rounded-full bg-foreground p-1.5 text-background transition-transform hover:scale-105 disabled:opacity-50"
              title="Replace video"
            >
              <Upload className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              disabled={disabled || status === "uploading"}
              className="rounded-full bg-red p-1.5 text-white transition-transform hover:scale-105 disabled:opacity-50"
              title="Remove video"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
          className={cn(
            "flex aspect-video cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-input/40 p-4 transition-all",
            disabled && "cursor-not-allowed opacity-50",
            isDragActive
              ? "scale-[0.99] border-acid bg-acid/5"
              : "border-separator hover:border-acid/30 hover:bg-input/70",
            status === "uploading" && "cursor-progress",
          )}
        >
          {status === "uploading" ? (
            <>
              <Loader2 className="mb-2 h-6 w-6 animate-spin text-acid" />
              <p className="text-[12px] font-medium text-foreground">Uploading…</p>
              <p className="mt-0.5 text-[10px] text-muted/55">Large videos may take a while</p>
            </>
          ) : status === "error" ? (
            <>
              <AlertTriangle className="mb-2 h-6 w-6 text-red" />
              <p className="text-[12px] font-medium text-foreground">Upload failed — try again</p>
            </>
          ) : disabled ? (
            <>
              <Upload className="mb-2 h-5 w-5 text-muted/40" />
              <p className="text-[11px] text-muted/60">
                Save your profile first to enable video uploads.
              </p>
            </>
          ) : (
            <>
              <Upload className="mb-2 h-6 w-6 text-muted/40" />
              <p className="text-[12px] font-medium text-foreground">
                Drag & drop or <span className="text-acid underline">browse</span>
              </p>
              <p className="mt-0.5 text-[10px] text-muted/50">
                MP4, WebM, MOV · up to {formatBytes(maxBytesHard)}
              </p>
            </>
          )}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="video/*"
        onChange={handleChange}
      />
    </div>
  );
}
