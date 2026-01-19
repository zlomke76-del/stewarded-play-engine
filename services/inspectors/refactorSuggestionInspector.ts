import { ShadowInspector, InspectionFinding } from "../shadowInspectionService";
import { SnapshotDiff } from "../shadowSnapshotDiffService";

/*
  Assistive AI inspector (SAFE MODE):

  - Advisory only
  - No hard dependency on model runtime
  - Degrades cleanly if AI is unavailable
  - NEVER mutates code
*/

type CallModelFn = (model: string, prompt: string) => Promise<string>;

async function tryGetCallModel(): Promise<CallModelFn | null> {
  try {
    // Lazy runtime import — avoids build-time coupling
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("../model-router");
    if (typeof mod.callModel === "function") {
      return mod.callModel as CallModelFn;
    }
  } catch {
    // Intentionally silent — AI is optional
  }
  return null;
}

export const RefactorSuggestionInspector: ShadowInspector = {
  name: "refactor-suggestion-inspector",

  async inspect(diff: SnapshotDiff): Promise<InspectionFinding[]> {
    const findings: InspectionFinding[] = [];

    const changedFiles = [...diff.added, ...diff.modified].slice(0, 10);

    if (changedFiles.length === 0) {
      return findings;
    }

    const callModel = await tryGetCallModel();

    if (!callModel) {
      findings.push({
        id: "refactor-ai-unavailable",
        severity: "info",
        message:
          "Assistive refactor analysis skipped (AI runtime not available).",
        filePaths: changedFiles,
      });
      return findings;
    }

    const prompt = `
You are a senior software engineer reviewing a code change.

TASK:
- Suggest OPTIONAL refactors only.
- Focus on structure, clarity, and separation of concerns.
- Do NOT rewrite code.
- Do NOT propose stylistic or cosmetic changes.
- Output concise bullet points.
- If nothing meaningful applies, say: "No refactor suggestions."

FILES TO CONSIDER:
${changedFiles.join("\n")}
`;

    let response: string;

    try {
      response = await callModel("gpt-4.1-mini", prompt);
    } catch {
      findings.push({
        id: "refactor-ai-error",
        severity: "info",
        message:
          "Assistive refactor analysis failed at runtime; no suggestions generated.",
        filePaths: changedFiles,
      });
      return findings;
    }

    if (
      !response ||
      response.toLowerCase().includes("no refactor")
    ) {
      return findings;
    }

    findings.push({
      id: "refactor-suggestions",
      severity: "info",
      message: response.trim(),
      filePaths: changedFiles,
    });

    return findings;
  },
};
