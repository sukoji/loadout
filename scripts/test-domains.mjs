#!/usr/bin/env node
import { loadCatalog } from "../cli/lib/catalog.mjs";

const { domains } = loadCatalog();
let failed = 0;

function assert(name, cond, detail = "") {
  if (!cond) {
    console.error(`❌ ${name}${detail ? `: ${detail}` : ""}`);
    failed++;
  } else {
    console.log(`✅ ${name}`);
  }
}

assert("has 10 domains", domains.length === 10, String(domains.length));
const ids = domains.map((d) => d.id);
for (const id of [
  "frontend",
  "backend-api",
  "data-ml",
  "research",
  "devops",
  "mobile",
  "security",
  "docs-writing",
  "game-dev",
  "general",
]) {
  assert(`includes ${id}`, ids.includes(id));
}

for (const d of domains) {
  assert(`${d.id} has loadout items`, Array.isArray(d.loadout) && d.loadout.length > 0);
  assert(`${d.id} has signals`, Array.isArray(d.signals) && d.signals.length > 0);
}

const json = JSON.parse(JSON.stringify(domains.map((d) => ({ id: d.id, title: d.title, loadout: d.loadout }))));
assert("domains JSON round-trips", json.length === 10);

if (failed) process.exit(1);
console.log("\nAll domains catalog checks passed.");
