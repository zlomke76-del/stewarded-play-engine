// authorityModel.ts
// ------------------------------------------------------------
// Authority Object Model v1.0
// Types + invariants for authority, scope, ratification, break-glass
// No IO, no side effects
// ------------------------------------------------------------

import { UUID, RFC3339 } from "./decisionTrace";

/* ------------------------------------------------------------
   Primitive Types
------------------------------------------------------------ */

export type AuthorityScope =
  | "SYSTEM"
  | "DOMAIN"
  | "WORKSPACE"
  | "OPERATION"
  | "EMERGENCY";

export type AuthorityRole =
  | "HUMAN"
  | "SYSTEM"
  | "OVERSIGHT"
  | "BREAK_GLASS";

export type RatificationMode =
  | "EXPLICIT"
  | "MULTI_PARTY"
  | "TIME_DELAYED";

export type BreakGlassReason =
  | "IMMINENT_HARM"
  | "SYSTEM_FAILURE"
  | "LEGAL_REQUIREMENT";

/* ------------------------------------------------------------
   Authority Instance
------------------------------------------------------------ */

export type AuthorityInstance = {
  authority_id: UUID;
  role: AuthorityRole;
  scope: AuthorityScope;
  ratification_mode: RatificationMode;
  active: boolean;
};

/* ------------------------------------------------------------
   Ratification Record
------------------------------------------------------------ */

export type RatificationRecord = {
  authority_id: UUID;
  ratified_at: RFC3339;
  signature: string;
};

/* ------------------------------------------------------------
   Break-Glass Event
------------------------------------------------------------ */

export type BreakGlassEvent = {
  authority_id: UUID;
  invoked_at: RFC3339;
  reason: BreakGlassReason;
  expires_at: RFC3339;
};

/* ------------------------------------------------------------
   Invariant Validators
------------------------------------------------------------ */

function isRFC3339(value: string): boolean {
  return !isNaN(Date.parse(value));
}

function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

/* ------------------------------------------------------------
   Authority Invariants
------------------------------------------------------------ */

export function validateAuthorityInstance(
  authority: AuthorityInstance
): void {
  if (!isValidUUID(authority.authority_id)) {
    throw new Error("Invalid authority_id UUID");
  }

  if (!authority.active) {
    throw new Error("Inactive authority cannot be used");
  }

  if (
    authority.role === "BREAK_GLASS" &&
    authority.scope !== "EMERGENCY"
  ) {
    throw new Error(
      "BREAK_GLASS authority must have EMERGENCY scope"
    );
  }
}

/* ------------------------------------------------------------
   Ratification Invariants
------------------------------------------------------------ */

export function validateRatification(
  authority: AuthorityInstance,
  ratification: RatificationRecord
): void {
  validateAuthorityInstance(authority);

  if (authority.authority_id !== ratification.authority_id) {
    throw new Error("Ratification authority mismatch");
  }

  if (!isRFC3339(ratification.ratified_at)) {
    throw new Error("Invalid ratification timestamp");
  }

  if (!ratification.signature) {
    throw new Error("Missing ratification signature");
  }
}

/* ------------------------------------------------------------
   Break-Glass Invariants
------------------------------------------------------------ */

export function validateBreakGlass(
  authority: AuthorityInstance,
  event: BreakGlassEvent,
  now: RFC3339
): void {
  validateAuthorityInstance(authority);

  if (authority.role !== "BREAK_GLASS") {
    throw new Error("Authority not permitted to invoke break-glass");
  }

  if (!isRFC3339(event.invoked_at) || !isRFC3339(event.expires_at)) {
    throw new Error("Invalid break-glass timestamps");
  }

  const invoked = Date.parse(event.invoked_at);
  const expires = Date.parse(event.expires_at);
  const current = Date.parse(now);

  if (invoked > current) {
    throw new Error("Break-glass invoked in the future");
  }

  if (expires <= invoked) {
    throw new Error("Break-glass expiry must be after invocation");
  }

  if (current > expires) {
    throw new Error("Break-glass event has expired");
  }
}
