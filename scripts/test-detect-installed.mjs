#!/usr/bin/env node
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadCatalog } from "../cli/lib/catalog.mjs";
import { recommend } from "../cli/lib/recommend.mjs";

const catalog = loadCatalog();
const dir = mkdtempSync(join(tmpdir(), "loadout-detect-"));
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
  writeFileSync(join(dir, "package.json"), JSON.stringify({ dependencies: { react: "18", next: "14" } }));
  mkdirSync(join(dir, ".codex"), { recursive: true });
  mkdirSync(join(dir, ".cursor"), { recursive: true });
  writeFileSync(join(dir, ".codex/config.toml"), '[mcp_servers.context7]\ncommand = "npx"\n');
  writeFileSync(join(dir, ".cursor/mcp.json"), JSON.stringify({ mcpServers: { playwright: { command: "npx" } } }));

  const signals = new Set(["always", "package.json", "react", "next"]);
  const { items, installed } = recommend(catalog, signals, dir);
  const ids = items.map((e) => e.item.id);

  assert("installed includes context7 from Codex", installed.includes("context7"));
  assert("installed includes playwright from Cursor", installed.includes("playwright"));
  assert("context7 not re-recommended", !ids.includes("context7"));
  assert("playwright not re-recommended", !ids.includes("playwright"));
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (failed) process.exit(1);
console.log("\nAll detectInstalled cross-agent checks passed.");
