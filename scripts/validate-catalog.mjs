#!/usr/bin/env node
// Validates the catalog: unique ids, required fields per kind, and that every
// domain loadout references an item that actually exists. Exits non-zero on any error.
import { loadCatalog } from "../cli/lib/catalog.mjs";

const errors = [];
const warn = [];
const { domains, byId, all, ecosystem, community } = loadCatalog();

// unique ids
const ids = new Map();
for (const item of all) {
  if (!item.id) errors.push(`item with no id: ${JSON.stringify(item).slice(0, 60)}`);
  if (ids.has(item.id)) errors.push(`duplicate id: ${item.id}`);
  ids.set(item.id, item);
}

// required fields
const need = (item, field) => {
  if (item[field] === undefined) errors.push(`${item.id}: missing "${field}"`);
};
for (const item of all) {
  ["id", "type", "name", "description", "domains", "signals"].forEach((f) => need(item, f));
  if (item.type === "mcp") need(item, "config");
  if (item.type === "hook" || item.type === "setting") need(item, "settings");
  if (item.type === "skill" || item.type === "reference") need(item, "install");
  if (Array.isArray(item.domains) && item.domains.length === 0) warn.push(`${item.id}: no domains`);
  // Curated MCP/skills must link a verifiable source (hooks are local snippets).
  const tier = item.tier || "curated";
  if (tier === "curated" && item.type !== "hook" && item.type !== "setting" && !item.homepage) {
    warn.push(`${item.id}: curated item missing homepage`);
  }
}

// domain integrity
const domainIds = new Set(domains.map((d) => d.id));
for (const item of all) {
  for (const d of item.domains || []) {
    if (!domainIds.has(d)) warn.push(`${item.id}: references unknown domain "${d}"`);
  }
}
for (const d of domains) {
  ["id", "title", "signals", "loadout"].forEach((f) => {
    if (d[f] === undefined) errors.push(`domain ${d.id || "?"}: missing "${f}"`);
  });
  for (const id of d.loadout || []) {
    if (!byId.has(id)) errors.push(`domain ${d.id}: loadout references missing item "${id}"`);
  }
}

for (const w of warn) console.log(`⚠  ${w}`);
if (errors.length) {
  console.error(`\n❌ ${errors.length} error(s):`);
  errors.forEach((e) => console.error(`   ${e}`));
  process.exit(1);
}
const curatedN = all.length - ecosystem.length - community.length;
console.log(`\n✅ catalog OK — ${all.length} items (${curatedN} curated + ${ecosystem.length} official + ${community.length} community) across ${domains.length} domains, ${warn.length} warning(s).`);
