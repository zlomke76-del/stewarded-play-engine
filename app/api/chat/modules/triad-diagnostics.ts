//--------------------------------------------------------------
// TRIAD DIAGNOSTICS
//--------------------------------------------------------------

export const TRIAD_DIAGNOSTICS_ENABLED = true;

type TriadDiagInput = {
  stage: "optimist" | "skeptic" | "arbiter";
  prompt: string;
  output: string;
  started: number;
  finished: number;
  model: string;
};

export function logTriadDiagnostics(info: TriadDiagInput) {
  if (!TRIAD_DIAGNOSTICS_ENABLED) return;

  const durationMs = info.finished - info.started;

  console.info("[TRIAD-DIAG]", {
    stage: info.stage,
    model: info.model,
    durationMs,
    promptChars: info.prompt?.length ?? 0,
    outputChars: info.output?.length ?? 0,
    truncated: info.output?.endsWith("…") ?? false,
    ts: new Date().toISOString(),
  });
}
