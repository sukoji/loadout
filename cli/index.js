#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { stdin, stdout, argv, cwd, exit } from "node:process";
import { loadCatalog } from "./lib/catalog.mjs";
import { scanProject } from "./lib/scan.mjs";
import { recommend } from "./lib/recommend.mjs";
import { apply } from "./lib/apply.mjs";

const C = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  cyan: "\x1b[36m", green: "\x1b[32m", yellow: "\x1b[33m", magenta: "\x1b[35m",
};
const c = (color, s) => `${C[color]}${s}${C.reset}`;
const KIND_LABEL = { mcp: "MCP server", hook: "Hook/setting", setting: "Hook/setting", skill: "Skill", reference: "Reference" };

async function main() {
  const flags = new Set(argv.slice(2).filter((a) => a.startsWith("-")));
  const dryRun = flags.has("--dry-run") || flags.has("-d");
  const takeAll = flags.has("--all") || flags.has("-a") || flags.has("--yes") || flags.has("-y");

  const catalog = loadCatalog();
  const root = cwd();

  console.log(c("bold", "\n🎯 Loadout") + c("dim", "  — gearing up Claude Code for this project\n"));

  const signals = scanProject(root);
  const { domains, items, installed } = recommend(catalog, signals, root);

  console.log(c("dim", "Detected: ") + describeSignals(signals));
  console.log(c("dim", "Best-fit domains: ") + domains.map((d) => c("magenta", d.title)).join(c("dim", ", ")));
  if (installed.length) console.log(c("dim", `Already configured (skipped): ${installed.join(", ")}`));
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
    const kind = c("dim", `[${KIND_LABEL[item.type]}]`);
    const auth = item.auth ? c("yellow", " (needs auth)") : "";
    console.log(`${n}  ${c("bold", item.name)} ${kind}${auth}`);
    console.log(`     ${item.description}`);
    console.log(c("dim", `     why: ${reason}`) + "\n");
  });

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

  const receipt = apply(picks.map((p) => p.item), root);
  printReceipt(receipt);
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

main().catch((err) => {
  console.error(c("yellow", "loadout error: ") + (err?.message || err));
  exit(1);
});
