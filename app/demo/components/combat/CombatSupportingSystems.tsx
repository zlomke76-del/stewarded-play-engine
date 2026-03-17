"use client";

import React from "react";
import CardSection from "@/components/layout/CardSection";
import CombatSetupPanel from "@/components/combat/CombatSetupPanel";
import EnemyTurnResolverPanel from "@/components/combat/EnemyTurnResolverPanel";
import { getPortraitPath } from "@/lib/portraits/getPortraitPath";
import { formatCombatantLabel } from "@/lib/combat/CombatState";
import { getSkillDefinition } from "@/lib/skills/skillDefinitions";
import { getSpeciesTraitDefinition } from "@/lib/skills/speciesTraitMap";
import type {
  CombatEncounterContext,
  DerivedCombatLite,
  EnemyRosterCard,
  EnemyTelegraphHint,
  HpState,
  PartyMemberLite,
} from "./combatSectionTypes";
import {
  actionButtonStyle,
  fmtHp,
  getResolvedClass,
  getResolvedSpecies,
  hpPercent,
  isHealerCapable,
  nameKey,
  playSfx,
  portraitSrcFor,
  titleCase,
} from "./combatSectionUtils";

function InfoPill(props: {
  label: string;
  tone?: "neutral" | "info" | "warn" | "accent";
}) {
  const tone = props.tone ?? "neutral";

  const toneStyle: React.CSSProperties =
    tone === "info"
      ? {
          border: "1px solid rgba(138,180,255,0.22)",
          background: "rgba(138,180,255,0.08)",
        }
      : tone === "warn"
        ? {
            border: "1px solid rgba(255,200,140,0.22)",
            background: "rgba(255,200,140,0.08)",
          }
        : tone === "accent"
          ? {
              border: "1px solid rgba(180,220,160,0.22)",
              background: "rgba(180,220,160,0.08)",
            }
          : {
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
            };

  return (
    <span
      style={{
        ...toneStyle,
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 11,
        lineHeight: 1,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {props.label}
    </span>
  );
}

type Props = {
  showSupportingSystems: boolean;
  showInspector: boolean;
  onToggleSupportingSystems: () => void;
  onToggleInspector: () => void;
  allowDevControls: boolean;
  events: any[];
  onAppendCanon: (type: string, payload: any) => void;
  dmMode: "human" | "solace-neutral" | null;
  partyMembers: PartyMemberLite[];
  pressureTier: "low" | "medium" | "high";
  encounterContext?: CombatEncounterContext | null;
  partyMembersForDisplay: PartyMemberLite[];
  playerHpById: Record<string, HpState>;
  enemyHpById: Record<string, HpState>;
  activePlayerId: string | null;
  telegraphTargetKey: string | null;
  enemyRoster: EnemyRosterCard[];
  showEnemyResolver: boolean;
  activeEnemyGroupName: string | null;
  activeEnemyGroupId: string | null;
  playerNames: string[];
  onTelegraph: (info: EnemyTelegraphHint) => void;
  onCommitOutcome: (payload: any) => void;
  onAdvanceTurn: () => void;
  enemyTelegraphHint: EnemyTelegraphHint | null;
  derivedCombat: DerivedCombatLite | null;
  activeCombatantSpec: any | null;
  isEnemyTurn: boolean;
  enemyTelegraphSfxSrc: string;
};

export default function CombatSupportingSystems(props: Props) {
  const {
    showSupportingSystems,
    showInspector,
    onToggleSupportingSystems,
    onToggleInspector,
    allowDevControls,
    events,
    onAppendCanon,
    dmMode,
    partyMembers,
    pressureTier,
    encounterContext,
    partyMembersForDisplay,
    playerHpById,
    enemyHpById,
    activePlayerId,
    telegraphTargetKey,
    enemyRoster,
    showEnemyResolver,
    activeEnemyGroupName,
    activeEnemyGroupId,
    playerNames,
    onTelegraph,
    onCommitOutcome,
    onAdvanceTurn,
    enemyTelegraphHint,
    derivedCombat,
    activeCombatantSpec,
    isEnemyTurn,
    enemyTelegraphSfxSrc,
  } = props;

  return (
    <CardSection title="Supporting Systems">
      <div style={{ display: "grid", gap: 10, width: "100%", minWidth: 0 }}>
        <button
          type="button"
          onClick={onToggleSupportingSystems}
          style={{
            justifySelf: "start",
            ...actionButtonStyle(showSupportingSystems ? "warn" : "secondary"),
            padding: "8px 12px",
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {showSupportingSystems ? "Hide Supporting Systems" : "Show Supporting Systems"}
        </button>

        {!showSupportingSystems ? (
          <div
            style={{
              fontSize: 12,
              lineHeight: 1.55,
              color: "rgba(228,232,240,0.66)",
            }}
          >
            Party panels, enemy roster, encounter details, resolver details, and inspector tools
            stay collapsed so the battlefield remains primary.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14, width: "100%", minWidth: 0 }}>
            {(encounterContext?.objective ||
              encounterContext?.rewardHint ||
              encounterContext?.zoneTheme ||
              encounterContext?.lockState) && (
              <CardSection title="Encounter Context">
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    width: "100%",
                    minWidth: 0,
                  }}
                >
                  {encounterContext?.zoneTheme ? (
                    <InfoPill
                      label={`Theme: ${titleCase(String(encounterContext.zoneTheme))}`}
                      tone="info"
                    />
                  ) : null}

                  {encounterContext?.lockState ? (
                    <InfoPill label={`Lock: ${encounterContext.lockState}`} tone="warn" />
                  ) : null}

                  {encounterContext?.rewardHint ? (
                    <InfoPill label={`Reward: ${encounterContext.rewardHint}`} tone="accent" />
                  ) : null}

                  {encounterContext?.objective ? (
                    <InfoPill label={`Objective: ${encounterContext.objective}`} tone="neutral" />
                  ) : null}
                </div>
              </CardSection>
            )}

            {partyMembersForDisplay.length > 0 && (
              <CardSection title="Your Side">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: 10,
                  }}
                >
                  {partyMembersForDisplay.map((m) => {
                    const src = portraitSrcFor(m);
                    const healer = isHealerCapable(m.className);

                    const hpState = playerHpById[String(m.id)];
                    const downed = hpState ? hpState.downed : (Number(m.hpCurrent) || 0) <= 0;

                    const pct = hpPercent(m.hpCurrent, m.hpMax);

                    const isActiveTurnOwner =
                      !!activePlayerId && String(activePlayerId) === String(m.id);
                    const isTelegraphTarget =
                      !!telegraphTargetKey &&
                      telegraphTargetKey.length > 0 &&
                      nameKey(m.name) === telegraphTargetKey;

                    const border = downed
                      ? "1px solid rgba(255,120,120,0.28)"
                      : isActiveTurnOwner
                        ? "1px solid rgba(214,188,120,0.40)"
                        : isTelegraphTarget
                          ? "1px solid rgba(255,255,255,0.18)"
                          : "1px solid rgba(255,255,255,0.12)";

                    const background = downed
                      ? "rgba(255,120,120,0.06)"
                      : isActiveTurnOwner
                        ? "rgba(214,188,120,0.08)"
                        : isTelegraphTarget
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(255,255,255,0.04)";

                    const boxShadow = isActiveTurnOwner
                      ? "0 14px 34px rgba(0,0,0,0.28)"
                      : "0 10px 26px rgba(0,0,0,0.22)";

                    const skillLabels = (Array.isArray(m.skills) ? m.skills : [])
                      .map((id) => getSkillDefinition(id)?.label ?? id)
                      .filter(Boolean);

                    const traitLabels = (Array.isArray(m.traits) ? m.traits : [])
                      .map((id) => getSpeciesTraitDefinition(id)?.label ?? id)
                      .filter(Boolean);

                    const resolvedSpecies = getResolvedSpecies(m);
                    const resolvedClass = getResolvedClass(m);

                    const skillChipStyle: React.CSSProperties = {
                      display: "inline-flex",
                      alignItems: "center",
                      borderRadius: 999,
                      padding: "2px 8px",
                      fontSize: 11,
                      lineHeight: 1.3,
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      whiteSpace: "nowrap",
                    };

                    const traitChipStyle: React.CSSProperties = {
                      ...skillChipStyle,
                      background: "rgba(120,180,255,0.10)",
                      border: "1px solid rgba(120,180,255,0.22)",
                    };

                    return (
                      <div
                        key={m.id}
                        style={{
                          position: "relative",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          padding: "12px 12px",
                          borderRadius: 12,
                          border,
                          background,
                          boxShadow,
                          opacity: downed ? 0.72 : 1,
                        }}
                      >
                        {isActiveTurnOwner && (
                          <div
                            style={{
                              position: "absolute",
                              top: 10,
                              left: 10,
                              padding: "4px 8px",
                              borderRadius: 999,
                              border: "1px solid rgba(214,188,120,0.45)",
                              background: "rgba(214,188,120,0.12)",
                              fontSize: 11,
                              letterSpacing: 0.6,
                              textTransform: "uppercase",
                              opacity: 0.98,
                              userSelect: "none",
                            }}
                          >
                            Active Turn
                          </div>
                        )}

                        {healer && (
                          <div
                            title="Healer-capable"
                            style={{
                              position: "absolute",
                              top: 10,
                              right: 10,
                              width: 24,
                              height: 24,
                              borderRadius: 999,
                              border: "1px solid rgba(255,255,255,0.18)",
                              background: "rgba(255,255,255,0.06)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 14,
                              lineHeight: 1,
                              opacity: 0.95,
                              userSelect: "none",
                            }}
                          >
                            ✚
                          </div>
                        )}

                        {downed && (
                          <div
                            style={{
                              position: "absolute",
                              bottom: 10,
                              right: 10,
                              padding: "4px 8px",
                              borderRadius: 999,
                              border: "1px solid rgba(255,120,120,0.35)",
                              background: "rgba(255,120,120,0.10)",
                              fontSize: 11,
                              letterSpacing: 0.5,
                              textTransform: "uppercase",
                              opacity: 0.95,
                            }}
                          >
                            Downed
                          </div>
                        )}

                        {isEnemyTurn && isTelegraphTarget && !downed && (
                          <div
                            style={{
                              position: "absolute",
                              bottom: 10,
                              left: 10,
                              padding: "4px 8px",
                              borderRadius: 999,
                              border: "1px solid rgba(255,255,255,0.18)",
                              background: "rgba(0,0,0,0.26)",
                              fontSize: 11,
                              letterSpacing: 0.5,
                              textTransform: "uppercase",
                              opacity: 0.95,
                            }}
                          >
                            Targeted
                          </div>
                        )}

                        <div
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: 14,
                            overflow: "hidden",
                            border: isActiveTurnOwner
                              ? "1px solid rgba(214,188,120,0.45)"
                              : "1px solid rgba(255,255,255,0.16)",
                            background: "rgba(0,0,0,0.28)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            marginTop: isActiveTurnOwner ? 24 : 0,
                          }}
                          title={`${resolvedSpecies} ${resolvedClass} ${m.portrait}`}
                        >
                          <img
                            src={src}
                            alt={`${resolvedSpecies} ${resolvedClass} ${m.portrait}`}
                            width={64}
                            height={64}
                            style={{
                              width: 64,
                              height: 64,
                              objectFit: "cover",
                              display: "block",
                            }}
                            onError={(e) => {
                              const el = e.currentTarget;
                              el.onerror = null;
                              el.src = getPortraitPath(
                                "Human",
                                "Warrior",
                                m.portrait === "Female" ? "Female" : "Male"
                              );
                            }}
                          />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "baseline",
                              gap: 10,
                              flexWrap: "wrap",
                            }}
                          >
                            <strong style={{ fontSize: 15, lineHeight: 1.2 }}>
                              {m.name || "Unnamed"}
                            </strong>
                            <span className="muted" style={{ fontSize: 12 }}>
                              AC {Number(m.ac) || 0} · init{" "}
                              {m.initiativeMod >= 0 ? `+${m.initiativeMod}` : m.initiativeMod}
                            </span>
                          </div>

                          <div style={{ marginTop: 8 }}>
                            <div
                              style={{
                                height: 7,
                                borderRadius: 999,
                                background: "rgba(0,0,0,0.36)",
                                border: "1px solid rgba(255,255,255,0.10)",
                                overflow: "hidden",
                              }}
                              aria-label={`HP ${fmtHp(m.hpCurrent, m.hpMax)}`}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  width: `${Math.round(pct * 100)}%`,
                                  background: downed
                                    ? "rgba(255,120,120,0.65)"
                                    : "rgba(160,220,255,0.55)",
                                  boxShadow: downed
                                    ? "none"
                                    : "0 0 12px rgba(160,220,255,0.22)",
                                }}
                              />
                            </div>

                            <div
                              className="muted"
                              style={{
                                marginTop: 6,
                                fontSize: 12,
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 10,
                                flexWrap: "wrap",
                              }}
                            >
                              <span>
                                HP <strong>{fmtHp(m.hpCurrent, m.hpMax)}</strong>
                              </span>
                              <span>
                                <strong>{resolvedSpecies}</strong> · <strong>{resolvedClass}</strong>
                              </span>
                            </div>
                          </div>

                          {(skillLabels.length > 0 || traitLabels.length > 0) && (
                            <div
                              style={{
                                marginTop: 8,
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                              }}
                            >
                              {skillLabels.length > 0 && (
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                  {skillLabels.map((label, idx) => (
                                    <span key={`${m.id}_skill_${label}_${idx}`} style={skillChipStyle}>
                                      {label}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {traitLabels.length > 0 && (
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                  {traitLabels.map((label, idx) => (
                                    <span key={`${m.id}_trait_${label}_${idx}`} style={traitChipStyle}>
                                      {label}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardSection>
            )}

            {enemyRoster.length > 0 && (
              <CardSection title="Enemy Roster">
                <div style={{ display: "grid", gap: 10 }}>
                  <div className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
                    Track the enemy line here. Focus on who is still standing and whose turn is
                    active.
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                      gap: 10,
                    }}
                  >
                    {enemyRoster.map((enemy) => {
                      const pct = hpPercent(enemy.hpCurrent, enemy.hpMax);
                      const border = enemy.defeated
                        ? "1px solid rgba(255,120,120,0.28)"
                        : enemy.isActive
                          ? "1px solid rgba(214,188,120,0.45)"
                          : "1px solid rgba(255,255,255,0.10)";
                      const background = enemy.defeated
                        ? "rgba(255,120,120,0.06)"
                        : enemy.isActive
                          ? "rgba(214,188,120,0.08)"
                          : "rgba(255,255,255,0.04)";

                      return (
                        <div
                          key={enemy.combatantId}
                          style={{
                            position: "relative",
                            display: "flex",
                            gap: 12,
                            alignItems: "flex-start",
                            padding: "12px",
                            borderRadius: 14,
                            border,
                            background,
                            opacity: enemy.defeated ? 0.72 : 1,
                          }}
                        >
                          {enemy.isActive && !enemy.defeated && (
                            <div
                              style={{
                                position: "absolute",
                                top: 10,
                                left: 10,
                                padding: "4px 8px",
                                borderRadius: 999,
                                border: "1px solid rgba(214,188,120,0.45)",
                                background: "rgba(214,188,120,0.12)",
                                fontSize: 11,
                                letterSpacing: 0.5,
                                textTransform: "uppercase",
                              }}
                            >
                              Active
                            </div>
                          )}

                          {enemy.defeated && (
                            <div
                              style={{
                                position: "absolute",
                                top: 10,
                                right: 10,
                                padding: "4px 8px",
                                borderRadius: 999,
                                border: "1px solid rgba(255,120,120,0.35)",
                                background: "rgba(255,120,120,0.10)",
                                fontSize: 11,
                                letterSpacing: 0.5,
                                textTransform: "uppercase",
                              }}
                            >
                              Defeated
                            </div>
                          )}

                          <div
                            style={{
                              width: 64,
                              height: 64,
                              borderRadius: 14,
                              overflow: "hidden",
                              border: "1px solid rgba(255,255,255,0.14)",
                              background: "rgba(0,0,0,0.24)",
                              flexShrink: 0,
                              marginTop: enemy.isActive && !enemy.defeated ? 24 : 0,
                            }}
                          >
                            <img
                              src={enemy.portraitSrc}
                              alt={enemy.enemyName}
                              width={64}
                              height={64}
                              style={{
                                width: 64,
                                height: 64,
                                objectFit: "cover",
                                display: "block",
                              }}
                              onError={(e) => {
                                const el = e.currentTarget;
                                el.onerror = null;
                                el.src = "/assets/V2/Enemy/Enemy_Bandit_Warrior.png";
                              }}
                            />
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                                alignItems: "baseline",
                              }}
                            >
                              <strong style={{ fontSize: 15 }}>{enemy.label}</strong>
                              <span className="muted" style={{ fontSize: 12 }}>
                                AC {enemy.ac} · init{" "}
                                {enemy.initiativeMod >= 0
                                  ? `+${enemy.initiativeMod}`
                                  : enemy.initiativeMod}
                              </span>
                            </div>

                            <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
                              {enemy.roleLabel} · {enemy.factionLabel}
                            </div>

                            <div style={{ marginTop: 8 }}>
                              <div
                                style={{
                                  height: 7,
                                  borderRadius: 999,
                                  background: "rgba(0,0,0,0.36)",
                                  border: "1px solid rgba(255,255,255,0.10)",
                                  overflow: "hidden",
                                }}
                                aria-label={`Enemy HP ${fmtHp(enemy.hpCurrent, enemy.hpMax)}`}
                              >
                                <div
                                  style={{
                                    height: "100%",
                                    width: `${Math.round(pct * 100)}%`,
                                    background: enemy.defeated
                                      ? "rgba(255,120,120,0.65)"
                                      : "rgba(255,196,118,0.58)",
                                    boxShadow: enemy.defeated
                                      ? "none"
                                      : "0 0 12px rgba(255,196,118,0.18)",
                                  }}
                                />
                              </div>

                              <div
                                className="muted"
                                style={{
                                  marginTop: 6,
                                  fontSize: 12,
                                  display: "flex",
                                  justifyContent: "space-between",
                                  gap: 10,
                                  flexWrap: "wrap",
                                }}
                              >
                                <span>
                                  HP <strong>{fmtHp(enemy.hpCurrent, enemy.hpMax)}</strong>
                                </span>
                                <span>{enemy.combatantId}</span>
                              </div>
                            </div>

                            {(enemy.isKeybearer || enemy.isRelicBearer || enemy.isCacheGuard) && (
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                                {enemy.isKeybearer ? (
                                  <InfoPill label="Keybearer" tone="warn" />
                                ) : null}
                                {enemy.isRelicBearer ? (
                                  <InfoPill label="Relic Bearer" tone="accent" />
                                ) : null}
                                {enemy.isCacheGuard ? (
                                  <InfoPill label="Guards Cache" tone="info" />
                                ) : null}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardSection>
            )}

            {showEnemyResolver ? (
              <CardSection title="Enemy Turn">
                <div style={{ display: "grid", gap: 10 }}>
                  <div
                    style={{
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: "rgba(228,232,240,0.78)",
                    }}
                  >
                    Solace is resolving the enemy action. Watch the telegraph and damage outcome
                    here.
                  </div>

                  <EnemyTurnResolverPanel
                    enabled={true}
                    activeEnemyGroupName={activeEnemyGroupName ?? ""}
                    activeEnemyGroupId={activeEnemyGroupId ?? ""}
                    playerNames={playerNames}
                    onTelegraph={(info) => {
                      playSfx(enemyTelegraphSfxSrc, 0.42);
                      onTelegraph(info);
                    }}
                    onCommitOutcome={onCommitOutcome}
                    onAdvanceTurn={onAdvanceTurn}
                  />

                  {enemyTelegraphHint ? (
                    <div className="muted" style={{ fontSize: 12 }}>
                      Telegraph hint: <strong>{enemyTelegraphHint.attackStyleHint}</strong> ·
                      Target <strong>{enemyTelegraphHint.targetName}</strong>
                    </div>
                  ) : null}
                </div>
              </CardSection>
            ) : null}

            <CardSection title="Combat Inspector">
              <div style={{ display: "grid", gap: 10 }}>
                <button
                  type="button"
                  onClick={onToggleInspector}
                  style={{
                    justifySelf: "start",
                    ...actionButtonStyle(showInspector ? "warn" : "secondary"),
                    padding: "8px 12px",
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {showInspector ? "Hide Combat Inspector" : "Show Combat Inspector"}
                </button>

                {!showInspector ? (
                  <div
                    style={{
                      fontSize: 12,
                      lineHeight: 1.55,
                      color: "rgba(228,232,240,0.66)",
                    }}
                  >
                    Setup logic, derived order internals, and workshop surfaces are hidden by
                    default so the battlefield reads like a game instead of a tool.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 14 }}>
                    <CombatSetupPanel
                      events={events as any[]}
                      onAppendCanon={onAppendCanon}
                      dmMode={dmMode as any}
                      partyMembers={partyMembers as any}
                      pressureTier={pressureTier as any}
                      allowDevControls={allowDevControls}
                      encounterContext={encounterContext}
                    />

                    {derivedCombat ? (
                      <CardSection title="Derived Turn Order">
                        <div className="muted">
                          Combat: <strong>{derivedCombat.combatId}</strong> · Round{" "}
                          <strong>{derivedCombat.round}</strong>
                          {activeCombatantSpec ? (
                            <>
                              {" "}
                              · Active: <strong>{formatCombatantLabel(activeCombatantSpec)}</strong>
                            </>
                          ) : null}
                        </div>

                        <div
                          style={{
                            marginTop: 10,
                            display: "grid",
                            gridTemplateColumns: "1fr",
                            gap: 6,
                          }}
                        >
                          {derivedCombat.order.map((id: string, idx: number) => {
                            const spec =
                              derivedCombat.participants.find((p: any) => p.id === id) ?? null;
                            const roll =
                              derivedCombat.initiative.find((r: any) => r.combatantId === id) ?? null;
                            const active = derivedCombat.activeCombatantId === id;
                            const isEnemy = String(spec?.kind ?? "") === "enemy_group";
                            const isPlayer = String(spec?.kind ?? "") === "player";

                            const enemyHp = isEnemy ? enemyHpById[String(id)] : null;
                            const playerHp = isPlayer ? playerHpById[String(id)] : null;
                            const defeated = Boolean(enemyHp?.downed || playerHp?.downed);

                            return (
                              <div
                                key={id}
                                style={{
                                  padding: "10px 12px",
                                  borderRadius: 8,
                                  border: defeated
                                    ? "1px solid rgba(255,120,120,0.28)"
                                    : active
                                      ? "1px solid rgba(138,180,255,0.55)"
                                      : "1px solid rgba(255,255,255,0.10)",
                                  background: defeated
                                    ? "rgba(255,120,120,0.06)"
                                    : active
                                      ? "rgba(138,180,255,0.10)"
                                      : "rgba(255,255,255,0.04)",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  gap: 10,
                                  opacity: defeated ? 0.68 : 1,
                                }}
                              >
                                <div>
                                  <strong>
                                    {idx + 1}. {spec ? formatCombatantLabel(spec) : id}
                                  </strong>
                                  {active && !defeated ? <span className="muted">{"  "}← active</span> : null}
                                  {defeated ? <span className="muted">{"  "}· defeated</span> : null}
                                </div>
                                <div className="muted">
                                  {roll
                                    ? `Init ${roll.total} (d20 ${roll.natural} + ${roll.modifier})`
                                    : "Init —"}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardSection>
                    ) : null}
                  </div>
                )}
              </div>
            </CardSection>
          </div>
        )}
      </div>
    </CardSection>
  );
}
