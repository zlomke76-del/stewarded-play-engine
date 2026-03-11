"use client";

import React, { useState } from "react";

type Props = {
  tavernScore: number;
  onClose: () => void;
};

type Topic = "dungeon" | "people" | "you" | null;

export default function BarmaidPanel({ tavernScore, onClose }: Props) {
  const [topic, setTopic] = useState<Topic>(null);

  function greeting(): string {
    if (tavernScore >= 100) {
      return "Well now… that throw will be talked about all night.";
    }

    if (tavernScore >= 60) {
      return "You’ve got a steady hand. Most travelers can’t even hit the board.";
    }

    if (tavernScore >= 31) {
      return "Not bad. The regulars noticed that one.";
    }

    return "Careful with those axes. The floor’s already claimed a few.";
  }

  function response(): string {
    if (!topic) return "";

    if (topic === "dungeon") {
      return "The stone below remembers more footsteps than names. The first rooms rarely kill fools quickly — they teach them first.";
    }

    if (topic === "people") {
      return "Every hero thinks they’re the first one brave enough to descend. They’re not. The tavern remembers the ones who came back.";
    }

    if (topic === "you") {
      if (tavernScore >= 100) {
        return "You throw like someone who’s already faced worse than a wooden target.";
      }

      if (tavernScore >= 60) {
        return "Calm breath. Strong wrist. That kind of focus carries a person far below.";
      }

      return "A little practice goes a long way down there.";
    }

    return "";
  }

  return (
    <div
      style={{
        marginTop: 24,
        background: "rgba(20,20,20,0.9)",
        border: "1px solid #6b4a2f",
        borderRadius: 10,
        padding: 24,
        maxWidth: 760,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 20,
          alignItems: "flex-start",
        }}
      >
        <img
          src="/assets/V3/Dungeon/Tavern/bar_maid_01.png"
          alt="Barmaid"
          style={{
            width: 180,
            borderRadius: 6,
            boxShadow: "0 4px 14px rgba(0,0,0,0.6)",
          }}
        />

        <div style={{ flex: 1 }}>
          <h3 style={{ marginBottom: 8 }}>The Barmaid</h3>

          <p
            style={{
              opacity: 0.9,
              marginBottom: 14,
              lineHeight: 1.4,
            }}
          >
            {greeting()}
          </p>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 12,
            }}
          >
            <button onClick={() => setTopic("dungeon")}>
              Ask about the dungeon
            </button>

            <button onClick={() => setTopic("people")}>
              Ask about the people who descend
            </button>

            <button onClick={() => setTopic("you")}>
              Ask what she noticed
            </button>
          </div>

          {topic && (
            <div
              style={{
                background: "#1b1b1b",
                borderRadius: 6,
                padding: 12,
                lineHeight: 1.5,
                marginBottom: 12,
              }}
            >
              {response()}
            </div>
          )}

          <button
            onClick={onClose}
            style={{
              marginTop: 6,
            }}
          >
            Return to Tavern
          </button>
        </div>
      </div>
    </div>
  );
}
