"use client";

import { useSearchParams } from "next/navigation";

export default function LayoutDebugOverlay() {
  const params = useSearchParams();

  // Defensive: params can be null during build / prerender
  const enabled =
    params?.get("debug") === "layout";

  if (!enabled) return null;

  return (
    <div
      data-layout-debug-overlay
      className="fixed inset-0 pointer-events-none z-[9999]"
    >
      {/* App shell */}
      <div className="absolute inset-0 outline outline-2 outline-red-500/40">
        <span className="absolute top-2 left-2 text-xs text-red-400 bg-black/60 px-2 py-1 rounded">
          app-shell
        </span>
      </div>

      {/* Neural sidebar */}
      <div className="absolute inset-y-0 left-0 w-[20vw] outline outline-2 outline-blue-500/40">
        <span className="absolute top-10 left-2 text-xs text-blue-400 bg-black/60 px-2 py-1 rounded">
          neural-sidebar
        </span>
      </div>

      {/* Main content */}
      <div className="absolute inset-y-0 left-[20vw] right-0 outline outline-2 outline-green-500/40">
        <span className="absolute top-10 left-2 text-xs text-green-400 bg-black/60 px-2 py-1 rounded">
          app-main
        </span>
      </div>
    </div>
  );
}
