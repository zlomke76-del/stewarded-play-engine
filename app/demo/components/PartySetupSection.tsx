"use client";

import React from "react";

type PortraitType = "Male" | "Female";

type PartyMember = {
  id: string;
  name: string;
  className: string;
  portrait: PortraitType;
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

  return (
    <div style={{ scrollMarginTop: 90 }}>
      <div style={{ padding: "14px 16px" }}>
        <p className="muted" style={{ marginTop: 0 }}>
          Declare players once at the start. This roster becomes the source for combatants. After you commit, it locks
          for the session.
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 220 }}>
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
              gridTemplateColumns: "220px 190px 100px 80px 90px 90px 110px",
              gap: 8,
              minWidth: 900,
              alignItems: "center",
            }}
          >
            <div className="muted" style={{ fontSize: 12 }}>
              NAME
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              CLASS
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              PORTRAIT
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              AC
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              HP
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              HP MAX
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              INIT MOD
            </div>

            {rows.map((row, idx) => {
              const i1 = idx + 1;
              const classValue = normalizeClassValue(row?.className ?? "");

              const isCustom =
                classValue.length > 0 &&
                !SAFE_CLASS_ARCHETYPES.map((x) => x.toLowerCase()).includes(classValue.toLowerCase());

              const selectValue =
                classValue.length === 0
                  ? ""
                  : isCustom
                  ? "__custom__"
                  : SAFE_CLASS_ARCHETYPES.find((x) => x.toLowerCase() === classValue.toLowerCase()) ??
                    "__custom__";

              return (
                <div key={row.id || `player_${i1}`} style={{ display: "contents" }}>
                  <input
                    value={row?.name ?? ""}
                    disabled={!editable}
                    onChange={(e) => setMemberField(idx, { name: e.target.value })}
                    placeholder={`Player ${i1}`}
                  />

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <select
                      value={selectValue}
                      disabled={!editable}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") {
                          setMemberField(idx, { className: "" });
                          return;
                        }
                        if (v === "__custom__") {
                          if (!isCustom) setMemberField(idx, { className: "" });
                          return;
                        }

                        setMemberField(idx, {
                          className: v,
                          portrait: "Male",
                        });
                      }}
                      style={{ minWidth: 150 }}
                    >
                      <option value="">—</option>
                      {SAFE_CLASS_ARCHETYPES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="__custom__">Custom…</option>
                    </select>

                    <input
                      value={isCustom ? classValue : ""}
                      disabled={!editable || selectValue !== "__custom__"}
                      onChange={(e) => setMemberField(idx, { className: e.target.value })}
                      placeholder="Custom"
                      style={{
                        width: 120,
                        opacity: selectValue === "__custom__" ? 1 : 0.65,
                      }}
                    />
                  </div>

                  <select
                    value={row?.portrait ?? "Male"}
                    disabled={!editable}
                    onChange={(e) =>
                      setMemberField(idx, { portrait: e.target.value as PortraitType })
                    }
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>

                  <input
                    value={String(row?.ac ?? 14)}
                    disabled={!editable}
                    onChange={(e) => setMemberField(idx, { ac: safeInt(e.target.value, 14, 1, 40) })}
                    inputMode="numeric"
                  />

                  <input
                    value={String(row?.hpCurrent ?? 12)}
                    disabled={!editable}
                    onChange={(e) =>
                      setMemberField(idx, { hpCurrent: safeInt(e.target.value, 12, 0, 999) })
                    }
                    inputMode="numeric"
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
                  />

                  <input
                    value={String(row?.initiativeMod ?? 1)}
                    disabled={!editable}
                    onChange={(e) =>
                      setMemberField(idx, { initiativeMod: safeInt(e.target.value, 1, -10, 20) })
                    }
                    inputMode="numeric"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
          Recommended: keep this roster stable. Combat turn order is still per combat, but *who the players are* is
          session truth.
        </div>
      </div>
    </div>
  );
}
