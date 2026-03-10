"use client";

import { useState } from "react";

type Props = {
  tavernScore: number;
  onClose: () => void;
};

export default function BarmaidPanel({ tavernScore, onClose }: Props) {
  const [topic, setTopic] = useState<string | null>(null);

  function getGreeting() {
    if (tavernScore >= 100)
      return "Well now… that throw will be talked about for a while.";

    if (tavernScore >= 60)
      return "You've got a steady hand. Most people miss the board entirely.";

    return "Not bad. The regulars noticed.";
  }

  function getResponse(topic: string) {
    switch (topic) {
      case "dungeon":
        return "The ones who rush down first rarely come back. The ones who listen to the stone… sometimes do.";

      case "people":
        return "Every hero thinks they are the first to descend. The tavern remembers otherwise.";

      case "you":
        if (tavernScore >= 100)
          return "You throw like someone who has already faced worse than a wooden board.";

        if (tavernScore >= 60)
          return "Steady breath. Calm wrist. You’ll go further than most.";

        return "A little practice goes a long way down there.";

      default:
        return "";
    }
  }

  return (
    <div
      style={{
        background: "rgba(0,0,0,0.85)",
        border: "1px solid #6b4a2f",
        padding: "24px",
        borderRadius: "8px",
        marginTop: "16px",
        maxWidth: "700px",
      }}
    >
      <div style={{ display: "flex", gap: "20px" }}>
        <img
          src="/assets/V3/Dungeon/Tavern/bar_maid_01.png"
          style={{ width: 180, borderRadius: 6 }}
        />

        <div style={{ flex: 1 }}>
          <h3>The Barmaid</h3>

          <p style={{ opacity: 0.9 }}>{getGreeting()}</p>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
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
                marginTop: 14,
                padding: 12,
                background: "#1b1b1b",
                borderRadius: 4,
              }}
            >
              {getResponse(topic)}
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <button onClick={onClose}>Return to Tavern</button>
          </div>
        </div>
      </div>
    </div>
  );
}
