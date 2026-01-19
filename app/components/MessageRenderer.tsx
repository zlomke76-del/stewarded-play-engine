"use client";

import React from "react";

type Props = {
  content?: string | null;
  imageUrl?: string | null;
};

export default function MessageRenderer({ content, imageUrl }: Props) {
  // --------------------------------------------------
  // IMAGE-ONLY MESSAGE (AUTHORITATIVE)
  // --------------------------------------------------
  if (imageUrl && (!content || !content.trim())) {
    return (
      <div
        style={{
          margin: "6px 0",
          borderRadius: 12,
          overflow: "hidden",
          background: "rgba(14,23,38,.85)",
          boxShadow: "0 4px 14px rgba(0,0,0,.45)",
        }}
      >
        <img
          src={imageUrl}
          alt="Generated image"
          style={{
            display: "block",
            maxWidth: "100%",
            height: "auto",
          }}
        />
      </div>
    );
  }

  // --------------------------------------------------
  // TEXT (WITH OPTIONAL INLINE IMAGE)
  // --------------------------------------------------
  const safeContent = content ?? "";
  const parts = safeContent.split(/```/g);

  return (
    <>
      {imageUrl && (
        <div
          style={{
            marginBottom: 8,
            borderRadius: 12,
            overflow: "hidden",
            background: "rgba(14,23,38,.85)",
            boxShadow: "0 4px 14px rgba(0,0,0,.45)",
          }}
        >
          <img
            src={imageUrl}
            alt="Generated image"
            style={{
              display: "block",
              maxWidth: "100%",
              height: "auto",
            }}
          />
        </div>
      )}

      {parts.map((part, idx) => {
        const isCode = idx % 2 === 1;

        if (!isCode) {
          return (
            <span
              key={idx}
              style={{
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                lineHeight: 1.35,
              }}
            >
              {part}
            </span>
          );
        }

        const lines = part.split("\n");
        const firstLine = lines[0].trim();
        const hasLang = /^[a-zA-Z0-9]+$/.test(firstLine);
        const code = hasLang ? lines.slice(1).join("\n") : part;

        return (
          <div
            key={idx}
            style={{
              position: "relative",
              margin: "12px 0",
              borderRadius: 8,
              background: "#0b1220",
              border: "1px solid rgba(255,255,255,.08)",
            }}
          >
            <button
              onClick={() => navigator.clipboard.writeText(code)}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                fontSize: 12,
                padding: "4px 8px",
                borderRadius: 6,
                background: "#fbbf24",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Copy
            </button>

            <pre
              style={{
                margin: 0,
                padding: "14px",
                overflowX: "auto",
                fontSize: 13,
                lineHeight: 1.45,
                color: "#e5e7eb",
              }}
            >
              <code>{code}</code>
            </pre>
          </div>
        );
      })}
    </>
  );
}
