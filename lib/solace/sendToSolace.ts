// ============================================================
// Solace Client Submit — AUTHORITATIVE
// ============================================================
// - Enforces shape-level authority
// - Prevents tunneling actions through `message`
// - Supports chat turns AND explicit commands
// ============================================================

export type SolaceChatTurn = {
  message: string;
  conversationId: string;
  canonicalUserKey: string;
  workspaceId?: string;
  ministryMode?: boolean;
  founderMode?: boolean;
  modeHint?: string;
};

export type RolodexAddCommand = {
  action: "rolodex.add";
  payload: {
    name: string;
    primary_email?: string;
    primary_phone?: string;
    notes?: string;
    relationship_type?: string;
    birthday?: string;
    sensitivity_level?: number;
    consent_level?: number;
  };
  conversationId: string;
  canonicalUserKey: string;
  workspaceId?: string;
  ministryMode?: boolean;
  founderMode?: boolean;
  modeHint?: string;
};

export type SolaceRequest = SolaceChatTurn | RolodexAddCommand;

/* ============================================================
 * SAFETY GUARDS
 * ============================================================ */

function assertNoAuthorityInMessage(req: any) {
  if (
    typeof req?.message === "string" &&
    (req.message.includes('"action"') ||
      req.message.includes("'action'"))
  ) {
    throw new Error(
      "Authority detected inside `message`. Commands must be sent as top-level actions."
    );
  }
}

function assertValidShape(req: any) {
  if ("action" in req) {
    if (!req.action || typeof req.action !== "string") {
      throw new Error("Invalid action shape");
    }
    if (!req.payload || typeof req.payload !== "object") {
      throw new Error("Action requires payload");
    }
  } else {
    if (!req.message || typeof req.message !== "string") {
      throw new Error("Chat turn requires message");
    }
  }
}

/* ============================================================
 * SUBMIT
 * ============================================================ */

export async function sendToSolace(req: SolaceRequest) {
  assertNoAuthorityInMessage(req);
  assertValidShape(req);

  const res = await fetch("/api/chat", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Solace request failed: ${text}`);
  }

  return res.json();
}
