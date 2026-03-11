"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import ResolutionDraftAdvisoryPanel from "@/components/resolution/ResolutionDraftAdvisoryPanel";
import NextActionHint from "@/components/NextActionHint";
import ActionSection from "./ActionSection";
import { anchorId, inferOptionKind } from "../demoUtils";
import { displayName } from "../hooks/useDemoRuntime";

type Props = {
  demo: any;
};

export default function GameplayActionColumn({ demo }: Props) {
  const [inlineResult, setInlineResult] = useState<any | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const isPuzzleMode = demo.actionMode === "puzzle";
  const hasInlineSubmit = typeof demo.onInlineSubmit === "function";

  const actionRootRef = useRef<HTMLDivElement | null>(null);
  const resolutionRef = useRef<HTMLDivElement | null>(null);

  const actionDemo = useMemo(() => {
    return {
      ...demo,
      CanonChronicleSection: demo.CanonChronicleSection,
    };
  }, [demo]);

  const partyMembers = demo.partyMembers.length
    ? demo.partyMembers.map((m: any, idx: number) => ({
        id: String(m.id),
        label: `${displayName(m, idx + 1)} (${m.id})`,
        species: m.species ?? "Human",
        className: m.className || "Warrior",
        portrait: m.portrait ?? "Male",
        skills: m.skills ?? [],
        traits: m.traits ?? [],
        ac: m.ac,
        hpMax: m.hpMax,
        hpCurrent: m.hpCurrent,
        initiativeMod: m.initiativeMod,
      }))
    : [];

  async function handleInlineSubmit() {
    setInlineResult(null);
    const result = await demo.onInlineSubmit?.();
    if (result) {
      setInlineResult(result);
    }
  }

  async function handleRecordAndReturn(payload: any) {
    if (isRecording) return;

    setIsRecording(true);
    try {
      await Promise.resolve(demo.handleRecord?.(payload));

      if (typeof demo.setSelectedOption === "function") {
        demo.setSelectedOption(null);
      }

      if (typeof demo.setPlayerInput === "function") {
        demo.setPlayerInput("");
      }

      if (typeof demo.setGameplayFocusStep === "function") {
        demo.setGameplayFocusStep("map");
      }

      if (typeof demo.setActiveSection === "function") {
        demo.setActiveSection("map");
      }

      window.requestAnimationFrame(() => {
        const mapAnchor = document.getElementById(anchorId("map"));
        if (mapAnchor) {
          mapAnchor.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          actionRootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    } finally {
      setIsRecording(false);
    }
  }

  const renderOptions =
    demo.gameplayAllowsAction && demo.options && demo.dmMode === "human";
  const renderResolution = demo.gameplayAllowsAction && demo.selectedOption;

  useEffect(() => {
    if (!renderOptions && !renderResolution && !inlineResult) return;

    const node = resolutionRef.current;
    if (!node) return;

    window.requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [renderOptions, renderResolution, inlineResult]);

  return (
    <div ref={actionRootRef} style={{ display: "grid", gap: 14 }}>
      {demo.gameplayAllowsAction ? (
        <div id={anchorId("action")} style={{ scrollMarginTop: 90 }}>
          <ActionSection
            partyMembers={partyMembers}
            actingPlayerId={demo.actingPlayerId}
            onSetActingPlayerId={(id) => demo.setActingPlayerId(id)}
            playerInput={demo.playerInput}
            onSetPlayerInput={(v) => demo.setPlayerInput(v)}
            canSubmit={demo.canPlayerSubmitIntent}
            onSubmit={hasInlineSubmit ? handleInlineSubmit : demo.handlePlayerAction}
            combatActive={demo.combatActive}
            passDisabled={
              (demo.dmMode === "solace-neutral" && demo.isEnemyTurn) ||
              demo.isWrongPlayerForTurn
            }
            onPassTurn={demo.passTurn}
            dmMode={demo.dmMode}
            isEnemyTurn={demo.isEnemyTurn}
            isWrongPlayerForTurn={demo.isWrongPlayerForTurn}
            activeTurnLabel={demo.activeTurnLabel}
            showPartyButtons={
              demo.dmMode === "human" && !demo.partyLocked && !!demo.partyDraft
            }
            onCommitParty={demo.commitParty}
            onRandomNames={demo.randomizePartyNames}
            commitDisabled={demo.partyLocked}
            title={demo.actionTitle ?? "Player Action"}
            eyebrow={demo.actionEyebrow ?? "Command"}
            description={demo.actionDescription ?? "Issue one clear command."}
            inputPlaceholder={demo.forceInputPlaceholder}
            showTurnCards={!isPuzzleMode}
            showLoadoutDetails={!isPuzzleMode}
          />
        </div>
      ) : null}

      {inlineResult ? (
        <div
          ref={resolutionRef}
          style={{
            padding: "16px",
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
            display: "grid",
            gap: 10,
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
            Result
          </div>

          {inlineResult.summary ? (
            <div style={{ fontWeight: 700, lineHeight: 1.6 }}>
              {inlineResult.summary}
            </div>
          ) : null}

          {Array.isArray(inlineResult.narration) && inlineResult.narration.length > 0 ? (
            <div style={{ display: "grid", gap: 8 }}>
              {inlineResult.narration.map((line: string, idx: number) => (
                <p key={`${idx}-${line.slice(0, 24)}`} style={{ margin: 0, lineHeight: 1.7 }}>
                  {line}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {renderOptions ? (
        <div
          ref={resolutionRef}
          style={{
            padding: "16px",
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
            display: "grid",
            gap: 10,
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
            Resolution Paths
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {demo.options.map((opt: any) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  demo.setSelectedOption(opt);
                }}
                disabled={isRecording}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "13px 14px",
                  borderRadius: 14,
                  border:
                    demo.selectedOption?.id === opt.id
                      ? "1px solid rgba(214,188,120,0.28)"
                      : "1px solid rgba(255,255,255,0.08)",
                  background:
                    demo.selectedOption?.id === opt.id
                      ? "linear-gradient(180deg, rgba(214,188,120,0.10), rgba(255,255,255,0.03))"
                      : "rgba(255,255,255,0.03)",
                  color: "inherit",
                  cursor: isRecording ? "not-allowed" : "pointer",
                  lineHeight: 1.55,
                  fontWeight: demo.selectedOption?.id === opt.id ? 800 : 600,
                  opacity: isRecording ? 0.6 : 1,
                }}
              >
                {opt.description}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {renderResolution ? (
        <div
          ref={resolutionRef}
          id={anchorId("resolution")}
          style={{ scrollMarginTop: 90 }}
        >
          <ResolutionDraftAdvisoryPanel
            context={{
              optionDescription: demo.selectedOption.description,
              optionKind: inferOptionKind(
                `${demo.playerInput}\n${demo.selectedOption.description}`.trim()
              ),
            }}
            role={demo.role}
            dmMode={demo.resolutionDmMode}
            setupText={`${demo.playerInput}\n\nCurrent Room: ${demo.currentRoomTitle}\n\n${demo.roomSummary}`}
            movement={demo.resolutionMovement}
            combat={demo.resolutionCombat}
            rollModifier={demo.actingRollModifier}
            rollModifierLabel={
              demo.actingPlayerInjuryStacks > 0
                ? `Injury stacks: ${demo.actingPlayerInjuryStacks}`
                : null
            }
            onRecord={handleRecordAndReturn}
          />
        </div>
      ) : null}

      {!isPuzzleMode && demo.gameplayAllowsAction ? (
        <details
          style={{
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.02))",
            overflow: "hidden",
          }}
        >
          <summary
            style={{
              cursor: "pointer",
              padding: "12px 14px",
              fontSize: 11,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              opacity: 0.66,
            }}
          >
            Secondary Guidance
          </summary>

          <div style={{ padding: "0 14px 14px", display: "grid", gap: 12 }}>
            <NextActionHint state={demo.state} />

            {!demo.hideParsedByDefault && demo.parsed ? (
              <div
                style={{
                  padding: "14px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  overflowX: "auto",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: 0.7,
                    textTransform: "uppercase",
                    opacity: 0.58,
                    marginBottom: 8,
                  }}
                >
                  Parsed Action
                </div>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(demo.parsed, null, 2)}
                </pre>
              </div>
            ) : null}

            {!demo.hideChronicleByDefault ? (
              <details
                style={{
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  overflow: "hidden",
                }}
              >
                <summary
                  style={{
                    cursor: "pointer",
                    padding: "11px 12px",
                    fontSize: 11,
                    letterSpacing: 0.7,
                    textTransform: "uppercase",
                    opacity: 0.62,
                  }}
                >
                  Chronicle
                </summary>
                <div id={anchorId("canon")} style={{ scrollMarginTop: 90, padding: 12 }}>
                  <demo.CanonChronicleSection events={demo.state.events as any[]} />
                </div>
              </details>
            ) : null}
          </div>
        </details>
      ) : null}

      {demo.gameplayAllowsAction ? (
        <div id={anchorId("ledger")} style={{ height: 1, scrollMarginTop: 90 }} />
      ) : null}
    </div>
  );
}
