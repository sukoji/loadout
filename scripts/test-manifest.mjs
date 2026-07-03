#!/usr/bin/env node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadCatalog } from "../cli/lib/catalog.mjs";
import { buildManifest, writeManifest, applyManifest } from "../cli/lib/manifest.mjs";

const catalog = loadCatalog();
const dir = mkdtempSync(join(tmpdir(), "loadout-manifest-"));
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
  const manifestPath = join(dir, ".loadout.json");
  writeManifest(
    {
      version: 1,
      generatedAt: new Date().toISOString(),
      domains: [{ id: "general", title: "General" }],
      installed: [],
      items: [{ id: "sequential-thinking", name: "Sequential Thinking", type: "mcp", tier: "curated", reason: "test" }],
    },
    manifestPath,
  );

  const { receipt } = applyManifest(catalog, manifestPath, dir);
  assert("apply writes sequential-thinking to .mcp.json", receipt.mcp.includes("sequential-thinking"));
  const mcpDoc = JSON.parse(readFileSync(join(dir, ".mcp.json"), "utf8"));
  assert("mcp.json has sequential-thinking config", Boolean(mcpDoc.mcpServers?.["sequential-thinking"]?.command));

  mkdirSync(join(dir, ".cursor"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ dependencies: { react: "18", next: "14" } }));
  writeFileSync(
    join(dir, ".cursor/mcp.json"),
    JSON.stringify({ mcpServers: { playwright: { command: "npx", args: ["-y", "@playwright/mcp@latest"] } } }),
  );

  const manifest = buildManifest(catalog, dir);
  assert("export lists installed MCP ids", manifest.installed.includes("playwright"));
  assert("export excludes already-installed playwright", !manifest.items.some((i) => i.id === "playwright"));
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (failed) process.exit(1);
console.log("\nAll manifest export/apply checks passed.");
