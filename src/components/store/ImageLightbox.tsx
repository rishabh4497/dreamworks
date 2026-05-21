import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { X } from "lucide-react";

interface ImageLightboxProps {
  url: string | null;
  alt?: string;
  onClose: () => void;
}

export function ImageLightbox({ url, alt, onClose }: ImageLightboxProps) {
  useEffect(() => {
    if (!url) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [url, onClose]);

  return (
    <AnimatePresence>
      {url && (
        <motion.div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-sm cursor-zoom-out"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.img
            src={url}
            alt={alt ?? ""}
            className="max-h-[92vh] max-w-[92vw] rounded-lg object-contain shadow-2xl shadow-black/80"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full bg-card/70 p-2 text-foreground/80 backdrop-blur transition-colors hover:bg-card hover:text-foreground"
            aria-label="Close image"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
