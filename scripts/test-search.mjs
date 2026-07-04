#!/usr/bin/env node
import { loadCatalog } from "../cli/lib/catalog.mjs";

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

function search(query) {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  return all
    .map((item) => {
      const hay = [
        item.id,
        item.name,
        item.description,
        item.tier,
        item.type,
        ...(item.domains || []),
        ...(item.signals || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const score = tokens.reduce((n, t) => n + (hay.includes(t) ? (item.id === t || item.id.includes(t) ? 3 : 1) : 0), 0);
      return { item, score };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id));
}

const pw = search("playwright");
assert("search playwright finds playwright", pw.some((h) => h.item.id === "playwright"));

const research = search("research");
assert("search research finds exa-research", research.some((h) => h.item.id === "exa-research"));
assert("search research finds tavily-research", research.some((h) => h.item.id === "tavily-research"));

const empty = search("zzzz-not-a-real-catalog-term-zzzz");
assert("search miss returns empty", empty.length === 0);

const json = JSON.parse(JSON.stringify(pw.slice(0, 5).map(({ item, score }) => ({ id: item.id, score }))));
assert("search results serialize", json[0].id && typeof json[0].score === "number");

if (failed) process.exit(1);
console.log("\nAll search checks passed.");
