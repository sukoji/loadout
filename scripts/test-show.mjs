#!/usr/bin/env node
import { loadCatalog } from "../cli/lib/catalog.mjs";

const { byId } = loadCatalog();
let failed = 0;

function assert(name, cond) {
  if (!cond) {
    console.error(`❌ ${name}`);
    failed++;
  } else {
    console.log(`✅ ${name}`);
  }
}

const item = byId.get("context7");
assert("context7 exists in catalog", Boolean(item));
assert("context7 has homepage", Boolean(item?.homepage));
assert("context7 has config", Boolean(item?.config));
assert("context7 is mcp type", item?.type === "mcp");

const skill = byId.get("exa-research");
assert("exa-research exists", Boolean(skill));
assert("exa-research has install commands", Boolean(skill?.install?.commands?.length));

const missing = byId.get("definitely-not-a-real-id");
assert("unknown id is absent", !missing);

const json = JSON.parse(JSON.stringify(item));
assert("item JSON round-trips", json.id === "context7" && json.config);

if (failed) process.exit(1);
console.log("\nAll show/catalog lookup checks passed.");
