import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";

const YAML_PATH = "governance/checksums.yml";

// minimal yaml loader/writer (keeps it dependency-free)
function parseYaml(y) {
  // super simple parser tailored to our structure
  const lines = y.split(/\r?\n/);
  const docs = [];
  let cur = null;
  for (const ln of lines) {
    if (ln.match(/^\s*-\s+file:/)) {
      if (cur) docs.push(cur);
      cur = { approved_by: [] };
      cur.file = ln.split("file:")[1].trim();
    } else if (cur && ln.includes("version:")) {
      cur.version = ln.split("version:")[1].trim();
    } else if (cur && ln.includes("checksum:")) {
      cur.checksum = ln.split("checksum:")[1].trim();
    } else if (cur && ln.includes("issued:")) {
      cur.issued = ln.split("issued:")[1].trim();
    } else if (cur && ln.match(/^\s+-\s+.+/)) {
      const name = ln.replace(/^\s+-\s+/, "").trim();
      if (name.includes(":")) cur.approved_by.push(name);
    }
  }
  if (cur) docs.push(cur);
  return { docs };
}

function toYaml(docs) {
  const head = `# Moral Clarity AI • Ratified Document Checksums
# Do not edit 'checksum' fields by hand; use the update script.

documents:
`;
  const body = docs.map(d => `  - file: ${d.file}
    version: ${d.version}
    checksum: ${d.checksum}
    approved_by:
      - ${d.approved_by[0] || "Timothy Zlomke"}
      - ${d.approved_by[1] || "Model Steward: Moral Clarity Model"}
    issued: ${d.issued}
`).join("\n");
  return head + body;
}

function sha256(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

const raw = fs.readFileSync(YAML_PATH, "utf8");
const { docs } = parseYaml(raw);

for (const d of docs) {
  const p = path.resolve(d.file);
  if (!fs.existsSync(p)) {
    console.error(`⚠️  Missing file: ${d.file} — skipping`);
    continue;
  }
  d.checksum = sha256(p);
  console.log(`✅ ${d.file} -> ${d.checksum.slice(0,12)}…`);
}

fs.writeFileSync(YAML_PATH, toYaml(docs), "utf8");
console.log(`\n🎯 Updated ${YAML_PATH}`);
