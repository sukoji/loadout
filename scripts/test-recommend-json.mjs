#!/usr/bin/env node
import { loadCatalog } from "../cli/lib/catalog.mjs";
import { recommend } from "../cli/lib/recommend.mjs";
import { buildRecommendPreview } from "../cli/lib/manifest.mjs";

const catalog = loadCatalog();
let failed = 0;

function assert(name, cond, detail = "") {
  if (!cond) {
    console.error(`❌ ${name}${detail ? `: ${detail}` : ""}`);
    failed++;
    return;
  }
  console.log(`✅ ${name}`);
}

const signals = new Set(["always", "package.json", "react", "next", ".git"]);
const { domains, items, community, installed } = recommend(catalog, signals);
const json = buildRecommendPreview(signals, domains, items, community, installed);

assert("JSON has items array", Array.isArray(json.items) && json.items.length > 0);
assert("JSON has domains array", Array.isArray(json.domains) && json.domains.length > 0);
assert("JSON has installed array", Array.isArray(json.installed));
assert("JSON signals include react", json.signals.includes("react"));
assert("frontend includes playwright in JSON", json.items.some((i) => i.id === "playwright"), json.items.map((i) => i.id).join(", "));
assert("each item has id, name, type, reason", json.items.every((i) => i.id && i.name && i.type && i.reason));

const serialized = JSON.parse(JSON.stringify(json));
assert("JSON round-trips", serialized.items.length === json.items.length);

if (failed) process.exit(1);
console.log("\nAll recommend JSON checks passed.");
