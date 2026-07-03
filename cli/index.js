#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { stdin, stdout, argv, cwd, exit } from "node:process";
import { loadCatalog } from "./lib/catalog.mjs";
import { scanProject } from "./lib/scan.mjs";
import { recommend } from "./lib/recommend.mjs";
import { apply } from "./lib/apply.mjs";
import { applyToTarget, listTargets, detectTargets, TARGETS } from "./lib/targets.mjs";

const C = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  cyan: "\x1b[36m", green: "\x1b[32m", yellow: "\x1b[33m", magenta: "\x1b[35m",
};
const c = (color, s) => `${C[color]}${s}${C.reset}`;
const KIND_LABEL = { mcp: "MCP server", hook: "Hook/setting", setting: "Hook/setting", skill: "Skill", reference: "Reference" };

async function main() {
  const args = argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith("-")));
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

  const targetLabels = targets.map((t) => TARGETS[t].label).join(", ");
  console.log(c("bold", "\n🎯 Loadout") + c("dim", `  — gearing up ${targetLabels} for this project\n`));

  const discover = flags.has("--discover");
  const signals = scanProject(root);
  let { domains, items, community, installed } = recommend(catalog, signals, root, { discover });
  if (mcpOnly) {
    items = items.filter((e) => e.item.type === "mcp");
    community = [];
  }

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

  if (dryRun) {
    console.log(c("dim", "Dry run — nothing written. Re-run without --dry-run to apply.\n"));
    return;
  }

  let picks;
  if (takeAll) {
    picks = top;
  } else {
    const rl = createInterface({ input: stdin, output: stdout });
    const answer = await rl.question(
      c("bold", "Install which? ") + c("dim", "numbers e.g. 1,3,4  ·  'a' = all  ·  Enter = skip: ")
    );
    rl.close();
    picks = parseSelection(answer, top);
  }

  if (!picks.length) {
    console.log(c("dim", "\nNothing selected. Bye!\n"));
    return;
  }

  const picked = picks.map((p) => p.item);
  for (const t of targets) {
    if (t === "claude") {
      printReceipt(apply(picked, root));
    } else {
      const mcp = picked.filter((i) => i.type === "mcp");
      printTargetReceipt(applyToTarget(t, mcp, root));
    }
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
