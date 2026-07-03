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
import { doctor } from "./lib/doctor.mjs";
import { buildManifest, writeManifest, applyManifest, readManifestIds, buildRecommendPreview, previewManifestApply } from "./lib/manifest.mjs";
import { applyToTarget, listTargets, detectTargets, TARGETS } from "./lib/targets.mjs";

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
  console.log(`  ${c("cyan", "npx claude-loadout doctor")}     Audit .mcp.json + hooks (read-only)`);
  console.log(`  ${c("cyan", "npx claude-loadout doctor --json")}  Machine-readable audit (exit 1 on fixes)`);
  console.log(`  ${c("cyan", "npx claude-loadout domains")}    List catalog domains and loadout sizes`);
  console.log(`  ${c("cyan", "npx claude-loadout domains research")}  Show one domain's loadout`);
  console.log(`  ${c("cyan", "npx claude-loadout domains --json")}  Domains as JSON`);
  console.log(`  ${c("cyan", "npx claude-loadout show context7")}  Show one catalog entry`);
  console.log(`  ${c("cyan", "npx claude-loadout show context7 --json")}  Entry as JSON`);
  console.log(`  ${c("cyan", "npx claude-loadout export")}     Write team loadout → .loadout.json`);
  console.log(`  ${c("cyan", "npx claude-loadout export --json")}  Print manifest JSON to stdout`);
  console.log(`  ${c("cyan", "npx claude-loadout apply -f .loadout.json")}  Apply a shared loadout file`);
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

function runApplyManifest(args, flags) {
  const root = cwd();
  const catalog = loadCatalog();
  const manifestPath = resolve(root, parseManifestPath(args));
  const targets = parseTargets(args);
  const invalid = targets.filter((t) => !TARGETS[t]);
  if (invalid.length) {
    console.error(c("yellow", `Unknown target(s): ${invalid.join(", ")}`) + c("dim", "  (run --list-targets)"));
    exit(1);
  }
  if (flags.has("--dry-run") || flags.has("-d")) {
    if (flags.has("--json")) {
      console.log(JSON.stringify(previewManifestApply(catalog, manifestPath, { targets }), null, 2));
      return;
    }
    const ids = readManifestIds(manifestPath);
    const label = targets.map((t) => TARGETS[t].label).join(", ");
    console.log(c("bold", "\nWould apply from") + c("dim", ` ${manifestPath}`) + c("dim", ` → ${label}:\n`));
    ids.forEach((id) => console.log(`  • ${id}`));
    console.log("");
    return;
  }
  const { receipts, skipped } = applyManifest(catalog, manifestPath, root, { targets });
  if (flags.has("--json")) {
    console.log(JSON.stringify({ manifest: manifestPath, targets, skipped, receipts }, null, 2));
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
  const findings = doctor(root);

  if (flags.has("--json")) {
    console.log(JSON.stringify({
      ...findings,
      summary: {
        fix: findings.fix.length,
        warn: findings.warn.length,
        ok: findings.ok.length,
      },
    }, null, 2));
    if (findings.fix.length) exit(1);
    return;
  }

  console.log(c("bold", "\n🩺 Loadout doctor") + c("dim", `  — auditing ${root}\n`));
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
  if (ok.length) {
    console.log(c("green", "OK:"));
    ok.forEach((f) => console.log(`  • ${f.msg}`));
    console.log("");
  }
  if (!fix.length && !warn.length) {
    console.log(c("green", "Everything looks good.\n"));
    return;
  }
  if (fix.length) {
    console.log(c("dim", "Tip: npx claude-loadout --dry-run to see recommended additions.\n"));
    exit(1);
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
