import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./styles/globals.css";
import { createQueryClient } from "@/lib/query-client";
import { useThemeStore } from "@/stores/theme-store";
import { isDesktop, openExternal } from "@/lib/platform";

// Side-effect: ensure theme store initializes & applies data-theme before paint
useThemeStore.getState();

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
