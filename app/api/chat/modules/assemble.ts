// app/api/chat/modules/assemble.ts
// -------------------------------------------------------------
// SYSTEM BLOCK + USER CONTEXT BLOCK ASSEMBLER (ASCII-SAFE)
// For Solace Hybrid Pipeline (Optimist → Skeptic → Arbiter)
// -------------------------------------------------------------

import { buildSolaceSystemPrompt } from "@/lib/solace/persona";

// -------------------------------------------------------------
// ASCII SANITIZER
// -------------------------------------------------------------
function sanitizeASCII(input: string): string {
  if (!input) return "";

  const replacements: Record<string, string> = {
    "—": "-",
    "–": "-",
    "•": "*",
    "“": '"',
    "”": '"',
    "‘": "'",
    "’": "'",
    "…": "...",
  };

  let out = input;
  for (const bad in replacements) {
    out = out.split(bad).join(replacements[bad]);
  }

  return out
    .split("")
    .map((c) => (c.charCodeAt(0) > 255 ? "?" : c))
    .join("");
}

// -------------------------------------------------------------
// SYSTEM BLOCK
// -------------------------------------------------------------
export function buildSystemBlock(domain: string, extras?: string) {
  const systemText = sanitizeASCII(
    buildSolaceSystemPrompt(domain as any, extras)
  );

  return {
    role: "system",
    content: [
      {
        type: "input_text",
        text: systemText,
      },
    ],
  };
}

// -------------------------------------------------------------
// USER CONTEXT ASSEMBLER
// -------------------------------------------------------------
export function assemblePrompt(context: any, history: any[], userMessage: string) {
  const safeJson = (obj: any) => {
    try {
      return sanitizeASCII(JSON.stringify(obj, null, 2));
    } catch {
      return "[]";
    }
  };

  const blockText = `
[User Message]
${sanitizeASCII(userMessage)}

[Persona]
${sanitizeASCII(context.persona || "Solace")}

[Facts]
${safeJson(context.memoryPack?.facts)}

[Episodic Memories]
${safeJson(context.memoryPack?.episodic)}

[Autobiography]
${safeJson(context.memoryPack?.autobiography)}

[News Digest]
${safeJson(context.newsDigest)}

[Research Context]
${safeJson(context.researchContext)}

[Did Research]
${context.didResearch ? "yes" : "no"}

[Chat History]
${safeJson(history)}
  `.trim();

  return [
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: sanitizeASCII(blockText),
        },
      ],
    },
  ];
}


