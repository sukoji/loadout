#!/usr/bin/env node
// Regression checks for recommend() ranking — run before release.
import { loadCatalog } from "../cli/lib/catalog.mjs";
import { recommend } from "../cli/lib/recommend.mjs";

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

function topNames(signals) {
  return recommend(catalog, signals).items.slice(0, 8).map((e) => e.item.id);
}

// ML research repo should surface research tools, not random python marketplace plugins.
const mlResearch = new Set([
  "always",
  "requirements.txt",
  "pyproject.toml",
  "numpy",
  "pandas",
  "torch",
  ".ipynb",
  "jupyter",
  "python",
  ".git",
]);
const mlTop = topNames(mlResearch);
assert("ML research includes exa-research", mlTop.includes("exa-research"), mlTop.join(", "));
assert("ML research includes context7", mlTop.includes("context7"), mlTop.join(", "));
assert("ML research excludes aws-transform noise", !mlTop.includes("aws-transform"), mlTop.join(", "));
assert("ML research excludes mongodb by default", !mlTop.includes("mongodb"), mlTop.join(", "));

// LaTeX + bib repo should match research domain.
const paperRepo = new Set(["always", "latex", ".bib", "requirements.txt", "python"]);
const paperTop = topNames(paperRepo);
assert("Paper repo includes exa-research", paperTop.includes("exa-research"), paperTop.join(", "));
assert("Paper repo includes tavily-research", paperTop.includes("tavily-research"), paperTop.join(", "));

// Frontend repo should still prioritize browser tooling.
const frontend = new Set(["always", "package.json", "react", "next", ".git"]);
const feTop = topNames(frontend);
assert("Frontend includes playwright", feTop.includes("playwright"), feTop.join(", "));

const officialInPool = recommend(catalog, mlResearch).items.filter((e) => e.item.tier === "official").length;
assert("Official tier capped in pool", officialInPool <= 2, String(officialInPool));

if (failed) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log(`\nAll ${4 + 1} recommend checks passed.`);
