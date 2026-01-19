// lib/memory-classifier.ts
import "server-only";
import OpenAI from "openai";

/* ============================================================
   LABEL ONTOLOGY — CLOSED SET (DO NOT AD-LIB)
   ============================================================ */

export type MemoryClassificationLabel =
  | "Identity"
  | "Relationship"
  | "Origin"
  | "Preference"
  | "Profile"
  | "Habit"
  | "Emotional"
  | "Goal"
  | "Task"
  | "Note"
  | "Health"
  | "Interests"
  | "Boundary"
  | "Trigger"
  | "Episodic"
  | "DecisionContext"
  | "MoralValue"
  | "ProjectDetail"
  | "BusinessPartner"
  | "WorkspaceProfile"
  | "Financial"
  | "LocationContext"
  | "Other";

/* ============================================================
   RESULT TYPE
   ============================================================ */

export type ClassificationResult = {
  provider: "micro" | "openai" | "system";
  label: MemoryClassificationLabel;
  confidence: number; // 0–1
  raw?: any; // optional diagnostics
};

/* ============================================================
   INPUT GUARDRAILS
   ============================================================ */

function validateInput(text: string): ClassificationResult | null {
  if (!text || typeof text !== "string") {
    return {
      provider: "system",
      label: "Other",
      confidence: 0,
      raw: "Invalid input",
    };
  }

  const trimmed = text.trim();
  if (trimmed.length < 5) {
    return {
      provider: "system",
      label: "Other",
      confidence: 0.1,
      raw: "Input too short",
    };
  }

  return null;
}

/* ============================================================
   MICRO-CLASSIFIER (FAST, DETERMINISTIC)
   ============================================================ */

const MICRO_RULES: Record<MemoryClassificationLabel, string[]> = {
  Identity: ["i am", "my name is", "i'm"],
  Relationship: ["wife", "husband", "partner", "friend", "family"],
  Origin: ["from", "born", "grew up"],
  Preference: ["prefer", "like", "love", "favorite"],
  Profile: ["profile", "about me"],
  Habit: ["always", "usually", "often", "routine"],
  Emotional: ["feel", "felt", "emotion", "anxious", "happy", "angry"],
  Goal: ["goal", "aim", "objective", "aspiration"],
  Task: ["todo", "task", "remind", "follow up"],
  Note: [],
  Health: ["health", "medical", "diagnosis", "condition"],
  Interests: ["interested in", "hobby", "enjoy", "passion"],
  Boundary: ["do not", "never", "not comfortable", "boundary"],
  Trigger: ["trigger", "sets me off", "react when"],
  Episodic: ["yesterday", "last week", "earlier today", "when i"],
  DecisionContext: ["because", "so that", "decision", "reason"],
  MoralValue: ["believe", "value", "ethic", "principle"],
  ProjectDetail: ["project", "build", "ship", "launch", "feature"],
  BusinessPartner: ["partner", "investor", "cofounder", "collaborator"],
  WorkspaceProfile: ["workspace", "team", "org", "organization"],
  Financial: ["revenue", "salary", "budget", "cost", "finance"],
  LocationContext: ["address", "location", "based in", "live in"],
  Other: [],
};

function microClassify(text: string): ClassificationResult {
  const t = text.toLowerCase();

  for (const [label, terms] of Object.entries(MICRO_RULES)) {
    if (!terms.length) continue;
    if (terms.some(term => t.includes(term))) {
      return {
        provider: "micro",
        label: label as MemoryClassificationLabel,
        confidence: 0.65,
      };
    }
  }

  return {
    provider: "micro",
    label: "Other",
    confidence: 0.3,
  };
}

/* ============================================================
   OPENAI CLASSIFIER (SEMANTIC)
   ============================================================ */

const CLASSIFIER_MODEL =
  process.env.OPENAI_CLASSIFIER_MODEL || "gpt-4.1-mini";

const VALID_LABELS = Object.keys(MICRO_RULES);

async function classifyWithOpenAI(
  text: string
): Promise<ClassificationResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  const systemPrompt = `
You are a memory classifier for an AI system.

Choose EXACTLY ONE label from the allowed list.

Allowed labels:
${VALID_LABELS.join(", ")}

Return ONLY valid JSON:
{ "label": "<label>", "confidence": <number between 0 and 1> }
`;

  try {
    const resp = await client.responses.create({
      model: CLASSIFIER_MODEL,
      input: `${systemPrompt}\nTEXT:\n${text}`,
      temperature: 0,
      max_output_tokens: 120,
    });

    const rawText = (resp as any).output_text ?? "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) throw new Error("No JSON found");

    const parsed = JSON.parse(jsonMatch[0]);

    if (!VALID_LABELS.includes(parsed.label)) {
      throw new Error("Invalid label");
    }

    return {
      provider: "openai",
      label: parsed.label as MemoryClassificationLabel,
      confidence: Number(parsed.confidence) || 0,
      raw: parsed,
    };
  } catch (err) {
    return {
      provider: "openai",
      label: "Other",
      confidence: 0,
      raw: String(err),
    };
  }
}

/* ============================================================
   FUSION LOGIC
   ============================================================ */

function fuseResults(
  micro: ClassificationResult,
  openai: ClassificationResult
): ClassificationResult {
  if (
    micro.label === openai.label &&
    micro.label !== "Other"
  ) {
    return {
      provider: "openai",
      label: openai.label,
      confidence: Math.min(
        0.95,
        Math.max(micro.confidence, openai.confidence) + 0.1
      ),
      raw: { micro, openai },
    };
  }

  return openai.confidence >= micro.confidence ? openai : micro;
}

/* ============================================================
   PUBLIC API
   ============================================================ */

export async function classifyMemoryText(
  text: string
): Promise<ClassificationResult> {
  const invalid = validateInput(text);
  if (invalid) return invalid;

  const micro = microClassify(text);
  const openai = await classifyWithOpenAI(text);

  const fused = fuseResults(micro, openai);

  if (fused.confidence < 0.25) {
    return {
      provider: "system",
      label: "Other",
      confidence: fused.confidence,
      raw: fused,
    };
  }

  return fused;
}
