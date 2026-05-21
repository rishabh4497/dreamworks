import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Toaster } from "@/components/common/Toaster";
import { useWishlistAlerts } from "@/hooks/use-wishlist-alerts";
import { useLibraryImportNotifier } from "@/hooks/use-library-import-notifier";
import { useAccentStore } from "@/stores/accent-store";

export function AppLayout() {
  useWishlistAlerts();
  useLibraryImportNotifier();
  const accent = useAccentStore((s) => s.accent);

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[560px] transition-[background] duration-500 ease-out"
        style={{
          background: accent
            ? `linear-gradient(180deg, ${accent}44 0%, ${accent}2e 28%, ${accent}16 58%, transparent 90%)`
            : "transparent",
        }}
      />
      <div className="relative z-10 flex h-full w-full overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden bg-transparent">
          <Topbar />
          <main className="flex-1 overflow-y-auto bg-transparent">
            <div className="px-8 py-7 max-w-[1500px] mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
