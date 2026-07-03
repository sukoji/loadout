#!/usr/bin/env node
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { scanProject } from "../cli/lib/scan.mjs";
import { loadCatalog } from "../cli/lib/catalog.mjs";
import { recommend } from "../cli/lib/recommend.mjs";

const dir = mkdtempSync(join(tmpdir(), "loadout-scan-"));
let failed = 0;

function assert(name, cond) {
  if (!cond) {
    console.error(`❌ ${name}`);
    failed++;
  } else {
    console.log(`✅ ${name}`);
  }
}

try {
  writeFileSync(join(dir, "notebook.ipynb"), JSON.stringify({ cells: [] }));
  writeFileSync(join(dir, "references.bib"), "@article{demo, title={Demo}}\n");

  mkdirSync(join(dir, "papers"), { recursive: true });
  writeFileSync(join(dir, "papers", "draft.tex"), "\\documentclass{article}\n");

  const signals = scanProject(dir);
  assert("scan adds .ipynb from notebook file", signals.has(".ipynb"));
  assert("scan adds jupyter from notebook file", signals.has("jupyter"));
  assert("scan adds .bib from references file", signals.has(".bib"));
  assert("scan adds papers from papers/ directory", signals.has("papers"));

  const catalog = loadCatalog();
  const top = recommend(catalog, signals).items.slice(0, 8).map((e) => e.item.id);
  assert("notebook scan surfaces exa-research", top.includes("exa-research"), top.join(", "));
  assert("papers scan surfaces tavily-research", top.includes("tavily-research"), top.join(", "));

  const viteDir = mkdtempSync(join(tmpdir(), "loadout-scan-vite-"));
  try {
    writeFileSync(join(viteDir, "vite.config.ts"), "export default {}\n");
    writeFileSync(join(viteDir, "tsconfig.json"), "{}\n");
    writeFileSync(join(viteDir, "package.json"), "{}");
    const viteSignals = scanProject(viteDir);
    assert("scan adds vite from vite.config.ts", viteSignals.has("vite"));
    assert("scan adds tsconfig.json signal", viteSignals.has("tsconfig.json"));
    const viteTop = recommend(catalog, viteSignals).items.slice(0, 8).map((e) => e.item.id);
    assert("vite project surfaces playwright", viteTop.includes("playwright"), viteTop.join(", "));
  } finally {
    rmSync(viteDir, { recursive: true, force: true });
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (failed) process.exit(1);
console.log("\nAll scan signal checks passed.");
