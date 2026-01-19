// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

import LayoutShell from "./LayoutShell";
import Toaster from "@/components/Toaster";

// ✅ Use the guard — NOT the dock directly
import SolaceGuard from "@/app/components/SolaceGuard";

import { headers } from "next/headers";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.moralclarity.ai"),
  title: {
    default: "Moral Clarity AI",
    template: "%s • Moral Clarity AI",
  },
  description: "Anchored answers. Neutral • Guidance.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hdrs = await headers();

  const pathname =
    hdrs.get("x-pathname") ||
    hdrs.get("x-invoke-path") ||
    hdrs.get("referer") ||
    "";

  const isApp =
    pathname.startsWith("/app") ||
    pathname.includes("/app/");

  return (
    <html lang="en" className="h-full dark">
      <body className="mc-root min-h-screen relative">
        <div className="mc-bg absolute inset-0 pointer-events-none z-0" />
        <div className="mc-noise absolute inset-0 pointer-events-none z-0" />

        <LayoutShell>{children}</LayoutShell>

        {/* ✅ SINGLE Solace mount */}
        {isApp && <SolaceGuard />}

        <Toaster />
      </body>
    </html>
  );
}
