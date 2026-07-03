#!/usr/bin/env node
// Tier 2 ingestion: pull Anthropic's official plugin marketplace (a trusted, vetted source) and
// transform its entries into Loadout catalog candidates in plugins/loadout/catalog/ecosystem.json.
// These are surfaced by signal match (or via `--discover`) and installed with /plugin — never
// auto-written to config. Curated entries (Tier 1) always win on id collisions.
//
// Run: node scripts/ingest-official.mjs   (needs network)
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { loadCatalog } from "../cli/lib/catalog.mjs";

const SRC = "https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/.claude-plugin/marketplace.json";
const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, "..", "plugins", "loadout", "catalog", "ecosystem.json");

const CATEGORY_DOMAINS = {
  security: ["security"],
  design: ["frontend"],
  development: ["general"],
  productivity: ["general"],
  database: ["backend-api", "data-ml"],
  location: ["general"],
  monitoring: ["devops"],
  migration: ["backend-api", "devops"],
  deployment: ["devops"],
  learning: ["docs-writing"],
  math: ["data-ml"],
  testing: ["frontend", "general"],
  automation: ["devops", "general"],
};

// tech tokens to look for in name+description → signals that align with what scan.mjs detects
const TOKEN_SIGNAL = {
  react: "react", "next.js": "next", nextjs: "next", vue: "vue", svelte: "svelte", angular: "angular",
  tailwind: "tailwind", vite: "vite", express: "express", nestjs: "nestjs", django: "django",
  flask: "flask", fastapi: "fastapi", spring: "spring", golang: "go.mod", " go ": "go.mod",
  rust: "Cargo.toml", kotlin: "kotlin", swift: "swift", flutter: "pubspec.yaml", expo: "expo",
  "react native": "react-native", python: "python", graphql: "graphql", prisma: "prisma",
  drizzle: "drizzle", postgres: "postgres", postgresql: "postgres", mysql: "mysql", mongodb: "mongodb",
  mongo: "mongodb", redis: "redis", supabase: "supabase", firebase: "firebase", docker: "dockerfile",
  kubernetes: "k8s", terraform: "terraform", github: ".github", gitlab: "gitlab", jira: "jira",
  linear: "linear", notion: "notion", slack: "slack", stripe: "stripe", paypal: "payment",
  twilio: "twilio", sentry: "sentry", datadog: "datadog", playwright: "playwright", cypress: "cypress",
  jest: "jest", figma: "figma", shopify: "shopify", wordpress: "wordpress", salesforce: "salesforce",
  elasticsearch: "elasticsearch", kafka: "kafka", snowflake: "snowflake", bigquery: "bigquery",
  openai: "openai", langchain: "langchain", pytorch: "torch", tensorflow: "tensorflow",
};

function deriveSignals(text) {
  const t = ` ${text.toLowerCase()} `;
  const out = new Set();
  for (const [tok, sig] of Object.entries(TOKEN_SIGNAL)) {
    if (t.includes(tok)) out.add(sig);
  }
  return [...out];
}

const res = await fetch(SRC);
if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
const mp = await res.json();

const { byId } = loadCatalog();
const curated = new Set(byId.keys());

const seen = new Set();
const entries = [];
let skipped = 0;

for (const p of mp.plugins || []) {
  const id = p.name;
  if (!id) continue;
  if (curated.has(id) || seen.has(id)) { skipped++; continue; } // Tier 1 wins
  seen.add(id);
  entries.push({
    id,
    tier: "official",
    type: "skill",
    name: p.displayName || p.name,
    description: (p.description || "").trim() || `Official Claude Code plugin (${p.category || "general"}).`,
    domains: CATEGORY_DOMAINS[p.category] || ["general"],
    signals: deriveSignals(`${p.name} ${p.description || ""}`),
    official: true,
    category: p.category || null,
    homepage: p.homepage || `https://github.com/anthropics/claude-plugins-official`,
    install: {
      type: "plugin",
      marketplace: "claude-plugins-official",
      plugin: id,
      commands: [`/plugin install ${id}@claude-plugins-official`],
    },
  });
}

writeFileSync(OUT, JSON.stringify(entries, null, 2) + "\n");
console.log(`✅ ingested ${entries.length} official plugins → catalog/ecosystem.json (${skipped} skipped as duplicates of curated)`);
