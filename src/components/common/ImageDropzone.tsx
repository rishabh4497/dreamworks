import { useState, useRef } from "react";
import { Upload, X, Loader2, AlertTriangle } from "lucide-react";
import { cn, parseScreenshots, joinScreenshots } from "@/lib/utils";
import { uploadAsset, dataUrlToBlob } from "@/lib/platform";
import { toast } from "@/stores/toast-store";

interface ImageDropzoneProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /**
   * Firebase Storage path (without leading slash). When provided, the resized
   * image is uploaded there and the returned download URL is stored. When
   * omitted, falls back to inlining as a base64 data URL — useful before the
   * parent entity has a stable slug (e.g. a brand-new studio with no name).
   *
   * Use the `dw_` prefix convention, e.g.
   *   `dw_developers/{slug}/logo`
   *   `dw_apps/{appId}/cover`
   */
  storagePath?: string;
  /** Maximum dimension for the canvas resize. Defaults to 600. */
  maxDim?: number;
  /** JPEG quality 0–1 for the resized output. Defaults to 0.85. */
  quality?: number;
  className?: string;
}

interface ResizedImage {
  dataUrl: string;
  blob: Blob;
  contentType: string;
}

async function resizeImage(file: File, maxDim: number, quality: number): Promise<ResizedImage> {
  const sourceUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("decode failed"));
    i.src = sourceUrl;
  });

  let { width, height } = img;
  if (width > maxDim || height > maxDim) {
    if (width > height) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    } else {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { dataUrl: sourceUrl, blob: file, contentType: file.type || "image/jpeg" };
  }
  ctx.drawImage(img, 0, 0, width, height);
  const contentType = "image/jpeg";
  const dataUrl = canvas.toDataURL(contentType, quality);
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (b) => resolve(b ?? dataUrlToBlob(dataUrl)),
      contentType,
      quality,
    );
  });
  return { dataUrl, blob, contentType };
}

export function ImageDropzone({
  label,
  value,
  onChange,
  storagePath,
  maxDim = 600,
  quality = 0.85,
  className,
}: ImageDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    try {
      const resized = await resizeImage(file, maxDim, quality);
      if (!storagePath) {
        // No path supplied — caller hasn't given us a stable slug yet. Fall
        // back to a data URL so the preview works; caller can re-upload once
        // a slug exists.
        onChange(resized.dataUrl);
        return;
      }
      setStatus("uploading");
      const { url } = await uploadAsset(resized.blob, storagePath, {
        contentType: resized.contentType,
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
    if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true);
    else if (e.type === "dragleave") setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
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
    if (status === "uploading") return;
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <span className="block text-[11px] font-semibold uppercase tracking-widest text-muted/50">
        {label}
      </span>

      {value ? (
        <div className="group relative flex h-28 items-center justify-center overflow-hidden rounded-xl border border-separator bg-card-active/40">
          <img src={value} alt={label} className="h-full w-full object-cover" />
          {status === "uploading" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <Loader2 className="h-5 w-5 animate-spin text-acid" />
            </div>
          )}
          {status === "error" && (
            <div className="absolute inset-0 flex items-center justify-center bg-red/40">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={onButtonClick}
              className="rounded-full bg-foreground p-2 text-background transition-transform hover:scale-105"
              title="Change image"
              disabled={status === "uploading"}
            >
              <Upload className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded-full bg-red p-2 text-white transition-transform hover:scale-105"
              title="Remove image"
              disabled={status === "uploading"}
            >
              <X className="h-4 w-4" />
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
            "flex h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-input/40 p-4 transition-all",
            isDragActive
              ? "scale-[0.99] border-acid bg-acid/5"
              : "border-separator hover:border-acid/30 hover:bg-input/70",
            status === "uploading" && "cursor-progress",
          )}
        >
          {status === "uploading" ? (
            <>
              <Loader2 className="mb-2 h-5 w-5 animate-spin text-acid" />
              <p className="text-[12px] font-medium text-foreground">Uploading…</p>
            </>
          ) : (
            <>
              <Upload className="mb-2 h-5 w-5 text-muted/40" />
              <p className="text-[12px] font-medium text-foreground">
                Drag & drop or <span className="text-acid underline">browse</span>
              </p>
              <p className="mt-0.5 text-[10px] text-muted/50">PNG, JPG, JPEG</p>
            </>
          )}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleChange}
      />
    </div>
  );
}

interface ScreenshotsZoneProps {
  value: string; // pipe-separated URLs
  onChange: (value: string) => void;
  /**
   * Storage folder for new screenshots, e.g. `dw_apps/{appId}/screenshots`.
   * Each new upload becomes `{storagePath}/{uuid}`. When omitted, falls back
   * to inlining as base64 data URLs.
   */
  storagePath?: string;
  maxDim?: number;
  quality?: number;
  className?: string;
}

export function ScreenshotsZone({
  value,
  onChange,
  storagePath,
  maxDim = 1280,
  quality = 0.8,
  className,
}: ScreenshotsZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUrls = parseScreenshots(value);

  const processFiles = async (files: FileList) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;
    setUploadingCount(list.length);
    try {
      const results = await Promise.all(
        list.map(async (file) => {
          const resized = await resizeImage(file, maxDim, quality);
          if (!storagePath) return resized.dataUrl;
          const id = "ss-" + crypto.randomUUID();
          const { url } = await uploadAsset(resized.blob, `${storagePath}/${id}`, {
            contentType: resized.contentType,
            onStorageError: "throw",
          });
          return url;
        }),
      );
      onChange(joinScreenshots([...currentUrls, ...results]));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed.";
      toast.error(`Couldn't upload screenshot: ${msg}`);
    } finally {
      setUploadingCount(0);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true);
    else if (e.type === "dragleave") setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files?.length) void processFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files?.length) void processFiles(e.target.files);
    e.target.value = "";
  };

  const removeScreenshot = (i: number) => {
    const nextUrls = currentUrls.filter((_, idx) => idx !== i);
    onChange(joinScreenshots(nextUrls));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <span className="block text-[11px] font-semibold uppercase tracking-widest text-muted/50">
        Screenshots
      </span>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {currentUrls.map((url, index) => (
          <div
            key={index}
            className="group relative h-24 overflow-hidden rounded-xl border border-separator bg-card-active/30"
          >
            <img
              src={url}
              alt={`Screenshot ${index + 1}`}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => removeScreenshot(index)}
                className="rounded-full bg-red p-1.5 text-white transition-transform hover:scale-105"
                title="Remove screenshot"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        {Array.from({ length: uploadingCount }).map((_, i) => (
          <div
            key={`uploading-${i}`}
            className="flex h-24 flex-col items-center justify-center rounded-xl border border-separator bg-card-active/30"
          >
            <Loader2 className="h-4 w-4 animate-spin text-acid" />
            <p className="mt-1 text-[10px] text-muted/60">Uploading…</p>
          </div>
        ))}

        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-input/40 transition-all",
            isDragActive
              ? "scale-[0.99] border-acid bg-acid/5"
              : "border-separator hover:border-acid/30 hover:bg-input/70",
          )}
        >
          <Upload className="mb-1 h-4 w-4 text-muted/40" />
          <p className="text-[11px] font-medium text-foreground">Add screenshot</p>
          <p className="text-[9px] text-muted/50">Drop or click</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept="image/*"
        onChange={handleChange}
      />
    </div>
  );
}
