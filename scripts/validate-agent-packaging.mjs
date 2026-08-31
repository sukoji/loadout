#!/usr/bin/env node
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const pkg = readJson("package.json");
const claude = readJson("plugins/loadout/.claude-plugin/plugin.json");
const codex = readJson("plugins/loadout/.codex-plugin/plugin.json");
const marketplace = readJson(".claude-plugin/marketplace.json");
const errors = [];

for (const [label, manifest] of [["Claude", claude], ["Codex", codex]]) {
  if (manifest.name !== "loadout") errors.push(`${label} manifest name must be loadout`);
  if (manifest.version !== pkg.version) errors.push(`${label} manifest version ${manifest.version} != package ${pkg.version}`);
}
if (marketplace.plugins?.[0]?.version !== pkg.version) errors.push("Claude marketplace version is out of sync");
if (codex.skills !== "./skills/") errors.push("Codex manifest must expose ./skills/");

for (const skillName of readdirSync(filePath("plugins/loadout/skills"))) {
  const text = readFileSync(join(filePath("plugins/loadout/skills"), skillName, "SKILL.md"), "utf8");
  if (!/^---\s*[\s\S]*?^name:\s*\S+/m.test(text)) errors.push(`${skillName}: missing name frontmatter`);
  if (!/^description:\s*\S+/m.test(text)) errors.push(`${skillName}: missing description frontmatter`);
}

if (errors.length) {
  errors.forEach((error) => console.error(`❌ ${error}`));
  process.exit(1);
}
console.log(`✅ agent packaging OK (${pkg.version}; Claude + Codex)`);

function filePath(relative) {
  return join(root, relative);
}

function readJson(relative) {
  return JSON.parse(readFileSync(filePath(relative), "utf8"));
}
