import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { cn, parseScreenshots, joinScreenshots } from "@/lib/utils";

interface ImageDropzoneProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ImageDropzone({ label, value, onChange, className }: ImageDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to keep Firestore doc size small
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxDim = 600;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6);
          onChange(compressedBase64);
        } else {
          onChange(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <span className="block text-[11px] font-semibold uppercase tracking-widest text-muted/50">
        {label}
      </span>
      
      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-separator bg-card-active/40 h-28 flex items-center justify-center">
          <img src={value} alt={label} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={onButtonClick}
              className="p-2 bg-foreground text-background rounded-full hover:scale-105 transition-transform"
              title="Change Image"
            >
              <Upload className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="p-2 bg-red-600 text-white rounded-full hover:scale-105 transition-transform"
              title="Remove Image"
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
            "flex flex-col items-center justify-center border border-dashed rounded-xl p-4 h-28 cursor-pointer transition-all bg-input/40",
            isDragActive 
              ? "border-acid bg-acid/5 scale-[0.99]" 
              : "border-separator hover:border-acid/30 hover:bg-input/70"
          )}
        >
          <Upload className="h-5 w-5 text-muted/40 mb-2 group-hover:text-acid" />
          <p className="text-[12px] text-foreground font-medium">
            Drag & drop or <span className="text-acid underline">browse</span>
          </p>
          <p className="text-[10px] text-muted/50 mt-0.5">Supports PNG, JPG, JPEG</p>
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
  value: string; // comma-separated base64 / urls
  onChange: (value: string) => void;
  className?: string;
}

export function ScreenshotsZone({ value, onChange, className }: ScreenshotsZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUrls = parseScreenshots(value);

  const processFiles = (files: FileList) => {
    const promises = Array.from(files).map((file) => {
      if (!file.type.startsWith("image/")) return Promise.resolve(null);
      
      return new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            const maxDim = 600;

            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL("image/jpeg", 0.6));
            } else {
              resolve(e.target?.result as string);
            }
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then((results) => {
      const validResults = results.filter((r): r is string => !!r);
      if (validResults.length > 0) {
        const nextUrls = [...currentUrls, ...validResults];
        onChange(joinScreenshots(nextUrls));
      }
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeScreenshot = (indexToRemove: number) => {
    const nextUrls = currentUrls.filter((_, idx) => idx !== indexToRemove);
    onChange(joinScreenshots(nextUrls));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <span className="block text-[11px] font-semibold uppercase tracking-widest text-muted/50">
        Screenshots
      </span>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {currentUrls.map((url, index) => (
          <div key={index} className="relative group rounded-xl overflow-hidden border border-separator h-24 bg-card-active/30">
            <img src={url} alt={`Screenshot ${index + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => removeScreenshot(index)}
                className="p-1.5 bg-red-600 text-white rounded-full hover:scale-105 transition-transform"
                title="Remove Screenshot"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center border border-dashed rounded-xl h-24 cursor-pointer transition-all bg-input/40",
            isDragActive 
              ? "border-acid bg-acid/5 scale-[0.99]" 
              : "border-separator hover:border-acid/30 hover:bg-input/70"
          )}
        >
          <Upload className="h-4 w-4 text-muted/40 mb-1" />
          <p className="text-[11px] font-medium text-foreground">Add Screenshot</p>
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
