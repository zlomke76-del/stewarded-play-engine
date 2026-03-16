"use client";

import React, { useEffect, useMemo, useState } from "react";
import HeroRitualPortrait from "./hero-ritual/HeroRitualPortrait";
import ModelViewerBootstrap from "./hero-ritual/ModelViewerBootstrap";

type PortraitType = "Male" | "Female";

type StageCombatant = {
  name: string;
  species?: string;
  className?: string;
  portrait?: PortraitType;
  imageSrc?: string | null;
  fallbackImageSrc?: string | null;
  modelSrc?: string | null;
  hpCurrent?: number;
  hpMax?: number;
  ac?: number;
  defeated?: boolean;
  active?: boolean;
};

type TelegraphHint = {
  attackStyleHint?: "volley" | "beam" | "charge" | "unknown";
  targetName?: string;
} | null;

type Props = {
  hero: StageCombatant | null;
  enemy: StageCombatant | null;
  battlefieldImageSrc?: string | null;
  isEnemyTurn: boolean;
  combatEnded: boolean;
  telegraphHint?: TelegraphHint;
  height?: number | string;
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function hpRatio(hpCurrent?: number, hpMax?: number) {
  const max = Math.max(1, Number(hpMax) || 1);
  const cur = Math.max(0, Number(hpCurrent) || 0);
  return clamp01(cur / max);
}

function formatHp(hpCurrent?: number, hpMax?: number) {
  const max = Math.max(1, Number(hpMax) || 1);
  const cur = Math.max(0, Number(hpCurrent) || 0);
  return `${cur} / ${max}`;
}

function titleCase(value: string) {
  return String(value ?? "")
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getTelegraphText(telegraphHint?: TelegraphHint) {
  if (!telegraphHint?.attackStyleHint) return null;

  const style = telegraphHint.attackStyleHint;
  const target = telegraphHint.targetName ? ` targeting ${telegraphHint.targetName}` : "";

  if (style === "volley") return `Incoming volley${target}`;
  if (style === "beam") return `Arcane beam forming${target}`;
  if (style === "charge") return `Charge incoming${target}`;
  return `Enemy action building${target}`;
}

function StageLabel(props: {
  title: string;
  subtitle?: string | null;
  align?: "left" | "right";
  active?: boolean;
  defeated?: boolean;
  hpCurrent?: number;
  hpMax?: number;
  ac?: number;
}) {
  const {
    title,
    subtitle,
    align = "left",
    active = false,
    defeated = false,
    hpCurrent,
    hpMax,
    ac,
  } = props;

  const ratio = hpRatio(hpCurrent, hpMax);

  return (
    <div
      style={{
        minWidth: 0,
        display: "grid",
        gap: 8,
        justifyItems: align === "right" ? "end" : "start",
        textAlign: align,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          justifyContent: align === "right" ? "flex-end" : "flex-start",
        }}
      >
        {active ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "5px 9px",
              borderRadius: 999,
              border: "1px solid rgba(214,188,120,0.24)",
              background: "rgba(214,188,120,0.10)",
              color: "rgba(245,236,216,0.96)",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            Active
          </span>
        ) : null}

        {defeated ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "5px 9px",
              borderRadius: 999,
              border: "1px solid rgba(255,132,132,0.24)",
              background: "rgba(255,132,132,0.10)",
              color: "rgba(255,222,222,0.96)",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            Defeated
          </span>
        ) : null}

        {typeof ac === "number" ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "5px 9px",
              borderRadius: 999,
              border: "1px solid rgba(138,180,255,0.20)",
              background: "rgba(138,180,255,0.08)",
              color: "rgba(232,238,255,0.92)",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            AC {ac}
          </span>
        ) : null}
      </div>

      <div
        style={{
          fontSize: 22,
          fontWeight: 900,
          lineHeight: 1.05,
          color: defeated ? "rgba(255,226,226,0.82)" : "rgba(245,236,216,0.98)",
          wordBreak: "break-word",
        }}
      >
        {title}
      </div>

      {subtitle ? (
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.5,
            color: "rgba(228,232,240,0.76)",
            maxWidth: 320,
          }}
        >
          {subtitle}
        </div>
      ) : null}

      <div
        style={{
          width: "100%",
          maxWidth: 240,
          display: "grid",
          gap: 6,
        }}
      >
        <div
          style={{
            height: 8,
            borderRadius: 999,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(0,0,0,0.34)",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.round(ratio * 100)}%`,
              background: defeated
                ? "rgba(255,132,132,0.64)"
                : "linear-gradient(90deg, rgba(196,138,54,0.96), rgba(235,199,112,0.96))",
              boxShadow: defeated ? "none" : "0 0 12px rgba(255,208,120,0.20)",
            }}
          />
        </div>

        <div
          style={{
            fontSize: 12,
            color: "rgba(232,236,244,0.76)",
          }}
        >
          HP <strong>{formatHp(hpCurrent, hpMax)}</strong>
        </div>
      </div>
    </div>
  );
}

function EnemyModelFallback(props: {
  enemy: StageCombatant;
  height: number | string;
}) {
  const { enemy, height } = props;
  const portraitSrc = enemy.imageSrc || enemy.fallbackImageSrc || "/assets/V2/Enemy/Enemy_Bandit_Warrior.png";

  return (
    <div
      style={{
        width: "100%",
        height,
        position: "relative",
        overflow: "hidden",
        borderRadius: 18,
        background:
          "radial-gradient(circle at 50% 24%, rgba(214,110,110,0.14), rgba(214,110,110,0.03) 24%, rgba(0,0,0,0) 46%), radial-gradient(circle at 50% 76%, rgba(120,70,48,0.20), rgba(0,0,0,0) 42%), linear-gradient(180deg, rgba(22,18,16,0.96) 0%, rgba(14,11,10,0.98) 58%, rgba(10,8,8,1) 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 84%, rgba(255,120,120,0.12), rgba(255,120,120,0.04) 18%, rgba(0,0,0,0) 40%), radial-gradient(circle at 50% 18%, rgba(255,235,205,0.06), rgba(255,235,205,0) 28%)",
          pointerEvents: "none",
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          bottom: "-2%",
          transform: "translateX(-50%)",
          width: "58%",
          height: "18%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,110,110,0.20) 0%, rgba(160,64,48,0.16) 32%, rgba(28,18,12,0.10) 58%, rgba(0,0,0,0) 76%)",
          filter: "blur(10px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "10% 12% 8%",
          display: "grid",
          placeItems: "center",
        }}
      >
        <img
          src={portraitSrc}
          alt={enemy.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            filter: enemy.defeated ? "grayscale(0.8) brightness(0.72)" : "none",
          }}
          onError={(e) => {
            const el = e.currentTarget;
            el.onerror = null;
            el.src = "/assets/V2/Enemy/Enemy_Bandit_Warrior.png";
          }}
        />
      </div>

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.05), inset 0 -90px 100px rgba(0,0,0,0.34), inset 0 40px 70px rgba(255,240,220,0.03)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

function EnemyModelViewer(props: {
  enemy: StageCombatant;
  height: number | string;
}) {
  const { enemy, height } = props;
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 24;

    function checkReady() {
      if (cancelled) return;

      const ok = Boolean(window.customElements?.get("model-viewer"));
      if (ok) {
        setReady(true);
        return;
      }

      attempts += 1;
      if (attempts < maxAttempts) {
        window.setTimeout(checkReady, 150);
      }
    }

    checkReady();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!enemy.modelSrc || !ready || failed) {
    return <EnemyModelFallback enemy={enemy} height={height} />;
  }

  return (
    <div
      style={{
        width: "100%",
        height,
        position: "relative",
        overflow: "hidden",
        borderRadius: 18,
        background:
          "radial-gradient(circle at 50% 24%, rgba(214,110,110,0.14), rgba(214,110,110,0.03) 24%, rgba(0,0,0,0) 46%), radial-gradient(circle at 50% 76%, rgba(120,70,48,0.20), rgba(0,0,0,0) 42%), linear-gradient(180deg, rgba(22,18,16,0.96) 0%, rgba(14,11,10,0.98) 58%, rgba(10,8,8,1) 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <ModelViewerBootstrap />

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 50% 84%, rgba(255,120,120,0.12), rgba(255,120,120,0.04) 18%, rgba(0,0,0,0) 40%), radial-gradient(circle at 50% 18%, rgba(255,235,205,0.06), rgba(255,235,205,0) 28%)",
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          bottom: "-2%",
          transform: "translateX(-50%)",
          width: "58%",
          height: "18%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,110,110,0.20) 0%, rgba(160,64,48,0.16) 32%, rgba(28,18,12,0.10) 58%, rgba(0,0,0,0) 76%)",
          filter: "blur(10px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          paddingTop: "2%",
          transform: "scale(0.93)",
          transformOrigin: "center center",
          filter: enemy.defeated ? "grayscale(0.8) brightness(0.72)" : "none",
        }}
      >
        {React.createElement("model-viewer" as any, {
          src: enemy.modelSrc,
          alt: enemy.name,
          "camera-controls": true,
          "touch-action": "pan-y",
          "interaction-prompt": "none",
          "shadow-intensity": "1.15",
          exposure: "1.05",
          "environment-image": "neutral",
          "camera-orbit": "0deg 78deg 2.22m",
          "field-of-view": "25deg",
          "min-camera-orbit": "auto 62deg 1.98m",
          "max-camera-orbit": "auto 92deg 2.58m",
          "min-field-of-view": "19deg",
          "max-field-of-view": "31deg",
          "disable-pan": true,
          "disable-zoom": false,
          "auto-rotate": true,
          "auto-rotate-delay": 0,
          "rotation-per-second": "7deg",
          style: {
            width: "100%",
            height: "100%",
            display: "block",
            background: "transparent",
          },
          onError: () => {
            setFailed(true);
          },
        })}
      </div>

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.05), inset 0 -90px 100px rgba(0,0,0,0.34), inset 0 40px 70px rgba(255,240,220,0.03)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

export default function CombatStage({
  hero,
  enemy,
  battlefieldImageSrc,
  isEnemyTurn,
  combatEnded,
  telegraphHint,
  height = 460,
}: Props) {
  const telegraphText = useMemo(() => getTelegraphText(telegraphHint), [telegraphHint]);

  const heroStageHeight =
    typeof height === "number" ? Math.max(320, Math.round(height * 0.82)) : "82%";

  const enemyStageHeight =
    typeof height === "number" ? Math.max(300, Math.round(height * 0.74)) : "74%";

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height,
        overflow: "hidden",
        borderRadius: 24,
        border: "1px solid rgba(255,255,255,0.08)",
        background:
          battlefieldImageSrc
            ? `linear-gradient(180deg, rgba(6,8,14,0.42), rgba(6,8,14,0.68)), url(${battlefieldImageSrc}) center / cover no-repeat`
            : "radial-gradient(circle at 50% 20%, rgba(214,188,120,0.10), rgba(214,188,120,0.02) 18%, rgba(0,0,0,0) 40%), linear-gradient(180deg, rgba(16,18,28,0.98), rgba(10,12,20,0.96))",
        boxShadow:
          "0 22px 56px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 50% 80%, rgba(255,194,104,0.08), rgba(255,194,104,0.00) 18%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.00) 24%, rgba(0,0,0,0.14) 100%)",
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          bottom: "6%",
          transform: "translateX(-50%)",
          width: "54%",
          height: "18%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(214,188,120,0.16) 0%, rgba(120,86,48,0.14) 34%, rgba(28,18,12,0.10) 58%, rgba(0,0,0,0) 78%)",
          filter: "blur(12px)",
          pointerEvents: "none",
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          top: "18%",
          bottom: "14%",
          width: 2,
          transform: "translateX(-50%)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.00), rgba(255,220,160,0.16) 24%, rgba(255,220,160,0.16) 76%, rgba(255,255,255,0.00))",
          opacity: combatEnded ? 0.28 : 0.52,
          pointerEvents: "none",
        }}
      />

      {telegraphText ? (
        <div
          style={{
            position: "absolute",
            top: 14,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 3,
            display: "inline-flex",
            alignItems: "center",
            padding: "8px 12px",
            borderRadius: 999,
            border: "1px solid rgba(255,132,132,0.24)",
            background: "rgba(255,132,132,0.10)",
            color: "rgba(255,226,226,0.96)",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            boxShadow: "0 12px 28px rgba(0,0,0,0.24)",
          }}
        >
          {telegraphText}
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "22px 22px 18px",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(120px, 0.18fr) minmax(0, 1fr)",
          alignItems: "end",
          gap: 16,
        }}
      >
        <div
          style={{
            display: "grid",
            gap: 12,
            alignSelf: "stretch",
            alignContent: "space-between",
          }}
        >
          <StageLabel
            title={hero?.name ?? "Hero"}
            subtitle={
              hero
                ? `${hero.species ?? "Human"} · ${hero.className ?? "Warrior"}`
                : null
            }
            align="left"
            active={Boolean(hero?.active) && !isEnemyTurn && !combatEnded}
            defeated={Boolean(hero?.defeated)}
            hpCurrent={hero?.hpCurrent}
            hpMax={hero?.hpMax}
            ac={hero?.ac}
          />

          <div
            style={{
              position: "relative",
              minHeight: typeof heroStageHeight === "number" ? heroStageHeight : undefined,
              display: "grid",
              alignItems: "end",
              opacity: hero?.defeated ? 0.72 : 1,
              filter:
                hero?.defeated
                  ? "grayscale(0.6)"
                  : hero?.active && !isEnemyTurn && !combatEnded
                    ? "drop-shadow(0 0 18px rgba(255,208,120,0.12))"
                    : "none",
            }}
          >
            {hero ? (
              <HeroRitualPortrait
                species={hero.species ?? "Human"}
                className={hero.className ?? "Warrior"}
                portrait={hero.portrait ?? "Male"}
                imageSrc={hero.imageSrc ?? "/Hero_dungeon.png"}
                fallbackImageSrc={hero.fallbackImageSrc ?? hero.imageSrc ?? "/Hero_dungeon.png"}
                alt={hero.name}
                height={heroStageHeight}
                objectPosition="center top"
              />
            ) : (
              <div />
            )}
          </div>
        </div>

        <div />

        <div
          style={{
            display: "grid",
            gap: 12,
            alignSelf: "stretch",
            alignContent: "space-between",
          }}
        >
          <StageLabel
            title={enemy?.name ?? "Enemy"}
            subtitle={enemy ? `${enemy.className ?? "Hostile"}` : null}
            align="right"
            active={Boolean(enemy?.active) && isEnemyTurn && !combatEnded}
            defeated={Boolean(enemy?.defeated)}
            hpCurrent={enemy?.hpCurrent}
            hpMax={enemy?.hpMax}
            ac={enemy?.ac}
          />

          <div
            style={{
              position: "relative",
              minHeight: typeof enemyStageHeight === "number" ? enemyStageHeight : undefined,
              display: "grid",
              alignItems: "end",
              opacity: enemy?.defeated ? 0.72 : 1,
              filter:
                enemy?.defeated
                  ? "grayscale(0.75)"
                  : enemy?.active && isEnemyTurn && !combatEnded
                    ? "drop-shadow(0 0 18px rgba(255,132,132,0.12))"
                    : "none",
            }}
          >
            {enemy ? (
              <EnemyModelViewer enemy={enemy} height={enemyStageHeight} />
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.04), inset 0 -100px 120px rgba(0,0,0,0.30), inset 0 60px 80px rgba(255,240,220,0.02)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
