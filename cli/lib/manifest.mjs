import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { scanProject } from "./scan.mjs";
import { recommend } from "./recommend.mjs";
import { apply } from "./apply.mjs";

// Build a shareable team loadout manifest from the current project profile.
export function buildManifest(catalog, root = process.cwd(), opts = {}) {
  const signals = scanProject(root);
  const { domains, items } = recommend(catalog, signals, root, opts);
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    domains: domains.map((d) => ({ id: d.id, title: d.title })),
    items: items.slice(0, 12).map(({ item, reason }) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      tier: item.tier || "curated",
      reason,
    })),
  };
}

export function writeManifest(manifest, outPath) {
  writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n");
}

export function readManifestIds(path) {
  if (!existsSync(path)) throw new Error(`loadout file not found: ${path}`);
  let doc;
  try {
    doc = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw new Error(`invalid JSON in loadout file: ${path}`);
  }
  if (!Array.isArray(doc.items) || !doc.items.length) {
    throw new Error("loadout file has no items — expected { items: [{ id, ... }, ...] }");
  }
  return doc.items.map((i) => (typeof i === "string" ? i : i.id)).filter(Boolean);
}

export function resolveManifestItems(catalog, ids) {
  const items = [];
  const skipped = [];
  for (const id of ids) {
    const item = catalog.byId.get(id);
    if (!item) {
      skipped.push(`${id} (unknown id)`);
      continue;
    }
    if (item.tier === "community") {
      skipped.push(`${id} (community — install manually)`);
      continue;
    }
    items.push(item);
  }
  return { items, skipped };
}

export function applyManifest(catalog, manifestPath, root = process.cwd()) {
  const ids = readManifestIds(manifestPath);
  const { items, skipped } = resolveManifestItems(catalog, ids);
  const receipt = apply(items, root);
  return { receipt, skipped, manifestPath: resolve(manifestPath) };
}
