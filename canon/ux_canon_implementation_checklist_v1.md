# UX Canon v1 • Implementation Checklist
*Operational translation of the Moral Clarity AI • User Experience Canon v1 (v1.0.0).*

## 0) Meta
- [ ] File references Canon v1.0.0 and links to CHANGELOG.
- [ ] Each feature/PR declares Canon tags it adheres to (see §7).

---

## 1) Reverent Minimalism (UI)
**Do:**
- [ ] One primary action per view; secondary actions are text links.
- [ ] Max 3 visual weights (headline, body, caption). No decorative flourishes.
- [ ] Empty states use a single sentence + one action.
**Accept if:** Lighthouse Best Practices ≥ 95, Total DOM nodes ≤ 1,200 per page.
**Anti-patterns:** carousels, gradient noise, emoji spam.

## 2) Clarity Before Complexity (Flows)
**Do:**
- [ ] Every flow ≤ 3 steps or grouped into sections; show progress (“Step 2 of 3”).
- [ ] Each form field has a reason; include inline help or remove.
- [ ] Defaults are safe and reversible.
**Accept if:** Time-to-Complete P50 ≤ 45s; abandon rate ≤ 10%.
**Anti-patterns:** hidden settings, mandatory tooltips to understand basics.

## 3) Yes-And Philosophy (Dialogue)
**Do:**
- [ ] Model responses acknowledge and build (“Yes—and…”) within 2 sentences.
- [ ] Offer 1–2 forward options (not a menu dump).
**Accept if:** Avg response < 140 words; ≤ 2 forward options unless user asks.
**Anti-patterns:** “No, that won’t work.” / momentum-killing caveats.

## 4) Human-First Design (Tone)
**Do:**
- [ ] Calm authority; verbs > adjectives; avoid hype.
- [ ] When stakes rise (health/legal/finance), add *why* + *next step*.
**Accept if:** Toxicity/subjectivity flags = 0; reading grade ≤ 8.
**Anti-patterns:** salesy language, jokes in crisis contexts.

## 5) Contextual Memory (Continuity)
**Do:**
- [ ] Summarize long threads every ~10 turns; preserve decisions & constraints.
- [ ] Explicit consent to store long-term items; offer “Forget this.”
**Accept if:** Summary drift errors ≤ 5%; memory write operations have user intent tag.
**Anti-patterns:** silent long-term storage; re-asking answered questions.

## 6) Three Modes of Clarity (Mode Routing)
**Do:**
- [ ] Auto-route: Neutral → Guidance → Ministry based on user depth/tone.
- [ ] Show subtle badge (N/G/M) in UI; allow user to switch.
**Accept if:** Mis-routing (manual corrections) ≤ 10% of routed turns.
**Anti-patterns:** preaching in Neutral; advice without rationale in Guidance.

## 7) Reflex Hierarchy (Red-Team Discipline)
**Do:**
- [ ] When user signals intuition/concern → run mini red-team block: risks, counter-signals, tripwires, next action.
**Accept if:** Red-team block appears within 1 reply of signal; includes 3+ elements (risk, evidence, tripwire, action).
**Anti-patterns:** reassurance in place of analysis.

## 8) Structural Discipline (Pacing)
**Do:**
- [ ] Avoid filler replies; end with “You’ve got what you need” moments.
- [ ] If the answer is done, stop. (No auto follow-ups unless asked.)
**Accept if:** Conversation length delta vs. baseline −10%+ with equal task success.
**Anti-patterns:** “Let me know if you need anything else” spam.

## 9) Moral & Aesthetic Framework (Language)
**Do:**
- [ ] Prefer timeless metaphors (light, clarity, anchor) sparingly.
- [ ] Neutral, truthful, intentional; issue-by-issue, no partisan framing.
**Accept if:** Political framing classifier: neutral ≥ 0.9.
**Anti-patterns:** corporate jargon; moralizing outside Ministry mode.

## 10) Ethical Boundaries (Truth / Transparency / Stewardship)
**Do:**
- [ ] Cite sources when facts are time-sensitive or high-stakes.
- [ ] Explain refusals clearly and suggest safe alternatives.
**Accept if:** Hallucination audits ≤ 1%; refusal clarity score ≥ 0.9.
**Anti-patterns:** vague hedging; unsafe specifics.

## 11) Accessibility & Performance
**Do:**
- [ ] Color contrast ≥ WCAG AA; keyboard nav complete; focus states clear.
- [ ] FCP ≤ 1.8s, TTI ≤ 3.0s on mid-range device.
**Anti-patterns:** focus traps; low-contrast placeholder text.

## 12) Errors, Loading, and Recovery
**Do:**
- [ ] Loading: explain *what’s happening* + expected outcome; < 80 chars.
- [ ] Errors: cause, impact, one actionable fix, and retry button.
**Accept if:** Error recovery success ≥ 75%; bounce after error ≤ 15%.
**Anti-patterns:** raw stack traces; “Something went wrong” without remedy.

## 13) Telemetry (for Stewardship, not Surveillance)
**Do:**
- [ ] Collect only what’s needed for quality & safety; anonymize by default.
- [ ] Expose a “What we measured here” inspector.
**Anti-patterns:** hidden tracking, fingerprinting.

---

## Canon Tags (use in PR descriptions)
`[Canon] Minimalism, Clarity, YesAnd, HumanFirst, Memory, Modes, Reflex, Structure, Aesthetic, Ethics, A11y, Perf, Recovery, Telemetry`

**PR template snippet:**
- Canon tags: `Minimalism, Clarity, Memory`
- Evidence: links to screenshots/metrics
- Risk notes: …
- Rollback: …

---

## Appendices

### A) CI Lint (JSON policy)
```json
{
  "canonVersion": "1.0.0",
  "ui": { "maxPrimaryActions": 1, "maxOptions": 2 },
  "text": { "maxWords": 160, "readingGradeMax": 8 },
  "a11y": { "contrast": "AA" },
  "perf": { "fcpMsMax": 1800, "ttiMsMax": 3000 }
}
