// components/resolution/ResolutionDraftAdvisoryPanel.tsx
"use client";

// ------------------------------------------------------------
// ResolutionDraftAdvisoryPanel
// ------------------------------------------------------------
// Authority contract:
// - Dice decide success/failure
// - CreativeNarrator drafts narration (NON-AUTHORITATIVE flavor)
// - Human DM mode: Arbiter may EDIT narration
// - Solace (Neutral Facilitator) DM mode: narration is NOT editable (read-only)
// - Arbiter commits canon (Record Outcome)
// ------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import { generateNarration } from "@/lib/narration/CreativeNarrator";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

type DiceMode = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";
type RollSource = "manual" | "solace";

export type ResolutionContext = {
  optionDescription: string;
  optionKind?: "safe" | "environmental" | "risky" | "contested";
};

type DMMode = "human" | "solace_neutral";

type XY = { x: number; y: number };

type Props = {
  context: ResolutionContext;
  role: "arbiter";

  /**
   * Controls whether narration is editable.
   * - "human": editable narration (current behavior)
   * - "solace_neutral": Solace-as-Arbiter narration, read-only
   *
   * Defaults to "human" to avoid changing existing flows unless explicitly set.
   */
  dmMode?: DMMode;

  /**
   * Optional truth anchors (passed from orchestrator).
   * These do NOT grant authority; they just let narration reference what actually happened.
   */
  setupText?: string | null;

  movement?: {
    from?: XY | null;
    to?: XY | null;
    direction?: "north" | "east" | "south" | "west" | "none" | null;
  } | null;

  combat?: {
    activeEnemyGroupName?: string | null;
    isEnemyTurn?: boolean;
    attackStyleHint?: "volley" | "beam" | "charge" | "unknown";
  } | null;

  onRecord: (payload: {
    description: string;
    dice: {
      mode: DiceMode;
      roll: number;
      dc: number;
      source: RollSource;
    };
    audit: string[];
  }) => void;
};

/* ------------------------------------------------------------
   Difficulty (mechanical truth only)
------------------------------------------------------------ */

function difficultyFor(kind?: ResolutionContext["optionKind"]): number {
  switch (kind) {
    case "safe":
      return 6;
    case "environmental":
      return 8;
    case "risky":
      return 10;
    case "contested":
      return 14;
    default:
      return 10;
  }
}

function clampInt(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/* ------------------------------------------------------------ */

export default function ResolutionDraftAdvisoryPanel({
  context,
  role,
  dmMode = "human",
  setupText = null,
  movement = null,
  combat = null,
  onRecord,
}: Props) {
  const dc = difficultyFor(context.optionKind);
  const isSolaceNeutral = dmMode === "solace_neutral";

  const [diceMode, setDiceMode] = useState<DiceMode>("d20");
  const [roll, setRoll] = useState<number | null>(null);
  const [manualRoll, setManualRoll] = useState("");

  const committedRef = useRef(false);

  // Draft narration (editable in human DM mode; read-only in Solace Neutral mode)
  const [draftText, setDraftText] = useState("");

  // Reset on new intent
  useEffect(() => {
    setRoll(null);
    setManualRoll("");
    setDraftText("");
    committedRef.current = false;
  }, [context.optionDescription]);

  /* ----------------------------------------------------------
     Dice handling
  ---------------------------------------------------------- */

  function rollDice() {
    const max = clampInt(Number(diceMode.slice(1)), 2, 100);
    setRoll(Math.ceil(Math.random() * max));
  }

  function acceptManualRoll() {
    const r = Number(manualRoll);
    if (!Number.isInteger(r) || r <= 0) return;
    setRoll(r);
  }

  /* ----------------------------------------------------------
     Creative narration (NON-AUTHORITATIVE flavor)
     - Human DM: keep shorter + editable
     - Solace Neutral: deeper + grounded + read-only
  ---------------------------------------------------------- */

  const generatedNarration = useMemo(() => {
    if (roll === null) return "";

    const margin = roll - dc;

    // Build truth anchors only when Solace Neutral is active
    const truth = isSolaceNeutral
      ? {
          setup: (setupText ?? "").trim() || undefined,
          movement: movement
            ? {
                from: movement.from ?? undefined,
                to: movement.to ?? undefined,
                direction: movement.direction ?? undefined,
              }
            : undefined,
          combat: combat
            ? {
                activeEnemyGroupName: combat.activeEnemyGroupName ?? undefined,
                isEnemyTurn: !!combat.isEnemyTurn,
                attackStyleHint: combat.attackStyleHint ?? "unknown",
              }
            : undefined,
          mechanics: {
            dc,
            roll,
            margin,
            success: margin >= 0,
            optionKind: context.optionKind,
          },
        }
      : undefined;

    return generateNarration({
      intentText: context.optionDescription,
      margin,
      lens: isSolaceNeutral ? "mythic" : "heroic",
      depth: isSolaceNeutral ? 2 : 1.5,
      truth,
    });
  }, [
    roll,
    dc,
    context.optionDescription,
    context.optionKind,
    isSolaceNeutral,
    setupText,
    movement,
    combat,
  ]);

  // Seed draft text:
  // - Human DM mode: seed once, then allow edits
  // - Solace Neutral mode: always keep aligned to generated narration (read-only)
  useEffect(() => {
    if (roll === null) return;

    if (isSolaceNeutral) {
      setDraftText(generatedNarration);
      return;
    }

    if (draftText === "") {
      setDraftText(generatedNarration);
    }
  }, [roll, generatedNarration, draftText, isSolaceNeutral]);

  /* ----------------------------------------------------------
     Commit (arbiter authority)
  ---------------------------------------------------------- */

  function handleRecord() {
    if (roll === null || committedRef.current) return;
    committedRef.current = true;

    const source: RollSource = manualRoll ? "manual" : "solace";

    const audit: string[] = [];
    if (isSolaceNeutral) {
      audit.push("Drafted by CreativeNarrator");
      audit.push("Presented as Solace (Neutral Facilitator) Arbiter narration (read-only)");
      audit.push("Recorded by Arbiter");
    } else {
      audit.push("Drafted by CreativeNarrator");
      audit.push("Edited by Arbiter");
    }

    onRecord({
      description: draftText.trim(),
      dice: { mode: diceMode, roll, dc, source },
      audit,
    });
  }

  /* ---------------------------------------------------------- */

  const showAnchors =
    isSolaceNeutral &&
    roll !== null &&
    (!!setupText ||
      !!movement?.from ||
      !!movement?.to ||
      !!combat?.activeEnemyGroupName);

  return (
    <section
      style={{
        border: "1px dashed #666",
        padding: 16,
      }}
    >
      <h3>Resolution Draft</h3>

      <p className="muted">Difficulty {dc}</p>

      <label>
        Dice:
        <select value={diceMode} onChange={(e) => setDiceMode(e.target.value as DiceMode)}>
          <option>d4</option>
          <option>d6</option>
          <option>d8</option>
          <option>d10</option>
          <option>d12</option>
          <option>d20</option>
        </select>
      </label>

      <div style={{ marginTop: 8 }}>
        <button onClick={rollDice}>Roll Here</button>
      </div>

      <div style={{ marginTop: 8 }}>
        <input
          placeholder="Enter physical roll"
          value={manualRoll}
          onChange={(e) => setManualRoll(e.target.value)}
        />
        <button onClick={acceptManualRoll}>Accept Roll</button>
      </div>

      {roll !== null && (
        <p>
          🎲 {diceMode} rolled <strong>{roll}</strong> vs DC <strong>{dc}</strong>
        </p>
      )}

      {roll !== null && (
        <>
          {isSolaceNeutral ? (
            <>
              <div className="muted" style={{ marginTop: 10, marginBottom: 6, fontSize: 12 }}>
                Arbiter Narration — <strong>Solace (Neutral Facilitator)</strong>{" "}
                <span style={{ opacity: 0.75 }}>(read-only)</span>
              </div>

              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  background: "rgba(0,0,0,0.35)",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.55,
                }}
              >
                {draftText || generatedNarration || "—"}
              </div>

              <div style={{ marginTop: 6, fontSize: 11, opacity: 0.75 }}>
                Narration is read-only in Solace Neutral mode.
              </div>

              {showAnchors && (
                <details style={{ marginTop: 10 }}>
                  <summary style={{ cursor: "pointer", opacity: 0.9 }}>
                    Truth anchors (why the narration says what it says)
                  </summary>
                  <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85, lineHeight: 1.5 }}>
                    {!!setupText && (
                      <div style={{ marginBottom: 6 }}>
                        <strong>Setup:</strong> {String(setupText).slice(0, 240)}
                        {String(setupText).length > 240 ? "…" : ""}
                      </div>
                    )}

                    {(movement?.from || movement?.to) && (
                      <div style={{ marginBottom: 6 }}>
                        <strong>Movement:</strong>{" "}
                        {movement?.from ? `(${movement.from.x},${movement.from.y})` : "(?)"}{" "}
                        {movement?.direction && movement.direction !== "none" ? `→ ${movement.direction}` : ""}
                        {"  "}
                        {movement?.to ? `(${movement.to.x},${movement.to.y})` : "(?)"}
                      </div>
                    )}

                    {!!combat?.activeEnemyGroupName && (
                      <div style={{ marginBottom: 6 }}>
                        <strong>Combat:</strong> {combat.activeEnemyGroupName}
                        {combat.isEnemyTurn ? " (enemy turn)" : ""}
                      </div>
                    )}

                    <div>
                      <strong>Mechanics:</strong> margin {roll - dc >= 0 ? "+" : ""}
                      {roll - dc} (roll {roll} vs DC {dc})
                    </div>
                  </div>
                </details>
              )}
            </>
          ) : (
            <>
              <label className="muted">Narration (editable)</label>
              <textarea
                rows={4}
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                style={{ width: "100%" }}
              />
            </>
          )}
        </>
      )}

      {role === "arbiter" && (
        <button onClick={handleRecord} disabled={roll === null}>
          Record Outcome
        </button>
      )}
    </section>
  );
}
