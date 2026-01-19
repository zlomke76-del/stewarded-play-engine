export type PlanTier = "plus" | "pro_family" | "ministry" | "enterprise";

export async function getEntitlements(cookie?: string) {
  // Server-side fetch in real app; placeholder returns paid=true for demo
  return { isSignedIn: true, plan: "plus" as PlanTier, isPaid: true };
}

export async function getWorkspaceContext() {
  return { activeSpaceId: null, persona: "Neutral", memoryBytes: 0 };
}
