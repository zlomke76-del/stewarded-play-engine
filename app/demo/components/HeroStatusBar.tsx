"use client";

type Props = {
  heroName: string;
  species: string;
  className: string;
  level: number;
  hpCurrent: number;
  hpMax: number;
  ac: number;
  initiativeMod: number;
};

export default function HeroStatusBar(props: Props) {
  const {
    heroName,
    species,
    className,
    level,
    hpCurrent,
    hpMax,
    ac,
    initiativeMod,
  } = props;

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 22,
        border: "1px solid rgba(214, 188, 120, 0.18)",
        background:
          "radial-gradient(circle at top left, rgba(214,188,120,0.12), transparent 32%), linear-gradient(180deg, rgba(16,18,28,0.96), rgba(10,12,20,0.92))",
        boxShadow:
          "0 18px 48px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div
        style={{
          padding: "16px 16px 14px",
          display: "grid",
          gap: 12,
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
          <div style={{ display: "grid", gap: 6 }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: 1,
                textTransform: "uppercase",
                opacity: 0.6,
              }}
            >
              Active Hero
            </div>

            <div
              style={{
                fontSize: 24,
                fontWeight: 900,
                lineHeight: 1.02,
                color: "rgba(245,236,216,0.98)",
              }}
            >
              {heroName}
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.5,
                color: "rgba(228,232,240,0.82)",
              }}
            >
              {species} · {className} · Level {level}
            </div>
          </div>

          <div
            style={{
              padding: "8px 10px",
              borderRadius: 999,
              border: "1px solid rgba(214,188,120,0.20)",
              background: "rgba(214,188,120,0.08)",
              fontSize: 11,
              letterSpacing: 0.9,
              textTransform: "uppercase",
              fontWeight: 800,
              color: "rgba(245,236,216,0.96)",
              whiteSpace: "nowrap",
            }}
          >
            The Chronicle Remembers
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 10,
          }}
        >
          {[
            {
              label: "HP",
              value: `${hpCurrent}/${hpMax}`,
              tone: "rgba(188,118,118,0.12)",
            },
            {
              label: "AC",
              value: String(ac),
              tone: "rgba(126,150,196,0.12)",
            },
            {
              label: "Initiative",
              value: initiativeMod >= 0 ? `+${initiativeMod}` : `${initiativeMod}`,
              tone: "rgba(118,188,132,0.12)",
            },
            {
              label: "Role",
              value: className,
              tone: "rgba(214,188,120,0.10)",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: "11px 13px",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
                background: `linear-gradient(180deg, ${item.tone}, rgba(255,255,255,0.02))`,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                display: "grid",
                gap: 4,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  opacity: 0.58,
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  lineHeight: 1,
                  color: "rgba(245,236,216,0.97)",
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
