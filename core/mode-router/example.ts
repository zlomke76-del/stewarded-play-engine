import { routeMode, toneFor } from "./index";

const ctx = { lastMode: "Neutral" as const };

[
  "What’s the difference between PET and PBT?",
  "Should we launch now or refine for 2 more sprints?",
  "I’m overwhelmed… how do I stay grounded? I’ve been praying about this."
].forEach(q => {
  const r = routeMode(q, ctx);
  console.log(q, "=>", r.mode, r.confidence, r.signals, r.scores, toneFor(r.mode));
});
