"use client";

import React from "react";
import { UI } from "./dock-ui";
import type { SolaceExport } from "@/lib/exports/types";

export default function ExportCard({ exportItem }: { exportItem: SolaceExport }) {
  const label =
    exportItem.format === "docx"
      ? "Word Document"
      : exportItem.format === "pdf"
      ? "PDF Document"
      : "CSV File";

  return (
    <div
      style={{
        border: UI.edge,
        borderRadius: 12,
        padding: 12,
        background: UI.surface2,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        maxWidth: 360,
      }}
    >
      <div style={{ fontWeight: 600 }}>{label}</div>

      <div style={{ fontSize: 12, color: UI.sub }}>
        {exportItem.filename}
      </div>

      <a
        href={exportItem.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginTop: 6,
          alignSelf: "flex-start",
          padding: "6px 10px",
          borderRadius: 8,
          background: "#fbbf24",
          color: "#000",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Download
      </a>
    </div>
  );
}
