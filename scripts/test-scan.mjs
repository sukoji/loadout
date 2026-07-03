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

  const angularDir = mkdtempSync(join(tmpdir(), "loadout-scan-ng-"));
  try {
    writeFileSync(join(angularDir, "angular.json"), "{}\n");
    writeFileSync(join(angularDir, "package.json"), JSON.stringify({ dependencies: { "@angular/core": "18" } }));
    const ngSignals = scanProject(angularDir);
    assert("scan adds angular from angular.json", ngSignals.has("angular"));
    assert("scan adds angular from @angular/core", ngSignals.has("angular"));
    const ngTop = recommend(catalog, ngSignals).items.slice(0, 8).map((e) => e.item.id);
    assert("angular project surfaces playwright", ngTop.includes("playwright"), ngTop.join(", "));
  } finally {
    rmSync(angularDir, { recursive: true, force: true });
  }

  const nestDir = mkdtempSync(join(tmpdir(), "loadout-scan-nest-"));
  try {
    writeFileSync(join(nestDir, "nest-cli.json"), "{}\n");
    writeFileSync(join(nestDir, "package.json"), JSON.stringify({ dependencies: { fastify: "4", "@nestjs/core": "10" } }));
    const nestSignals = scanProject(nestDir);
    assert("scan adds nestjs from nest-cli.json", nestSignals.has("nestjs"));
    assert("scan adds fastify from package.json", nestSignals.has("fastify"));
    const nestTop = recommend(catalog, nestSignals).items.slice(0, 8).map((e) => e.item.id);
    assert("nestjs project surfaces postgres or context7", nestTop.includes("postgres") || nestTop.includes("context7"), nestTop.join(", "));
  } finally {
    rmSync(nestDir, { recursive: true, force: true });
  }

  const flutterDir = mkdtempSync(join(tmpdir(), "loadout-scan-flutter-"));
  try {
    writeFileSync(join(flutterDir, "pubspec.yaml"), "name: demo\nflutter:\n  assets: []\n");
    writeFileSync(join(flutterDir, "build.gradle"), "android {}\n");
    const flSignals = scanProject(flutterDir);
    assert("scan adds pubspec.yaml signal", flSignals.has("pubspec.yaml"));
    assert("scan adds flutter from pubspec", flSignals.has("flutter"));
    assert("scan adds build.gradle signal", flSignals.has("build.gradle"));
    const flTop = recommend(catalog, flSignals).items.slice(0, 8).map((e) => e.item.id);
    assert("flutter project surfaces context7", flTop.includes("context7"), flTop.join(", "));
  } finally {
    rmSync(flutterDir, { recursive: true, force: true });
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (failed) process.exit(1);
console.log("\nAll scan signal checks passed.");
