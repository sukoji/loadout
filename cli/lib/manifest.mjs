import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { scanProject } from "./scan.mjs";
import { recommend } from "./recommend.mjs";
import { apply } from "./apply.mjs";
import { applyToTarget, TARGETS } from "./targets.mjs";

// Build a shareable team loadout manifest from the current project profile.
export function buildManifest(catalog, root = process.cwd(), opts = {}) {
  const signals = scanProject(root);
  const { domains, items, installed } = recommend(catalog, signals, root, opts);
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    ...buildRecommendPreview(signals, domains, items, [], installed, opts),
  };
}

export function buildRecommendPreview(signals, domains, items, community, installed, opts = {}) {
  const limit = opts.limit ?? 12;
  return {
    signals: [...signals].filter((s) => s !== "always").sort(),
    domains: domains.map((d) => ({ id: d.id, title: d.title })),
    installed: [...installed],
    items: items.slice(0, limit).map(({ item, reason }) => serializeItem(item, reason)),
    community: community.map(({ item }) => serializeItem(item)),
  };
}

function serializeItem(item, reason) {
  const placeholders = item.config
    ? (JSON.stringify(item.config).match(/<your-[^>]+>/g) || [])
    : [];
  const out = {
    id: item.id,
    name: item.name,
    type: item.type,
    tier: item.tier || "curated",
  };
  if (reason) out.reason = reason;
  if (item.homepage) out.homepage = item.homepage;
  if (item.auth) out.auth = true;
  if (placeholders.length) out.needsTokens = [...new Set(placeholders)];
  return out;
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

export function previewItemsApply(catalog, ids, opts = {}) {
  const { items, skipped } = resolveManifestItems(catalog, ids);
  const targets = normalizeTargets(opts.targets);
  return {
    ids,
    manifest: opts.manifestPath ? resolve(opts.manifestPath) : null,
    targets,
    items: items.map((i) => ({ id: i.id, name: i.name, type: i.type, tier: i.tier || "curated" })),
    skipped,
    claudeOnly: items.filter((i) => i.type !== "mcp").map((i) => i.id),
  };
}

export function previewManifestApply(catalog, manifestPath, opts = {}) {
  return previewItemsApply(catalog, readManifestIds(manifestPath), { ...opts, manifestPath });
}

export function applyItems(catalog, ids, root = process.cwd(), opts = {}) {
  const { items, skipped } = resolveManifestItems(catalog, ids);
  const targets = normalizeTargets(opts.targets);
  const receipts = [];
  const mcpItems = items.filter((i) => i.type === "mcp");
  const claudeNative = items.filter((i) => i.type !== "mcp");

  for (const t of targets) {
    if (t === "claude") {
      receipts.push({ type: "claude", receipt: apply(items, root) });
    } else {
      receipts.push({ type: "target", target: t, receipt: applyToTarget(t, mcpItems, root) });
    }
  }

  if (claudeNative.length && !targets.includes("claude")) {
    const skills = claudeNative.filter((i) => i.type === "skill" || i.type === "reference");
    if (skills.length) receipts.push({ type: "commands", receipt: apply(skills, root) });
    for (const item of claudeNative.filter((i) => i.type === "hook" || i.type === "setting")) {
      skipped.push(`${item.id} (Claude Code-only — add --target claude to apply hooks)`);
    }
  }

  return {
    receipts,
    skipped,
    ids,
    manifestPath: opts.manifestPath ? resolve(opts.manifestPath) : null,
  };
}

export function applyManifest(catalog, manifestPath, root = process.cwd(), opts = {}) {
  return applyItems(catalog, readManifestIds(manifestPath), root, { ...opts, manifestPath });
}

function normalizeTargets(targets) {
  if (!targets?.length) return ["claude"];
  const ids = targets.map((s) => String(s).trim().toLowerCase()).filter(Boolean);
  if (ids.includes("all")) return Object.keys(TARGETS);
  return [...new Set(ids)];
}
