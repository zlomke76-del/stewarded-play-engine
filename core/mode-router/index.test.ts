import { routeMode } from "./index";

test("routes factual to Neutral", () => {
  const r = routeMode("What is TCNQ? Provide definition and steps.");
  expect(r.mode).toBe("Neutral");
});

test("routes decisions to Guidance", () => {
  const r = routeMode("Should we pick Next.js App Router or Pages? Pros/cons?");
  expect(r.mode).toBe("Guidance");
});

test("routes existential to Ministry", () => {
  const r = routeMode("I’m praying about this decision and seeking moral clarity.");
  expect(r.mode).toBe("Ministry");
});
