// ------------------------------------------------------------
// Solace Resolution Permissions
// ------------------------------------------------------------
// Viewer vs Player Access Control
//
// Purpose:
// - Enforce read/write boundaries
// - Prevent replay or viewers from mutating canon
// ------------------------------------------------------------

export type ResolutionRole = "player" | "viewer";

export interface ResolutionPermissions {
  canView: boolean;
  canReplay: boolean;
  canAppend: boolean;
}

export function getPermissions(
  role: ResolutionRole,
  isComplete: boolean
): ResolutionPermissions {
  if (role === "viewer") {
    return {
      canView: true,
      canReplay: true,
      canAppend: false,
    };
  }

  // player
  return {
    canView: true,
    canReplay: isComplete,
    canAppend: !isComplete,
  };
}

export function assertCanAppend(
  role: ResolutionRole,
  isComplete: boolean
) {
  const perms = getPermissions(role, isComplete);
  if (!perms.canAppend) {
    throw new Error(
      "Permission violation: cannot append resolution"
    );
  }
}
