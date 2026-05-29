"use client";

import * as React from "react";

/**
 * Registers the service worker on mount. Silently no-ops on unsupported browsers.
 */
export function PWARegistrar() {
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* silent */
    });
  }, []);
  return null;
}
