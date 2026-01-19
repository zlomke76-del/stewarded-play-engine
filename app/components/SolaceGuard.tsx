// app/components/SolaceGuard.tsx
"use client";

import { usePathname } from "next/navigation";
import SolaceDockWrapper from "./SolaceDockWrapper";

export default function SolaceGuard() {
  const pathname = usePathname();

  const hide =
    pathname?.startsWith("/auth") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/sign-in");

  if (hide) return null;

  return <SolaceDockWrapper />;
}
