"use client";

import React from "react";
import { RitualStepPills } from "./HeroRitualUI";
import type { HeroCreationStep } from "./types";

type StandardStepProps = {
  title: string;
  subtitle?: React.ReactNode;
  currentStep: HeroCreationStep;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

type OathStepProps = {
  children: React.ReactNode;
};

const standardPanelStyle: React.CSSProperties = {
  borderRadius: 20,
  border: "1px solid rgba(255,255,255,0.10)",
  background:
    "radial-gradient(circle at top, rgba(255,188,112,0.08), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
  padding: 22,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
  maxWidth: 1240,
  margin: "0 auto",
  width: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  minWidth: 0,
};

const oathPanelStyle: React.CSSProperties = {
  borderRadius: 24,
  border: "1px solid rgba(255,205,126,0.14)",
  background:
    "radial-gradient(circle at 50% 8%, rgba(255,209,130,0.12), rgba(255,209,130,0.02) 28%, rgba(0,0,0,0) 52%), linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
  padding: "22px 22px 24px",
  boxShadow:
    "0 0 50px rgba(255,168,62,0.10), inset 0 1px 0 rgba(255,255,255,0.04)",
  maxWidth: 1440,
  margin: "0 auto",
  width: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  position: "relative",
  minWidth: 0,
};

export function StandardRitualStep({
  title,
  subtitle,
  currentStep,
  children,
  footer,
}: StandardStepProps) {
  const showHeader = currentStep !== "confirm";

  return (
    <article style={standardPanelStyle}>
      <div style={{ display: "grid", gap: 18, minWidth: 0 }}>
        {showHeader && (
          <>
            <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 950,
                  letterSpacing: 0.2,
                  lineHeight: 1.02,
                }}
              >
                {title}
              </div>

              {subtitle ? (
                <div
                  style={{
                    fontSize: 14,
                    opacity: 0.84,
                    lineHeight: 1.7,
                    maxWidth: 820,
                  }}
                >
                  {subtitle}
                </div>
              ) : null}
            </div>

            <RitualStepPills currentStep={currentStep} />
          </>
        )}

        {children}

        {footer ? (
          <div
            style={{
              paddingTop: 6,
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function OathRitualStep({ children }: OathStepProps) {
  return <article style={oathPanelStyle}>{children}</article>;
}
