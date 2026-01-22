# Solace Resolution System — Developer Documentation

## Purpose

The Solace Resolution system defines how **authoritative outcomes** are
reported, rendered, stored, and replayed in the Stewarded Play Engine.

It exists to separate:

- **World mechanics** (authoritative, constrained)
- **Narrative reporting** (free, descriptive, non-advisory)

This separation is intentional and non-negotiable.

---

## Core Principles

1. **Solace does not advise**
2. **Solace does not decide outcomes**
3. **Solace reports what the world did**
4. **All mechanics are explicit**
5. **Canon is append-only**

---

## Key Domain Objects

### `SolaceResolution`

A structured, versioned payload emitted once per player intent.

Sections:
- `opening_signal`
- `situation_frame`
- `pressures`
- `process`
- `mechanical_resolution`
- `aftermath`
- `closure` (optional)

Numbers may appear **only** in `mechanical_resolution`.

---

### `ResolutionRun`

A single survival run consisting of ordered `SolaceResolution` entries.

Properties:
- `resolutions[]`
- `isComplete`
- `startedAt`
- `endedAt`

Once complete, no further resolutions may be appended.

---

## Scenario System

Scenarios provide **bounded variation**.

- Scenarios add texture
- Scenarios never alter mechanics
- One scenario is selected per turn
- Selection is deterministic when seeded

Scenarios live in:
