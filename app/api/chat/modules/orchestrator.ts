// ------------------------------------------------------------
// ORCHESTRATOR
// Stable contract between API route and hybrid pipeline
// Newsroom-safe
// ------------------------------------------------------------

import { runHybridPipeline } from "./hybrid";

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------
type OrchestratorArgs = {
  userMessage: string;
  context: any;
  ministryMode?: boolean;
  founderMode?: boolean;
  modeHint?: string;
};

// ------------------------------------------------------------
// MAIN ORCHESTRATOR
// ------------------------------------------------------------
export async function orchestrateSolaceResponse(
  args: OrchestratorArgs
) {
  const result = await runHybridPipeline({
    userMessage: args.userMessage,
    context: args.context,
    ministryMode: args.ministryMode,
    founderMode: args.founderMode,
    modeHint: args.modeHint,
  });

  return {
    finalAnswer: result.finalAnswer,
  };
}
