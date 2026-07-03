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

// Jupyter + numpy research repo (LOOP #5).
const jupyterResearch = new Set([
  "always",
  "requirements.txt",
  "numpy",
  "pandas",
  ".ipynb",
  "jupyter",
  "python",
  ".git",
]);
const jrTop = topNames(jupyterResearch);
assert("Jupyter research includes exa-research", jrTop.includes("exa-research"), jrTop.join(", "));
assert("Jupyter research excludes mongodb", !jrTop.includes("mongodb"), jrTop.join(", "));
assert("Jupyter research includes fetch or firecrawl", jrTop.includes("fetch") || jrTop.includes("firecrawl"), jrTop.join(", "));

// FastAPI backend should get API-appropriate tools, not frontend noise.
const fastapi = new Set(["always", "requirements.txt", "pyproject.toml", "fastapi", "python", ".git", "postgres"]);
const beTop = topNames(fastapi);
assert("FastAPI includes context7", beTop.includes("context7"), beTop.join(", "));
assert("FastAPI includes postgres", beTop.includes("postgres"), beTop.join(", "));
assert("FastAPI includes guard-dangerous-bash", beTop.includes("guard-dangerous-bash"), beTop.join(", "));
assert("FastAPI excludes playwright", !beTop.includes("playwright"), beTop.join(", "));

// Godot game project.
const godot = new Set(["always", "godot", "project.godot", ".git"]);
const gdTop = topNames(godot);
assert("Godot includes context7", gdTop.includes("context7"), gdTop.join(", "));
assert("Godot includes guard-dangerous-bash", gdTop.includes("guard-dangerous-bash"), gdTop.join(", "));

const officialInPool = recommend(catalog, mlResearch).items.filter((e) => e.item.tier === "official").length;
assert("Official tier capped in pool", officialInPool <= 2, String(officialInPool));

const total = 4 + 3 + 4 + 2 + 1;
if (failed) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log(`\nAll ${total} recommend checks passed.`);
