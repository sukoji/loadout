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

  const { receipts } = applyManifest(catalog, manifestPath, dir);
  const receipt = receipts.find((r) => r.type === "claude")?.receipt;
  assert("apply writes sequential-thinking to .mcp.json", receipt?.mcp?.includes("sequential-thinking"));
  const mcpDoc = JSON.parse(readFileSync(join(dir, ".mcp.json"), "utf8"));
  assert("mcp.json has sequential-thinking config", Boolean(mcpDoc.mcpServers?.["sequential-thinking"]?.command));

  const cursorDir = mkdtempSync(join(tmpdir(), "loadout-manifest-cursor-"));
  try {
    const cursorManifest = join(cursorDir, ".loadout.json");
    writeManifest(
      {
        version: 1,
        generatedAt: new Date().toISOString(),
        domains: [{ id: "general", title: "General" }],
        installed: [],
        items: [{ id: "memory", name: "Memory", type: "mcp", tier: "curated", reason: "test" }],
      },
      cursorManifest,
    );
    const { receipts } = applyManifest(catalog, cursorManifest, cursorDir, { targets: ["cursor"] });
    const targetReceipt = receipts.find((r) => r.type === "target")?.receipt;
    assert("apply --target cursor writes memory", targetReceipt?.added?.includes("memory"));
    const cursorMcp = JSON.parse(readFileSync(join(cursorDir, ".cursor/mcp.json"), "utf8"));
    assert("cursor mcp.json has memory config", Boolean(cursorMcp.mcpServers?.memory?.command));
  } finally {
    rmSync(cursorDir, { recursive: true, force: true });
  }

  mkdirSync(join(dir, ".cursor"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ dependencies: { react: "18", next: "14" } }));
  writeFileSync(
    join(dir, ".cursor/mcp.json"),
    JSON.stringify({ mcpServers: { playwright: { command: "npx", args: ["-y", "@playwright/mcp@latest"] } } }),
  );

  const manifest = buildManifest(catalog, dir);
  assert("export lists installed MCP ids", manifest.installed.includes("playwright"));
  assert("export excludes already-installed playwright", !manifest.items.some((i) => i.id === "playwright"));

  const jsonManifest = buildManifest(catalog, dir);
  const serialized = JSON.parse(JSON.stringify(jsonManifest));
  assert("export manifest JSON has installed array", Array.isArray(serialized.installed));
  assert("export manifest JSON has items array", Array.isArray(serialized.items) && serialized.items.length > 0);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (failed) process.exit(1);
console.log("\nAll manifest export/apply checks passed.");
