import { useCallback } from "react";
import { isDesktop, getOS, openExternal, notify } from "@/lib/platform";

export function usePlatform() {
  return {
    isDesktop: isDesktop(),
    os: getOS(),
    openExternal: useCallback((url: string) => openExternal(url), []),
    notify: useCallback((title: string, body: string) => notify(title, body), []),
  };
}
