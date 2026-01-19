---
project: "Moral Clarity AI"
title: "Governance & Version Control Guidelines"
author: "Timothy Zlomke"
version: "v1.0"
issued: "2026-01-01"
license: "Moral Clarity AI Stewardship License"
related_version: null
status: canon
---

# Moral Clarity AI • Governance & Version Control Guidelines v1

*Defines ratification, change management, and archival standards for all doctrinal and operational documents.*

---

## 0) Purpose

This document establishes the governing process for issuing, amending, and archiving official Moral Clarity AI materials.  
Its aim is to protect **continuity, authorship integrity, and moral fidelity** across all canonical documents.

These rules exist to prevent:
- Silent drift
- Fragmented authorship
- Retroactive reinterpretation
- Tool-driven mutation of doctrine

---

## 1) Scope

These rules apply to all files under `/docs`, `/core`, `/governance`, `/tools`, and any directory containing:
- “canon”, “policy”, “charter”, “spec”, or “stewardship” in its filename, or
- YAML front-matter declaring `project: "Moral Clarity AI"`

---

## 2) Roles & Responsibilities

| Role | Authority | Primary Duties |
|-----|---------|----------------|
| **Founder (Timothy Zlomke)** | Final moral and structural authority | Approves Canon-level documents; resolves interpretive disputes |
| **Model Steward(s)** | Editorial and compliance oversight | Ensure changes align with Canon; verify checksums |
| **Contributors** | Proposal authority only | Draft documents; submit PRs with full metadata and references |

---

## 3) Document Lifecycle

### 3.1 Creation

All new documents must:
1. Include YAML front-matter with:
   - `title`
   - `author`
   - `version`
   - `issued`
   - `license`
   - `related_version`
2. Use the suffix `-draft.md` until ratified
3. Be submitted via a pull request labeled:
   - `Canon Proposal` or `Policy Proposal`
4. Pass all CI checks, including metadata validation

---

### 3.2 Ratification

A document becomes **official** only when:

- Approved by **Timothy Zlomke**
- Approved by a designated **Model Steward**
- CI confirms Canon alignment and checksum integrity

The ratifying commit **must** use the format:

```text
[CANON-RATIFIED] <Title> v<version>
Approved-by: Timothy Zlomke
Steward: <Name>
Checksum: 5CEDA678DB0A4ECEE9D77E53B685BCE15BACCFC23CBD4CD611746538BC6D4DC0


