// --------------------------------------------------------------
// Model & Orchestration Constants
// AUTHORITATIVE FOR: model selection, routing, feature toggles
// DO NOT import into context/memory geometry
// --------------------------------------------------------------

// Primary model (must exist in OpenAI Responses API)
export const DEFAULT_MODEL = "gpt-4.1";

// Guaranteed-safe fallback model
export const FALLBACK_MODEL = "gpt-4.1-mini";

// NOTE:
// Responses API does NOT support temperature / max_tokens directly.
// These are retained ONLY for internal logic or future adapters.
export const TEMPERATURE = 0.2;
export const MAX_TOKENS = 1800;

// --------------------------------------------------------------
// Capability Toggles (System-Level)
// --------------------------------------------------------------

// Enables News Digest enrichment (if pipeline wired)
export const ENABLE_NEWS = true;

// Enables external research context (Hubble, future feeds)
export const ENABLE_RESEARCH = true;
