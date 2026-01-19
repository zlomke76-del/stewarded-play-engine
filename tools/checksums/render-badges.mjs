import fs from "node:fs";
import crypto from "node:crypto"; // not used, but handy if you extend
import path from "node:path";

const LEDGER = "governance/checksums.yml";
const INDEX = "docs/INDEX.md";
const BEGIN = "<!-- CHECKSUMS:BEGIN -->";
const END   = "<!-- CHECKSUMS:END -->";

// Tiny YAML grabber tuned to our known structure
function parseLedger(text) {
  const docs = [];
  let cur = null;
  for (const raw of text.split(/\r?\n/)) {
    const ln = raw.trimEnd();
    if (/^-\s+file: /.test(ln)) {
      if (cur) docs.push(cur);
      cur = { approved_by: [] };
      cur.file = ln.split("file:")[1].trim();
    } else if (cur && ln.includes("version:")) {
      cur.version = ln.split("version:")[1].trim();
    } else if (cur && ln.includes("checksum:")) {
      cur.checksum = ln.split("checksum:")[1].trim();
    } else if (cur && ln.startsWith("- ")) {
      cur.approved_by.push(ln.replace("- ","").trim());
    } else if (cur && ln.includes("issued:")) {
      cur.issued = ln.split("issued:")[1].trim();
    }
  }
  if (cur) docs.push(cur);
  return docs.filter(d => d.file && d.version && d.checksum && d.checksum !== "TODO");
}

function short(hex) { return hex.slice(0, 8); }

function buildBadgeRow(d) {
  const name = path.basename(d.file);
  // simple text “badge” style for repo-internal rendering (no external network)
  const badge = `\`${short(d.checksum)}\``;
  return `| \`${name}\` | v${d.version} | ${d.issued} | ${badge} |`;
}

function renderTable(docs) {
  const header = [
    "| File | Version | Issued | SHA-256 (short) |",
    "|------|---------|--------|------------------|",
  ];
  const rows = docs
    .sort((a,b) => a.file.localeCompare(b.file))
    .map(buildBadgeRow);
  return header.concat(rows).join("\n");
}

function replaceInIndex(indexText, payload) {
  const start = indexText.indexOf(BEGIN);
  const end = indexText.indexOf(END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Marker comments not found or malformed in docs/INDEX.md");
  }
  const before = indexText.slice(0, start + BEGIN.length);
  const after  = indexText.slice(end);
  const body = `\n<!-- This section is auto-generated. Do not edit by hand. -->\n\n${payload}\n`;
  return before + body + after;
}

// ---- main
const ledgerText = fs.readFileSync(LEDGER, "utf8");
const entries = parseLedger(ledgerText);
if (!entries.length) {
  console.error("⚠️  No finalized checksums found. Run: npm run checksums:update");
  process.exit(1);
}
const table = renderTable(entries);

const idx = fs.readFileSync(INDEX, "utf8");
const updated = replaceInIndex(idx, table);
fs.writeFileSync(INDEX, updated, "utf8");

console.log("✅ Wrote checksum badge table into docs/INDEX.md");
