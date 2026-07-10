#!/usr/bin/env node
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadCatalog } from "../cli/lib/catalog.mjs";
import { recommend, listTokenSavers } from "../cli/lib/recommend.mjs";
import { buildRecommendPreview } from "../cli/lib/manifest.mjs";

const catalog = loadCatalog();
const CLEAN_ROOT = join(tmpdir(), `loadout-clean-json-${process.pid}`);
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
const { domains, items, community, tokenSavers, installed } = recommend(catalog, signals, CLEAN_ROOT);
const json = buildRecommendPreview(signals, domains, items, community, installed, { tokenSavers });

assert("tokenSavers lists caveman", tokenSavers.some((e) => e.item.id === "caveman"));
assert("caveman not in default community", !community.some((e) => e.item.id === "caveman"));
const withDiscover = recommend(catalog, signals, CLEAN_ROOT, { discover: true });
assert("caveman not in --discover community", !withDiscover.community.some((e) => e.item.id === "caveman"));
assert("JSON has tokenSavers array", Array.isArray(json.tokenSavers) && json.tokenSavers.some((i) => i.id === "caveman"));
assert("listTokenSavers matches recommend", listTokenSavers(catalog.all, new Set()).some((e) => e.item.id === "caveman"));

assert("JSON has items array", Array.isArray(json.items) && json.items.length > 0);
assert("JSON has domains array", Array.isArray(json.domains) && json.domains.length > 0);
assert("JSON has installed array", Array.isArray(json.installed));
assert("JSON signals include react", json.signals.includes("react"));
assert("frontend includes playwright in JSON", json.items.some((i) => i.id === "playwright"), json.items.map((i) => i.id).join(", "));
assert("each item has id, name, type, reason", json.items.every((i) => i.id && i.name && i.type && i.reason));
assert("items include homepage when available", json.items.some((i) => i.homepage));

const serialized = JSON.parse(JSON.stringify(json));
assert("JSON round-trips", serialized.items.length === json.items.length);

if (failed) process.exit(1);
console.log("\nAll recommend JSON checks passed.");
