// app/demo/components/PartySetupSection.tsx
"use client";

import React from "react";
import { getPortraitPath } from "@/lib/portraits/getPortraitPath";
import { getSkillsForClass } from "@/lib/skills/classSkillMap";
import { getSkillDefinition } from "@/lib/skills/skillDefinitions";

type PortraitType = "Male" | "Female";

type PartyMember = {
  id: string;
  name: string;

  // identity
  species?: string; // optional for backward-compat with existing party payloads
  className: string;
  portrait: PortraitType;

  // progression / rules
  skills?: string[];

  // stats
  ac: number;
  hpMax: number;
  hpCurrent: number;
  initiativeMod: number;
};

type PartyDeclaredPayload = {
  partyId: string;
  members: PartyMember[];
};

const SAFE_CLASS_ARCHETYPES = [
  "Warrior",
  "Rogue",
  "Mage",
  "Cleric",
  "Ranger",
  "Paladin",
  "Bard",
  "Druid",
  "Monk",
  "Artificer",
  "Barbarian",
  "Sorcerer",
  "Warlock",
] as const;

const SAFE_SPECIES = [
  "Human",
  "Elf",
  "Dwarf",
  "Halfling",
  "Gnome",
  "Half-Elf",
  "Half-Orc",
  "Tiefling",
  "Dragonborn",
] as const;

export default function PartySetupSection(props: {
  enabled: boolean;

  partyDraft: PartyDeclaredPayload | null;
  partyMembersFallback: PartyMember[];

  partyCanonicalExists: boolean;

  partyLocked: boolean;
  partyLockedByCombat: boolean;

  setPartySize: (n: number) => void;
  randomizePartyNames: () => void;
  commitParty: () => void;

  safeInt: (n: unknown, fallback: number, lo: number, hi: number) => number;

  setPartyDraft: React.Dispatch<React.SetStateAction<PartyDeclaredPayload | null>>;
}) {
  const {
    enabled,
    partyDraft,
    partyMembersFallback,
    partyCanonicalExists,
    partyLocked,
    partyLockedByCombat,
    setPartySize,
    randomizePartyNames,
    commitParty,
    safeInt,
    setPartyDraft,
  } = props;

  if (!enabled) return null;

  const editable = !partyLocked && !!partyDraft;
  const rows = (partyDraft?.members ?? partyMembersFallback) as PartyMember[];
  const currentCount = partyDraft?.members?.length ?? partyMembersFallback.length ?? 4;

  function setMemberField(idx: number, patch: Partial<PartyMember>) {
    setPartyDraft((prev) => {
      if (!prev) return prev;
      const next = { ...prev, members: prev.members.map((x) => ({ ...x })) };
      next.members[idx] = { ...next.members[idx], ...patch };
      return next;
    });
  }

  function normalizeClassValue(v: string) {
    return (v ?? "").trim();
  }

  function normalizeSpeciesValue(v: string) {
    return (v ?? "").trim();
  }

  function isKnownValue(value: string, allowed: readonly string[]) {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return false;
    return allowed.some((x) => x.toLowerCase() === normalized);
  }

  function getResolvedSpecies(value?: string) {
    const normalized = normalizeSpeciesValue(value ?? "");
    if (!normalized) return "Human";

    const known =
      SAFE_SPECIES.find((x) => x.toLowerCase() === normalized.toLowerCase()) ?? normalized;

    return known;
  }

  function getResolvedClass(value?: string) {
    const normalized = normalizeClassValue(value ?? "");
    if (!normalized) return "Warrior";

    const known =
      SAFE_CLASS_ARCHETYPES.find((x) => x.toLowerCase() === normalized.toLowerCase()) ?? normalized;

    return known;
  }

  function resolveSkillsForClass(className?: string) {
    const resolvedClass = getResolvedClass(className);
    return getSkillsForClass(resolvedClass);
  }

  function getResolvedSkillIds(row: PartyMember) {
    const fromRow = Array.isArray(row.skills) ? row.skills.filter(Boolean) : [];
    if (fromRow.length > 0) return fromRow;
    return resolveSkillsForClass(row.className);
  }

  const desktopGridColumns =
    "84px minmax(160px, 1.45fr) minmax(130px, 1fr) minmax(130px, 1fr) 88px 60px 64px 74px 74px";

  const compactInputStyle: React.CSSProperties = {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  };

  const compactNumberStyle: React.CSSProperties = {
    ...compactInputStyle,
    textAlign: "center",
  };

  const portraitFrameStyle: React.CSSProperties = {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.04)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
  };

  const portraitImageStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  };

  const skillChipStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "2px 8px",
    fontSize: 11,
    lineHeight: 1.3,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.10)",
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ scrollMarginTop: 90 }}>
      <div style={{ padding: "14px 16px" }}>
        <p className="muted" style={{ marginTop: 0 }}>
          Declare players once at the start. This roster becomes the source for combatants. After you
          commit, it locks for the session.
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 190 }}>
            Players (1–6)
            <select
              value={currentCount}
              onChange={(e) => setPartySize(Number(e.target.value))}
              disabled={partyLocked}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <button onClick={randomizePartyNames} disabled={partyLocked || !partyDraft}>
            🎲 Random names
          </button>

          <button onClick={commitParty} disabled={partyLocked || !partyDraft}>
            Commit Party (Append-only)
          </button>

          <span className="muted" style={{ fontSize: 12 }}>
            {partyCanonicalExists ? "Canonical party declared ✅ (locked)" : "Draft only (not yet canon)"}
            {partyLockedByCombat ? " · Locked (combat active)" : ""}
          </span>
        </div>

        <div style={{ marginTop: 14, overflowX: "auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: desktopGridColumns,
              gap: 8,
              alignItems: "center",
              width: "100%",
              minWidth: 920,
            }}
          >
            <div className="muted" style={{ fontSize: 12 }}>
              PORTRAIT
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              NAME
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              SPECIES
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              CLASS
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              PORT
            </div>
            <div className="muted" style={{ fontSize: 12, textAlign: "center" }}>
              AC
            </div>
            <div className="muted" style={{ fontSize: 12, textAlign: "center" }}>
              HP
            </div>
            <div className="muted" style={{ fontSize: 12, textAlign: "center" }}>
              HP MAX
            </div>
            <div className="muted" style={{ fontSize: 12, textAlign: "center" }}>
              INIT
            </div>

            {rows.map((row, idx) => {
              const i1 = idx + 1;

              const speciesValue = normalizeSpeciesValue(row?.species ?? "");
              const speciesIsCustom = speciesValue.length > 0 && !isKnownValue(speciesValue, SAFE_SPECIES);

              const speciesSelectValue =
                speciesValue.length === 0
                  ? ""
                  : speciesIsCustom
                    ? "__custom__"
                    : SAFE_SPECIES.find((x) => x.toLowerCase() === speciesValue.toLowerCase()) ?? "";

              const classValue = normalizeClassValue(row?.className ?? "");
              const classIsCustom =
                classValue.length > 0 && !isKnownValue(classValue, SAFE_CLASS_ARCHETYPES);

              const classSelectValue =
                classValue.length === 0
                  ? ""
                  : classIsCustom
                    ? "__custom__"
                    : SAFE_CLASS_ARCHETYPES.find((x) => x.toLowerCase() === classValue.toLowerCase()) ?? "";

              const resolvedSpecies = getResolvedSpecies(row?.species);
              const resolvedClass = getResolvedClass(row?.className);
              const portraitPath = getPortraitPath(
                resolvedSpecies,
                resolvedClass,
                row?.portrait ?? "Male"
              );

              const resolvedSkillIds = getResolvedSkillIds(row);
              const resolvedSkillLabels = resolvedSkillIds.map(
                (skillId) => getSkillDefinition(skillId)?.label ?? skillId
              );

              return (
                <React.Fragment key={row.id || `player_${i1}`}>
                  <div
                    style={portraitFrameStyle}
                    title={`${resolvedSpecies} ${resolvedClass} ${row?.portrait ?? "Male"}`}
                  >
                    <img
                      src={portraitPath}
                      alt={`${row?.name || `Player ${i1}`} portrait`}
                      style={portraitImageStyle}
                      onError={(e) => {
                        const img = e.currentTarget;
                        img.onerror = null;
                        img.src = getPortraitPath("Human", "Warrior", row?.portrait ?? "Male");
                      }}
                    />
                  </div>

                  <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                    <input
                      value={row?.name ?? ""}
                      disabled={!editable}
                      onChange={(e) => setMemberField(idx, { name: e.target.value })}
                      placeholder={`Player ${i1}`}
                      style={compactInputStyle}
                    />

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                        minHeight: 22,
                      }}
                    >
                      {resolvedSkillLabels.length > 0 ? (
                        resolvedSkillLabels.map((label, skillIdx) => (
                          <span key={`${row.id || i1}_${label}_${skillIdx}`} style={skillChipStyle}>
                            {label}
                          </span>
                        ))
                      ) : (
                        <span className="muted" style={{ fontSize: 11 }}>
                          No specialty skills assigned
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                    <select
                      value={speciesSelectValue}
                      disabled={!editable}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") {
                          setMemberField(idx, { species: "" });
                          return;
                        }
                        if (v === "__custom__") {
                          if (!speciesIsCustom) setMemberField(idx, { species: "" });
                          return;
                        }
                        setMemberField(idx, { species: v });
                      }}
                      style={compactInputStyle}
                    >
                      <option value="">—</option>
                      {SAFE_SPECIES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                      <option value="__custom__">Custom…</option>
                    </select>

                    {speciesSelectValue === "__custom__" && (
                      <input
                        value={speciesIsCustom ? speciesValue : ""}
                        disabled={!editable}
                        onChange={(e) => setMemberField(idx, { species: e.target.value })}
                        placeholder="Custom species"
                        style={compactInputStyle}
                      />
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                    <select
                      value={classSelectValue}
                      disabled={!editable}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") {
                          setMemberField(idx, {
                            className: "",
                            skills: [],
                          });
                          return;
                        }
                        if (v === "__custom__") {
                          if (!classIsCustom) {
                            setMemberField(idx, {
                              className: "",
                              skills: [],
                            });
                          }
                          return;
                        }

                        setMemberField(idx, {
                          className: v,
                          skills: getSkillsForClass(v),
                        });
                      }}
                      style={compactInputStyle}
                    >
                      <option value="">—</option>
                      {SAFE_CLASS_ARCHETYPES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="__custom__">Custom…</option>
                    </select>

                    {classSelectValue === "__custom__" && (
                      <input
                        value={classIsCustom ? classValue : ""}
                        disabled={!editable}
                        onChange={(e) => {
                          const nextClassName = e.target.value;
                          setMemberField(idx, {
                            className: nextClassName,
                            skills: getSkillsForClass(nextClassName),
                          });
                        }}
                        placeholder="Custom class"
                        style={compactInputStyle}
                      />
                    )}
                  </div>

                  <select
                    value={row?.portrait ?? "Male"}
                    disabled={!editable}
                    onChange={(e) => setMemberField(idx, { portrait: e.target.value as PortraitType })}
                    style={compactInputStyle}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>

                  <input
                    value={String(row?.ac ?? 14)}
                    disabled={!editable}
                    onChange={(e) => setMemberField(idx, { ac: safeInt(e.target.value, 14, 1, 40) })}
                    inputMode="numeric"
                    style={compactNumberStyle}
                  />

                  <input
                    value={String(row?.hpCurrent ?? 12)}
                    disabled={!editable}
                    onChange={(e) =>
                      setMemberField(idx, { hpCurrent: safeInt(e.target.value, 12, 0, 999) })
                    }
                    inputMode="numeric"
                    style={compactNumberStyle}
                  />

                  <input
                    value={String(row?.hpMax ?? 12)}
                    disabled={!editable}
                    onChange={(e) => {
                      const v = safeInt(e.target.value, 12, 1, 999);
                      setPartyDraft((prev) => {
                        if (!prev) return prev;
                        const next = { ...prev, members: prev.members.map((x) => ({ ...x })) };
                        next.members[idx].hpMax = v;
                        if (next.members[idx].hpCurrent > v) next.members[idx].hpCurrent = v;
                        return next;
                      });
                    }}
                    inputMode="numeric"
                    style={compactNumberStyle}
                  />

                  <input
                    value={String(row?.initiativeMod ?? 1)}
                    disabled={!editable}
                    onChange={(e) =>
                      setMemberField(idx, { initiativeMod: safeInt(e.target.value, 1, -10, 20) })
                    }
                    inputMode="numeric"
                    style={compactNumberStyle}
                  />
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
          Recommended: keep this roster stable. Combat turn order is still per combat, but <em>who the
          players are</em> is session truth. Specialty skills are auto-assigned from class and become part
          of the declared roster.
        </div>
      </div>
    </div>
  );
}
