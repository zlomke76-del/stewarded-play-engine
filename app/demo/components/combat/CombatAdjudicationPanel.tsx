"use client";

import React from "react";
import CardSection from "@/components/layout/CardSection";
import ResolutionDraftAdvisoryPanel from "@/components/resolution/ResolutionDraftAdvisoryPanel";
import { inferOptionKind } from "../../demoUtils";
import type { ActionSurfaceProps } from "./combatSectionTypes";
import { actionButtonStyle, playSfx } from "./combatSectionUtils";

type Props = {
  actionSurface: ActionSurfaceProps;
  uiClickSfxSrc: string;
};

function optionId(option: any, idx: number) {
  const explicit = String(option?.id ?? "").trim();
  if (explicit) return explicit;
  return `option_${idx}_${String(option?.description ?? option?.label ?? "choice")}`;
}

function optionDescription(option: any) {
  return String(option?.description ?? option?.label ?? "Unknown resolution path").trim();
}

export default function CombatAdjudicationPanel({ actionSurface, uiClickSfxSrc }: Props) {
  return (
    <CardSection title="Adjudication">
      <div style={{ display: "grid", gap: 12, width: "100%", minWidth: 0 }}>
        <div style={{ display: "grid", gap: 5 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              opacity: 0.62,
            }}
          >
            Resolution Flow
          </div>
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: "rgba(228,232,240,0.78)",
            }}
          >
            Resolve the typed command here in combat. Choose the best interpretation, then use the
            real fate panel below.
          </div>
        </div>

        {actionSurface.options && actionSurface.options.length > 0 ? (
          <div style={{ display: "grid", gap: 10, width: "100%", minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: 0.7,
                textTransform: "uppercase",
                opacity: 0.62,
              }}
            >
              Resolution Paths
            </div>

            <div style={{ display: "grid", gap: 10, width: "100%", minWidth: 0 }}>
              {actionSurface.options.map((opt, idx) => {
                const active = actionSurface.selectedOption?.id
                  ? actionSurface.selectedOption?.id === opt?.id
                  : actionSurface.selectedOption === opt;

                return (
                  <button
                    key={optionId(opt, idx)}
                    type="button"
                    onClick={() => {
                      playSfx(uiClickSfxSrc, 0.58);
                      actionSurface.onSetSelectedOption(opt);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "13px 14px",
                      borderRadius: 14,
                      border: active
                        ? "1px solid rgba(214,188,120,0.28)"
                        : "1px solid rgba(255,255,255,0.08)",
                      background: active
                        ? "linear-gradient(180deg, rgba(214,188,120,0.10), rgba(255,255,255,0.03))"
                        : "rgba(255,255,255,0.03)",
                      color: "inherit",
                      cursor: "pointer",
                      lineHeight: 1.55,
                      fontWeight: active ? 800 : 600,
                    }}
                  >
                    {optionDescription(opt)}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: "12px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              fontSize: 13,
              lineHeight: 1.6,
              color: "rgba(228,232,240,0.72)",
              width: "100%",
              minWidth: 0,
            }}
          >
            {actionSurface.playerInput.trim().length > 0
              ? "Click Resolve Action above and the combat interpretations will appear here."
              : "Type your command above to begin the combat adjudication loop."}
          </div>
        )}

        {actionSurface.selectedOption ? (
          <div style={{ display: "grid", gap: 10, width: "100%", minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: 0.7,
                textTransform: "uppercase",
                opacity: 0.62,
              }}
            >
              Roll Fate
            </div>

            <ResolutionDraftAdvisoryPanel
              context={{
                optionDescription: actionSurface.selectedOption.description,
                optionKind: inferOptionKind(
                  `${actionSurface.playerInput}\n${actionSurface.selectedOption.description}`.trim()
                ),
              }}
              role={actionSurface.role as any}
              dmMode={actionSurface.resolutionDmMode as any}
              setupText={`${actionSurface.playerInput}\n\nCurrent Room: ${actionSurface.currentRoomTitle}\n\n${actionSurface.roomSummary}`}
              movement={actionSurface.resolutionMovement}
              combat={
                actionSurface.resolutionCombat
                  ? {
                      ...actionSurface.resolutionCombat,
                      attackStyleHint:
                        actionSurface.resolutionCombat.attackStyleHint ?? undefined,
                    }
                  : null
              }
              rollModifier={actionSurface.actingRollModifier}
              rollModifierLabel={
                (actionSurface.actingPlayerInjuryStacks ?? 0) > 0
                  ? `Injury stacks: ${actionSurface.actingPlayerInjuryStacks}`
                  : null
              }
              onRecord={actionSurface.onRecord}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  playSfx(uiClickSfxSrc, 0.56);
                  actionSurface.onSetSelectedOption(null);
                }}
                style={{
                  ...actionButtonStyle("secondary"),
                  padding: "9px 12px",
                  borderRadius: 12,
                  fontWeight: 800,
                }}
              >
                Clear Selection
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </CardSection>
  );
}
