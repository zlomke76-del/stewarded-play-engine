"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type HeroAttributeKey =
  | "strength"
  | "dexterity"
  | "constitution"
  | "intelligence"
  | "wisdom"
  | "charisma";

type HeroAttributes = Record<HeroAttributeKey, number>;

type HeroSkill = {
  id: string;
  label: string;
  value: number;
  attribute: HeroAttributeKey;
};

type HeroWeaponSummary = {
  name: string;
  category: string;
  trait: string;
  damage: string;
  broken?: boolean;
};

type HeroArmorSummary = {
  name: string;
  category: string;
  acBase: number;
};

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
  xpCurrent?: number;
  xpToNextLevel?: number;
  attributes?: HeroAttributes;
  skills?: HeroSkill[];
  classFeatures?: string[];
  weapon?: HeroWeaponSummary | null;
  armor?: HeroArmorSummary | null;
  attackBonus?: number;
};

type HeroXpGainDetail = {
  xp: number;
};

const HERO_STATUS_XP_TARGET_ID = "eof-active-hero-xp-target";
const COLLAPSED_SKILL_COUNT = 3;

function getHeroInitials(heroName: string) {
  const words = String(heroName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "H";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}

function getDefaultXpToNextLevel(level: number) {
  const safeLevel = Math.max(1, Number(level) || 1);
  return 100 + (safeLevel - 1) * 50;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function attributeAbbrev(key: HeroAttributeKey) {
  if (key === "strength") return "STR";
  if (key === "dexterity") return "DEX";
  if (key === "constitution") return "CON";
  if (key === "intelligence") return "INT";
  if (key === "wisdom") return "WIS";
  return "CHA";
}

function abilityModifier(score: number) {
  return Math.floor((Number(score || 0) - 10) / 2);
}

function normalizeKey(value: string) {
  return String(value ?? "").trim().toLowerCase();
}

function StatCard(props: {
  label: string;
  value: string;
  tone: string;
  warning?: boolean;
}) {
  const { label, value, tone, warning = false } = props;

  return (
    <div
      style={{
        padding: "11px 13px",
        borderRadius: 16,
        border: warning
          ? "1px solid rgba(255,132,132,0.18)"
          : "1px solid rgba(255,255,255,0.08)",
        background: warning
          ? "linear-gradient(180deg, rgba(188,118,118,0.16), rgba(255,255,255,0.02))"
          : `linear-gradient(180deg, ${tone}, rgba(255,255,255,0.02))`,
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
        {label}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 900,
          lineHeight: 1,
          color: "rgba(245,236,216,0.97)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function InfoChip(props: {
  label: string;
  tone?: "neutral" | "warn" | "accent" | "blessing";
}) {
  const { label, tone = "neutral" } = props;

  const style =
    tone === "warn"
      ? {
          border: "1px solid rgba(255,140,140,0.22)",
          background: "rgba(255,140,140,0.10)",
          color: "rgba(255,226,226,0.96)",
        }
      : tone === "accent"
        ? {
            border: "1px solid rgba(214,188,120,0.18)",
            background: "rgba(214,188,120,0.08)",
            color: "rgba(245,236,216,0.94)",
          }
        : tone === "blessing"
          ? {
              border: "1px solid rgba(255,220,138,0.28)",
              background:
                "linear-gradient(180deg, rgba(214,188,120,0.18), rgba(214,188,120,0.08))",
              color: "rgba(255,245,220,0.98)",
            }
          : {
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(232,236,244,0.88)",
            };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "7px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1.2,
        ...style,
      }}
    >
      {label}
    </span>
  );
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
    xpCurrent,
    xpToNextLevel,
    attributes,
    skills = [],
    classFeatures = [],
    weapon,
    armor,
    attackBonus,
  } = props;

  const heroInitials = getHeroInitials(heroName);

  const resolvedXpToNextLevel = useMemo(() => {
    return Math.max(1, xpToNextLevel ?? getDefaultXpToNextLevel(level));
  }, [level, xpToNextLevel]);

  const initialXpCurrent = useMemo(() => {
    const value = xpCurrent ?? 0;
    return Math.max(0, Math.min(value, resolvedXpToNextLevel));
  }, [xpCurrent, resolvedXpToNextLevel]);

  const [displayLevel, setDisplayLevel] = useState(level);
  const [displayXp, setDisplayXp] = useState(initialXpCurrent);
  const [xpImpactVisible, setXpImpactVisible] = useState(false);
  const [xpGainLabel, setXpGainLabel] = useState<string | null>(null);
  const [levelUpLabel, setLevelUpLabel] = useState<string | null>(null);
  const [skillsExpanded, setSkillsExpanded] = useState(false);

  const impactTimerRef = useRef<number | null>(null);
  const gainTimerRef = useRef<number | null>(null);
  const levelUpTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setDisplayLevel(level);
  }, [level]);

  useEffect(() => {
    setDisplayXp(initialXpCurrent);
  }, [initialXpCurrent]);

  useEffect(() => {
    function handleXpGain(event: Event) {
      const customEvent = event as CustomEvent<HeroXpGainDetail>;
      const gainedXp = Math.max(0, Number(customEvent.detail?.xp) || 0);
      if (!gainedXp) return;

      if (impactTimerRef.current !== null) {
        window.clearTimeout(impactTimerRef.current);
      }
      if (gainTimerRef.current !== null) {
        window.clearTimeout(gainTimerRef.current);
      }
      if (levelUpTimerRef.current !== null) {
        window.clearTimeout(levelUpTimerRef.current);
      }

      setXpImpactVisible(true);
      setXpGainLabel(`+${gainedXp} XP`);

      setDisplayXp((prevXp) => {
        let workingXp = prevXp + gainedXp;
        let leveledUp = false;

        while (workingXp >= resolvedXpToNextLevel) {
          workingXp -= resolvedXpToNextLevel;
          leveledUp = true;
        }

        if (leveledUp) {
          setDisplayLevel((prevLevel) => prevLevel + 1);
          setLevelUpLabel("Level Up");
          levelUpTimerRef.current = window.setTimeout(() => {
            setLevelUpLabel(null);
            levelUpTimerRef.current = null;
          }, 2200);
        }

        return workingXp;
      });

      impactTimerRef.current = window.setTimeout(() => {
        setXpImpactVisible(false);
        impactTimerRef.current = null;
      }, 1200);

      gainTimerRef.current = window.setTimeout(() => {
        setXpGainLabel(null);
        gainTimerRef.current = null;
      }, 1800);
    }

    window.addEventListener("eof:hero-xp-gain", handleXpGain as EventListener);

    return () => {
      window.removeEventListener("eof:hero-xp-gain", handleXpGain as EventListener);

      if (impactTimerRef.current !== null) {
        window.clearTimeout(impactTimerRef.current);
      }
      if (gainTimerRef.current !== null) {
        window.clearTimeout(gainTimerRef.current);
      }
      if (levelUpTimerRef.current !== null) {
        window.clearTimeout(levelUpTimerRef.current);
      }
    };
  }, [resolvedXpToNextLevel]);

  const xpProgress = clamp01(displayXp / resolvedXpToNextLevel);

  const sortedSkills = useMemo(() => {
    return [...skills].sort((a, b) => b.value - a.value).slice(0, 6);
  }, [skills]);

  const visibleFeatures = classFeatures.slice(0, 4);

  const attributeRows = useMemo(() => {
    if (!attributes) return [];
    return (
      [
        "strength",
        "dexterity",
        "constitution",
        "intelligence",
        "wisdom",
        "charisma",
      ] as HeroAttributeKey[]
    ).map((key) => ({
      key,
      label: attributeAbbrev(key),
      value: attributes[key],
      mod: abilityModifier(attributes[key]),
    }));
  }, [attributes]);

  const weaponBroken = Boolean(weapon?.broken);
  const weaponNameKey = normalizeKey(weapon?.name ?? "");
  const recoveredWeapon =
    Boolean(weapon) &&
    !weaponBroken &&
    weaponNameKey.length > 0 &&
    weaponNameKey !== "starter weapon" &&
    weaponNameKey !== "iron longsword" &&
    weaponNameKey !== "quick dagger" &&
    weaponNameKey !== "apprentice staff" &&
    weaponNameKey !== "sanctified mace" &&
    weaponNameKey !== "hunter bow" &&
    weaponNameKey !== "oathblade" &&
    weaponNameKey !== "rapier" &&
    weaponNameKey !== "oak staff" &&
    weaponNameKey !== "bo staff" &&
    weaponNameKey !== "infused sidearm" &&
    weaponNameKey !== "rough axe" &&
    weaponNameKey !== "focus wand" &&
    weaponNameKey !== "pact rod";

  const attackLabel =
    typeof attackBonus === "number"
      ? attackBonus >= 0
        ? `+${attackBonus}`
        : `${attackBonus}`
      : "—";

  const hpRatio = hpMax > 0 ? hpCurrent / hpMax : 0;
  const hpTone =
    hpRatio <= 0.25
      ? "rgba(188,118,118,0.18)"
      : hpRatio <= 0.5
        ? "rgba(214,188,120,0.14)"
        : "rgba(118,188,132,0.12)";

  const weaponPanelTone = weaponBroken
    ? {
        background:
          "linear-gradient(180deg, rgba(188,118,118,0.12), rgba(255,255,255,0.03))",
        border: "1px solid rgba(255,132,132,0.18)",
      }
    : recoveredWeapon
      ? {
          background:
            "linear-gradient(180deg, rgba(214,188,120,0.14), rgba(255,255,255,0.03))",
          border: "1px solid rgba(255,220,138,0.20)",
        }
      : {
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.05)",
        };

  const journeyLine = weaponBroken
    ? "The first victory cost steel. A better weapon must be found deeper in the dungeon."
    : recoveredWeapon
      ? "A recovered weapon now carries the descent forward. The hero enters the next chamber with renewed intent."
      : "The Chronicle bears witness as you enter the dark.";

  const hasHiddenSkills = sortedSkills.length > COLLAPSED_SKILL_COUNT;
  const displayedSkills = skillsExpanded
    ? sortedSkills
    : sortedSkills.slice(0, COLLAPSED_SKILL_COUNT);
  const hiddenSkillCount = Math.max(0, sortedSkills.length - COLLAPSED_SKILL_COUNT);

  return (
    <div
      data-eof-hero-xp-target={HERO_STATUS_XP_TARGET_ID}
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
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: xpImpactVisible ? 1 : 0,
          transition: "opacity 240ms ease",
          background:
            "radial-gradient(circle at 24% 18%, rgba(255,210,120,0.16), transparent 22%), radial-gradient(circle at 48% 32%, rgba(255,210,120,0.10), transparent 28%), radial-gradient(circle at 80% 16%, rgba(255,210,120,0.08), transparent 22%)",
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
                border: recoveredWeapon
                  ? "1px solid rgba(255,220,138,0.28)"
                  : "1px solid rgba(214,188,120,0.24)",
                background:
                  "radial-gradient(circle at 50% 30%, rgba(214,188,120,0.18), rgba(24,28,40,0.96) 70%)",
                boxShadow:
                  recoveredWeapon
                    ? "0 10px 28px rgba(0,0,0,0.24), 0 0 18px rgba(255,208,120,0.10), inset 0 1px 0 rgba(255,255,255,0.05)"
                    : "0 10px 28px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.05)",
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

            <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
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
                {species} · {className} · Level {displayLevel}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <InfoChip
                  label={`Attack ${attackLabel}`}
                  tone={weaponBroken ? "warn" : recoveredWeapon ? "blessing" : "accent"}
                />
                {weaponBroken ? <InfoChip label="Weapon Broken" tone="warn" /> : null}
                {recoveredWeapon ? <InfoChip label="Recovered Armament" tone="blessing" /> : null}
                {armor?.name ? <InfoChip label={armor.name} /> : null}
              </div>

              <div
                style={{
                  position: "relative",
                  display: "grid",
                  gap: 6,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: 0.8,
                      textTransform: "uppercase",
                      color: "rgba(214,188,120,0.78)",
                    }}
                  >
                    Progress to Level {Math.min(displayLevel + 1, 30)}
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(232,236,244,0.68)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {displayXp} / {resolvedXpToNextLevel} XP
                  </div>
                </div>

                <div
                  style={{
                    position: "relative",
                    height: 12,
                    borderRadius: 999,
                    overflow: "hidden",
                    border: "1px solid rgba(214,188,120,0.16)",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
                    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.30)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: `${xpProgress * 100}%`,
                      transition:
                        "width 900ms cubic-bezier(0.22, 1, 0.36, 1), filter 220ms ease",
                      background:
                        "linear-gradient(90deg, rgba(196,138,54,0.98), rgba(235,199,112,0.98) 55%, rgba(255,233,170,0.98))",
                      boxShadow:
                        xpImpactVisible
                          ? "0 0 18px rgba(255,208,120,0.42)"
                          : "0 0 10px rgba(255,208,120,0.24)",
                      filter: xpImpactVisible ? "brightness(1.08)" : "none",
                    }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.00) 55%)",
                      pointerEvents: "none",
                    }}
                  />
                </div>

                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: -2,
                    display: "grid",
                    gap: 6,
                    justifyItems: "end",
                    pointerEvents: "none",
                  }}
                >
                  {xpGainLabel ? (
                    <div
                      style={{
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: "1px solid rgba(214,188,120,0.22)",
                        background: "rgba(214,188,120,0.10)",
                        color: "rgba(255,240,198,0.98)",
                        fontSize: 11,
                        fontWeight: 900,
                        boxShadow: "0 8px 18px rgba(0,0,0,0.20)",
                      }}
                    >
                      {xpGainLabel}
                    </div>
                  ) : null}

                  {levelUpLabel ? (
                    <div
                      style={{
                        padding: "7px 11px",
                        borderRadius: 999,
                        border: "1px solid rgba(255,220,138,0.28)",
                        background:
                          "linear-gradient(180deg, rgba(214,188,120,0.18), rgba(214,188,120,0.08))",
                        color: "rgba(255,245,220,0.98)",
                        fontSize: 11,
                        fontWeight: 900,
                        letterSpacing: 0.7,
                        textTransform: "uppercase",
                        boxShadow: "0 10px 24px rgba(0,0,0,0.24)",
                      }}
                    >
                      {levelUpLabel}
                    </div>
                  ) : null}
                </div>
              </div>

              <div
                style={{
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: weaponBroken
                    ? "rgba(255,188,188,0.86)"
                    : recoveredWeapon
                      ? "rgba(255,231,174,0.90)"
                      : "rgba(214,188,120,0.78)",
                }}
              >
                {journeyLine}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "8px 10px",
              borderRadius: 999,
              border: recoveredWeapon
                ? "1px solid rgba(255,220,138,0.24)"
                : "1px solid rgba(214,188,120,0.20)",
              background: recoveredWeapon
                ? "linear-gradient(180deg, rgba(214,188,120,0.16), rgba(214,188,120,0.08))"
                : "rgba(214,188,120,0.08)",
              fontSize: 11,
              letterSpacing: 0.9,
              textTransform: "uppercase",
              fontWeight: 800,
              color: "rgba(245,236,216,0.96)",
              whiteSpace: "nowrap",
              alignSelf: "start",
            }}
          >
            {recoveredWeapon ? "The Chronicle Arms You" : "The Chronicle Remembers"}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 10,
          }}
        >
          <StatCard label="HP" value={`${hpCurrent}/${hpMax}`} tone={hpTone} />
          <StatCard label="AC" value={String(ac)} tone="rgba(126,150,196,0.12)" />
          <StatCard
            label="Initiative"
            value={initiativeMod >= 0 ? `+${initiativeMod}` : `${initiativeMod}`}
            tone="rgba(118,188,132,0.12)"
          />
          <StatCard
            label="Attack"
            value={attackLabel}
            tone={recoveredWeapon ? "rgba(214,188,120,0.14)" : "rgba(214,188,120,0.10)"}
            warning={weaponBroken}
          />
        </div>

        {attributeRows.length > 0 ? (
          <div
            style={{
              padding: "14px 14px 12px",
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.08)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))",
              display: "grid",
              gap: 10,
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: 1,
                textTransform: "uppercase",
                opacity: 0.62,
              }}
            >
              Attributes
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                gap: 8,
              }}
            >
              {attributeRows.map((item) => (
                <div
                  key={item.key}
                  style={{
                    padding: "10px 11px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(255,255,255,0.03)",
                    display: "grid",
                    gap: 5,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: 0.8,
                      textTransform: "uppercase",
                      opacity: 0.6,
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      alignItems: "baseline",
                    }}
                  >
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
                    <div
                      style={{
                        fontSize: 12,
                        lineHeight: 1,
                        color: "rgba(226,230,238,0.74)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.mod >= 0 ? `+${item.mod}` : `${item.mod}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr)",
            gap: 10,
          }}
        >
          <div
            style={{
              padding: "14px 14px 12px",
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.08)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))",
              display: "grid",
              gap: 10,
              minWidth: 0,
              alignContent: "start",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  opacity: 0.62,
                }}
              >
                Skills
              </div>

              {sortedSkills.length > 0 ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                  }}
                >
                  {!skillsExpanded && hasHiddenSkills ? (
                    <span
                      style={{
                        fontSize: 11,
                        color: "rgba(214,188,120,0.78)",
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      +{hiddenSkillCount} more
                    </span>
                  ) : null}

                  {hasHiddenSkills ? (
                    <button
                      type="button"
                      onClick={() => setSkillsExpanded((prev) => !prev)}
                      aria-expanded={skillsExpanded}
                      style={{
                        appearance: "none",
                        border: "1px solid rgba(214,188,120,0.18)",
                        background: "rgba(214,188,120,0.08)",
                        color: "rgba(245,236,216,0.94)",
                        borderRadius: 999,
                        padding: "7px 10px",
                        fontSize: 11,
                        fontWeight: 800,
                        lineHeight: 1,
                        letterSpacing: 0.6,
                        textTransform: "uppercase",
                        cursor: "pointer",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {skillsExpanded ? "Hide Skills" : "Show All Skills"}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            {sortedSkills.length > 0 ? (
              <div style={{ display: "grid", gap: 7 }}>
                {displayedSkills.map((skill) => (
                  <div
                    key={skill.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      padding: "8px 10px",
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "rgba(245,236,216,0.95)",
                        }}
                      >
                        {skill.label}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          opacity: 0.56,
                          textTransform: "uppercase",
                          letterSpacing: 0.7,
                        }}
                      >
                        {attributeAbbrev(skill.attribute)}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 900,
                        whiteSpace: "nowrap",
                        color: "rgba(232,236,244,0.88)",
                      }}
                    >
                      {skill.value >= 0 ? `+${skill.value}` : `${skill.value}`}
                    </div>
                  </div>
                ))}

                {!skillsExpanded && hasHiddenSkills ? (
                  <div
                    style={{
                      padding: "8px 10px",
                      borderRadius: 12,
                      border: "1px dashed rgba(214,188,120,0.16)",
                      background: "rgba(214,188,120,0.04)",
                      fontSize: 12,
                      lineHeight: 1.45,
                      color: "rgba(214,188,120,0.82)",
                    }}
                  >
                    {hiddenSkillCount} additional skill{hiddenSkillCount === 1 ? "" : "s"} hidden.
                    Expand to review the full list.
                  </div>
                ) : null}
              </div>
            ) : (
              <div style={{ fontSize: 12, opacity: 0.68 }}>
                No trained skills recorded.
              </div>
            )}
          </div>

          <div
            style={{
              padding: "14px 14px 12px",
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.08)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))",
              display: "grid",
              gap: 10,
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: 1,
                textTransform: "uppercase",
                opacity: 0.62,
              }}
            >
              Equipment
            </div>

            <div
              style={{
                display: "grid",
                gap: 8,
              }}
            >
              <div
                style={{
                  padding: "9px 10px",
                  borderRadius: 12,
                  ...weaponPanelTone,
                  display: "grid",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    opacity: 0.58,
                    textTransform: "uppercase",
                    letterSpacing: 0.7,
                  }}
                >
                  Weapon
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: weaponBroken
                        ? "rgba(255,220,220,0.98)"
                        : recoveredWeapon
                          ? "rgba(255,245,220,0.98)"
                          : "rgba(245,236,216,0.95)",
                    }}
                  >
                    {weapon?.name ?? "Unarmed"}
                  </div>
                  {weaponBroken ? <InfoChip label="Broken" tone="warn" /> : null}
                  {recoveredWeapon ? <InfoChip label="Recovered" tone="blessing" /> : null}
                </div>
                <div style={{ fontSize: 12, opacity: 0.76, lineHeight: 1.5 }}>
                  {weapon ? `${weapon.category} · ${weapon.damage}` : "No weapon equipped"}
                </div>
                {weapon?.trait ? (
                  <div
                    style={{
                      fontSize: 12,
                      opacity: recoveredWeapon ? 0.82 : 0.66,
                      lineHeight: 1.45,
                      color: recoveredWeapon ? "rgba(255,231,174,0.90)" : undefined,
                    }}
                  >
                    {weapon.trait}
                  </div>
                ) : null}
              </div>

              <div
                style={{
                  padding: "9px 10px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  display: "grid",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    opacity: 0.58,
                    textTransform: "uppercase",
                    letterSpacing: 0.7,
                  }}
                >
                  Armor
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "rgba(245,236,216,0.95)",
                  }}
                >
                  {armor?.name ?? "Traveler's Clothes"}
                </div>
                <div style={{ fontSize: 12, opacity: 0.76, lineHeight: 1.5 }}>
                  {armor ? `${armor.category} · AC ${armor.acBase}` : "Light civilian wear"}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "14px 14px 12px",
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.08)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))",
              display: "grid",
              gap: 10,
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: 1,
                textTransform: "uppercase",
                opacity: 0.62,
              }}
            >
              Class Features
            </div>

            {visibleFeatures.length > 0 ? (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {visibleFeatures.map((feature) => (
                  <span
                    key={feature}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "7px 10px",
                      borderRadius: 999,
                      border: "1px solid rgba(214,188,120,0.16)",
                      background: "rgba(214,188,120,0.08)",
                      fontSize: 12,
                      fontWeight: 700,
                      lineHeight: 1.2,
                      color: "rgba(245,236,216,0.94)",
                    }}
                  >
                    {feature}
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, opacity: 0.68 }}>
                No class features unlocked yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
