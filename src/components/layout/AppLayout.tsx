import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigationType } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Toaster } from "@/components/common/Toaster";
import { CommandPalette } from "@/components/common/CommandPalette";
import { VoiceWidget } from "@/components/voice/VoiceWidget";
import { useWishlistAlerts } from "@/hooks/use-wishlist-alerts";
import { useLibraryImportNotifier } from "@/hooks/use-library-import-notifier";
import { useAccentStore } from "@/stores/accent-store";
import { useUiStore } from "@/stores/ui-store";
import { useTranslation } from "@/lib/i18n";

export function AppLayout() {
  useWishlistAlerts();
  useLibraryImportNotifier();
  const accent = useAccentStore((s) => s.accent);
  const dynamicBackgrounds = useUiStore((s) => s.settings.dynamicStoreBackgroundsEnabled);
  const { langCode } = useTranslation();
  const mainRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const scrollByPath = useRef<Map<string, number>>(new Map());
  const prevPathname = useRef<string>(pathname);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useLayoutEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    // Save the scroll position of the page we're leaving.
    scrollByPath.current.set(prevPathname.current, main.scrollTop);
    // On Back navigation, restore the saved position if we have one.
    if (navigationType === "POP") {
      const saved = scrollByPath.current.get(pathname) ?? 0;
      main.scrollTo({ top: saved, left: 0 });
    } else {
      main.scrollTo({ top: 0, left: 0 });
    }
    prevPathname.current = pathname;
  }, [pathname, navigationType]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = langCode;
    }
  }, [langCode]);

  const showAccent = Boolean(accent) && dynamicBackgrounds;

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[560px] transition-[background] duration-500 ease-out"
        style={{
          background: showAccent
            ? `linear-gradient(180deg, ${accent}44 0%, ${accent}2e 28%, ${accent}16 58%, transparent 90%)`
            : "transparent",
        }}
      />
      <div className="relative z-10 flex h-full w-full overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden bg-transparent">
          <Topbar />
          <main ref={mainRef} className="flex-1 overflow-y-auto bg-transparent">
            <div className="px-8 py-7 max-w-[1500px] mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <Toaster />
      <VoiceWidget />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
