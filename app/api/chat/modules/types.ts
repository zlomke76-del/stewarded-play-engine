// modules/types.ts
// Shared types across the chat system

export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface ChatMessage {
  role: ChatRole;
  content: string;
  name?: string;
}

export interface StreamEvent {
  type: "response" | "error" | "done";
  content?: string;
}

export interface SolaceContextBlock {
  persona: string;
  userKey: string;
  workspaceId: string | null;
  memoryPack?: any;
  newsDigest?: any;
  researchContext?: any;
}

export interface MemoryPackOptions {
  factsLimit: number;
  episodesLimit: number;
}

export interface MemoryInsertRequest {
  user_key: string;
  content: string;
  title?: string | null;
  purpose?: string | null;
  workspace_id?: string | null;
}

export interface ModelCallOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: any;
  tools?: any[];
}

export interface StreamableModelResponse {
  stream: AsyncGenerator<StreamEvent>;
}

export type ToolCall = {
  toolName: string;
  arguments: Record<string, any>;
};

/* ============================================================
   TOOL CALL EXTRACTION — Required by chat route
   ============================================================ */

/**
 * Extracts a tool call block from the first streamed chunk.
 * Supports the standard OpenAI "tool" message format.
 */
export function extractToolCall(chunk: any): ToolCall | null {
  if (!chunk || !chunk.value) return null;

  const msg = chunk.value;

  // New model format: { type: "tool", toolName: string, arguments: any }
  if (msg.type === "tool" && msg.toolName) {
    return {
      toolName: msg.toolName,
      arguments: msg.arguments || {},
    };
  }

  // Legacy format fallback: OpenAI often nests the call in message.tool_calls
  if (msg.tool_calls && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
    const call = msg.tool_calls[0];
    return {
      toolName: call.function?.name || "unknown",
      arguments: call.function?.arguments ? JSON.parse(call.function.arguments) : {},
    };
  }

  return null;
}
