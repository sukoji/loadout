#!/usr/bin/env node
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadCatalog } from "../cli/lib/catalog.mjs";
import { applyToTarget, supportedItems } from "../cli/lib/targets.mjs";

const catalog = loadCatalog();
const dir = mkdtempSync(join(tmpdir(), "loadout-targets-"));
let failed = 0;

function assert(name, condition) {
  console.log(`${condition ? "✅" : "❌"} ${name}`);
  if (!condition) failed++;
}

try {
  const github = catalog.byId.get("github");
  const guard = catalog.byId.get("guard-dangerous-bash");
  const statusline = catalog.byId.get("statusline-git");

  assert("Codex accepts MCP and hook items", supportedItems("codex", [github, guard]).length === 2);
  assert("Codex rejects Claude-only settings", supportedItems("codex", [statusline]).length === 0);

  const first = applyToTarget("codex", [github, guard], dir);
  const toml = readFileSync(join(dir, ".codex", "config.toml"), "utf8");
  const hooks = JSON.parse(readFileSync(join(dir, ".codex", "hooks.json"), "utf8"));
  assert("Codex writes Streamable HTTP MCP URL", toml.includes('url = "https://api.githubcopilot.com/mcp/"'));
  assert("Codex writes lifecycle hooks", hooks.hooks?.PreToolUse?.length === 1);
  assert("Codex receipt lists both files", first.files.length === 2);

  applyToTarget("codex", [github, guard], dir);
  const hooksAgain = JSON.parse(readFileSync(join(dir, ".codex", "hooks.json"), "utf8"));
  assert("Codex hook apply is idempotent", hooksAgain.hooks.PreToolUse.length === 1);

  const existingDir = mkdtempSync(join(tmpdir(), "loadout-targets-existing-"));
  try {
    mkdirSync(join(existingDir, ".codex"), { recursive: true });
    writeFileSync(join(existingDir, ".codex", "hooks.json"), JSON.stringify({ description: "keep me", hooks: {} }));
    applyToTarget("codex", [guard], existingDir);
    const merged = JSON.parse(readFileSync(join(existingDir, ".codex", "hooks.json"), "utf8"));
    assert("Codex hook merge preserves existing fields", merged.description === "keep me");
  } finally {
    rmSync(existingDir, { recursive: true, force: true });
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (failed) process.exit(1);
console.log("\nAll target adapter checks passed.");
