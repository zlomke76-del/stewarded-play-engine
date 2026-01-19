type BlockKind = "profiles" | "subs" | "memories" | "spaces" | "support" | "caps";
type Variant = "marketing" | "product";

export function BlockCard({ kind, variant, onClick }:{ kind: BlockKind; variant: Variant; onClick?: () => void }) {
  const labelMap: Record<BlockKind, string> = {
    profiles: "Profiles & Personas",
    subs: "Subscriptions & Entitlements",
    memories: "Memories (Context Store)",
    spaces: "Spaces & Threads",
    support: "Support & Requests",
    caps: "Caps & Limits",
  };
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl p-4 shadow ${variant === "marketing" ? "hover:scale-[1.01]" : ""}`}
      aria-label={labelMap[kind]}
    >
      <div className="text-sm opacity-70">{variant}</div>
      <div className="text-lg font-semibold">{labelMap[kind]}</div>
    </button>
  );
}
