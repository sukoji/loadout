#!/usr/bin/env node
import { loadCatalog } from "../cli/lib/catalog.mjs";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const { domains, all, mcp, skills, hooks, ecosystem, community } = loadCatalog();
const version = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "package.json"), "utf8"),
).version;
let failed = 0;

function assert(name, cond, detail = "") {
  if (!cond) {
    console.error(`❌ ${name}${detail ? `: ${detail}` : ""}`);
    failed++;
  } else {
    console.log(`✅ ${name}`);
  }
}

const byType = {};
const byTier = { curated: 0, official: 0, community: 0 };
for (const item of all) {
  byType[item.type] = (byType[item.type] || 0) + 1;
  byTier[item.tier || "curated"] = (byTier[item.tier || "curated"] || 0) + 1;
}

const payload = {
  version,
  domains: domains.length,
  items: all.length,
  tiers: byTier,
  types: byType,
  curated: { mcp: mcp.length, skills: skills.length, hooks: hooks.length },
  official: ecosystem.length,
  community: community.length,
};

assert("stats has package version", Boolean(payload.version));
assert("stats has 10 domains", payload.domains === 10);
assert("stats items equals all tiers", payload.items === byTier.curated + byTier.official + byTier.community);
assert("stats curated mcp count", payload.curated.mcp === mcp.length && mcp.length > 0);
assert("stats has mcp type", payload.types.mcp > 0);
assert("stats has skill type", payload.types.skill > 0);
assert("stats JSON round-trips", JSON.parse(JSON.stringify(payload)).items === payload.items);

if (failed) process.exit(1);
console.log("\nAll stats checks passed.");
