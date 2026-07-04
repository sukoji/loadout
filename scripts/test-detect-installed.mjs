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
  mkdirSync(join(dir, ".gemini"), { recursive: true });
  writeFileSync(join(dir, ".codex/config.toml"), '[mcp_servers.context7]\ncommand = "npx"\n');
  writeFileSync(join(dir, ".cursor/mcp.json"), JSON.stringify({ mcpServers: { playwright: { command: "npx" } } }));
  writeFileSync(join(dir, ".gemini/settings.json"), JSON.stringify({ mcpServers: { memory: { command: "npx" } } }));
  writeFileSync(join(dir, "opencode.json"), JSON.stringify({ mcp: { postgres: { type: "local", command: ["npx"] } } }));

  const openclawHome = mkdtempSync(join(tmpdir(), "loadout-openclaw-"));
  process.env.LOADOUT_OPENCLAW_HOME = openclawHome;
  mkdirSync(join(openclawHome, ".openclaw"), { recursive: true });
  writeFileSync(
    join(openclawHome, ".openclaw/openclaw.json"),
    JSON.stringify({ mcp: { servers: { filesystem: { command: "npx", args: ["-y", "@modelcontextprotocol/server-filesystem", "."] } } } }),
  );

  try {
    const signals = new Set(["always", "package.json", "react", "next"]);
    const { items, installed } = recommend(catalog, signals, dir);
    const ids = items.map((e) => e.item.id);

    assert("installed includes context7 from Codex", installed.includes("context7"));
    assert("installed includes playwright from Cursor", installed.includes("playwright"));
    assert("installed includes memory from Gemini", installed.includes("memory"));
    assert("installed includes postgres from opencode", installed.includes("postgres"));
    assert("installed includes filesystem from OpenClaw", installed.includes("filesystem"));
    assert("context7 not re-recommended", !ids.includes("context7"));
    assert("playwright not re-recommended", !ids.includes("playwright"));
    assert("memory not re-recommended", !ids.includes("memory"));
    assert("postgres not re-recommended", !ids.includes("postgres"));
    assert("filesystem not re-recommended", !ids.includes("filesystem"));
  } finally {
    delete process.env.LOADOUT_OPENCLAW_HOME;
    rmSync(openclawHome, { recursive: true, force: true });
  }

  const hooksDir = mkdtempSync(join(tmpdir(), "loadout-detect-hooks-"));
  try {
    mkdirSync(join(hooksDir, ".claude"), { recursive: true });
    writeFileSync(
      join(hooksDir, ".claude/settings.json"),
      JSON.stringify({
        hooks: {
          PostToolUse: [{ hooks: [{ command: "eslint --fix" }] }],
          PreToolUse: [{ hooks: [{ command: "echo block-push" }] }],
        },
        statusLine: { type: "command", command: "git status" },
      }),
    );
    writeFileSync(join(hooksDir, "package.json"), JSON.stringify({ dependencies: { react: "18" } }));
    const { items: hookItems, installed: hookInstalled } = recommend(
      catalog,
      new Set(["always", "package.json", "react"]),
      hooksDir,
    );
    const hookIds = hookItems.map((e) => e.item.id);
    assert("installed includes eslint-fix-on-edit from settings", hookInstalled.includes("eslint-fix-on-edit"));
    assert("installed includes statusline-git from settings", hookInstalled.includes("statusline-git"));
    assert("installed includes block-push-to-main from settings", hookInstalled.includes("block-push-to-main"));
    assert("eslint-fix-on-edit not re-recommended", !hookIds.includes("eslint-fix-on-edit"));
  } finally {
    rmSync(hooksDir, { recursive: true, force: true });
  }

  const initDir = mkdtempSync(join(tmpdir(), "loadout-init-"));
  try {
    writeFileSync(join(initDir, "package.json"), JSON.stringify({ name: "x" }));
    writeFileSync(join(initDir, "CLAUDE.md"), "# Project\n");
    const withClaude = recommend(catalog, new Set(["always", "package.json"]), initDir);
    assert("installed includes init-claude-md when CLAUDE.md exists", withClaude.installed.includes("init-claude-md"));
    assert(
      "init-claude-md not re-recommended when CLAUDE.md exists",
      !withClaude.items.some((e) => e.item.id === "init-claude-md"),
    );

    const bareDir = mkdtempSync(join(tmpdir(), "loadout-bare-"));
    try {
      writeFileSync(join(bareDir, "package.json"), JSON.stringify({ name: "y" }));
      const bare = recommend(catalog, new Set(["always", "package.json"]), bareDir);
      assert("init-claude-md recommended without CLAUDE.md", bare.items.some((e) => e.item.id === "init-claude-md"));
    } finally {
      rmSync(bareDir, { recursive: true, force: true });
    }
  } finally {
    rmSync(initDir, { recursive: true, force: true });
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (failed) process.exit(1);
console.log("\nAll detectInstalled cross-agent checks passed.");
