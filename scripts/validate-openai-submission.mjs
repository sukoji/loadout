#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const pluginRoot = path("plugins/loadout");
const listing = readJson("submission/openai/listing.json");
const claudeManifest = readJson("plugins/loadout/.claude-plugin/plugin.json");
const codexManifest = readJson("plugins/loadout/.codex-plugin/plugin.json");
const errors = [];

if (listing.submissionType !== "Skills only") errors.push("submissionType must be Skills only");
if (listing.positiveTestCases?.length !== 5) errors.push("exactly five positive test cases are required");
if (listing.negativeTestCases?.length !== 3) errors.push("exactly three negative test cases are required");
if (!listing.ownerActions?.length) errors.push("publisher-only portal actions must be documented");
for (const key of ["pluginName", "category", "shortDescription", "longDescription", "websiteUrl", "supportUrl", "privacyPolicyUrl", "termsUrl", "releaseNotes"]) {
  if (!listing[key]?.trim()) errors.push(`listing.${key} is required`);
}

for (const relative of ["PRIVACY.md", "TERMS.md", "SUPPORT.md", listing.logoPath]) {
  if (!relative || !existsSync(path(relative))) errors.push(`missing submission material: ${relative}`);
}
if (listing.logoPath && existsSync(path(listing.logoPath))) {
  const logo = readFileSync(path(listing.logoPath));
  const isPng = logo.subarray(1, 4).toString("ascii") === "PNG";
  const width = isPng ? logo.readUInt32BE(16) : 0;
  const height = isPng ? logo.readUInt32BE(20) : 0;
  if (!isPng || width !== 512 || height !== 512) errors.push("listing logo must be a 512×512 PNG");
}

if (!claudeManifest.description?.trim()) errors.push("Claude manifest needs a nonempty description for direct upload");
if (claudeManifest.name !== codexManifest.name) errors.push("Claude and Codex manifest names differ");
if (claudeManifest.version !== codexManifest.version) errors.push("Claude and Codex manifest versions differ");

const skillsDir = join(pluginRoot, "skills");
const skills = readdirSync(skillsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory());
if (!skills.length) errors.push("at least one skill is required");
for (const skill of skills) {
  const skillPath = join(skillsDir, skill.name, "SKILL.md");
  if (!existsSync(skillPath)) {
    errors.push(`${skill.name}: missing SKILL.md`);
    continue;
  }
  const text = readFileSync(skillPath, "utf8");
  if (!/^name:\s*\S+/m.test(text)) errors.push(`${skill.name}: missing name frontmatter`);
  if (!/^description:\s*\S+/m.test(text)) errors.push(`${skill.name}: missing description frontmatter`);
  if (/^allowed-tools:/m.test(text)) errors.push(`${skill.name}: remove host-specific allowed-tools frontmatter`);
  if (/AskUserQuestion/.test(text)) errors.push(`${skill.name}: remove host-specific AskUserQuestion references`);
  if (/\$\{user_config\./.test(text)) errors.push(`${skill.name}: userConfig variables are unsupported`);
}

if (errors.length) {
  errors.forEach((error) => console.error(`❌ ${error}`));
  process.exit(1);
}

console.log(`✅ OpenAI submission materials OK (${skills.length} skills; 5 positive + 3 negative tests)`);

function path(relative) {
  return join(root, relative);
}

function readJson(relative) {
  return JSON.parse(readFileSync(path(relative), "utf8"));
}
