"use client";

// ------------------------------------------------------------
// Demo Page — Full Stewarded Flow (Polished)
// ------------------------------------------------------------

import { useState } from "react";

import {
  createSession,
  proposeChange,
  confirmChange,
  SessionState,
  SessionEvent,
} from "@/lib/session/SessionState";

import { parseAction } from "@/lib/parser/ActionParser";
import { generateOptions, Option } from "@/lib/options/OptionGenerator";
import { renderNarration } from "@/lib/narration/NarrationRenderer";

import DMConfirmationPanel from "@/components/dm/DMConfirmationPanel";

// ------------------------------------------------------------

export default function DemoPage() {
  const [state, setState] = useState<SessionState>(
    createSession("demo-session")
  );

  const [playerInput, setPlayerInput] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [options, setOptions] = useState<Option[] | null>(null);
  const [narration, setNarration] = useState<string[]>([]);

  // ----------------------------------------------------------
  // Player submits an action
  // ----------------------------------------------------------

  function handlePlayerAction() {
    if (!playerInput.trim()) return;

    const parsedAction = parseAction("player_1", playerInput);
    const optionSet = generateOptions(parsedAction);

    setParsed(parsedAction);
    setOptions([...optionSet.options]); // ensure mutable copy
  }

  // ----------------------------------------------------------
  // DM selects an option → propose change
  // ----------------------------------------------------------

  function handleSelectOption(option: Option) {
    setState((prev) =>
      proposeChange(prev, {
        id: crypto.randomUUID(),
        description: option.description,
        proposedBy: "system",
        createdAt: Date.now(),
      })
    );
  }

  // ----------------------------------------------------------
  // DM confirms change → record event → narrate
  // ----------------------------------------------------------

  function handleConfirm(changeId: string) {
    setState((prev) => {
      const confirmed = confirmChange(prev, changeId, "DM");

      const event: SessionEvent = confirmed.events.at(-1)!;

      const rendered = renderNarration(event, {
        tone: "neutral",
      });

      setNarration((n) => [...n, rendered.text]);

      return confirmed;
    });
  }

  // ----------------------------------------------------------
  // Styles
  // ----------------------------------------------------------

  const sectionStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px",
    padding: "16px",
    marginBottom: "24px",
  };

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  return (
    <main style={{ padding: "32px", maxWidth: "960px" }}>
      <h1 style={{ marginBottom: "24px" }}>
        Stewarded Play — Full Flow Demo
      </h1>

      {/* Player Input */}
      <section style={sectionStyle}>
        <h2>Player Action</h2>
        <textarea
          rows={3}
          value={playerInput}
          onChange={(e) => setPlayerInput(e.target.value)}
          style={{
            width: "100%",
            background: "#2b2b2b",
            color: "#fff",
            borderRadius: "6px",
            padding: "10px",
            border: "1px solid #444",
          }}
          placeholder="Describe what your character does…"
        />
        <button
          onClick={handlePlayerAction}
          style={{
            marginTop: "10px",
            padding: "8px 14px",
            background: "#444",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Submit Action
        </button>
      </section>

      {/* Parsed Action */}
      {parsed && (
        <section style={sectionStyle}>
          <h2>Parsed Action (System)</h2>
          <pre
            style={{
              background: "#1e1e1e",
              padding: "12px",
              borderRadius: "6px",
              overflowX: "auto",
            }}
          >
            {JSON.stringify(parsed, null, 2)}
          </pre>
        </section>
      )}

      {/* Options */}
      {options && (
        <section style={sectionStyle}>
          <h2>Possible Options (No Ranking)</h2>
          <ul style={{ paddingLeft: "20px" }}>
            {options.map((opt) => (
              <li key={opt.id} style={{ marginBottom: "8px" }}>
                <button
                  onClick={() => handleSelectOption(opt)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "4px",
                    background: "#333",
                    color: "#fff",
                    border: "1px solid #555",
                    cursor: "pointer",
                  }}
                >
                  {opt.description}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* DM Confirmation */}
      <section style={sectionStyle}>
        <DMConfirmationPanel state={state} onConfirm={handleConfirm} />
      </section>

      {/* Narration */}
      <section
        style={{
          background: "#ffffff",
          color: "#111",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 12px 30px rgba(0,0,0,0.2)",
        }}
      >
        <h2>Canon (Confirmed Narrative)</h2>

        {narration.length === 0 ? (
          <p style={{ opacity: 0.6, fontStyle: "italic" }}>
            Awaiting first confirmed outcome…
          </p>
        ) : (
          <ul>
            {narration.map((line, i) => (
              <li
                key={i}
                style={{
                  marginBottom: "10px",
                  animation: "fadeIn 0.3s ease",
                }}
              >
                {line}
              </li>
            ))}
          </ul>
        )}

        <p
          style={{
            marginTop: "12px",
            opacity: 0.5,
            fontStyle: "italic",
          }}
        >
          Awaiting next player action…
        </p>
      </section>
    </main>
  );
}
