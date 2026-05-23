import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./styles/globals.css";
import { createQueryClient } from "@/lib/query-client";
import { useThemeStore } from "@/stores/theme-store";
import { useAuthStore } from "@/stores/auth-store";
import { isDesktop, openExternal } from "@/lib/platform";

// Side-effect: ensure theme store & auth store initialize
useThemeStore.getState();
useAuthStore.getState().initialize();

// Hydrate the system rig once on startup. detectSystemRig() runs synchronously
// (browser APIs only), then on desktop we async-merge in the exact CPU/RAM/
// storage from Tauri's read_hardware_info command. This means features like
// the AI System Compatibility card and AI Hardware Optimizer get real specs
// without depending on the profile page being mounted first.
void (async () => {
  try {
    const { useProfileStore, detectSystemRig } = await import("@/stores/profile-store");
    useProfileStore.getState().setSystemRig(detectSystemRig());
    if (isDesktop()) {
      const { invokeDesktop } = await import("@/lib/platform");
      const res = await invokeDesktop<{
        ok: boolean;
        data?: { cpu?: string; ram?: string; storage?: string };
      }>("read_hardware_info");
      if (res?.ok && res.data) {
        useProfileStore.getState().setSystemRig({
          cpu: res.data.cpu,
          ram: res.data.ram,
          storage: res.data.storage,
        });
      }
    }
  } catch (err) {
    console.warn("system rig hydration skipped:", err);
  }
})();


// On desktop, route external links through the OS browser rather than letting
// the Tauri webview open them inside the app window.
if (typeof document !== "undefined") {
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const anchor = target.closest("a") as HTMLAnchorElement | null;
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (!href) return;
    const isExternal = /^https?:\/\//i.test(href);
    if (isExternal && (anchor.target === "_blank" || isDesktop())) {
      e.preventDefault();
      void openExternal(href);
    }
  });
}

const queryClient = createQueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
