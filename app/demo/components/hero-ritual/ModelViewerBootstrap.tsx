"use client";

import { useEffect } from "react";

let attemptedRegistration = false;

export default function ModelViewerBootstrap() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.customElements?.get("model-viewer")) return;
    if (attemptedRegistration) return;

    attemptedRegistration = true;

    import("@google/model-viewer").catch(() => {
      // fail silently and allow image fallback
    });
  }, []);

  return null;
}
