// Minimal PR-body linter for Canon compliance
// Usage: node tools/canon-lint/check.js "$PR_BODY"

const fs = require("fs");

const policy = JSON.parse(fs.readFileSync("tools/canon-lint/policy.json", "utf8"));
const body = (process.argv[2] || "").trim();

function fail(msg) { console.error("❌ Canon lint:", msg); process.exit(1); }
function ok(msg)   { console.log("✅", msg); }

if (!body) fail("PR body is empty. Use the PR template.");

for (const section of policy.requiredSections) {
  const re = new RegExp(`^##\\s+${section}\\b`, "mi");
  if (!re.test(body)) fail(`Missing section: ${section}`);
}
ok("All required sections present.");

for (const field of policy.requiredFields) {
  const re = new RegExp(`${field}\\s*:\\s*`, "i");
  if (!re.test(body)) fail(`Missing field: ${field}`);
}
ok("All required fields present.");

const tagLine = body.match(/Canon tags\s*:\s*(.+)/i);
if (!tagLine) fail("Canon tags not provided.");
const tags = tagLine[1].split(/[,\s]+/).filter(Boolean);
const known = new Set(policy.tags);
const unknown = tags.filter(t => !known.has(t));
if (unknown.length) fail(`Unknown Canon tag(s): ${unknown.join(", ")}`);
ok(`Canon tags ok: ${tags.join(", ")}`);

const versionMatch = body.match(/Canon version\s*:\s*`?([0-9]+\.[0-9]+\.[0-9]+)`?/i);
if (!versionMatch) fail("Canon version missing.");
if (versionMatch[1] !== policy.canonVersion) {
  fail(`Canon version mismatch: got ${versionMatch[1]}, expected ${policy.canonVersion}`);
}
ok(`Canon version ${policy.canonVersion} confirmed.`);

console.log("🎯 Canon lint passed.");
