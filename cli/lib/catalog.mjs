import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
// cli/lib -> repo root -> plugins/loadout/catalog (bundled in the npm package too)
const CATALOG_DIR = resolve(here, "..", "..", "plugins", "loadout", "catalog");

function load(name) {
  return JSON.parse(readFileSync(resolve(CATALOG_DIR, name), "utf8"));
}

export function loadCatalog() {
  const mcp = load("mcp.json");
  const skills = load("skills.json");
  const hooks = load("hooks.json");
  const domains = load("domains.json");
  const byId = new Map();
  for (const item of [...mcp, ...skills, ...hooks]) byId.set(item.id, item);
  return { mcp, skills, hooks, domains, byId };
}
