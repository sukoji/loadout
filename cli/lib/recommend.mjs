import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// Signals too broad to justify a Tier-2 official plugin on their own.
const WEAK_OFFICIAL_SIGNALS = new Set([
  "python",
  "package.json",
  ".git",
  "docs",
  "javascript",
  "typescript",
  "always",
]);

const MAX_OFFICIAL_IN_RESULTS = 2;
const RESULT_POOL_SIZE = 16;

// Score domains against project signals and build a ranked, de-duplicated loadout.
// Tier 1 (curated) recs come from domain loadouts; Tier 2 (official) enter by signal match;
// Tier 3 (community) surface only when opts.discover is set, and are never auto-applied.
export function recommend({ domains, byId, all = [] }, signals, root = process.cwd(), opts = {}) {
  const installed = detectInstalled(root);

  const scored = domains
    .map((d) => {
      const matched = d.signals.filter((s) => s !== "always" && signals.has(s.toLowerCase()));
      const isGeneral = d.signals.includes("always");
      return { domain: d, score: matched.length, isGeneral, matched };
    })
    .filter((s) => s.score > 0 || s.isGeneral)
    .sort((a, b) => b.score - a.score);

  // top 2 signal-matched domains + always keep general
  const chosen = [];
  for (const s of scored) {
    if (s.isGeneral) continue;
    if (chosen.length < 2) chosen.push(s);
  }
  const general = scored.find((s) => s.isGeneral);
  if (general) chosen.push(general);

  const seen = new Set();
  const items = [];
  for (const { domain } of chosen) {
    for (const id of domain.loadout) {
      if (seen.has(id)) continue;
      seen.add(id);
      const item = byId.get(id);
      if (!item) continue;
      if (installed.has(id)) continue;
      const strength = item.signals.filter((s) => s !== "always" && signals.has(s.toLowerCase())).length;
      const alwaysUseful = item.signals.includes("always");
      items.push({
        item,
        domain: domain.id,
        strength,
        alwaysUseful,
        reason: reasonFor(item, domain, signals),
      });
    }
  }

  // Tier 2: official-marketplace plugins — only when signals are specific enough.
  for (const item of all) {
    if (item.tier !== "official") continue;
    if (seen.has(item.id) || installed.has(item.id)) continue;
    const matched = item.signals.filter((s) => s !== "always" && signals.has(s.toLowerCase()));
    if (!officialSignalMatch(matched)) continue;
    seen.add(item.id);
    items.push({
      item,
      domain: item.domains[0],
      strength: matched.length,
      alwaysUseful: false,
      reason: `matches ${matched.slice(0, 3).join(", ")}`,
    });
  }

  items.sort(rankEntries);
  const finalized = capOfficialTier(items, RESULT_POOL_SIZE);

  const community = opts.discover
    ? all
        .filter((i) => i.tier === "community" && !installed.has(i.id))
        .map((item) => ({ item, reason: "community · unverified — review before installing" }))
    : [];

  return {
    domains: chosen.map((c) => c.domain),
    items: finalized,
    community,
    installed: [...installed],
  };
}

function officialSignalMatch(matched) {
  if (!matched.length) return false;
  const strong = matched.filter((s) => !WEAK_OFFICIAL_SIGNALS.has(s.toLowerCase()));
  if (strong.length > 0) return true;
  return matched.length >= 2;
}

function rankEntries(a, b) {
  const tierA = a.item.tier === "curated" ? 100 : 0;
  const tierB = b.item.tier === "curated" ? 100 : 0;
  const scoreA = a.strength + tierA + Number(a.alwaysUseful);
  const scoreB = b.strength + tierB + Number(b.alwaysUseful);
  return scoreB - scoreA;
}

function capOfficialTier(items, limit) {
  const out = [];
  let officialCount = 0;
  for (const entry of items) {
    if (entry.item.tier === "official") {
      if (officialCount >= MAX_OFFICIAL_IN_RESULTS) continue;
      officialCount++;
    }
    out.push(entry);
    if (out.length >= limit) break;
  }
  return out;
}

function reasonFor(item, domain, signals) {
  const hits = item.signals.filter((s) => s !== "always" && signals.has(s.toLowerCase()));
  if (hits.length) return `matches ${hits.slice(0, 3).join(", ")}`;
  if (item.signals.includes("always")) return `broadly useful (${domain.title})`;
  return `fits ${domain.title}`;
}

function detectInstalled(root) {
  const installed = new Set();

  const mcpPath = resolve(root, ".mcp.json");
  if (existsSync(mcpPath)) {
    try {
      const mcp = JSON.parse(readFileSync(mcpPath, "utf8"));
      for (const key of Object.keys(mcp.mcpServers || {})) installed.add(key);
    } catch {
      /* ignore */
    }
  }

  const settingsPath = resolve(root, ".claude", "settings.json");
  if (existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(readFileSync(settingsPath, "utf8"));
      const blob = JSON.stringify(settings).toLowerCase();
      if (settings.statusLine) installed.add("statusline-git");
      if (blob.includes("prettier")) installed.add("format-js-on-edit");
      if (blob.includes("ruff")) installed.add("lint-python-on-edit");
      if (blob.includes("dangerous") || blob.includes("mkfs")) installed.add("guard-dangerous-bash");
      if (blob.includes("secret") || blob.includes("refusing to read")) installed.add("protect-secrets");
      if (blob.includes("waiting for you")) installed.add("notify-on-stop");
    } catch {
      /* ignore */
    }
  }

  return installed;
}
