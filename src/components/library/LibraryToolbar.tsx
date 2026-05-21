import { Plus, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlatform } from "@/hooks/use-platform";

interface LibraryToolbarProps {
  onAdd: () => void;
  onScan: () => void;
}

export function LibraryToolbar({ onAdd, onScan }: LibraryToolbarProps) {
  const { isDesktop } = usePlatform();
  return (
    <div className="flex items-center justify-end gap-2">
      <Button variant="secondary" size="sm" onClick={onAdd}>
        <Plus className="h-3.5 w-3.5" />
        Add to library
      </Button>
      <Button
        variant={isDesktop ? "primary" : "secondary"}
        size="sm"
        onClick={onScan}
        disabled={!isDesktop}
        title={
          isDesktop
            ? "Scan installed launchers and import detected titles"
            : "Available in the desktop app"
        }
      >
        <ScanLine className="h-3.5 w-3.5" />
        {isDesktop ? "Auto-add from launchers" : "Auto-add (desktop only)"}
      </Button>
    </div>
  );
}
