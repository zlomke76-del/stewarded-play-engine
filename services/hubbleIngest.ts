// services/hubbleIngest.ts
// --------------------------------------------------------------
// Hubble Ingest — Minimal, Deterministic, Dependency-Free
// - NO AJV
// - Strict structural validation
// - Explicit diagnostics
// - Immutable ingest discipline
// --------------------------------------------------------------

import fetch from "node-fetch";

// --------------------------------------------------------------
// Types (Minimal Viable Event)
// --------------------------------------------------------------
export type HubbleEvent = {
  event_id: string;
  timestamp_utc: string; // ISO-8601
  instrument_mode: string;
  exposure_time: number;
  target_ra: number;
  target_dec: number;
  data_quality_flags: number[]; // numeric only
  payload_ref: string;
  calibration_version: string;
  provenance: {
    source: string;
    dataset_id: string;
    citation: string;
    license: string;
    retrieved_at: string;
  };
};

// --------------------------------------------------------------
// Diagnostics
// --------------------------------------------------------------
function diag(label: string, payload: any) {
  console.log(`[HUBBLE-INGEST] ${label}`, payload);
}

// --------------------------------------------------------------
// Hard Validator (NO COERCION)
// --------------------------------------------------------------
function isValidHubbleEvent(e: any): e is HubbleEvent {
  try {
    if (!e || typeof e !== "object") return false;

    const requiredStrings = [
      "event_id",
      "timestamp_utc",
      "instrument_mode",
      "payload_ref",
      "calibration_version",
    ];

    for (const k of requiredStrings) {
      if (typeof e[k] !== "string" || e[k].length === 0) return false;
    }

    if (typeof e.exposure_time !== "number") return false;
    if (typeof e.target_ra !== "number") return false;
    if (typeof e.target_dec !== "number") return false;

    if (
      !Array.isArray(e.data_quality_flags) ||
      !e.data_quality_flags.every((n: any) => typeof n === "number")
    ) {
      return false;
    }

    const p = e.provenance;
    if (
      !p ||
      typeof p.source !== "string" ||
      typeof p.dataset_id !== "string" ||
      typeof p.citation !== "string" ||
      typeof p.license !== "string" ||
      typeof p.retrieved_at !== "string"
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// --------------------------------------------------------------
// Ingest Function
// --------------------------------------------------------------
export async function ingestHubbleEvent(
  event: unknown
): Promise<{ ok: boolean; error?: string }> {
  diag("received", event);

  if (!isValidHubbleEvent(event)) {
    diag("reject.invalid_schema", event);
    return { ok: false, error: "Invalid Hubble event schema" };
  }

  // Immutable namespace (example)
  const objectPath = `/hubble_ingest/v1/${event.event_id}.json`;

  diag("validated", {
    event_id: event.event_id,
    instrument: event.instrument_mode,
    timestamp: event.timestamp_utc,
  });

  // ----------------------------------------------------------
  // At this point you would:
  // - write to object storage
  // - write metadata row
  // - never overwrite
  // ----------------------------------------------------------

  diag("accepted", {
    path: objectPath,
    provenance: event.provenance,
  });

  return { ok: true };
}
