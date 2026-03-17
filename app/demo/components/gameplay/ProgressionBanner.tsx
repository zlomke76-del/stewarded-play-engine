"use client";

type Props = {
  demo: any;
};

export default function ProgressionBanner({ demo }: Props) {
  const banner =
    typeof demo.progressionInspectorBanner === "string"
      ? demo.progressionInspectorBanner
      : "";

  const summary = demo.progressionInspectorSummary ?? null;
  const progression = demo.progression ?? null;

  if (!banner || !summary || !progression) return null;

  const heroLevel = summary.hero?.level ?? progression.hero?.level ?? 1;
  const masteryUnlocked = Boolean(
    summary.hero?.masteryUnlocked ?? progression.hero?.masteryUnlocked
  );
  const partyActive =
    summary.party?.activeSlots ?? progression.party?.activeSlots ?? 1;
  const partyMax = summary.party?.maxSlots ?? progression.party?.maxSlots ?? 6;
  const inventoryUsed =
    summary.inventory?.usedSlots ?? progression.inventory?.usedSlots ?? 0;
  const inventoryTotal =
    summary.inventory?.totalSlots ?? progression.inventory?.totalSlots ?? 0;
  const cryptCleared = Boolean(
    summary.campaign?.cryptFullyCleared ??
      progression.campaign?.cryptFullyCleared
  );
  const finalReady = Boolean(
    summary.campaign?.finalDescentUnlocked ??
      progression.campaign?.finalDescentUnlocked
  );
  const fullFellowship = Boolean(
    summary.campaign?.fullFellowshipAssembled ??
      progression.campaign?.fullFellowshipAssembled
  );
  const relicBonded = summary.relics?.bondedCount ?? 0;
  const fallen =
    summary.party?.fallenMembers ?? progression.party?.fallenMembers ?? 0;

  const statusTone = finalReady
    ? {
        edge: "rgba(167, 219, 174, 0.34)",
        glow: "rgba(120, 196, 128, 0.20)",
        text: "rgba(214, 245, 220, 0.96)",
        chip: "rgba(120, 196, 128, 0.12)",
      }
    : masteryUnlocked
      ? {
          edge: "rgba(214, 188, 120, 0.34)",
          glow: "rgba(214, 188, 120, 0.16)",
          text: "rgba(245, 236, 216, 0.96)",
          chip: "rgba(214, 188, 120, 0.10)",
        }
      : {
          edge: "rgba(126, 150, 196, 0.30)",
          glow: "rgba(92, 116, 168, 0.16)",
          text: "rgba(232, 236, 245, 0.95)",
          chip: "rgba(126, 150, 196, 0.10)",
        };

  const statusLabel = finalReady
    ? "Final Descent Ready"
    : cryptCleared
      ? "Crypt Cleared"
      : fullFellowship
        ? "Fellowship Complete"
        : "Fellowship Forming";

  const subtitle = finalReady
    ? "Six stand together. The lower law answers."
    : cryptCleared
      ? "The crypt has fallen silent. Only the final threshold remains."
      : fullFellowship
        ? "The company is assembled. Mastery now decides the road."
        : "The Chronicle is still gathering its living names.";

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 22,
        border: `1px solid ${statusTone.edge}`,
        background:
          "radial-gradient(circle at top left, rgba(214,188,120,0.16), transparent 34%), radial-gradient(circle at top right, rgba(96,116,171,0.14), transparent 30%), linear-gradient(180deg, rgba(16,18,28,0.96), rgba(9,11,18,0.92))",
        boxShadow: `0 18px 48px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px ${statusTone.glow}`,
      }}
    >
      <div
        style={{
          position: "relative",
          display: "grid",
          gap: 14,
          padding: "16px 16px 14px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                opacity: 0.62,
              }}
            >
              Chronicle Status
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  lineHeight: 1.1,
                  color: statusTone.text,
                }}
              >
                {statusLabel}
              </div>

              <div
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: `1px solid ${statusTone.edge}`,
                  background: statusTone.chip,
                  fontSize: 11,
                  letterSpacing: 0.9,
                  textTransform: "uppercase",
                  fontWeight: 800,
                  color: statusTone.text,
                  whiteSpace: "nowrap",
                }}
              >
                {heroLevel >= 30 ? "Level 30 Mastery" : `Hero Level ${heroLevel}`}
              </div>
            </div>

            <div
              style={{
                fontSize: 13,
                lineHeight: 1.55,
                color: "rgba(229, 232, 240, 0.82)",
                maxWidth: 760,
              }}
            >
              {subtitle}
            </div>
          </div>

          <div
            style={{
              minWidth: 220,
              padding: "10px 12px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.08)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025))",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
              display: "grid",
              gap: 6,
            }}
          >
            <div
              style={{
                fontSize: 10,
                letterSpacing: 1.1,
                textTransform: "uppercase",
                opacity: 0.55,
              }}
            >
              Live Banner
            </div>
            <div
              style={{
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
                fontSize: 12,
                lineHeight: 1.5,
                color: "rgba(238, 239, 242, 0.92)",
                wordBreak: "break-word",
              }}
            >
              {banner}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 10,
          }}
        >
          {[
            {
              label: "Fellowship",
              value: `${partyActive}/${partyMax}`,
              hint: fullFellowship ? "Complete" : "Still gathering",
            },
            {
              label: "Inventory",
              value: `${inventoryUsed}/${inventoryTotal}`,
              hint:
                inventoryTotal > 0
                  ? `${Math.max(0, inventoryTotal - inventoryUsed)} free slots`
                  : "No storage",
            },
            {
              label: "Bonded Relics",
              value: String(relicBonded),
              hint: relicBonded > 0 ? "Lineage forming" : "None bonded yet",
            },
            {
              label: "Fallen",
              value: String(fallen),
              hint: fallen > 0 ? "The Chronicle remembers" : "No losses recorded",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: "11px 13px",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.018))",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                display: "grid",
                gap: 4,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: 0.9,
                  textTransform: "uppercase",
                  opacity: 0.6,
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  lineHeight: 1,
                  color: "rgba(245,236,216,0.97)",
                }}
              >
                {item.value}
              </div>
              <div
                style={{
                  fontSize: 12,
                  lineHeight: 1.45,
                  color: "rgba(225, 228, 236, 0.72)",
                }}
              >
                {item.hint}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
