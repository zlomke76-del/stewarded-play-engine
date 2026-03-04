"use client";

// ------------------------------------------------------------
// CardSection.tsx
// ------------------------------------------------------------
// Pure visual wrapper for content blocks.
// No logic, no state, no assumptions.
// ------------------------------------------------------------

import React from "react";

type Props = {
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export default function CardSection({ title, children, className = "" }: Props) {
  return (
    <section
      className={`fade-in ${className}`}
      style={{
        position: "relative",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.10)",
        background:
          "radial-gradient(900px 360px at 25% 0%, rgba(255,255,255,0.07), rgba(255,255,255,0.03) 45%, rgba(0,0,0,0.28) 100%)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.35), 0 18px 46px rgba(0,0,0,0.38)",
        backdropFilter: "blur(6px)",
        overflow: "hidden",
      }}
    >
      {/* subtle torch vignette */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: [
            "radial-gradient(520px 260px at 18% 12%, rgba(255,190,120,0.10), rgba(255,190,120,0.00) 65%)",
            "radial-gradient(640px 320px at 86% 18%, rgba(255,200,140,0.08), rgba(255,200,140,0.00) 68%)",
            "radial-gradient(120% 120% at 50% 45%, rgba(0,0,0,0.00) 55%, rgba(0,0,0,0.18) 78%, rgba(0,0,0,0.30) 100%)",
          ].join(", "),
          opacity: 0.9,
          mixBlendMode: "screen",
        }}
      />

      <div
        style={{
          position: "relative",
          padding: 18,
        }}
      >
        {title ? (
          <header style={{ marginBottom: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              {/* sigil */}
              <span
                aria-hidden
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background:
                    "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18), rgba(255,255,255,0.06))",
                  boxShadow:
                    "0 0 0 3px rgba(255,255,255,0.03), 0 0 18px rgba(255,200,140,0.10)",
                  flex: "0 0 auto",
                }}
              />

              <h2
                style={{
                  margin: 0,
                  fontSize: 16,
                  letterSpacing: 0.2,
                  fontWeight: 650,
                }}
              >
                {title}
              </h2>
            </div>

            {/* divider line */}
            <div
              aria-hidden
              style={{
                marginTop: 10,
                height: 1,
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0.00), rgba(255,255,255,0.12), rgba(255,255,255,0.00))",
              }}
            />
          </header>
        ) : null}

        {children}
      </div>
    </section>
  );
}
