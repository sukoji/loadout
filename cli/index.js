#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { stdin, stdout, argv, cwd, exit } from "node:process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { loadCatalog } from "./lib/catalog.mjs";
import { scanProject } from "./lib/scan.mjs";
import { recommend } from "./lib/recommend.mjs";
import { apply } from "./lib/apply.mjs";
import { doctor, doctorFix, skillInstallGuide, isAutoApplyType, summarizeDoctor } from "./lib/doctor.mjs";
import { buildManifest, writeManifest, applyManifest, applyItems, readManifestIds, buildRecommendPreview, previewManifestApply, previewItemsApply } from "./lib/manifest.mjs";
import { applyToTarget, listTargets, detectTargets, TARGETS } from "./lib/targets.mjs";
import { searchCatalog } from "./lib/search.mjs";

const PKG_VERSION = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "package.json"), "utf8"),
).version;

const C = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  cyan: "\x1b[36m", green: "\x1b[32m", yellow: "\x1b[33m", magenta: "\x1b[35m", red: "\x1b[31m",
};
const c = (color, s) => `${C[color]}${s}${C.reset}`;
const KIND_LABEL = { mcp: "MCP server", hook: "Hook/setting", setting: "Hook/setting", skill: "Skill", reference: "Reference" };

async function main() {
  const args = argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith("-")));
  const positional = args.filter((a) => !a.startsWith("-"));

  if (flags.has("--help") || flags.has("-h")) return printHelp();
  if (flags.has("--version") || flags.has("-V")) return console.log(PKG_VERSION);
  if (positional[0] === "doctor") return runDoctor(flags);
  if (positional[0] === "domains") return runDomains(positional[1], flags);
  if (positional[0] === "show") return runShow(positional[1], flags);
  if (positional[0] === "search") return runSearch(args, flags);
  if (positional[0] === "stats") return runStats(flags);
  if (positional[0] === "signals") return runSignals(flags);
  if (positional[0] === "export") return runExport(args, flags);
  if (positional[0] === "apply") return runApplyManifest(args, flags);

  const dryRun = flags.has("--dry-run") || flags.has("-d");
  const takeAll = flags.has("--all") || flags.has("-a") || flags.has("--yes") || flags.has("-y");

  if (flags.has("--list-targets")) return printTargets();

  const targets = parseTargets(args);
  const invalid = targets.filter((t) => !TARGETS[t]);
  if (invalid.length) {
    console.error(c("yellow", `Unknown target(s): ${invalid.join(", ")}`) + c("dim", "  (run --list-targets)"));
    exit(1);
  }
  // Skills and hooks are Claude-Code-native; other agents only take MCP servers.
  const mcpOnly = !targets.includes("claude");

  const catalog = loadCatalog();
  const root = cwd();
  const asJson = flags.has("--json");

  const discover = flags.has("--discover");
  const signals = scanProject(root);
  let { domains, items, community, installed } = recommend(catalog, signals, root, { discover });
  if (mcpOnly) {
    items = items.filter((e) => e.item.type === "mcp");
    community = [];
  }

  if (asJson && !takeAll) {
    console.log(JSON.stringify(buildRecommendPreview(signals, domains, items, community, installed), null, 2));
    return;
  }

  if (!asJson) {
    const targetLabels = targets.map((t) => TARGETS[t].label).join(", ");
    console.log(c("bold", "\n🎯 Loadout") + c("dim", `  — gearing up ${targetLabels} for this project\n`));
    console.log(c("dim", "Detected: ") + describeSignals(signals));
    console.log(c("dim", "Best-fit domains: ") + domains.map((d) => c("magenta", d.title)).join(c("dim", ", ")));
    const detected = detectTargets(root).filter((t) => !targets.includes(t));
    if (detected.length) console.log(c("dim", `Also configured here: ${detected.map((t) => TARGETS[t].label).join(", ")} (target them with --target)`));
    if (installed.length) console.log(c("dim", `Already configured (skipped): ${installed.join(", ")}`));
    if (mcpOnly) console.log(c("dim", "Non-Claude target → showing MCP servers only (skills/hooks are Claude Code-native)."));
    console.log("");

    if (!items.length) {
      console.log(c("green", "You're already well-equipped — nothing new to recommend. 🎉\n"));
      return;
    }

    const top = items.slice(0, 8);
    console.log(c("bold", "Recommended loadout:\n"));
    top.forEach((entry, i) => {
      const { item, reason } = entry;
      const n = c("cyan", String(i + 1).padStart(2));
      const tierTag = item.tier === "official" ? " · official marketplace" : "";
      const kind = c("dim", `[${KIND_LABEL[item.type]}${tierTag}]`);
      const needs = authLabel(item);
      console.log(`${n}  ${c("bold", item.name)} ${kind}${needs}`);
      console.log(`     ${item.description}`);
      console.log(c("dim", `     why: ${reason}`));
      if (item.homepage) console.log(c("dim", `     ↳ ${item.homepage}`));
      console.log("");
    });

    if (community.length) {
      console.log(c("yellow", "Discover — community skills") + c("dim", "  (unverified · review before installing):\n"));
      community.forEach(({ item }) => {
        console.log(`    ${c("bold", item.name)} ${c("dim", "[community]")}`);
        console.log(`      ${item.description}`);
        console.log(c("dim", `      ↳ ${item.homepage}`) + "\n");
      });
    } else if (!discover && !mcpOnly) {
      console.log(c("dim", "Tip: add --discover to also surface community skills (e.g. caveman token-saver).\n"));
    }
  }

  if (!items.length) {
    if (asJson && takeAll) console.log(JSON.stringify({ applied: [], targets, receipts: [] }, null, 2));
    return;
  }

  if (dryRun) {
    if (!asJson) console.log(c("dim", "Dry run — nothing written. Re-run without --dry-run to apply.\n"));
    return;
  }

  if (!stdin.isTTY && !takeAll) {
    console.log(
      c("yellow", "\nNon-interactive terminal detected.") +
        c("dim", " Pass --all to apply the recommended loadout, or --dry-run to preview only.\n")
    );
    return;
  }

  let picks;
  if (takeAll) {
    picks = items.slice(0, 8);
  } else {
    const rl = createInterface({ input: stdin, output: stdout });
    const answer = await rl.question(
      c("bold", "Install which? ") + c("dim", "numbers e.g. 1,3,4  ·  'a' = all  ·  Enter = skip: ")
    );
    rl.close();
    picks = parseSelection(answer, items.slice(0, 8));
  }

  if (!picks.length) {
    if (!asJson) console.log(c("dim", "\nNothing selected. Bye!\n"));
    return;
  }

  const picked = picks.map((p) => p.item);
  const receipts = [];
  for (const t of targets) {
    if (t === "claude") {
      const receipt = apply(picked, root);
      receipts.push({ type: "claude", receipt });
      if (!asJson) printReceipt(receipt);
    } else {
      const mcp = picked.filter((i) => i.type === "mcp");
      const receipt = applyToTarget(t, mcp, root);
      receipts.push({ type: "target", target: t, receipt });
      if (!asJson) printTargetReceipt(receipt);
    }
  }
  if (asJson) {
    console.log(JSON.stringify({ applied: picked.map((i) => i.id), targets, receipts }, null, 2));
  }
}

function parseTargets(args) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--target" || a === "-t") {
      const v = args[i + 1];
      if (v && !v.startsWith("-")) { out.push(...v.split(",")); i++; }
    } else if (a.startsWith("--target=")) {
      out.push(...a.slice("--target=".length).split(","));
    }
  }
  const ids = out.map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (ids.includes("all")) return Object.keys(TARGETS);
  return ids.length ? [...new Set(ids)] : ["claude"];
}

function printTargets() {
  console.log(c("bold", "\nSupported targets") + c("dim", "  (--target <id>, comma-separated, or 'all')\n"));
  for (const t of listTargets()) {
    const where = t.scope === "home" ? "~/" + t.file : t.file;
    console.log(`  ${c("cyan", t.id.padEnd(9))} ${c("bold", t.label.padEnd(13))} ${c("dim", where)}`);
  }
  console.log(c("dim", "\nMCP servers apply to every target. Skills & hooks are Claude Code-native.\n"));
}

function printHelp() {
  console.log(c("bold", "\n🎯 claude-loadout") + c("dim", " — project-aware agent setup\n"));
  console.log(c("bold", "Usage:\n"));
  console.log(`  ${c("cyan", "npx claude-loadout")}              Interactive recommend + apply (Claude Code)`);
  console.log(`  ${c("cyan", "npx claude-loadout doctor")}     Audit .mcp.json + hooks`);
  console.log(`  ${c("cyan", "npx claude-loadout doctor --fix")}  Apply MCP/hooks + print skill install steps`);
  console.log(`  ${c("cyan", "npx claude-loadout doctor --fix --mcp-only")}  Fix: MCP servers only`);
  console.log(`  ${c("cyan", "npx claude-loadout doctor --fix --hooks-only")}  Fix: hooks/settings only`);
  console.log(`  ${c("cyan", "npx claude-loadout doctor --fix --dry-run")}  Preview what --fix would apply`);
  console.log(`  ${c("cyan", "npx claude-loadout doctor --json")}  Machine-readable audit (exit 1 on fixes)`);
  console.log(`  ${c("cyan", "npx claude-loadout doctor --quiet")}  Warnings/fixes only (skip OK lines)`);
  console.log(`  ${c("cyan", "npx claude-loadout doctor --require-healthy")}  Exit 1 unless summary.healthy`);
  console.log(`  ${c("cyan", "npx claude-loadout domains")}    List catalog domains and loadout sizes`);
  console.log(`  ${c("cyan", "npx claude-loadout domains research")}  Show one domain's loadout`);
  console.log(`  ${c("cyan", "npx claude-loadout domains --json")}  Domains as JSON`);
  console.log(`  ${c("cyan", "npx claude-loadout show context7")}  Show one catalog entry`);
  console.log(`  ${c("cyan", "npx claude-loadout show context7 --json")}  Entry as JSON`);
  console.log(`  ${c("cyan", "npx claude-loadout search playwright")}  Search catalog by name/id/signal`);
  console.log(`  ${c("cyan", "npx claude-loadout search research --type skill")}  Filter search by type`);
  console.log(`  ${c("cyan", "npx claude-loadout search research --limit 5")}  Cap search results`);
  console.log(`  ${c("cyan", "npx claude-loadout search research --json")}  Search results as JSON`);
  console.log(`  ${c("cyan", "npx claude-loadout stats")}      Catalog counts (domains, tiers, types)`);
  console.log(`  ${c("cyan", "npx claude-loadout stats --json")}  Stats as JSON`);
  console.log(`  ${c("cyan", "npx claude-loadout signals")}    Detected project signals (debug recommend)`);
  console.log(`  ${c("cyan", "npx claude-loadout signals --json")}  Signals as JSON`);
  console.log(`  ${c("cyan", "npx claude-loadout export")}     Write team loadout → .loadout.json`);
  console.log(`  ${c("cyan", "npx claude-loadout export --json")}  Print manifest JSON to stdout`);
  console.log(`  ${c("cyan", "npx claude-loadout apply -f .loadout.json")}  Apply a shared loadout file`);
  console.log(`  ${c("cyan", "npx claude-loadout apply --ids playwright,context7")}  Apply specific catalog ids`);
  console.log(`  ${c("cyan", "npx claude-loadout apply --suggestions")}  Apply top doctor suggestions`);
  console.log(`  ${c("cyan", "npx claude-loadout apply --suggestions --mcp-only")}  Suggestions: MCP servers only`);
  console.log(`  ${c("cyan", "npx claude-loadout apply --suggestions --hooks-only")}  Suggestions: hooks/settings only`);
  console.log(`  ${c("cyan", "npx claude-loadout apply -f .loadout.json --dry-run --json")}  Preview apply as JSON`);
  console.log(`  ${c("cyan", "npx claude-loadout apply -f .loadout.json --json")}  Apply and print receipts as JSON`);
  console.log(`  ${c("cyan", "npx claude-loadout --dry-run")}  Show recommendations only`);
  console.log(`  ${c("cyan", "npx claude-loadout --json")}       Print recommendations as JSON (no write)`);
  console.log(`  ${c("cyan", "npx claude-loadout --all")}      Apply top recommendations without prompting`);
  console.log(`  ${c("cyan", "npx claude-loadout --all --json")} Apply top recommendations; print receipts as JSON`);
  console.log(`  ${c("cyan", "npx claude-loadout --discover")}  Also show unverified community skills`);
  console.log(`  ${c("cyan", "npx claude-loadout --target cursor")}  Write MCP config for Cursor`);
  console.log(`  ${c("cyan", "npx claude-loadout --list-targets")}   List supported agents\n`);
  console.log(c("bold", "What auto-applies vs what you run:\n"));
  console.log(`  ${c("green", "Auto-written")}   MCP entries → .mcp.json (or agent-specific MCP file)`);
  console.log(`  ${c("green", "Auto-written")}   Hooks/settings → .claude/settings.json`);
  console.log(`  ${c("yellow", "You run")}       Plugin skills → /plugin install … in Claude Code`);
  console.log(`  ${c("yellow", "You fill")}       API keys / OAuth when a server needs auth\n`);
  console.log(c("dim", "Docs: https://github.com/sukoji/loadout\n"));
}

function parseOutputPath(args, flags) {
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === "--output" || args[i] === "-o") && args[i + 1]) return args[i + 1];
    if (args[i].startsWith("--output=")) return args[i].slice("--output=".length);
  }
  return ".loadout.json";
}

function parseManifestPath(args) {
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === "--from" || args[i] === "-f") && args[i + 1]) return args[i + 1];
    if (args[i].startsWith("--from=")) return args[i].slice("--from=".length);
  }
  const positional = args.filter((a) => !a.startsWith("-"));
  if (positional[1] && !positional[1].startsWith("-")) return positional[1];
  return ".loadout.json";
}

function runExport(args, flags) {
  const root = cwd();
  const catalog = loadCatalog();
  const discover = flags.has("--discover");
  const outPath = resolve(root, parseOutputPath(args, flags));
  const manifest = buildManifest(catalog, root, { discover });
  if (flags.has("--json")) {
    console.log(JSON.stringify(manifest, null, 2));
    return;
  }
  writeManifest(manifest, outPath);
  console.log(c("bold", "\n📦 Loadout exported") + c("dim", `  → ${outPath}\n`));
  console.log(c("dim", `Domains: ${manifest.domains.map((d) => d.title).join(", ")}`));
  if (manifest.installed?.length) {
    console.log(c("dim", `Already installed (excluded): ${manifest.installed.join(", ")}`));
  }
  console.log(c("dim", `Items: ${manifest.items.map((i) => i.id).join(", ")}\n`));
  console.log(c("dim", "Share with your team: npx claude-loadout apply -f .loadout.json\n"));
}

function parseIds(args) {
  const raw = parseFlagValue(args, "--ids");
  if (!raw) return null;
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function suggestionIds(catalog, root, opts = {}) {
  const signals = scanProject(root);
  const { items } = recommend(catalog, signals, root);
  const limit = opts.limit ?? 5;
  let list = items;
  if (opts.mcpOnly || opts.hooksOnly) {
    list = items.filter((e) => isAutoApplyType(e.item.type, {
      mcpOnly: opts.mcpOnly,
      hooksOnly: opts.hooksOnly && !opts.mcpOnly,
    }));
  }
  return list.slice(0, limit).map((e) => e.item.id);
}

function runApplyManifest(args, flags) {
  const root = cwd();
  const catalog = loadCatalog();
  const idsFromFlag = parseIds(args);
  const useSuggestions = flags.has("--suggestions");
  const mcpOnly = flags.has("--mcp-only");
  const hooksOnly = flags.has("--hooks-only") && !mcpOnly;
  const typeOpts = { mcpOnly, hooksOnly };
  const limitRaw = parseFlagValue(args, "--limit", "-n");
  const limit = limitRaw ? Math.max(1, parseInt(limitRaw, 10) || 5) : 5;
  const targets = parseTargets(args);
  const invalid = targets.filter((t) => !TARGETS[t]);
  if (invalid.length) {
    console.error(c("yellow", `Unknown target(s): ${invalid.join(", ")}`) + c("dim", "  (run --list-targets)"));
    exit(1);
  }

  let ids;
  let manifestPath = null;
  let sourceLabel = null;
  if (idsFromFlag?.length) {
    ids = idsFromFlag;
    if (mcpOnly || hooksOnly) {
      ids = ids.filter((id) => isAutoApplyType(catalog.byId.get(id)?.type, typeOpts));
    }
    sourceLabel = `--ids ${ids.join(",")}`;
  } else if (useSuggestions) {
    ids = suggestionIds(catalog, root, { limit, mcpOnly, hooksOnly });
    const filterLabel = mcpOnly ? " --mcp-only" : hooksOnly ? " --hooks-only" : "";
    sourceLabel = `--suggestions${filterLabel} (${ids.join(",") || "none"})`;
    if (!ids.length) {
      if (flags.has("--json")) {
        console.log(JSON.stringify({ ids: [], targets, skipped: [], receipts: [], note: "no suggestions" }, null, 2));
        return;
      }
      console.log(c("green", "\nNo suggestions — setup looks complete.\n"));
      return;
    }
  } else {
    manifestPath = resolve(root, parseManifestPath(args));
    ids = readManifestIds(manifestPath);
    sourceLabel = manifestPath;
  }

  const label = targets.map((t) => TARGETS[t].label).join(", ");
  const source = sourceLabel;

  if (flags.has("--dry-run") || flags.has("-d")) {
    if (flags.has("--json")) {
      console.log(JSON.stringify(
        manifestPath
          ? previewManifestApply(catalog, manifestPath, { targets })
          : previewItemsApply(catalog, ids, { targets }),
        null,
        2,
      ));
      return;
    }
    console.log(c("bold", "\nWould apply from") + c("dim", ` ${source}`) + c("dim", ` → ${label}:\n`));
    ids.forEach((id) => console.log(`  • ${id}`));
    console.log("");
    return;
  }

  const { receipts, skipped } = manifestPath
    ? applyManifest(catalog, manifestPath, root, { targets })
    : applyItems(catalog, ids, root, { targets });

  if (flags.has("--json")) {
    console.log(JSON.stringify({ manifest: manifestPath, ids, targets, skipped, receipts }, null, 2));
    return;
  }
  if (skipped.length) {
    console.log(c("yellow", "Skipped:"));
    skipped.forEach((s) => console.log(`  • ${s}`));
    console.log("");
  }
  for (const r of receipts) {
    if (r.type === "claude" || r.type === "commands") printReceipt(r.receipt);
    else printTargetReceipt(r.receipt);
  }
}

function runSignals(flags = new Set()) {
  const root = cwd();
  const signalSet = scanProject(root);
  const signals = [...signalSet].filter((s) => s !== "always").sort();
  const { domains } = recommend(loadCatalog(), signalSet, root);
  const domainRows = domains.map((d) => ({ id: d.id, title: d.title }));
  const payload = {
    version: PKG_VERSION,
    root,
    signals,
    count: signals.length,
    domains: domainRows,
  };
  if (flags.has("--json")) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  console.log(c("bold", "\n📡 Project signals") + c("dim", `  — ${root}\n`));
  if (!signals.length) {
    console.log(c("dim", "  (none beyond always)\n"));
  } else {
    for (const s of signals) console.log(`  ${c("cyan", s)}`);
    console.log("");
  }
  console.log(c("bold", "Matched domains:"));
  for (const d of domainRows) {
    console.log(`  ${c("cyan", d.id.padEnd(14))} ${d.title}`);
  }
  console.log(c("dim", `\n${signals.length} signal(s) · ${domainRows.length} domain(s). Tip: npx claude-loadout --dry-run\n`));
}

function runStats(flags = new Set()) {
  const { domains, all, mcp, skills, hooks, ecosystem, community } = loadCatalog();
  const byType = {};
  const byTier = { curated: 0, official: 0, community: 0 };
  for (const item of all) {
    byType[item.type] = (byType[item.type] || 0) + 1;
    const tier = item.tier || "curated";
    byTier[tier] = (byTier[tier] || 0) + 1;
  }
  const payload = {
    version: PKG_VERSION,
    domains: domains.length,
    items: all.length,
    tiers: byTier,
    types: byType,
    curated: {
      mcp: mcp.length,
      skills: skills.length,
      hooks: hooks.length,
    },
    official: ecosystem.length,
    community: community.length,
  };
  if (flags.has("--json")) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  console.log(c("bold", "\n📊 Loadout catalog") + c("dim", `  v${PKG_VERSION}\n`));
  console.log(`  ${c("cyan", "domains")}   ${payload.domains}`);
  console.log(`  ${c("cyan", "items")}     ${payload.items}`);
  console.log(`  ${c("cyan", "curated")}   ${byTier.curated}  (mcp ${mcp.length} · skills ${skills.length} · hooks ${hooks.length})`);
  console.log(`  ${c("cyan", "official")}  ${byTier.official}`);
  console.log(`  ${c("cyan", "community")} ${byTier.community}`);
  console.log(c("dim", "\n  types: " + Object.entries(byType).map(([k, v]) => `${k}=${v}`).join(" · ")));
  console.log(c("dim", "\nBrowse: npx claude-loadout domains | search <q> | show <id>\n"));
}

function parseFlagValue(args, longName, shortName) {
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if ((a === longName || (shortName && a === shortName)) && args[i + 1] && !args[i + 1].startsWith("-")) {
      return args[i + 1];
    }
    if (a.startsWith(`${longName}=`)) return a.slice(longName.length + 1);
  }
  return null;
}

function runSearch(args, flags = new Set()) {
  const type = parseFlagValue(args, "--type", "-T");
  const limitRaw = parseFlagValue(args, "--limit", "-n");
  const limit = limitRaw ? Math.max(1, parseInt(limitRaw, 10) || 20) : 20;
  const query = args
    .filter((a, i) => {
      if (a === "search") return false;
      if (a.startsWith("-")) return false;
      if (i > 0 && (args[i - 1] === "--type" || args[i - 1] === "-T")) return false;
      if (i > 0 && (args[i - 1] === "--limit" || args[i - 1] === "-n")) return false;
      return true;
    })
    .join(" ")
    .trim();
  if (!query) {
    console.error(c("yellow", "Usage: npx claude-loadout search <query> [--type mcp|skill|hook] [--limit N]"));
    exit(1);
  }
  if (type && !["mcp", "skill", "hook", "setting", "reference"].includes(type.toLowerCase())) {
    console.error(c("yellow", `Unknown type "${type}" — use mcp, skill, or hook`));
    exit(1);
  }

  const { all } = loadCatalog();
  const hits = searchCatalog(all, query, { type, limit });

  if (flags.has("--json")) {
    console.log(JSON.stringify(hits.map(({ item, score }) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      tier: item.tier || "curated",
      domains: item.domains || [],
      score,
      homepage: item.homepage,
    })), null, 2));
    return;
  }

  if (!hits.length) {
    console.log(c("yellow", `\nNo catalog matches for "${query}"${type ? ` (type=${type})` : ""}.\n`));
    return;
  }

  const label = type ? ` · type=${type}` : "";
  console.log(c("bold", `\n🔎 Search`) + c("dim", `  "${query}"${label} · ${hits.length} hit(s)\n`));
  for (const { item } of hits) {
    const tier = item.tier && item.tier !== "curated" ? c("dim", ` · ${item.tier}`) : "";
    console.log(`  ${c("cyan", item.id.padEnd(22))} ${c("bold", item.name)} ${c("dim", `[${item.type}]`)}${tier}`);
    if (item.description) console.log(c("dim", `                         ${item.description.slice(0, 90)}${item.description.length > 90 ? "…" : ""}`));
  }
  console.log(c("dim", `\nShow one: npx claude-loadout show ${hits[0].item.id}\n`));
}

function runShow(id, flags = new Set()) {
  if (!id) {
    console.error(c("yellow", "Usage: npx claude-loadout show <id>"));
    exit(1);
  }
  const { byId, all } = loadCatalog();
  const item = byId.get(id);
  if (!item) {
    console.error(c("yellow", `Unknown catalog id: ${id}`));
    const q = id.toLowerCase();
    const hints = all
      .map((i) => i.id)
      .filter((x) => x.includes(q) || q.includes(x) || x.split("-").some((p) => q.includes(p)))
      .slice(0, 5);
    if (hints.length) console.error(c("dim", `Did you mean: ${hints.join(", ")}?`));
    exit(1);
  }
  if (flags.has("--json")) {
    console.log(JSON.stringify(item, null, 2));
    return;
  }
  console.log(c("bold", `\n${item.name}`) + c("dim", `  (${item.id})\n`));
  console.log(`  ${c("dim", "type")}     ${item.type}${item.tier ? c("dim", ` · ${item.tier}`) : ""}`);
  if (item.domains?.length) console.log(`  ${c("dim", "domains")}  ${item.domains.join(", ")}`);
  if (item.signals?.length) console.log(`  ${c("dim", "signals")}  ${item.signals.join(", ")}`);
  if (item.description) console.log(`\n  ${item.description}`);
  if (item.homepage) console.log(c("dim", `\n  ↳ ${item.homepage}`));
  if (item.config) {
    console.log(c("dim", "\n  config:"));
    console.log(`  ${JSON.stringify(item.config, null, 2).split("\n").join("\n  ")}`);
  }
  if (item.install?.commands?.length) {
    console.log(c("dim", "\n  install:"));
    item.install.commands.forEach((cmd) => console.log(`  ${c("green", cmd)}`));
  }
  if (item.note) console.log(c("yellow", `\n  note: ${item.note}`));
  console.log("");
}

function runDomains(domainId, flags = new Set()) {
  const { domains, byId } = loadCatalog();
  if (domainId) {
    const d = domains.find((x) => x.id === domainId);
    if (!d) {
      console.error(c("yellow", `Unknown domain: ${domainId}`));
      console.error(c("dim", `Known: ${domains.map((x) => x.id).join(", ")}`));
      exit(1);
    }
    const items = (d.loadout || []).map((id) => {
      const item = byId.get(id) || byId.get(`${id}-win`);
      return {
        id,
        name: item?.name || id,
        type: item?.type || "unknown",
        tier: item?.tier || "curated",
      };
    });
    const payload = {
      id: d.id,
      title: d.title,
      title_ko: d.title_ko,
      blurb: d.blurb,
      signals: d.signals || [],
      items,
    };
    if (flags.has("--json")) {
      console.log(JSON.stringify(payload, null, 2));
      return;
    }
    console.log(c("bold", `\n📚 ${d.title}`) + c("dim", `  (${d.id})\n`));
    if (d.blurb) console.log(`  ${d.blurb}\n`);
    console.log(c("dim", `  signals: ${(d.signals || []).filter((s) => s !== "always").join(", ") || "(always)"}`));
    console.log(c("bold", "\n  Loadout:\n"));
    for (const it of items) {
      console.log(`  ${c("cyan", it.id.padEnd(22))} ${it.name} ${c("dim", `[${it.type}]`)}`);
    }
    console.log(c("dim", `\n  Show one item: npx claude-loadout show ${items[0]?.id || "<id>"}\n`));
    return;
  }

  const rows = domains.map((d) => ({
    id: d.id,
    title: d.title,
    title_ko: d.title_ko,
    signals: d.signals || [],
    loadout: d.loadout || [],
  }));
  if (flags.has("--json")) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }
  console.log(c("bold", "\n📚 Catalog domains") + c("dim", `  (${rows.length})\n`));
  for (const d of rows) {
    console.log(`  ${c("cyan", d.id.padEnd(14))} ${c("bold", d.title)}`);
    console.log(c("dim", `                 ${d.loadout.length} items · signals: ${d.signals.filter((s) => s !== "always").slice(0, 6).join(", ")}${d.signals.length > 7 ? "…" : ""}`));
  }
  console.log(c("dim", "\nTip: npx claude-loadout domains research"));
  console.log(c("dim", "Docs: https://github.com/sukoji/loadout/tree/main/docs/domains\n"));
}

function runDoctor(flags = new Set()) {
  const root = cwd();
  const doFix = flags.has("--fix");
  const mcpOnly = flags.has("--mcp-only");
  const dryRun = flags.has("--dry-run") || flags.has("-d");

  const hooksOnly = flags.has("--hooks-only") && !mcpOnly;

  if (doFix) {
    const result = doctorFix(root, { mcpOnly, hooksOnly, dryRun });
    if (flags.has("--json")) {
      console.log(JSON.stringify({
        applied: result.applied,
        ids: result.ids,
        manual: result.manual,
        skills: result.skills,
        dryRun: result.dryRun,
        skipped: result.skipped,
        receipts: result.receipts,
        findings: result.findings,
        summary: summarizeDoctor(result.findings),
      }, null, 2));
      exitDoctor(result.findings, flags);
      return;
    }
    printDoctorFix(result, root);
    exitDoctor(result.findings, flags);
    return;
  }

  const findings = doctor(root);
  const quiet = flags.has("--quiet") || flags.has("-q");

  if (flags.has("--json")) {
    console.log(JSON.stringify(doctorJsonPayload(findings), null, 2));
    exitDoctor(findings, flags);
    return;
  }

  console.log(c("bold", "\n🩺 Loadout doctor") + c("dim", `  — auditing ${root}\n`));
  printDoctorFindings(findings, { quiet });
  if (!findings.fix.length && !findings.warn.length) {
    console.log(c("green", "Everything looks good.\n"));
    exitDoctor(findings, flags);
    return;
  }
  const suggestionIds = (findings.suggestions || []).map((s) => s.id).filter(Boolean);
  const autoIds = (findings.suggestions || [])
    .filter((s) => s.type === "mcp" || s.type === "hook" || s.type === "setting")
    .map((s) => s.id);
  const mcpSuggestionIds = (findings.suggestions || []).filter((s) => s.type === "mcp").map((s) => s.id);
  const hookSuggestionIds = (findings.suggestions || [])
    .filter((s) => s.type === "hook" || s.type === "setting")
    .map((s) => s.id);
  if (autoIds.length) {
    if (mcpSuggestionIds.length && mcpSuggestionIds.length === autoIds.length) {
      console.log(c("dim", "Tip: npx claude-loadout doctor --fix --mcp-only"));
    } else if (hookSuggestionIds.length && hookSuggestionIds.length === autoIds.length) {
      console.log(c("dim", "Tip: npx claude-loadout doctor --fix --hooks-only"));
    } else {
      console.log(c("dim", "Tip: npx claude-loadout doctor --fix"));
    }
    console.log(c("dim", `     or: npx claude-loadout apply --ids ${suggestionIds.join(",")}\n`));
  } else if (suggestionIds.length) {
    console.log(c("dim", "Tip: npx claude-loadout doctor --fix  (prints skill install steps)"));
    console.log(c("dim", `     or: npx claude-loadout apply --ids ${suggestionIds.join(",")}\n`));
  } else if (findings.fix.length) {
    console.log(c("dim", "Tip: npx claude-loadout --dry-run to see recommended additions.\n"));
  } else {
    console.log("");
  }
  exitDoctor(findings, flags);
}

/** Exit 1 on hard fixes, or when --require-healthy and setup is not healthy. */
function exitDoctor(findings, flags) {
  if (findings.fix.length) exit(1);
  if (flags.has("--require-healthy") && !summarizeDoctor(findings).healthy) exit(1);
}

function doctorJsonPayload(findings) {
  const suggestionIds = (findings.suggestions || []).map((s) => s.id).filter(Boolean);
  const mcpIds = (findings.suggestions || []).filter((s) => s.type === "mcp").map((s) => s.id);
  const hookIds = (findings.suggestions || [])
    .filter((s) => s.type === "hook" || s.type === "setting")
    .map((s) => s.id);
  const skills = skillInstallGuide(loadCatalog(), findings.suggestions || []);
  return {
    version: PKG_VERSION,
    ...findings,
    skills,
    applyCommand: suggestionIds.length ? `npx claude-loadout apply --suggestions` : null,
    applyCommandMcpOnly: mcpIds.length ? `npx claude-loadout apply --suggestions --mcp-only` : null,
    applyCommandHooksOnly: hookIds.length ? `npx claude-loadout apply --suggestions --hooks-only` : null,
    applyCommandIds: suggestionIds.length
      ? `npx claude-loadout apply --ids ${suggestionIds.join(",")}`
      : null,
    fixCommand: suggestionIds.length ? `npx claude-loadout doctor --fix` : null,
    fixCommandMcpOnly: mcpIds.length ? `npx claude-loadout doctor --fix --mcp-only` : null,
    fixCommandHooksOnly: hookIds.length ? `npx claude-loadout doctor --fix --hooks-only` : null,
    summary: summarizeDoctor(findings),
  };
}

function printDoctorFindings(findings, opts = {}) {
  const { ok, warn, fix } = findings;
  if (fix.length) {
    console.log(c("red", "Fix:"));
    fix.forEach((f) => console.log(`  • ${f.msg}${f.file ? c("dim", ` (${f.file})`) : ""}`));
    console.log("");
  }
  if (warn.length) {
    console.log(c("yellow", "Warnings:"));
    warn.forEach((f) => console.log(`  • ${f.msg}${f.file ? c("dim", ` (${f.file})`) : ""}`));
    console.log("");
  }
  if (ok.length && !opts.quiet) {
    console.log(c("green", "OK:"));
    ok.forEach((f) => console.log(`  • ${f.msg}`));
    console.log("");
  }
}

function printDoctorFix(result, root) {
  console.log(c("bold", "\n🩺 Loadout doctor --fix") + c("dim", `  — ${root}\n`));
  if (result.dryRun) {
    if (!result.ids.length) {
      console.log(c("green", "Nothing auto-applicable to write.\n"));
    } else {
      console.log(c("bold", "Would apply:"));
      result.ids.forEach((id) => console.log(`  • ${id}`));
      console.log("");
    }
  } else if (result.applied.length) {
    for (const r of result.receipts) {
      if (r.type === "claude" || r.type === "commands") printReceipt(r.receipt);
      else printTargetReceipt(r.receipt);
    }
  } else if (!result.skills?.length) {
    console.log(c("green", "Nothing to fix — setup looks complete.\n"));
  } else {
    console.log(c("green", "Nothing auto-applicable to write (MCP/hooks already set).\n"));
  }
  printSkillInstallGuide(result.skills);
  if (result.skipped?.length) {
    console.log(c("yellow", "Skipped:"));
    result.skipped.forEach((s) => console.log(`  • ${s}`));
    console.log("");
  }
  if (!result.dryRun && result.applied.length) {
    console.log(c("bold", "After fix:"));
    printDoctorFindings(result.findings);
  }
}

function printSkillInstallGuide(skills) {
  if (!skills?.length) return;
  console.log(c("bold", "Skills (run in Claude Code — not auto-written):"));
  for (const s of skills) {
    console.log(`  ${c("cyan", s.name)}`);
    if (s.commands?.length) {
      s.commands.forEach((cmd) => console.log(`     ${c("green", cmd)}`));
    } else if (s.note) {
      console.log(c("dim", `     ${s.note}`));
    } else if (s.homepage) {
      console.log(c("dim", `     ${s.homepage}`));
    }
  }
  console.log("");
}

function parseSelection(answer, top) {
  const a = answer.trim().toLowerCase();
  if (!a) return [];
  if (a === "a" || a === "all") return top;
  const idx = new Set(
    a.split(/[\s,]+/).map((t) => parseInt(t, 10) - 1).filter((n) => n >= 0 && n < top.length)
  );
  return [...idx].map((i) => top[i]);
}

function authLabel(item) {
  const ph = item.config ? JSON.stringify(item.config).match(/<your-[^>]+>/g) || [] : [];
  if (ph.length) return c("yellow", ph.length > 1 ? " ⚠ needs tokens" : " ⚠ needs a token");
  if (item.auth) return c("yellow", " ⚠ login/OAuth on first use");
  return "";
}

function describeSignals(signals) {
  const interesting = [...signals].filter((s) => s !== "always").slice(0, 8);
  return interesting.length ? interesting.map((s) => c("green", s)).join(", ") : c("dim", "a fresh/empty project");
}

function printReceipt(r) {
  console.log(c("bold", "\n✅ Applied:\n"));
  if (r.mcp.length) console.log(`  ${c("cyan", ".mcp.json")}          + ${r.mcp.join(", ")}`);
  if (r.settings.length) console.log(`  ${c("cyan", ".claude/settings.json")} + ${r.settings.join(", ")}`);
  for (const cmd of r.commands) {
    if (cmd.commands.length) {
      console.log(`\n  ${c("bold", cmd.name)} — run in Claude Code:`);
      cmd.commands.forEach((x) => console.log(`     ${c("green", x)}`));
    } else if (cmd.note) {
      console.log(`\n  ${c("bold", cmd.name)} — ${c("dim", cmd.note)}`);
    }
  }
  if (r.tokens.length) {
    console.log(c("yellow", "\n⚠  Needs your attention:"));
    r.tokens.forEach((t) => console.log(`     ${t}`));
  }
  console.log(c("dim", "\nRestart Claude Code (or /reload-plugins) so new MCP servers load.\n"));
}

function printTargetReceipt(r) {
  console.log(c("bold", `\n✅ ${r.label}:\n`));
  if (r.added.length) console.log(`  ${c("cyan", r.file)}\n     + ${r.added.join(", ")}`);
  if (r.skipped.length) {
    console.log(c("dim", "  skipped:"));
    r.skipped.forEach((s) => console.log(c("dim", `     - ${s}`)));
  }
  if (r.tokens.length) {
    console.log(c("yellow", "\n⚠  Needs your attention:"));
    r.tokens.forEach((t) => console.log(`     ${t}`));
  }
  if (!r.added.length && !r.skipped.length) console.log(c("dim", "  (no MCP servers to add)"));
  console.log(c("dim", `\nRestart ${r.label} so new MCP servers load.\n`));
}

main().catch((err) => {
  console.error(c("yellow", "loadout error: ") + (err?.message || err));
  exit(1);
});
