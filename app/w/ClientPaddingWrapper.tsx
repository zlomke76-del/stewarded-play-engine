// app/w/ClientPaddingWrapper.tsx
"use client";

import { usePathname } from "next/navigation";
import clsx from "clsx";

export default function ClientPaddingWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";

  const noPadding =
    pathname.includes("/memory") ||
    pathname.includes("/newsroom");

  return (
    <div
      className={clsx(
        // Height & containment contract (DO NOT vary by route)
        "w-full h-full min-h-0 flex flex-col overflow-hidden",
        // Padding is the only conditional concern
        noPadding ? "px-0 py-0" : "px-8 py-10"
      )}
    >
      {children}
    </div>
  );
}
