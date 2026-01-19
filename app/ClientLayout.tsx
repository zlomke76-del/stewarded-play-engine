"use client";

import { usePathname } from "next/navigation";
import LayoutShell from "./LayoutShell";
import SolaceDock from "@/app/components/SolaceDock";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuth = pathname?.startsWith("/auth");

  return (
    <>
      <LayoutShell>{children}</LayoutShell>

      {/* Solace hidden on auth routes */}
      {!isAuth && <SolaceDock />}
    </>
  );
}
