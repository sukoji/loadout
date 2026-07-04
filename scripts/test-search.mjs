#!/usr/bin/env node
import { loadCatalog } from "../cli/lib/catalog.mjs";
import { searchCatalog } from "../cli/lib/search.mjs";

const { all } = loadCatalog();
let failed = 0;

function assert(name, cond, detail = "") {
  if (!cond) {
    console.error(`❌ ${name}${detail ? `: ${detail}` : ""}`);
    failed++;
  } else {
    console.log(`✅ ${name}`);
  }
}

const pw = searchCatalog(all, "playwright");
assert("search playwright finds playwright", pw.some((h) => h.item.id === "playwright"));

const research = searchCatalog(all, "research");
assert("search research finds exa-research", research.some((h) => h.item.id === "exa-research"));
assert("search research finds tavily-research", research.some((h) => h.item.id === "tavily-research"));

const skillsOnly = searchCatalog(all, "research", { type: "skill" });
assert("search --type skill excludes mcp", skillsOnly.every((h) => h.item.type === "skill" || h.item.type === "reference"));
assert("search --type skill still finds exa-research", skillsOnly.some((h) => h.item.id === "exa-research"));

const mcpOnly = searchCatalog(all, "playwright", { type: "mcp" });
assert("search --type mcp finds playwright", mcpOnly.some((h) => h.item.id === "playwright"));

const empty = searchCatalog(all, "zzzz-not-a-real-catalog-term-zzzz");
assert("search miss returns empty", empty.length === 0);

const limited = searchCatalog(all, "a", { limit: 3 });
assert("search --limit caps results", limited.length <= 3);

const json = JSON.parse(JSON.stringify(pw.slice(0, 5).map(({ item, score }) => ({ id: item.id, score }))));
assert("search results serialize", json[0].id && typeof json[0].score === "number");

if (failed) process.exit(1);
console.log("\nAll search checks passed.");
