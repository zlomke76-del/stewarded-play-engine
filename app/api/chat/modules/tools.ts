// modules/tools.ts

import { remember } from "@/lib/memory";
import { classifyMemoryAtWriteTime } from "@/lib/memory-intelligence";

export async function executeTool(toolName: string, args: any, userKey: string) {
  switch (toolName) {
    case "memory.write": {
      const { content } = args;

      const classification = await classifyMemoryAtWriteTime(content);

      const saved = await remember({
        user_key: userKey,
        content,
        title: null,
        purpose: classification.label,
        workspace_id: null,
      });

      return { ok: true, saved };
    }

    default:
      return { ok: false, error: `Unknown tool: ${toolName}` };
  }
}
