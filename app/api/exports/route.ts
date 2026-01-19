// ------------------------------------------------------------
// SOLACE EXPORT API ROUTE (AUTHORITATIVE)
// Generates downloadable exports and returns SolaceExport
// ------------------------------------------------------------

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import type { SolaceExport, SolaceExportFormat } from "@/lib/exports/types";

// ------------------------------------------------------------
// Runtime configuration
// ------------------------------------------------------------
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function inferMime(format: SolaceExportFormat): string {
  switch (format) {
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "pdf":
      return "application/pdf";
    case "csv":
      return "text/csv";
    default:
      return "application/octet-stream";
  }
}

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      format,
      filename,
      content,
      workspaceId,
    }: {
      format: SolaceExportFormat;
      filename: string;
      content: string | Buffer;
      workspaceId?: string;
    } = body ?? {};

    if (!format || !filename || content == null) {
      return NextResponse.json(
        { ok: false, error: "Missing required export fields" },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // Supabase admin client
    // --------------------------------------------------------
    const supabase = createClient(
      requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false } }
    );

    // --------------------------------------------------------
    // Normalize payload
    // --------------------------------------------------------
    const data =
      typeof content === "string"
        ? Buffer.from(content, "utf-8")
        : Buffer.from(content);

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${
      workspaceId || "global"
    }/${Date.now()}_${safeName}`;

    // --------------------------------------------------------
    // Upload
    // --------------------------------------------------------
    const { error: uploadError } = await supabase.storage
      .from("exports")
      .upload(path, data, {
        upsert: false,
        contentType: inferMime(format),
        cacheControl: "3600",
      });

    if (uploadError) {
      throw uploadError;
    }

    // --------------------------------------------------------
    // Signed URL (authoritative)
    // --------------------------------------------------------
    const { data: signed, error: signError } =
      await supabase.storage
        .from("exports")
        .createSignedUrl(path, 60 * 60); // 1 hour

    if (signError || !signed?.signedUrl) {
      throw signError || new Error("Failed to create signed URL");
    }

    // --------------------------------------------------------
    // Contract response
    // --------------------------------------------------------
    const exportPayload: SolaceExport = {
      kind: "export",
      format,
      filename: safeName,
      url: signed.signedUrl,
    };

    return NextResponse.json({
      ok: true,
      export: exportPayload,
    });
  } catch (err: any) {
    console.error("[EXPORT ROUTE ERROR]", err?.message || err);

    return NextResponse.json(
      {
        ok: false,
        error: "Export generation failed",
      },
      { status: 500 }
    );
  }
}
