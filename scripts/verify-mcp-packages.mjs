#!/usr/bin/env node
// Accuracy gate: confirm every npx-based MCP server in the catalog points at a real, published
// npm package (a wrong install command is worse than no entry, since Loadout *applies* it).
// stdio-via-uvx and HTTP servers are reported as "manual" — verify those against their homepage.
import { execSync } from "node:child_process";
import { loadCatalog } from "../cli/lib/catalog.mjs";

const { mcp } = loadCatalog();
let bad = 0;

for (const e of mcp) {
  const cfg = e.config || {};
  if (cfg.type === "http" || cfg.url) {
    console.log(`  ~  ${e.id.padEnd(18)} HTTP endpoint (verify: ${cfg.url})`);
    continue;
  }
  if (cfg.command !== "npx") {
    console.log(`  ~  ${e.id.padEnd(18)} ${cfg.command} (not npm — verify at ${e.homepage})`);
    continue;
  }
  const pkg = (cfg.args || []).find((a) => !a.startsWith("-"));
  if (!pkg) {
    console.log(`  ?  ${e.id.padEnd(18)} could not parse package from args`);
    continue;
  }
  try {
    const v = execSync(`npm view ${pkg} version`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    console.log(`  ✅ ${e.id.padEnd(18)} ${pkg} @ ${v}`);
  } catch {
    console.log(`  ❌ ${e.id.padEnd(18)} ${pkg} — NOT FOUND on npm`);
    bad++;
  }
}

if (bad) {
  console.error(`\n❌ ${bad} MCP package(s) do not resolve on npm.`);
  process.exit(1);
}
console.log(`\n✅ all npx MCP packages resolve on npm.`);
