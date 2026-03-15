"use client";

import React from "react";
import { getPortraitPath } from "@/lib/portraits/getPortraitPath";
import {
  BUILD_FOCUS_META,
  BUILD_FOCUS_OPTIONS,
  CLASS_META,
  SPECIES_META,
  type BuildFocus,
  type ClassMeta,
  type FocusMeta,
  type HeroCreationStep,
  type PartyDeclaredPayload,
  type PartyMember,
  type SpeciesMeta,
} from "./types";
import { getFocusTitleColor, getPortraitObjectPosition } from "./helpers";
import {
  RitualChoiceCard,
  SectionPill,
  StatChip,
  TinyLabel,
} from "./HeroRitualUI";
import HeroRitualPortrait from "./HeroRitualPortrait";
import { StandardRitualStep, OathRitualStep } from "./HeroRitualStep";

const controlButtonBase: React.CSSProperties = {
  padding: "11px 14px",
  borderRadius: 12,
  fontWeight: 850,
  letterSpacing: 0.2,
  cursor: "pointer",
  transition:
    "transform 140ms ease, filter 140ms ease, box-shadow 140ms ease, opacity 140ms ease",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "inherit",
  outline: "none",
};

const helperCardStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
  display: "grid",
  gap: 8,
  boxSizing: "border-box",
  minWidth: 0,
};

const oathInfoCardStyle: React.CSSProperties = {
  ...helperCardStyle,
  width: "100%",
  minWidth: 0,
  overflow: "hidden",
  wordBreak: "break-word",
};

type StandardStepBase = {
  editable: boolean;
  currentStep: HeroCreationStep;
  onBack: () => void;
};

type IntroPanelProps = {
  editable: boolean;
  currentStep: HeroCreationStep;
  fallbackPortraitPath: string;
  onBegin: () => void;
};

export function IntroPanel({
  editable,
  currentStep,
  fallbackPortraitPath,
  onBegin,
}: IntroPanelProps) {
  return (
    <StandardRitualStep
      title="Echoes of Fate"
      subtitle={
        <>
          The tavern grows quiet.
          <br />
          One hero will begin the descent.
          <br />
          Their name will enter the Chronicle.
        </>
      }
      currentStep={currentStep}
      footer={
        <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
          <button
            type="button"
            onClick={onBegin}
            disabled={!editable}
            style={{
              ...controlButtonBase,
              padding: "14px 22px",
              border: "1px solid rgba(255,205,126,0.28)",
              background: editable
                ? "linear-gradient(180deg, rgba(255,201,116,0.98), rgba(218,132,47,0.98))"
                : "linear-gradient(180deg, rgba(107,89,69,0.7), rgba(74,55,39,0.74))",
              color: editable ? "#2f1606" : "rgba(244,227,201,0.75)",
              boxShadow: editable
                ? "0 0 20px rgba(255,160,60,0.35), 0 10px 28px rgba(255,145,42,0.18), inset 0 1px 0 rgba(255,244,220,0.72)"
                : "none",
              opacity: editable ? 1 : 0.62,
              cursor: editable ? "pointer" : "not-allowed",
              minWidth: 220,
            }}
          >
            Begin the Chronicle
          </button>
        </div>
      }
    >
      <div
        style={{
          display: "grid",
          justifyItems: "center",
          gap: 18,
          padding: "10px 0 6px",
          minWidth: 0,
        }}
      >
        <div
          style={{
            width: "min(100%, 760px)",
            borderRadius: 20,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.03)",
            boxShadow: "0 18px 46px rgba(0,0,0,0.24)",
            position: "relative",
            boxSizing: "border-box",
          }}
        >
          <img
            src="/assets/V3/Dungeon/Tavern/tavern_01.png"
            alt="The tavern grows quiet"
            style={{
              width: "100%",
              height: 320,
              objectFit: "cover",
              objectPosition: getPortraitObjectPosition("intro"),
              display: "block",
            }}
            onError={(e) => {
              const img = e.currentTarget;
              img.onerror = null;
              img.src = fallbackPortraitPath;
              img.style.objectPosition = getPortraitObjectPosition("intro");
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.08) 18%, rgba(0,0,0,0.22) 60%, rgba(0,0,0,0.52) 100%)",
              pointerEvents: "none",
            }}
          />
        </div>

        <div
          style={{
            fontSize: 14,
            opacity: 0.78,
            maxWidth: 700,
            textAlign: "center",
            lineHeight: 1.7,
          }}
        >
          The first name set into canon will carry forward into every future
          descent. Choose slowly.
        </div>
      </div>
    </StandardRitualStep>
  );
}

type SexPanelProps = StandardStepBase & {
  resolvedSpecies: string;
  resolvedClass: string;
  row: PartyMember;
  fallbackPortraitPath: string;
  onSelectPortrait: (portrait: "Male" | "Female") => void;
};

export function SexPanel({
  editable,
  currentStep,
  onBack,
  resolvedSpecies,
  resolvedClass,
  row,
  fallbackPortraitPath,
  onSelectPortrait,
}: SexPanelProps) {
  return (
    <StandardRitualStep
      title="Choose a Form"
      subtitle="Set the first face of your hero. This determines which portrait line follows through the ritual."
      currentStep={currentStep}
      footer={
        <>
          <button
            type="button"
            onClick={onBack}
            style={{
              ...controlButtonBase,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
              color: "inherit",
            }}
          >
            Back
          </button>
          <div style={{ fontSize: 12, opacity: 0.72 }}>
            Select the portrait line to continue.
          </div>
        </>
      }
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 18,
          width: "100%",
          minWidth: 0,
          alignItems: "stretch",
        }}
      >
        {(["Male", "Female"] as const).map((portrait) => {
          const selected = row?.portrait === portrait;
          const imageSrc = getPortraitPath(
            resolvedSpecies,
            resolvedClass,
            portrait
          );

          return (
            <RitualChoiceCard
              key={portrait}
              title={portrait}
              subtitle={
                portrait === "Male"
                  ? "A rugged line of portraits for your hero's journey."
                  : "A fierce line of portraits for your hero's journey."
              }
              imageSrc={imageSrc}
              fallbackImageSrc={fallbackPortraitPath}
              species={resolvedSpecies}
              className={resolvedClass}
              portrait={portrait}
              selected={selected}
              disabled={!editable}
              details={
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.72,
                    lineHeight: 1.5,
                  }}
                >
                  This choice controls the portrait set shown during species,
                  class, name, and oath.
                </div>
              }
              onClick={() => onSelectPortrait(portrait)}
            />
          );
        })}
      </div>
    </StandardRitualStep>
  );
}

type SpeciesPanelProps = StandardStepBase & {
  visibleSpecies: readonly string[];
  pageIndex: number;
  pageCount: number;
  resolvedSpecies: string;
  resolvedClass: string;
  row: PartyMember;
  fallbackPortraitPath: string;
  onPrevPage: () => void;
  onNextPage: () => void;
  onSelectSpecies: (species: string) => void;
};

export function SpeciesPanel({
  editable,
  currentStep,
  onBack,
  visibleSpecies,
  pageIndex,
  pageCount,
  resolvedSpecies,
  resolvedClass,
  row,
  fallbackPortraitPath,
  onPrevPage,
  onNextPage,
  onSelectSpecies,
}: SpeciesPanelProps) {
  return (
    <StandardRitualStep
      title="Choose a Species"
      subtitle="Identity begins with lineage. Here the player should understand not just the fantasy, but the practical shape of the build."
      currentStep={currentStep}
      footer={
        <div
          style={{
            display: "grid",
            gap: 12,
            width: "100%",
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={onBack}
              style={{
                ...controlButtonBase,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
                color: "inherit",
              }}
            >
              Back
            </button>

            <div style={{ fontSize: 12, opacity: 0.72 }}>
              Compare strengths, tradeoffs, and playstyle fit.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <SectionPill tone="warn">
              <strong>Species Set</strong> {pageIndex + 1} of {pageCount}
            </SectionPill>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={onPrevPage}
                disabled={pageIndex === 0}
                style={{
                  ...controlButtonBase,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.05)",
                  color: "inherit",
                  opacity: pageIndex === 0 ? 0.5 : 1,
                  cursor: pageIndex === 0 ? "not-allowed" : "pointer",
                  minWidth: 110,
                }}
              >
                Previous 3
              </button>

              <button
                type="button"
                onClick={onNextPage}
                disabled={pageIndex >= pageCount - 1}
                style={{
                  ...controlButtonBase,
                  border: "1px solid rgba(255,205,126,0.22)",
                  background: "rgba(255,196,118,0.08)",
                  color: "inherit",
                  opacity: pageIndex >= pageCount - 1 ? 0.5 : 1,
                  cursor: pageIndex >= pageCount - 1 ? "not-allowed" : "pointer",
                  minWidth: 110,
                }}
              >
                Next 3
              </button>
            </div>
          </div>
        </div>
      }
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 18,
          width: "100%",
          minWidth: 0,
          alignItems: "stretch",
        }}
      >
        {visibleSpecies.map((species) => {
          const imageSrc = getPortraitPath(
            species,
            resolvedClass,
            row?.portrait ?? "Male"
          );
          const selected =
            resolvedSpecies.toLowerCase() === species.toLowerCase();
          const meta = SPECIES_META[species] ?? SPECIES_META.Human;

          return (
            <RitualChoiceCard
              key={species}
              title={species}
              subtitle={meta.fantasy}
              imageSrc={imageSrc}
              fallbackImageSrc={fallbackPortraitPath}
              species={species}
              className={resolvedClass}
              portrait={row?.portrait ?? "Male"}
              selected={selected}
              disabled={!editable}
              details={
                <>
                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.88,
                      lineHeight: 1.5,
                    }}
                  >
                    <strong>Strengths:</strong> {meta.strengths.join(" · ")}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.78,
                      lineHeight: 1.5,
                    }}
                  >
                    <strong>Tradeoff:</strong> {meta.tradeoff}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.72,
                      lineHeight: 1.5,
                    }}
                  >
                    <strong>Best for:</strong> {meta.bestFor}
                  </div>
                </>
              }
              onClick={() => onSelectSpecies(species)}
            />
          );
        })}
      </div>
    </StandardRitualStep>
  );
}

type ClassPanelProps = StandardStepBase & {
  visibleClasses: readonly string[];
  pageIndex: number;
  pageCount: number;
  resolvedSpecies: string;
  resolvedClass: string;
  row: PartyMember;
  fallbackPortraitPath: string;
  renderClassStepCallout: (className: string) => React.ReactNode;
  onPrevPage: () => void;
  onNextPage: () => void;
  onSelectClass: (className: string) => void;
};

export function ClassPanel({
  editable,
  currentStep,
  onBack,
  visibleClasses,
  pageIndex,
  pageCount,
  resolvedSpecies,
  resolvedClass,
  row,
  fallbackPortraitPath,
  renderClassStepCallout,
  onPrevPage,
  onNextPage,
  onSelectClass,
}: ClassPanelProps) {
  return (
    <StandardRitualStep
      title="Choose a Class"
      subtitle="Choose the path your hero will carry into the first descent."
      currentStep={currentStep}
      footer={
        <div
          style={{
            display: "grid",
            gap: 12,
            width: "100%",
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={onBack}
              style={{
                ...controlButtonBase,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
                color: "inherit",
              }}
            >
              Back
            </button>

            <div style={{ fontSize: 12, opacity: 0.72 }}>
              Four archetypes at a time. Read less. Feel the role faster.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <SectionPill tone="warn">
              <strong>Class Set</strong> {pageIndex + 1} of {pageCount}
            </SectionPill>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={onPrevPage}
                disabled={pageIndex === 0}
                style={{
                  ...controlButtonBase,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.05)",
                  color: "inherit",
                  opacity: pageIndex === 0 ? 0.5 : 1,
                  cursor: pageIndex === 0 ? "not-allowed" : "pointer",
                  minWidth: 110,
                }}
              >
                Previous 4
              </button>

              <button
                type="button"
                onClick={onNextPage}
                disabled={pageIndex >= pageCount - 1}
                style={{
                  ...controlButtonBase,
                  border: "1px solid rgba(255,205,126,0.22)",
                  background: "rgba(255,196,118,0.08)",
                  color: "inherit",
                  opacity: pageIndex >= pageCount - 1 ? 0.5 : 1,
                  cursor: pageIndex >= pageCount - 1 ? "not-allowed" : "pointer",
                  minWidth: 110,
                }}
              >
                Next 4
              </button>
            </div>
          </div>
        </div>
      }
    >
      <div
        style={{
          ...helperCardStyle,
          border: "1px solid rgba(255,196,118,0.14)",
          background:
            "radial-gradient(circle at 50% 0%, rgba(255,196,118,0.10), rgba(255,255,255,0.02) 42%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 900 }}>
          Chosen lineage, awaiting its path
        </div>
        <div style={{ fontSize: 13, opacity: 0.82, lineHeight: 1.65 }}>
          <strong>{resolvedSpecies}</strong> stands ready. The next choice
          determines how this hero enters danger, what role they carry, and which
          focus pairings will shape the first descent.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            visibleClasses.length === 4
              ? "repeat(2, minmax(0, 1fr))"
              : "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 18,
          width: "100%",
          minWidth: 0,
          alignItems: "stretch",
        }}
      >
        {visibleClasses.map((className) => {
          const imageSrc = getPortraitPath(
            resolvedSpecies,
            className,
            row?.portrait ?? "Male"
          );
          const selected =
            resolvedClass.toLowerCase() === className.toLowerCase();
          const meta = CLASS_META[className] ?? CLASS_META.Warrior;

          return (
            <RitualChoiceCard
              key={className}
              title={className}
              subtitle={meta.fantasy}
              imageSrc={imageSrc}
              fallbackImageSrc={fallbackPortraitPath}
              species={resolvedSpecies}
              className={className}
              portrait={row?.portrait ?? "Male"}
              selected={selected}
              disabled={!editable}
              details={
                <>
                  {renderClassStepCallout(className)}
                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.88,
                      lineHeight: 1.5,
                    }}
                  >
                    <strong>Role:</strong> {meta.role}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.88,
                      lineHeight: 1.5,
                    }}
                  >
                    <strong>Difficulty:</strong> {meta.difficulty}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.84,
                      lineHeight: 1.5,
                    }}
                  >
                    <strong>Strengths:</strong> {meta.strengths.join(" · ")}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.76,
                      lineHeight: 1.5,
                    }}
                  >
                    <strong>Tradeoff:</strong> {meta.tradeoff}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.72,
                      lineHeight: 1.5,
                    }}
                  >
                    <strong>Best focus:</strong> {meta.bestFocus}
                  </div>
                </>
              }
              onClick={() => onSelectClass(className)}
            />
          );
        })}
      </div>
    </StandardRitualStep>
  );
}

type FocusPanelProps = {
  editable: boolean;
  currentStep: HeroCreationStep;
  resolvedSpecies: string;
  resolvedClass: string;
  resolvedClassMeta: ClassMeta;
  resolvedSpeciesMeta: SpeciesMeta;
  row: PartyMember;
  display: string;
  portraitPath: string;
  fallbackPortraitPath: string;
  hoveredFocus: BuildFocus | null;
  currentFocus: BuildFocus;
  previewFocus: BuildFocus;
  previewFocusCopy: {
    doctrine: string;
    vow: string;
    consequence: string;
    chosenLabel: string;
  };
  previewFocusPalette: {
    border: string;
    background: string;
    shadow: string;
  };
  renderFocusDeltaSummary: (focus: BuildFocus) => string;
  onBack: () => void;
  onHoverFocus: (focus: BuildFocus | null) => void;
  onSelectFocus: (focus: BuildFocus) => void;
  baseStats: { ac: number; hpMax: number; initiativeMod: number };
};

export function FocusPanel({
  editable,
  currentStep,
  resolvedSpecies,
  resolvedClass,
  resolvedClassMeta,
  resolvedSpeciesMeta,
  row,
  display,
  portraitPath,
  fallbackPortraitPath,
  hoveredFocus,
  currentFocus,
  previewFocus,
  previewFocusCopy,
  previewFocusPalette,
  renderFocusDeltaSummary,
  onBack,
  onHoverFocus,
  onSelectFocus,
  baseStats,
}: FocusPanelProps) {
  return (
    <StandardRitualStep
      title="Choose a Focus"
      subtitle="Every hero survives by a stance. Choose how this one enters danger."
      currentStep={currentStep}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(420px, 1.22fr) minmax(360px, 1fr)",
          gap: 18,
          alignItems: "stretch",
          minWidth: 0,
        }}
      >
        <div
          style={{
            borderRadius: 22,
            overflow: "hidden",
            border: previewFocusPalette.border,
            background:
              "radial-gradient(circle at 50% 18%, rgba(255,224,178,0.12), rgba(255,224,178,0.02) 24%, rgba(0,0,0,0) 44%), linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
            boxShadow:
              previewFocusPalette.shadow || "0 18px 44px rgba(0,0,0,0.24)",
            minWidth: 0,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              padding: 16,
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              display: "grid",
              gap: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <SectionPill tone="warn">
                <strong>{previewFocusCopy.chosenLabel}</strong>
              </SectionPill>

              <div
                style={{
                  fontSize: 12,
                  opacity: 0.74,
                }}
              >
                {resolvedSpecies} {resolvedClass} · {row?.portrait ?? "Male"}
              </div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 950,
                  lineHeight: 1.04,
                  color: getFocusTitleColor(previewFocus),
                }}
              >
                {BUILD_FOCUS_OPTIONS.find((x) => x.id === previewFocus)?.icon}{" "}
                {BUILD_FOCUS_OPTIONS.find((x) => x.id === previewFocus)?.label}
              </div>
              <div
                style={{
                  fontSize: 19,
                  fontWeight: 800,
                  opacity: 0.92,
                }}
              >
                {previewFocusCopy.doctrine}
              </div>
              <div
                style={{
                  fontSize: 13,
                  opacity: 0.78,
                  lineHeight: 1.65,
                  maxWidth: 560,
                }}
              >
                {previewFocusCopy.vow}
              </div>
            </div>
          </div>

          <HeroRitualPortrait
            species={resolvedSpecies}
            className={resolvedClass}
            portrait={row?.portrait ?? "Male"}
            imageSrc={portraitPath}
            fallbackImageSrc={fallbackPortraitPath}
            alt={`${display} focus portrait`}
            height={430}
            objectPosition={getPortraitObjectPosition("oath")}
          />

          <div
            style={{
              padding: 16,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              display: "grid",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <SectionPill>
                <strong>Shift</strong> {renderFocusDeltaSummary(previewFocus)}
              </SectionPill>
              <SectionPill>
                <strong>Role</strong> {resolvedClassMeta.role}
              </SectionPill>
              <SectionPill>
                <strong>Base</strong> {resolvedSpeciesMeta.bestFor}
              </SectionPill>
            </div>

            <div
              style={{
                fontSize: 13,
                opacity: 0.8,
                lineHeight: 1.65,
              }}
            >
              <strong>Consequence:</strong> {previewFocusCopy.consequence}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 10,
                minWidth: 0,
              }}
            >
              {(() => {
                const { ac, hpMax, initiativeMod } = (() => {
                  if (previewFocus === "guardian") {
                    return {
                      ac: Math.min(18, baseStats.ac + 1),
                      hpMax: baseStats.hpMax,
                      initiativeMod: Math.max(-2, baseStats.initiativeMod - 1),
                    };
                  }
                  if (previewFocus === "swift") {
                    return {
                      ac: Math.max(10, baseStats.ac - 1),
                      hpMax: baseStats.hpMax,
                      initiativeMod: Math.min(6, baseStats.initiativeMod + 2),
                    };
                  }
                  if (previewFocus === "hardy") {
                    return {
                      ac: baseStats.ac,
                      hpMax: baseStats.hpMax + 2,
                      initiativeMod: baseStats.initiativeMod,
                    };
                  }
                  return baseStats;
                })();

                return (
                  <>
                    <StatChip label="AC" value={ac} />
                    <StatChip label="HP Max" value={hpMax} />
                    <StatChip label="Init" value={initiativeMod} />
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 14, minWidth: 0 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 14,
              minWidth: 0,
            }}
          >
            {BUILD_FOCUS_OPTIONS.map((option) => {
              const active = currentFocus === option.id;
              const hovered = hoveredFocus === option.id;
              const meta = BUILD_FOCUS_META[option.id];
              const palette =
                hovered || active
                  ? {
                      border:
                        option.id === "guardian"
                          ? "1px solid rgba(255,196,118,0.44)"
                          : option.id === "swift"
                            ? "1px solid rgba(98,210,220,0.44)"
                            : option.id === "hardy"
                              ? "1px solid rgba(220,110,110,0.42)"
                              : "1px solid rgba(160,180,210,0.42)",
                      background:
                        option.id === "guardian"
                          ? "linear-gradient(180deg, rgba(255,190,90,0.16), rgba(255,255,255,0.03))"
                          : option.id === "swift"
                            ? "linear-gradient(180deg, rgba(70,200,215,0.15), rgba(255,255,255,0.03))"
                            : option.id === "hardy"
                              ? "linear-gradient(180deg, rgba(170,70,70,0.16), rgba(255,255,255,0.03))"
                              : "linear-gradient(180deg, rgba(140,165,200,0.16), rgba(255,255,255,0.03))",
                      shadow:
                        option.id === "guardian"
                          ? "0 12px 28px rgba(255,170,60,0.18)"
                          : option.id === "swift"
                            ? "0 12px 28px rgba(60,180,200,0.16)"
                            : option.id === "hardy"
                              ? "0 12px 28px rgba(140,50,50,0.16)"
                              : "0 12px 28px rgba(120,145,180,0.16)",
                    }
                  : {
                      border:
                        option.id === "guardian"
                          ? "1px solid rgba(255,196,118,0.24)"
                          : option.id === "swift"
                            ? "1px solid rgba(98,210,220,0.24)"
                            : option.id === "hardy"
                              ? "1px solid rgba(220,110,110,0.22)"
                              : "1px solid rgba(160,180,210,0.22)",
                      background:
                        option.id === "guardian"
                          ? "linear-gradient(180deg, rgba(255,180,80,0.09), rgba(255,255,255,0.02))"
                          : option.id === "swift"
                            ? "linear-gradient(180deg, rgba(70,200,215,0.08), rgba(255,255,255,0.02))"
                            : option.id === "hardy"
                              ? "linear-gradient(180deg, rgba(170,70,70,0.08), rgba(255,255,255,0.02))"
                              : "linear-gradient(180deg, rgba(140,165,200,0.08), rgba(255,255,255,0.02))",
                      shadow: "none",
                    };

              const copy = {
                balanced: {
                  doctrine: "Yield nothing to extremes.",
                  consequence: "No sharp weakness. No sharp advantage.",
                },
                guardian: {
                  doctrine: "Hold the line.",
                  consequence: "Harder to break. Slower to answer.",
                },
                swift: {
                  doctrine: "Strike before fear settles.",
                  consequence: "Faster to act. Easier to punish if caught.",
                },
                hardy: {
                  doctrine: "Endure what should kill you.",
                  consequence: "More staying power. Less tempo advantage.",
                },
              }[option.id];

              return (
                <button
                  key={option.id}
                  type="button"
                  onMouseEnter={() => onHoverFocus(option.id)}
                  onMouseLeave={() => onHoverFocus(null)}
                  onFocus={() => onHoverFocus(option.id)}
                  onBlur={() => onHoverFocus(null)}
                  onClick={() => onSelectFocus(option.id)}
                  disabled={!editable}
                  style={{
                    textAlign: "left",
                    padding: 18,
                    borderRadius: 20,
                    border: palette.border,
                    background: palette.background,
                    boxShadow: palette.shadow,
                    color: "inherit",
                    cursor: editable ? "pointer" : "not-allowed",
                    opacity: editable ? 1 : 0.6,
                    display: "grid",
                    gap: 10,
                    transition:
                      "transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease, filter 140ms ease",
                    minWidth: 0,
                    boxSizing: "border-box",
                    transform:
                      active || hovered ? "translateY(-3px)" : "translateY(0)",
                    minHeight: 220,
                    alignContent: "start",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 950,
                        color: getFocusTitleColor(option.id),
                      }}
                    >
                      {option.icon} {option.label}
                    </div>

                    {active ? (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 900,
                          textTransform: "uppercase",
                          letterSpacing: "0.12em",
                          padding: "6px 8px",
                          borderRadius: 999,
                          border: "1px solid rgba(255,255,255,0.16)",
                          background: "rgba(255,255,255,0.08)",
                        }}
                      >
                        Bound
                      </span>
                    ) : null}
                  </div>

                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      lineHeight: 1.35,
                      opacity: 0.94,
                    }}
                  >
                    {copy.doctrine}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.9,
                      lineHeight: 1.5,
                    }}
                  >
                    <strong>Shift:</strong> {renderFocusDeltaSummary(option.id)}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.8,
                      lineHeight: 1.55,
                    }}
                  >
                    <strong>Vow:</strong> {copy.consequence}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.72,
                      lineHeight: 1.55,
                    }}
                  >
                    <strong>For:</strong> {meta.bestFor}
                  </div>
                </button>
              );
            })}
          </div>

          <div
            style={{
              ...helperCardStyle,
              border: "1px solid rgba(255,255,255,0.10)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 900 }}>
              What this stance changes
            </div>
            <div style={{ fontSize: 13, opacity: 0.82, lineHeight: 1.65 }}>
              Your class remains <strong>{resolvedClass}</strong>. Your lineage
              remains <strong>{resolvedSpecies}</strong>. Focus only changes how
              this hero survives pressure, controls tempo, and carries their power
              into the first descent.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
              paddingTop: 6,
            }}
          >
            <button
              type="button"
              onClick={onBack}
              style={{
                ...controlButtonBase,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
                color: "inherit",
              }}
            >
              Back
            </button>

            <div style={{ fontSize: 12, opacity: 0.72 }}>
              Hover a stance to feel its doctrine. Click to bind it.
            </div>
          </div>
        </div>
      </div>
    </StandardRitualStep>
  );
}

type NamePanelProps = StandardStepBase & {
  row: PartyMember;
  display: string;
  resolvedSpecies: string;
  resolvedClass: string;
  resolvedSpeciesMeta: SpeciesMeta;
  resolvedClassMeta: ClassMeta;
  resolvedFocusMeta: FocusMeta;
  currentFocus: BuildFocus;
  portraitPath: string;
  fallbackPortraitPath: string;
  canContinueFromName: boolean;
  onChangeName: (name: string) => void;
  onContinue: () => void;
};

export function NamePanel({
  currentStep,
  onBack,
  row,
  display,
  resolvedSpecies,
  resolvedClass,
  resolvedSpeciesMeta,
  resolvedClassMeta,
  resolvedFocusMeta,
  currentFocus,
  portraitPath,
  fallbackPortraitPath,
  canContinueFromName,
  onChangeName,
  onContinue,
}: NamePanelProps) {
  return (
    <StandardRitualStep
      title="Name the Hero"
      subtitle="A name binds memory to fate. This is the first voice the Chronicle will remember."
      currentStep={currentStep}
      footer={
        <>
          <button
            type="button"
            onClick={onBack}
            style={{
              ...controlButtonBase,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
              color: "inherit",
            }}
          >
            Back
          </button>

          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinueFromName}
            style={{
              ...controlButtonBase,
              border: "1px solid rgba(255,205,126,0.28)",
              background: canContinueFromName
                ? "linear-gradient(180deg, rgba(255,201,116,0.98), rgba(218,132,47,0.98))"
                : "linear-gradient(180deg, rgba(107,89,69,0.7), rgba(74,55,39,0.74))",
              color: canContinueFromName
                ? "#2f1606"
                : "rgba(244,227,201,0.75)",
              opacity: canContinueFromName ? 1 : 0.62,
              cursor: canContinueFromName ? "pointer" : "not-allowed",
              minWidth: 140,
            }}
          >
            Continue
          </button>
        </>
      }
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
          alignItems: "start",
          minWidth: 0,
        }}
      >
        <div style={{ display: "grid", gap: 14, minWidth: 0 }}>
          <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
            <TinyLabel>Hero Name</TinyLabel>
            <input
              value={row?.name ?? ""}
              onChange={(e) => onChangeName(e.target.value)}
              placeholder="The Lone Hero"
              style={{
                ...inputStyle,
                padding: "14px 16px",
                fontSize: 18,
                borderRadius: 14,
              }}
            />
            <div style={{ fontSize: 13, opacity: 0.74, lineHeight: 1.6 }}>
              {(row?.name ?? "").trim().length > 0 ? (
                <>
                  Current Chronicle entry: <strong>{display}</strong>
                </>
              ) : (
                <>Choose a true name before continuing.</>
              )}
            </div>
          </div>

          <div style={helperCardStyle}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>
              Current Build Summary
            </div>
            <div style={{ fontSize: 13, opacity: 0.82, lineHeight: 1.6 }}>
              <strong>{resolvedSpecies}</strong> {resolvedClass} ·{" "}
              <strong>
                {BUILD_FOCUS_OPTIONS.find((x) => x.id === currentFocus)?.label ?? ""}
              </strong>
            </div>
            <div style={{ fontSize: 12, opacity: 0.76, lineHeight: 1.6 }}>
              {resolvedSpeciesMeta.bestFor} · {resolvedClassMeta.role} ·{" "}
              {resolvedFocusMeta.bestFor}
            </div>
          </div>
        </div>

        <div
          style={{
            borderRadius: 18,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.03)",
            minWidth: 0,
            boxSizing: "border-box",
          }}
        >
          <HeroRitualPortrait
            species={resolvedSpecies}
            className={resolvedClass}
            portrait={row?.portrait ?? "Male"}
            imageSrc={portraitPath}
            fallbackImageSrc={fallbackPortraitPath}
            alt={`${display} portrait`}
            height={320}
            objectPosition={getPortraitObjectPosition("name")}
          />
        </div>
      </div>
    </StandardRitualStep>
  );
}

type OathPanelProps = {
  row: PartyMember;
  display: string;
  resolvedSpecies: string;
  resolvedClass: string;
  resolvedClassMeta: ClassMeta;
  resolvedSpeciesMeta: SpeciesMeta;
  resolvedFocusMeta: FocusMeta;
  currentFocus: BuildFocus;
  portraitPath: string;
  fallbackPortraitPath: string;
  baseStats: { ac: number; hpMax: number; initiativeMod: number };
  focusDeltaAc: number;
  focusDeltaHp: number;
  focusDeltaInit: number;
  canEnterChronicle: boolean;
  partyDraft: PartyDeclaredPayload | null;
  partyLocked: boolean;
  partyLockedByCombat: boolean;
  onBack: () => void;
  onCommit: () => void;
};

export function OathPanel({
  row,
  display,
  resolvedSpecies,
  resolvedClass,
  resolvedClassMeta,
  resolvedSpeciesMeta,
  resolvedFocusMeta,
  currentFocus,
  portraitPath,
  fallbackPortraitPath,
  baseStats,
  focusDeltaAc,
  focusDeltaHp,
  focusDeltaInit,
  canEnterChronicle,
  partyLockedByCombat,
  onBack,
  onCommit,
}: OathPanelProps) {
  return (
    <OathRitualStep>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 12,
          left: "50%",
          transform: "translateX(-50%)",
          width: 260,
          height: 260,
          borderRadius: "50%",
          border: "1px solid rgba(255,210,140,0.10)",
          boxShadow:
            "0 0 80px rgba(255,176,64,0.10), inset 0 0 40px rgba(255,220,160,0.04)",
          opacity: 0.9,
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 34,
          left: "50%",
          transform: "translateX(-50%)",
          width: 190,
          height: 190,
          borderRadius: "50%",
          border: "1px solid rgba(255,210,140,0.08)",
          opacity: 0.8,
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 26,
          left: 24,
          right: 24,
          height: 1,
          background:
            "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,210,140,0.22), rgba(255,255,255,0))",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 104,
          left: 36,
          width: 72,
          height: 72,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,170,70,0.18) 0%, rgba(255,170,70,0.04) 45%, rgba(0,0,0,0) 70%)",
          filter: "blur(12px)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: 52,
          right: 48,
          width: 96,
          height: 96,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,196,118,0.14) 0%, rgba(255,196,118,0.04) 46%, rgba(0,0,0,0) 72%)",
          filter: "blur(16px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "grid",
          gap: 20,
          minWidth: 0,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "grid",
            gap: 6,
            justifyItems: "center",
            textAlign: "center",
            marginBottom: 4,
          }}
        >
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.24em",
              opacity: 0.62,
              fontWeight: 900,
            }}
          >
            Chronicle Entry
          </div>

          <div
            style={{
              fontSize: 68,
              lineHeight: 0.9,
              fontWeight: 1000,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              background:
                "linear-gradient(180deg, rgba(255,242,214,0.98) 0%, rgba(255,214,134,0.98) 42%, rgba(229,143,54,0.98) 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              textShadow:
                "0 0 26px rgba(255,176,64,0.18), 0 3px 22px rgba(0,0,0,0.35)",
            }}
          >
            The Oath
          </div>

          <div
            style={{
              width: 260,
              height: 1,
              background:
                "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,210,140,0.28), rgba(255,255,255,0))",
            }}
          />

          <div
            style={{
              fontSize: 13,
              opacity: 0.78,
              lineHeight: 1.6,
              maxWidth: 720,
            }}
          >
            Spoken into the Chronicle. Bound before witness. Carried into the
            first descent.
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(420px, 1.22fr) minmax(380px, 0.98fr)",
            gap: 22,
            alignItems: "start",
            minWidth: 0,
          }}
        >
          <div
            style={{
              borderRadius: 24,
              overflow: "hidden",
              border: "1px solid rgba(255,205,126,0.18)",
              background:
                "radial-gradient(circle at 50% 18%, rgba(255,224,178,0.12), rgba(255,224,178,0.02) 24%, rgba(0,0,0,0) 44%), linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
              boxShadow:
                "0 0 60px rgba(255,176,64,0.10), 0 22px 48px rgba(0,0,0,0.28)",
              minWidth: 0,
              boxSizing: "border-box",
            }}
          >
            <HeroRitualPortrait
              species={resolvedSpecies}
              className={resolvedClass}
              portrait={row?.portrait ?? "Male"}
              imageSrc={portraitPath}
              fallbackImageSrc={fallbackPortraitPath}
              alt={`${display} portrait`}
              height={620}
              objectPosition={getPortraitObjectPosition("oath")}
            />
          </div>

          <div
            style={{
              display: "grid",
              gap: 14,
              minWidth: 0,
              width: "100%",
              alignContent: "start",
            }}
          >
            <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 1000,
                  lineHeight: 0.94,
                  wordBreak: "break-word",
                }}
              >
                {display}
              </div>
              <div
                style={{
                  fontSize: 18,
                  opacity: 0.84,
                  wordBreak: "break-word",
                }}
              >
                {resolvedSpecies} {resolvedClass}
              </div>
              <div
                style={{
                  fontSize: 13,
                  opacity: 0.76,
                  lineHeight: 1.6,
                  wordBreak: "break-word",
                }}
              >
                This name enters canon as the first witness to the descent.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "flex-start",
              }}
            >
              <SectionPill tone="warn">
                <strong>Focus</strong>{" "}
                {BUILD_FOCUS_OPTIONS.find((x) => x.id === currentFocus)?.label ??
                  "Balanced"}
              </SectionPill>
              <SectionPill>
                <strong>Portrait</strong> {row?.portrait ?? "Male"}
              </SectionPill>
              <SectionPill>
                <strong>Role</strong> {resolvedClassMeta.role}
              </SectionPill>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 10,
                minWidth: 0,
                width: "100%",
              }}
            >
              <StatChip
                label="AC"
                value={`${row?.ac ?? baseStats.ac}${
                  focusDeltaAc ? ` (${focusDeltaAc > 0 ? `+${focusDeltaAc}` : focusDeltaAc})` : ""
                }`}
              />
              <StatChip
                label="HP Max"
                value={`${row?.hpMax ?? baseStats.hpMax}${
                  focusDeltaHp ? ` (${focusDeltaHp > 0 ? `+${focusDeltaHp}` : focusDeltaHp})` : ""
                }`}
              />
              <StatChip
                label="Init"
                value={`${row?.initiativeMod ?? baseStats.initiativeMod}${
                  focusDeltaInit
                    ? ` (${focusDeltaInit > 0 ? `+${focusDeltaInit}` : focusDeltaInit})`
                    : ""
                }`}
              />
            </div>

            <div style={oathInfoCardStyle}>
              <div style={{ fontSize: 14, fontWeight: 900 }}>
                What this build does well
              </div>
              <div
                style={{
                  fontSize: 13,
                  opacity: 0.84,
                  lineHeight: 1.65,
                  wordBreak: "break-word",
                }}
              >
                • {resolvedSpeciesMeta.strengths[0]}
                <br />
                • {resolvedClassMeta.strengths[0]}
                <br />
                • {resolvedFocusMeta.gains[0]}
              </div>
            </div>

            <div style={oathInfoCardStyle}>
              <div style={{ fontSize: 14, fontWeight: 900 }}>Tradeoffs</div>
              <div
                style={{
                  fontSize: 13,
                  opacity: 0.8,
                  lineHeight: 1.65,
                  wordBreak: "break-word",
                }}
              >
                • {resolvedSpeciesMeta.tradeoff}
                <br />
                • {resolvedClassMeta.tradeoff}
                <br />
                • {resolvedFocusMeta.tradeoff}
              </div>
            </div>

            <div style={oathInfoCardStyle}>
              <div style={{ fontSize: 14, fontWeight: 900 }}>
                Recommended playstyle
              </div>
              <div
                style={{
                  fontSize: 13,
                  opacity: 0.82,
                  lineHeight: 1.65,
                  wordBreak: "break-word",
                }}
              >
                This hero fits{" "}
                <strong>{resolvedSpeciesMeta.bestFor.toLowerCase()}</strong>,
                operates as a{" "}
                <strong>{resolvedClassMeta.role.toLowerCase()}</strong>, and is
                best used for{" "}
                <strong>{resolvedFocusMeta.bestFor.toLowerCase()}</strong>.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
                paddingTop: 6,
              }}
            >
              <button
                type="button"
                onClick={onBack}
                style={{
                  ...controlButtonBase,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.05)",
                  color: "inherit",
                }}
              >
                Back
              </button>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={onCommit}
                  disabled={!canEnterChronicle}
                  style={{
                    ...controlButtonBase,
                    border: "1px solid rgba(255,205,126,0.28)",
                    background: canEnterChronicle
                      ? "linear-gradient(180deg, rgba(255,201,116,0.98), rgba(218,132,47,0.98))"
                      : "linear-gradient(180deg, rgba(107,89,69,0.7), rgba(74,55,39,0.74))",
                    color: canEnterChronicle
                      ? "#2f1606"
                      : "rgba(244,227,201,0.75)",
                    boxShadow: canEnterChronicle
                      ? "0 10px 28px rgba(255,145,42,0.18), inset 0 1px 0 rgba(255,244,220,0.72)"
                      : "none",
                    opacity: canEnterChronicle ? 1 : 0.62,
                    cursor: canEnterChronicle ? "pointer" : "not-allowed",
                    minWidth: 230,
                  }}
                >
                  Enter the Chronicle
                </button>

                <span
                  style={{
                    fontSize: 12,
                    opacity: 0.72,
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                  }}
                >
                  {canEnterChronicle
                    ? "Ritual complete"
                    : "Complete every choice to continue"}
                  {partyLockedByCombat ? " · Combat lock active" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OathRitualStep>
  );
}
