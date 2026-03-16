"use client";

import type { ReactNode } from "react";

type Props = {
  heroName: string;
  species: string;
  className: string;
  level: number;
  hpCurrent: number;
  hpMax: number;
  ac: number;
  initiativeMod: number;
  heroVisual?: ReactNode;
  heroPortraitSrc?: string;
};

function getHeroInitials(heroName: string) {
  const words = String(heroName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "H";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}

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
    heroVisual,
    heroPortraitSrc,
  } = props;

  const heroInitials = getHeroInitials(heroName);

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
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(90deg, rgba(214,188,120,0.06), transparent 24%, transparent 76%, rgba(214,188,120,0.03))",
        }}
      />

      <div
        style={{
          position: "relative",
          padding: "16px 16px 14px",
          display: "grid",
          gap: 14,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto",
            gap: 16,
            alignItems: "start",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "88px minmax(0, 1fr)",
              gap: 14,
              alignItems: "center",
              minWidth: 0,
            }}
          >
            <div
              aria-label={`${heroName} portrait`}
              style={{
                width: 88,
                height: 88,
                borderRadius: 18,
                overflow: "hidden",
                border: "1px solid rgba(214,188,120,0.24)",
                background:
                  "radial-gradient(circle at 50% 30%, rgba(214,188,120,0.18), rgba(24,28,40,0.96) 70%)",
                boxShadow:
                  "0 10px 28px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.05)",
                display: "grid",
                placeItems: "center",
              }}
            >
              {heroVisual ? (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(0,0,0,0.14)",
                  }}
                >
                  {heroVisual}
                </div>
              ) : heroPortraitSrc ? (
                <img
                  src={heroPortraitSrc}
                  alt={`${heroName} portrait`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 999,
                    border: "1px solid rgba(214,188,120,0.20)",
                    background:
                      "radial-gradient(circle at 50% 35%, rgba(214,188,120,0.22), rgba(214,188,120,0.06) 60%, rgba(255,255,255,0.02) 100%)",
                    display: "grid",
                    placeItems: "center",
                    color: "rgba(245,236,216,0.96)",
                    fontSize: 20,
                    fontWeight: 900,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  {heroInitials}
                </div>
              )}
            </div>

            <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
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
                  fontSize: 26,
                  fontWeight: 900,
                  lineHeight: 1.02,
                  color: "rgba(245,236,216,0.98)",
                  wordBreak: "break-word",
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

              <div
                style={{
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: "rgba(214,188,120,0.78)",
                }}
              >
                The Chronicle bears witness as you enter the dark.
              </div>
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
              alignSelf: "start",
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
