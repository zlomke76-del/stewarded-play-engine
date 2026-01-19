// lib/exports/types.ts
// ============================================================
// SOLACE EXPORT CONTRACT (AUTHORITATIVE)
// Any export MUST resolve to this shape.
// ============================================================

export type SolaceExportFormat = "docx" | "pdf" | "csv";

export type SolaceExport = {
  kind: "export";
  format: SolaceExportFormat;
  filename: string;
  url: string; // signed or public HTTPS URL
};
