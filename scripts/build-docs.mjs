#!/usr/bin/env node
// Regenerates the browsable per-domain catalog pages under docs/domains/ from the
// canonical catalog JSON, plus a domains index. Keeps the human-readable "list"
// side of the repo in sync with the data the recommender actually uses.
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { loadCatalog } from "../cli/lib/catalog.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, "..", "docs", "domains");
mkdirSync(OUT, { recursive: true });

const { domains, byId } = loadCatalog();
const KIND = { mcp: "MCP servers", hook: "Hooks & settings", setting: "Hooks & settings", skill: "Skills", reference: "Reference" };
const ORDER = ["mcp", "hook", "setting", "skill", "reference"];

function itemLine(item) {
  const auth = item.auth ? " · 🔑 needs auth" : "";
  const home = item.homepage ? ` — [source](${item.homepage})` : "";
  return `- **${item.name}** — ${item.description}${home}${auth}`;
}

const indexRows = [];
for (const d of domains) {
  const groups = new Map();
  for (const id of d.loadout) {
    const item = byId.get(id);
    if (!item) continue;
    const key = item.type === "setting" ? "hook" : item.type;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  let md = `# ${d.title}\n\n> ${d.blurb || ""}\n\n`;
  md += `_Signals that map here: ${d.signals.filter((s) => s !== "always").map((s) => "\`" + s + "\`").join(", ") || "baseline (always)"}_\n\n`;
  for (const kind of ORDER) {
    const list = groups.get(kind);
    if (!list || !list.length) continue;
    md += `## ${KIND[kind]}\n\n${list.map(itemLine).join("\n")}\n\n`;
  }
  md += `---\n\nApply this loadout to your repo automatically with \`/loadout:recommend\` in Claude Code, or \`npx claude-loadout\` in the project folder.\n`;
  writeFileSync(resolve(OUT, `${d.id}.md`), md);
  indexRows.push(`| [${d.title}](${d.id}.md) | ${d.blurb || ""} | ${d.loadout.length} |`);
}

const index =
  `# Loadout catalog — by domain\n\n` +
  `Curated Claude Code extensions, organized by the kind of project you're working on.\n` +
  `Generated from the canonical catalog — do not edit by hand (run \`npm run build:docs\`).\n\n` +
  `| Domain | For | Items |\n| :-- | :-- | :-- |\n${indexRows.join("\n")}\n`;
writeFileSync(resolve(OUT, "README.md"), index);

console.log(`✅ built ${domains.length} domain pages + index in docs/domains/`);
