#!/usr/bin/env node
// Regression checks for recommend() ranking — run before release.
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadCatalog } from "../cli/lib/catalog.mjs";
import { recommend } from "../cli/lib/recommend.mjs";

const catalog = loadCatalog();
// Isolate from the developer's cwd so dogfooded .mcp.json does not hide recs.
const CLEAN_ROOT = join(tmpdir(), `loadout-clean-${process.pid}`);
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
  return recommend(catalog, signals, CLEAN_ROOT).items.slice(0, 8).map((e) => e.item.id);
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

// Flutter / mobile.
const flutter = new Set(["always", "pubspec.yaml", "flutter", "build.gradle", ".git"]);
const flTop = topNames(flutter);
assert("Flutter includes context7", flTop.includes("context7"), flTop.join(", "));
assert("Flutter includes figma or playwright", flTop.includes("figma") || flTop.includes("playwright"), flTop.join(", "));

// Expo / React Native.
const expo = new Set(["always", "package.json", "expo", "react-native", ".git"]);
const expoTop = topNames(expo);
assert("Expo includes context7", expoTop.includes("context7"), expoTop.join(", "));
assert("Expo excludes postgres by default", !expoTop.includes("postgres"), expoTop.join(", "));

// DevOps / infra.
const devops = new Set(["always", "dockerfile", "terraform", "helm", "k8s", ".github/workflows", ".git"]);
const dvTop = topNames(devops);
assert("DevOps includes git or github", dvTop.includes("git") || dvTop.includes("github"), dvTop.join(", "));
assert("DevOps includes guard-dangerous-bash", dvTop.includes("guard-dangerous-bash"), dvTop.join(", "));
assert("DevOps excludes playwright", !dvTop.includes("playwright"), dvTop.join(", "));

// Docs / writing.
const docsWriting = new Set(["always", "docs", "mkdocs", "docusaurus", ".docx"]);
const docsTop = topNames(docsWriting);
assert("Docs includes office-docs or notion", docsTop.includes("office-docs") || docsTop.includes("notion"), docsTop.join(", "));
assert("Docs excludes postgres by default", !docsTop.includes("postgres"), docsTop.join(", "));

// Security-sensitive (auth/payments).
const security = new Set(["always", "auth", "jwt", "stripe", ".env", ".git"]);
const secTop = topNames(security);
assert("Security includes protect-secrets", secTop.includes("protect-secrets"), secTop.join(", "));
assert("Security includes guard-dangerous-bash", secTop.includes("guard-dangerous-bash"), secTop.join(", "));

// protect-secrets requires .env — do not push it on plain devops repos.
const devopsNoEnv = new Set(["always", "dockerfile", "terraform", ".github/workflows", ".git"]);
const devopsNoEnvTop = topNames(devopsNoEnv);
assert("DevOps without .env excludes protect-secrets", !devopsNoEnvTop.includes("protect-secrets"), devopsNoEnvTop.join(", "));

// Monorepo markers match devops tooling (filesystem / git / github).
const monorepo = new Set(["always", "monorepo", "turbo", "package.json", ".git"]);
const monoTop = topNames(monorepo);
assert("Monorepo includes filesystem or git", monoTop.includes("filesystem") || monoTop.includes("git"), monoTop.join(", "));
assert("Monorepo includes github or git", monoTop.includes("github") || monoTop.includes("git"), monoTop.join(", "));

// .env alone (via general loadout) surfaces protect-secrets even when security isn't top domain.
const frontendEnv = new Set(["always", "react", "next", "package.json", ".env"]);
const frontendEnvTop = topNames(frontendEnv);
assert("Frontend with .env includes protect-secrets", frontendEnvTop.includes("protect-secrets"), frontendEnvTop.join(", "));
assert("Frontend without .env excludes protect-secrets", !topNames(new Set(["always", "react", "next", "package.json"])).includes("protect-secrets"));

const officialInPool = recommend(catalog, mlResearch, CLEAN_ROOT).items.filter((e) => e.item.tier === "official").length;
assert("Official tier capped in pool", officialInPool <= 2, String(officialInPool));

if (failed) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log("\nAll recommend checks passed.");
