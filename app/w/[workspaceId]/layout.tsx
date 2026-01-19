// app/w/[workspaceId]/layout.tsx
// SERVER LAYOUT — TOOL / WORKSPACE ROOT

import { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default function WorkspaceIdLayout({
  children,
}: {
  children: ReactNode;
}) {
  /**
   * This layout intentionally breaks out of the global
   * "standalone / marketing" container.
   *
   * Workspaces are full-viewport tools, not centered pages.
   */
  return (
    <div className="w-screen h-screen min-h-0 flex flex-col overflow-hidden">
      {children}
    </div>
  );
}
