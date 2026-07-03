import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
// cli/lib -> repo root -> plugins/loadout/catalog (bundled in the npm package too)
const CATALOG_DIR = resolve(here, "..", "..", "plugins", "loadout", "catalog");

function load(name) {
  return JSON.parse(readFileSync(resolve(CATALOG_DIR, name), "utf8"));
}
function loadOpt(name) {
  try {
    return load(name);
  } catch {
    return [];
  }
}

export function loadCatalog() {
  // Tier 1 (curated, hand-verified) — the hand-maintained files, no explicit tier field.
  const curated = [...load("mcp.json"), ...load("skills.json"), ...load("hooks.json")].map((i) => ({ tier: "curated", ...i }));
  const domains = load("domains.json");
  // Tier 2 (official marketplace) + Tier 3 (community) — generated / seeded, carry their own tier.
  const ecosystem = loadOpt("ecosystem.json"); // tier: "official"
  const community = loadOpt("community.json"); // tier: "community"

  const all = [...curated, ...ecosystem, ...community];
  const byId = new Map();
  for (const item of all) byId.set(item.id, item);

  // Back-compat views used by the recommender's domain-loadout logic (all Tier 1).
  const mcp = curated.filter((i) => i.type === "mcp");
  const skills = curated.filter((i) => i.type === "skill" || i.type === "reference");
  const hooks = curated.filter((i) => i.type === "hook" || i.type === "setting");
  return { mcp, skills, hooks, domains, ecosystem, community, all, byId };
}
