// app/demo/page.tsx
"use client";

// ------------------------------------------------------------
// Demo Page — Stewarded Play (Full Governed Flow)
// ------------------------------------------------------------
//
// This file is now the *orchestrator* only.
// UI is broken into components under app/demo/components.
//
// ------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import { createSession, recordEvent, SessionState } from "@/lib/session/SessionState";

import { parseAction } from "@/lib/parser/ActionParser";
import { generateOptions, Option } from "@/lib/options/OptionGenerator";
import { exportCanon } from "@/lib/export/exportCanon";
import CanonEventsPanel from "@/components/world/CanonEventsPanel";

import ResolutionDraftAdvisoryPanel from "@/components/resolution/ResolutionDraftAdvisoryPanel";
import NextActionHint from "@/components/NextActionHint";
import WorldLedgerPanelLegacy from "@/components/world/WorldLedgerPanel.legacy";
import DungeonPressurePanel from "@/components/world/DungeonPressurePanel";
import ExplorationMapPanel, { MapMarkKind } from "@/components/world/ExplorationMapPanel";
import CombatRendererPanel from "@/components/world/CombatRendererPanel";
import EnemyTurnResolverPanel from "@/components/combat/EnemyTurnResolverPanel";

import StewardedShell from "@/components/layout/StewardedShell";
import ModeHeader from "@/components/layout/ModeHeader";
import CardSection from "@/components/layout/CardSection";
import Disclaimer from "@/components/layout/Disclaimer";

import {
  CombatStartedPayload,
  CombatantSpec,
  deriveCombatState,
  findLatestCombatId,
  formatCombatantLabel,
  generateDeterministicInitiativeRolls,
  nextTurnPointer,
} from "@/lib/combat/CombatState";

import AmbientBackground from "./components/AmbientBackground";
import DemoHero from "./components/DemoHero";
import InitialTableSection from "./components/InitialTableSection";

import {
  DMMode,
  DemoSectionId,
  DiceMode,
  RollSource,
  InitialTable,
  ExplorationDraft,
} from "./demoTypes";

import {
  anchorId,
  scrollToSection,
  pick,
  clampInt,
  normalizeName,
  randomName,
  generateInitialTable,
  renderInitialTableNarration,
  inferOptionKind,
  withinBounds,
  deriveCurrentPosition,
  revealRadius,
  inferDirection,
  stepFrom,
  textSuggestsDoor,
  textSuggestsLocked,
  isCombatEndedForId,
} from "./demoUtils";

// ------------------------------------------------------------

export default function DemoPage() {
  const role: "arbiter" = "arbiter";

  const [state, setState] = useState<SessionState>(createSession("demo-session", "demo"));

  // IMPORTANT UX CHANGE: mode must be explicitly selected
  const [dmMode, setDmMode] = useState<DMMode | null>(null);

  const MAP_W = 13;
  const MAP_H = 9;

  // Initial Table Gate
  const [initialTable, setInitialTable] = useState<InitialTable | null>(null);
  const [tableAccepted, setTableAccepted] = useState(false);
  const [tableDraftText, setTableDraftText] = useState("");

  // Chapter UI (visual only)
  const [activeSection, setActiveSection] = useState<DemoSectionId>("mode");

  // Action parsing + options
  const [playerInput, setPlayerInput] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [options, setOptions] = useState<Option[] | null>(null);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  // Combat renderer trigger (parent-driven)
  const [enemyPlayNonce, setEnemyPlayNonce] = useState(0);

  // ----------------------------------------------------------
  // Combat state (derived + ended-aware)
  // ----------------------------------------------------------

  const latestCombatId = useMemo(() => findLatestCombatId(state.events as any) ?? null, [state.events]);

  const derivedCombat = useMemo(() => {
    if (!latestCombatId) return null;
    return deriveCombatState(latestCombatId, state.events as any);
  }, [latestCombatId, state.events]);

  const combatEnded = useMemo(() => {
    if (!derivedCombat?.combatId) return false;
    return isCombatEndedForId(derivedCombat.combatId, state.events as any[]);
  }, [derivedCombat?.combatId, state.events]);

  const combatActive = !!derivedCombat && !combatEnded;

  const activeCombatantSpec = useMemo(() => {
    if (!derivedCombat?.activeCombatantId) return null;
    return derivedCombat.participants.find((p) => p.id === derivedCombat.activeCombatantId) ?? null;
  }, [derivedCombat]);

  const isEnemyTurn = combatActive && activeCombatantSpec?.kind === "enemy_group";

  // ----------------------------------------------------------
  // Exploration draft (auto-prepared AFTER intent + option)
  // ----------------------------------------------------------

  const currentPos = useMemo(
    () => deriveCurrentPosition(state.events as any[], MAP_W, MAP_H),
    [state.events]
  );

  const [explorationDraft, setExplorationDraft] = useState<ExplorationDraft>({
    enableMove: false,
    direction: "none",
    enableReveal: true,
    revealRadius: 1,
    enableMark: false,
    markKind: "door",
    markNote: "",
  });

  const suggestedTo = useMemo(() => {
    if (!explorationDraft.enableMove) return null;
    if (explorationDraft.direction === "none") return null;
    const to = stepFrom(currentPos, explorationDraft.direction);
    return withinBounds(to, MAP_W, MAP_H) ? to : null;
  }, [explorationDraft.enableMove, explorationDraft.direction, currentPos]);

  useEffect(() => {
    if (!selectedOption) return;

    const intentText = `${playerInput}\n${selectedOption.description}`.trim();
    const dir = inferDirection(intentText);
    const door = textSuggestsDoor(intentText);
    const locked = textSuggestsLocked(intentText);

    setExplorationDraft((prev) => ({
      ...prev,
      enableMove: !!dir,
      direction: dir ?? "none",
      enableReveal: true,
      revealRadius: 1,
      enableMark: door,
      markKind: "door",
      markNote: door ? (locked ? "locked" : prev.markNote || "") : prev.markNote,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOption?.id]);

  // ----------------------------------------------------------
  // Generate table ONCE per session
  // ----------------------------------------------------------

  useEffect(() => {
    if (initialTable) return;
    setInitialTable(generateInitialTable());
  }, [initialTable]);

  const renderedTableNarration = useMemo(() => {
    if (!initialTable) return "";
    return renderInitialTableNarration(initialTable);
  }, [initialTable]);

  useEffect(() => {
    if (!initialTable) return;
    if (tableDraftText.trim() === "") setTableDraftText(renderedTableNarration);
  }, [initialTable, renderedTableNarration, tableDraftText]);

  // When mode changes, reset the table acceptance
  useEffect(() => {
    if (dmMode === null) return;
    setTableAccepted(false);
  }, [dmMode]);

  // ----------------------------------------------------------
  // Player submits action (intent)
  // ----------------------------------------------------------

  const canPlayerSubmitIntent =
    dmMode !== null && ((!combatActive || !isEnemyTurn) || dmMode === "human");

  function handlePlayerAction() {
    if (!playerInput.trim()) return;
    if (!canPlayerSubmitIntent) return;

    const parsedAction = parseAction("player_1", playerInput);
    const optionSet = generateOptions(parsedAction);

    setParsed(parsedAction);
    setOptions([...optionSet.options]);
    setSelectedOption(null);

    // Nudge flow forward
    setActiveSection("resolution");
    queueMicrotask(() => scrollToSection("resolution"));
  }

  useEffect(() => {
    if (dmMode !== "solace-neutral") return;
    if (!options || options.length === 0) return;
    setSelectedOption(options[0]);

    // Nudge flow forward
    setActiveSection("resolution");
    queueMicrotask(() => scrollToSection("resolution"));
  }, [dmMode, options]);

  // ----------------------------------------------------------
  // Record canon (OUTCOME + optional exploration bundle)
  // ----------------------------------------------------------

  function commitExplorationBundle(nextState: SessionState) {
    const d = explorationDraft;
    let next = nextState;

    const here = deriveCurrentPosition(next.events as any[], MAP_W, MAP_H);

    const to =
      d.enableMove && d.direction !== "none" ? stepFrom(here, d.direction) : null;

    const canMove = to ? withinBounds(to, MAP_W, MAP_H) : false;

    if (d.enableMove && canMove && to) {
      next = recordEvent(next, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "PLAYER_MOVED",
        payload: { from: here, to } as any,
      });

      if (d.enableReveal && d.revealRadius > 0) {
        next = recordEvent(next, {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          actor: "arbiter",
          type: "MAP_REVEALED",
          payload: {
            tiles: revealRadius(to, d.revealRadius, MAP_W, MAP_H),
          } as any,
        });
      }

      if (d.enableMark) {
        const note = d.markNote.trim() ? d.markNote.trim() : null;
        next = recordEvent(next, {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          actor: "arbiter",
          type: "MAP_MARKED",
          payload: { at: to, kind: d.markKind, note } as any,
        });
      }

      return next;
    }

    if (d.enableReveal && d.revealRadius > 0) {
      next = recordEvent(next, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "MAP_REVEALED",
        payload: {
          tiles: revealRadius(here, d.revealRadius, MAP_W, MAP_H),
        } as any,
      });
    }

    if (d.enableMark) {
      const note = d.markNote.trim() ? d.markNote.trim() : null;
      next = recordEvent(next, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "MAP_MARKED",
        payload: { at: here, kind: d.markKind, note } as any,
      });
    }

    return next;
  }

  function handleRecord(payload: {
    description: string;
    dice: { mode: DiceMode; roll: number; dc: number; source: RollSource };
    audit: string[];
  }) {
    setState((prev) => {
      let next = recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "OUTCOME",
        payload,
      });

      next = commitExplorationBundle(next);
      return next;
    });

    // Nudge flow forward
    setActiveSection("canon");
    queueMicrotask(() => scrollToSection("canon"));
  }

  // Enemy outcomes should NOT auto-commit exploration movement/reveal/marks.
  function handleRecordOutcomeOnly(payload: {
    description: string;
    dice: { mode: DiceMode; roll: number; dc: number; source: RollSource };
    audit: string[];
  }) {
    setState((prev) =>
      recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "OUTCOME",
        payload,
      })
    );

    setActiveSection("canon");
    queueMicrotask(() => scrollToSection("canon"));
  }

  function shareCanon() {
    navigator.clipboard.writeText(exportCanon(state.events));
    alert("Canon copied to clipboard.");
  }

  // ----------------------------------------------------------
  // Combat setup inputs (locked while combatActive)
  // ----------------------------------------------------------

  const [playerCount, setPlayerCount] = useState(4);
  const [playerNames, setPlayerNames] = useState<string[]>(["", "", "", "", "", ""]);

  const [enemyGroups, setEnemyGroups] = useState<string[]>(["Skirmishers", "Archers"]);
  const [enemyGroupSelect, setEnemyGroupSelect] = useState<string>("Skirmishers");

  const [initModPlayers, setInitModPlayers] = useState(1);
  const [initModEnemies, setInitModEnemies] = useState(1);

  const PLAYER_COUNTS = [1, 2, 3, 4, 5, 6] as const;
  const INIT_MODS = [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

  const ENEMY_GROUP_LIBRARY = useMemo(
    () => [
      "Skirmishers",
      "Archers",
      "Brutes",
      "Shields",
      "Stalkers",
      "Casters",
      "Drones",
      "Sentries",
      "Wraiths",
      "Grid Knights",
      "Firewall Wardens",
      "Neon Hounds",
    ],
    []
  );

  useEffect(() => {
    setPlayerNames((prev) => {
      if (prev.length === 6) return prev;
      const next = [...prev];
      while (next.length < 6) next.push("");
      return next.slice(0, 6);
    });
  }, []);

  function getEffectivePlayerName(i1Based: number) {
    const idx = i1Based - 1;
    const raw = playerNames[idx] ?? "";
    const name = normalizeName(raw);
    return name.length > 0 ? name : `Player ${i1Based}`;
  }

  function startCombatDeterministic() {
    if (combatActive) return;

    const pc = clampInt(playerCount, 1, 6);
    const groups = enemyGroups.map(normalizeName).filter(Boolean).slice(0, 6);

    const combatId = crypto.randomUUID();
    const seed = crypto.randomUUID();

    const participants: CombatantSpec[] = [];

    for (let i = 1; i <= pc; i++) {
      participants.push({
        id: `player_${i}`,
        name: getEffectivePlayerName(i),
        kind: "player",
        initiativeMod: Math.trunc(initModPlayers || 0),
      });
    }

    groups.forEach((name, idx) => {
      participants.push({
        id: `enemy_group_${idx + 1}`,
        name,
        kind: "enemy_group",
        initiativeMod: Math.trunc(initModEnemies || 0),
      });
    });

    const started: CombatStartedPayload = { combatId, seed, participants };
    const initRolls = generateDeterministicInitiativeRolls(started);

    setState((prev) => {
      let next = prev;

      next = recordEvent(next, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "COMBAT_STARTED",
        payload: started as any,
      });

      for (const r of initRolls) {
        next = recordEvent(next, {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          actor: "arbiter",
          type: "INITIATIVE_ROLLED",
          payload: r as any,
        });
      }

      next = recordEvent(next, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "TURN_ADVANCED",
        payload: { combatId, round: 1, index: 0 } as any,
      });

      return next;
    });

    setActiveSection("combat");
  }

  function advanceTurn() {
    if (!derivedCombat) return;
    if (combatEnded) return;

    const payload = nextTurnPointer(derivedCombat);

    setState((prev) =>
      recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "TURN_ADVANCED",
        payload: payload as any,
      })
    );
  }

  function endCombat() {
    if (!derivedCombat) return;
    if (combatEnded) return;

    setState((prev) =>
      recordEvent(prev, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actor: "arbiter",
        type: "COMBAT_ENDED",
        payload: { combatId: derivedCombat.combatId } as any,
      })
    );
  }

  function addEnemyGroup(name: string) {
    if (combatActive) return;

    const v = normalizeName(name);
    if (!v) return;

    setEnemyGroups((prev) => {
      if (prev.map((x) => x.toLowerCase()).includes(v.toLowerCase())) return prev;
      if (prev.length >= 6) return prev;
      return [...prev, v];
    });
  }

  function removeEnemyGroup(name: string) {
    if (combatActive) return;
    setEnemyGroups((prev) => prev.filter((g) => g !== name));
  }

  function clearEnemyGroups() {
    if (combatActive) return;
    setEnemyGroups([]);
  }

  function randomizePlayerNames() {
    if (combatActive) return;

    const pc = clampInt(playerCount, 1, 6);
    setPlayerNames((prev) => {
      const next = [...prev];
      const used = new Set<string>(next.map((x) => normalizeName(x).toLowerCase()).filter(Boolean));

      for (let i = 0; i < pc; i++) {
        const current = normalizeName(next[i] ?? "");
        if (current) continue;

        let tries = 0;
        let name = randomName();
        while (used.has(name.toLowerCase()) && tries < 12) {
          name = randomName();
          tries++;
        }
        used.add(name.toLowerCase());
        next[i] = name;
      }

      return next.slice(0, 6);
    });
  }

  const isHumanDM = dmMode === "human";

  const outcomesCount = useMemo(
    () => state.events.filter((e: any) => e?.type === "OUTCOME").length,
    [state.events]
  );
  const canonCount = useMemo(
    () => state.events.filter((e: any) => e?.type && e?.type !== "OUTCOME").length,
    [state.events]
  );

  const chapterButtons: { id: DemoSectionId; hint: string }[] = useMemo(
    () => [
      { id: "mode", hint: "Choose facilitator mode" },
      { id: "table", hint: "Start scene + accept table" },
      { id: "pressure", hint: "Advisory state" },
      { id: "map", hint: "Canon view of space" },
      { id: "combat", hint: "Deterministic turn order" },
      { id: "action", hint: "Player intent" },
      { id: "resolution", hint: "Roll + record OUTCOME" },
      { id: "canon", hint: "Non-outcome canon log" },
      { id: "ledger", hint: "Outcome narration only" },
    ],
    []
  );

  function selectMode(nextMode: DMMode) {
    setDmMode(nextMode);
    setActiveSection("table");
    queueMicrotask(() => scrollToSection("table"));
  }

  // Enemy overlay only when:
  // - combat is active
  // - it's an enemy group's turn
  // - and we're not in Human DM (Solace-neutral expects Solace to run enemy action)
  const activeEnemyOverlayName =
    dmMode !== "human" && combatActive && isEnemyTurn ? String(activeCombatantSpec?.name ?? "") : null;

  const activeEnemyOverlayId =
    dmMode !== "human" && combatActive && isEnemyTurn ? String(activeCombatantSpec?.id ?? "") : null;

  const solaceNeutralEnemyTurnEnabled =
    dmMode === "solace-neutral" && combatActive && isEnemyTurn && !!activeEnemyOverlayName && !!activeEnemyOverlayId;

  const effectivePlayerNames = useMemo(() => {
    const pc = clampInt(playerCount, 1, 6);
    const names: string[] = [];
    for (let i = 1; i <= pc; i++) names.push(getEffectivePlayerName(i));
    return names;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerCount, playerNames]);

  // Map demo DMMode -> Resolution panel dmMode (scoped fix: only Solace-neutral locks narration)
  const resolutionDmMode = useMemo(() => {
    return dmMode === "solace-neutral" ? "solace_neutral" : "human";
  }, [dmMode]);

  // Truth anchors for narration (available at resolution time)
  const resolutionMovement = useMemo(() => {
    if (!selectedOption) return null;
    if (!explorationDraft.enableMove) return null;
    if (!suggestedTo) return null;
    return {
      from: currentPos,
      to: suggestedTo,
      direction: explorationDraft.direction,
    };
  }, [selectedOption, explorationDraft.enableMove, explorationDraft.direction, suggestedTo, currentPos]);

  const resolutionCombat = useMemo(() => {
    if (!combatActive) return null;
    return {
      activeEnemyGroupName: activeEnemyOverlayName,
      isEnemyTurn,
      attackStyleHint: "unknown" as const,
    };
  }, [combatActive, activeEnemyOverlayName, isEnemyTurn]);

  return (
    <AmbientBackground>
      <div style={{ position: "relative", zIndex: 1 }}>
        <StewardedShell>
          <ModeHeader
            title="Stewarded Play — Full Flow"
            onShare={() => {
              navigator.clipboard.writeText(exportCanon(state.events));
              alert("Canon copied to clipboard.");
            }}
            roles={[
              { label: "Player", description: "Declares intent" },
              { label: "Solace", description: "Prepares the resolution and narrates outcome" },
              { label: "Arbiter", description: "Commits canon" },
            ]}
          />

          <DemoHero
            dmMode={dmMode}
            tableAccepted={tableAccepted}
            activeSection={activeSection}
            outcomesCount={outcomesCount}
            canonCount={canonCount}
            chapterButtons={chapterButtons}
            onStartHere={() => {
              setActiveSection("mode");
              scrollToSection("mode");
            }}
            onPlayJump={() => {
              setActiveSection("action");
              scrollToSection("action");
            }}
            onSelectMode={selectMode}
            onNavigate={(id) => {
              setActiveSection(id);
              scrollToSection(id);
            }}
          />

          {/* TABLE (hidden until mode selected) */}
          <div id={anchorId("table")} style={{ scrollMarginTop: 90 }}>
            <InitialTableSection
              dmMode={dmMode}
              initialTable={initialTable}
              tableAccepted={tableAccepted}
              tableDraftText={tableDraftText}
              setTableDraftText={setTableDraftText}
              onAccept={() => {
                setTableAccepted(true);
                setActiveSection("pressure");
                queueMicrotask(() => scrollToSection("pressure"));
              }}
            />
          </div>

          {(dmMode !== null && (dmMode === "human" || tableAccepted)) && (
            <>
              {/* PRESSURE */}
              <div id={anchorId("pressure")} style={{ scrollMarginTop: 90 }}>
                <DungeonPressurePanel turn={outcomesCount} events={state.events} />
              </div>

              {/* MAP */}
              <div id={anchorId("map")} style={{ scrollMarginTop: 90 }}>
                <div style={{ position: "relative" }}>
                  <ExplorationMapPanel events={state.events} mapW={MAP_W} mapH={MAP_H} />
                  {/* Visual-only combat theater overlay */}
                  <CombatRendererPanel
                    events={state.events}
                    mapW={MAP_W}
                    mapH={MAP_H}
                    activeEnemyGroupName={activeEnemyOverlayName}
                    hideControls={true}
                    playSignal={enemyPlayNonce}
                  />
                </div>
              </div>

              {/* COMBAT */}
              <div id={anchorId("combat")} style={{ scrollMarginTop: 90 }}>
                <CardSection title="Combat (Deterministic, Grouped Enemies)">
                  <p className="muted" style={{ marginTop: 0 }}>
                    Players roll individually. Enemy groups roll once per group. Turn order is derived from events.
                  </p>

                  {solaceNeutralEnemyTurnEnabled && (
                    <div style={{ marginTop: 10, marginBottom: 12 }}>
                      <EnemyTurnResolverPanel
                        enabled={true}
                        activeEnemyGroupName={activeEnemyOverlayName}
                        activeEnemyGroupId={activeEnemyOverlayId}
                        playerNames={effectivePlayerNames}
                        onTelegraph={() => setEnemyPlayNonce((n) => n + 1)}
                        onCommitOutcome={(payload) => handleRecordOutcomeOnly(payload)}
                        onAdvanceTurn={advanceTurn}
                      />
                    </div>
                  )}

                  {combatActive && (
                    <div className="muted" style={{ marginTop: 8 }}>
                      🔒 Combat is active. Setup is locked to preserve replay integrity.
                    </div>
                  )}

                  {combatEnded && derivedCombat && (
                    <div className="muted" style={{ marginTop: 8 }}>
                      🏁 Combat ended. You can start a new combat (new combatId) if you want.
                    </div>
                  )}

                  {/* ... rest of your combat UI unchanged ... */}

                  {derivedCombat && (
                    <div style={{ marginTop: 12 }}>
                      <div className="muted">
                        Combat: <strong>{derivedCombat.combatId}</strong> · Round <strong>{derivedCombat.round}</strong>
                        {activeCombatantSpec && (
                          <>
                            {" "}
                            · Active: <strong>{formatCombatantLabel(activeCombatantSpec)}</strong>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </CardSection>
              </div>

              {/* ACTION */}
              <div id={anchorId("action")} style={{ scrollMarginTop: 90 }}>
                <CardSection title="Player Action">
                  {combatActive && isEnemyTurn && dmMode !== "human" && (
                    <p className="muted" style={{ marginTop: 0 }}>
                      Enemy turn. In Solace-neutral, Solace resolves enemy action above (Combat section). After the
                      outcome is committed, the turn advances automatically.
                    </p>
                  )}

                  <textarea
                    value={playerInput}
                    onChange={(e) => setPlayerInput(e.target.value)}
                    placeholder="Describe what your character does…"
                    disabled={!canPlayerSubmitIntent}
                    style={{
                      width: "100%",
                      minHeight: "120px",
                      resize: "vertical",
                      boxSizing: "border-box",
                      lineHeight: 1.5,
                    }}
                  />
                  <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <button onClick={handlePlayerAction} disabled={!canPlayerSubmitIntent}>
                      Submit Action
                    </button>
                    <span className="muted" style={{ fontSize: 12 }}>
                      Tip: After you submit, the page jumps to Resolution automatically.
                    </span>
                  </div>
                </CardSection>
              </div>

              {/* PARSED */}
              {parsed && (
                <CardSection title="Parsed Action">
                  <pre>{JSON.stringify(parsed, null, 2)}</pre>
                </CardSection>
              )}

              {/* OPTIONS (Human DM) */}
              {options && isHumanDM && (
                <CardSection title="Options">
                  <ul>
                    {options.map((opt) => (
                      <li key={opt.id}>
                        <button
                          onClick={() => {
                            setSelectedOption(opt);
                            setActiveSection("resolution");
                            queueMicrotask(() => scrollToSection("resolution"));
                          }}
                        >
                          {opt.description}
                        </button>
                      </li>
                    ))}
                  </ul>
                </CardSection>
              )}

              {/* RESOLUTION */}
              <div id={anchorId("resolution")} style={{ scrollMarginTop: 90 }}>
                {/* (your Proposed Exploration Canon Draft card stays as-is) */}

                {selectedOption && (
                  <ResolutionDraftAdvisoryPanel
                    role={role}
                    dmMode={resolutionDmMode}
                    setupText={tableDraftText}
                    movement={resolutionMovement}
                    combat={resolutionCombat}
                    context={{
                      optionDescription: selectedOption.description,
                      optionKind: inferOptionKind(selectedOption.description),
                    }}
                    onRecord={handleRecord}
                  />
                )}
              </div>

              <NextActionHint state={state} />

              {/* CANON */}
              <div id={anchorId("canon")} style={{ scrollMarginTop: 90 }}>
                <CanonEventsPanel events={state.events as any[]} />
              </div>

              {/* LEDGER */}
              <div id={anchorId("ledger")} style={{ scrollMarginTop: 90 }}>
                <WorldLedgerPanelLegacy events={state.events} />
              </div>
            </>
          )}

          <Disclaimer />
        </StewardedShell>
      </div>
    </AmbientBackground>
  );
}
