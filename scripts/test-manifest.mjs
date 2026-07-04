#!/usr/bin/env node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadCatalog } from "../cli/lib/catalog.mjs";
import { recommend } from "../cli/lib/recommend.mjs";
import { buildManifest, writeManifest, applyManifest, applyItems, previewManifestApply, previewItemsApply } from "../cli/lib/manifest.mjs";

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

  const preview = previewManifestApply(catalog, manifestPath, { targets: ["claude"] });
  assert("preview apply lists sequential-thinking", preview.items.some((i) => i.id === "sequential-thinking"));
  assert("preview apply has targets", preview.targets.includes("claude"));

  const minimalPath = join(dir, "minimal.loadout.json");
  writeFileSync(minimalPath, JSON.stringify({ items: ["memory"] }));
  const minDir = mkdtempSync(join(tmpdir(), "loadout-manifest-min-"));
  try {
    const { receipts: minReceipts } = applyManifest(catalog, minimalPath, minDir);
    const minReceipt = minReceipts.find((r) => r.type === "claude")?.receipt;
    assert("minimal string[] manifest applies memory", minReceipt?.mcp?.includes("memory"));
    const applyJson = JSON.parse(JSON.stringify({ receipts: minReceipts, skipped: [] }));
    assert("apply receipts serialize to JSON", applyJson.receipts.some((r) => r.type === "claude"));
  } finally {
    rmSync(minDir, { recursive: true, force: true });
  }

  const idsDir = mkdtempSync(join(tmpdir(), "loadout-manifest-ids-"));
  try {
    const preview = previewItemsApply(catalog, ["sequential-thinking", "not-a-real-id"], { targets: ["claude"] });
    assert("preview --ids lists sequential-thinking", preview.items.some((i) => i.id === "sequential-thinking"));
    assert("preview --ids skips unknown id", preview.skipped.some((s) => s.includes("not-a-real-id")));
    const { receipts: idReceipts, skipped: idSkipped } = applyItems(catalog, ["memory"], idsDir, { targets: ["claude"] });
    assert("apply --ids writes memory", idReceipts.find((r) => r.type === "claude")?.receipt?.mcp?.includes("memory"));
    assert("apply --ids has no skips for known id", idSkipped.length === 0);
  } finally {
    rmSync(idsDir, { recursive: true, force: true });
  }

  const sugDir = mkdtempSync(join(tmpdir(), "loadout-manifest-sug-"));
  try {
    writeFileSync(join(sugDir, "package.json"), JSON.stringify({ dependencies: { react: "18", next: "14" } }));
    const signals = new Set(["always", "package.json", "react", "next", ".git"]);
    const sugIds = recommend(catalog, signals, sugDir).items.slice(0, 5).map((e) => e.item.id);
    assert("suggestions include playwright for react/next", sugIds.includes("playwright"));
    const { receipts: sugReceipts } = applyItems(catalog, sugIds.filter((id) => id === "playwright"), sugDir);
    assert("apply --suggestions path writes playwright", sugReceipts.find((r) => r.type === "claude")?.receipt?.mcp?.includes("playwright"));
  } finally {
    rmSync(sugDir, { recursive: true, force: true });
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (failed) process.exit(1);
console.log("\nAll manifest export/apply checks passed.");
