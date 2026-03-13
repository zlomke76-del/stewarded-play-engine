"use client";

import React, { useState } from "react";
import HeroRitualPortrait from "./HeroRitualPortrait";
import { getPortraitObjectPosition } from "./helpers";
import type { HeroCreationStep, PortraitType } from "./types";

export function SectionPill({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "good" | "warn";
}) {
  const palette =
    tone === "good"
      ? {
          border: "1px solid rgba(120,190,255,0.24)",
          background: "rgba(120,190,255,0.10)",
        }
      : tone === "warn"
        ? {
            border: "1px solid rgba(255,196,118,0.22)",
            background: "rgba(255,196,118,0.08)",
          }
        : {
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.05)",
          };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 11px",
        borderRadius: 999,
        fontSize: 12,
        lineHeight: 1,
        ...palette,
      }}
    >
      {children}
    </span>
  );
}

export function TinyLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        opacity: 0.62,
        marginBottom: 6,
        fontWeight: 800,
      }}
    >
      {children}
    </div>
  );
}

export function StatChip({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: "8px 10px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.04)",
        minWidth: 70,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          fontSize: 10,
          opacity: 0.62,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </div>
      <div style={{ marginTop: 4, fontWeight: 900, fontSize: 15 }}>{value}</div>
    </div>
  );
}

export function RitualFrame({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <article
      style={{
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.10)",
        background:
          "radial-gradient(circle at top, rgba(255,188,112,0.08), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
        padding: 22,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
        maxWidth: 1150,
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      <div style={{ display: "grid", gap: 18, minWidth: 0 }}>
        <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              opacity: 0.62,
              fontWeight: 900,
            }}
          >
            Hero Creation Ritual
          </div>
          <div style={{ fontSize: 28, fontWeight: 950, letterSpacing: 0.2 }}>{title}</div>
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

        {children}

        {footer ? (
          <div
            style={{
              paddingTop: 14,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              minWidth: 0,
            }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function RitualChoiceCard({
  title,
  subtitle,
  imageSrc,
  onClick,
  selected = false,
  disabled = false,
  details,
  species,
  className,
  portrait,
  fallbackImageSrc,
}: {
  title: string;
  subtitle?: string;
  imageSrc: string;
  onClick: () => void;
  selected?: boolean;
  disabled?: boolean;
  details?: React.ReactNode;
  species: string;
  className: string;
  portrait: PortraitType;
  fallbackImageSrc?: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        textAlign: "left",
        padding: 0,
        borderRadius: 18,
        overflow: "hidden",
        border: selected
          ? "1px solid rgba(255,205,126,0.36)"
          : "1px solid rgba(255,255,255,0.10)",
        background: selected
          ? "linear-gradient(180deg, rgba(255,206,128,0.08), rgba(255,255,255,0.03))"
          : "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.58 : 1,
        boxShadow: selected
          ? "0 16px 38px rgba(255,145,42,0.12)"
          : hovered
            ? "0 12px 28px rgba(0,0,0,0.28)"
            : "none",
        transform: hovered && !disabled ? "translateY(-3px)" : "translateY(0)",
        transition:
          "transform 140ms ease, filter 140ms ease, box-shadow 140ms ease, border-color 140ms ease",
      }}
    >
      <div
        style={{
          height: 210,
          background: "rgba(255,255,255,0.04)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <HeroRitualPortrait
          species={species}
          className={className}
          portrait={portrait}
          imageSrc={imageSrc}
          fallbackImageSrc={fallbackImageSrc}
          alt={title}
          height={210}
          objectPosition={getPortraitObjectPosition("card")}
        />
      </div>

      <div
        style={{
          padding: 16,
          display: "grid",
          gap: 8,
          minWidth: 0,
          boxSizing: "border-box",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 900 }}>{title}</div>
        {subtitle ? (
          <div style={{ fontSize: 13, opacity: 0.82, lineHeight: 1.6 }}>
            {subtitle}
          </div>
        ) : null}
        {details ? <div style={{ display: "grid", gap: 6, minWidth: 0 }}>{details}</div> : null}
      </div>
    </button>
  );
}

export function RitualStepPills({
  currentStep,
}: {
  currentStep: HeroCreationStep;
}) {
  const order: HeroCreationStep[] = [
    "intro",
    "sex",
    "species",
    "class",
    "focus",
    "name",
    "confirm",
  ];

  const labels: Record<HeroCreationStep, string> = {
    intro: "Opening",
    sex: "Sex",
    species: "Species",
    class: "Class",
    focus: "Focus",
    name: "Name",
    confirm: "Oath",
  };

  const currentIndex = order.indexOf(currentStep);

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {order.map((step, idx) => {
        const active = step === currentStep;
        const complete = idx < currentIndex;

        return (
          <SectionPill
            key={step}
            tone={active ? "warn" : complete ? "good" : "default"}
          >
            <strong>{idx + 1}</strong> {labels[step]}
          </SectionPill>
        );
      })}
    </div>
  );
}
